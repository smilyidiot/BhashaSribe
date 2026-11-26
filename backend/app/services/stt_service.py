import logging
from functools import lru_cache

from faster_whisper import WhisperModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@lru_cache
def get_whisper_model() -> WhisperModel:
    settings = get_settings()
    logger.info(
        "Loading faster-whisper model '%s' (device=%s, compute_type=%s)",
        settings.whisper_model_size,
        settings.whisper_device,
        settings.whisper_compute_type,
    )
    return WhisperModel(
        settings.whisper_model_size,
        device=settings.whisper_device,
        compute_type=settings.whisper_compute_type,
    )


def transcribe_audio_file(audio_path: str) -> tuple[str, str | None]:
    """Transcribe a short audio chunk and return (text, detected_language).

    Language is auto-detected per chunk so mixed Hindi/English speech is
    handled sentence-by-sentence rather than locked to one language.
    """
    model = get_whisper_model()
    segments, info = model.transcribe(audio_path, beam_size=1, vad_filter=True)
    text = " ".join(segment.text.strip() for segment in segments).strip()
    return text, info.language
