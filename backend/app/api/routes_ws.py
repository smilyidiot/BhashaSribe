import logging
import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from pydub import AudioSegment
from sqlalchemy.orm import Session
from starlette.websockets import WebSocketState

from app.db.database import get_db
from app.db.models import Transcription
from app.services.stt_service import transcribe_audio_file

logger = logging.getLogger(__name__)
router = APIRouter()

# Browser-side recorder sends rolling chunks of roughly this length; used only
# to give the stored record an approximate duration, not for precise timing.
CHUNK_SECONDS_ESTIMATE = 3.0


def decode_and_transcribe(chunk_bytes: bytes) -> tuple[str, str | None]:
    """Decode a browser-recorded audio chunk (webm/opus) and transcribe it.

    Requires ffmpeg on PATH, which pydub shells out to for the webm->wav decode.
    """
    with tempfile.TemporaryDirectory() as tmp_dir:
        input_path = Path(tmp_dir) / "chunk.webm"
        wav_path = Path(tmp_dir) / "chunk.wav"
        input_path.write_bytes(chunk_bytes)
        audio = AudioSegment.from_file(input_path)
        audio.export(wav_path, format="wav")
        return transcribe_audio_file(str(wav_path))


@router.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()

    transcription = Transcription(session_id=str(uuid.uuid4()), text="")
    db.add(transcription)
    db.commit()
    db.refresh(transcription)

    accumulated_text = ""
    chunk_count = 0

    try:
        while True:
            message = await websocket.receive()

            if message.get("type") == "websocket.disconnect":
                break

            chunk_bytes = message.get("bytes")
            if chunk_bytes:
                chunk_count += 1
                try:
                    text_piece, language = await run_in_threadpool(
                        decode_and_transcribe, chunk_bytes
                    )
                except Exception:
                    logger.exception("Failed to transcribe audio chunk")
                    continue

                if text_piece:
                    accumulated_text = f"{accumulated_text} {text_piece}".strip()
                    transcription.text = accumulated_text
                    transcription.language = language
                    transcription.duration_seconds = chunk_count * CHUNK_SECONDS_ESTIMATE
                    db.commit()

                await websocket.send_json(
                    {
                        "type": "partial",
                        "text": text_piece,
                        "accumulated_text": accumulated_text,
                        "language": language,
                        "transcription_id": transcription.id,
                    }
                )
            elif message.get("text") == "stop":
                break
    except WebSocketDisconnect:
        pass
    finally:
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_json(
                {
                    "type": "final",
                    "transcription_id": transcription.id,
                    "accumulated_text": accumulated_text,
                }
            )
            await websocket.close()
