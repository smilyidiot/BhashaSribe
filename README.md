# BhashaScribe

Real-time, multilingual (e.g. Hindi + English code-mixed) speech-to-text web app, built as a hiring assignment. Speak into the browser, see a live transcript, and manage transcription history (create/read/update/delete) from a dashboard — all backed by a self-hosted, open-source STT model (no paid API required).

## Stack

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic
- **STT:** [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (open-source Whisper), self-hosted, auto-detects language per audio chunk
- **Database:** PostgreSQL (SQLite works out of the box for local dev with zero setup)
- **Frontend:** React + Vite

## How it works

1. The browser records your mic in short rolling chunks (~3s) via `MediaRecorder`.
2. Each chunk streams to the backend over a WebSocket (`/ws/transcribe`).
3. The backend decodes the chunk and runs it through a locally loaded `faster-whisper` model. Language is detected per chunk, so Hindi/English code-switching is handled sentence-by-sentence rather than being locked to one language.
4. Recognized text streams back to the browser as a live transcript, and is persisted to the database incrementally as it comes in.
5. The dashboard's history table (REST API) lists every past session, with inline edit and delete.

This is a **chunk-based near-real-time** pipeline rather than true token-level streaming ASR — a pragmatic tradeoff for a take-home assignment that still feels live in the browser.

## Prerequisites

- Python 3.10+
- Node.js 18+
- **ffmpeg** on your PATH (used to decode the browser's webm/opus audio chunks before transcription)
  - Windows: `winget install ffmpeg` (or download from ffmpeg.org and add to PATH)
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`
- PostgreSQL (optional for local dev — SQLite is the default; see `backend/.env.example`)

## Running locally

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`. The first transcription request will download the `faster-whisper` model weights (small model by default, configurable via `WHISPER_MODEL_SIZE` in `.env`).

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

### With Docker Compose (Postgres + backend + frontend)

```powershell
docker compose up --build
```

This brings up Postgres on `5432`, the API on `8000`, and the frontend (served via nginx) on `5173`.

## API

- `GET /api/transcriptions` — paginated history list
- `GET /api/transcriptions/{id}` — single transcription
- `PUT /api/transcriptions/{id}` — edit transcript text
- `DELETE /api/transcriptions/{id}` — delete a transcription
- `WS /ws/transcribe` — stream audio chunks, receive live transcript updates

## Known limitations / partial scope

Per the assignment brief, this is a partial, demoable slice rather than a production system:

- Code-switch transcription accuracy depends on the Whisper model size (`small` by default, CPU-friendly). Larger models (`medium`, `large-v3`) improve accuracy at the cost of speed/memory.
- Chunk-based "live" transcription has a few seconds of latency per chunk rather than true streaming ASR.
- No authentication/multi-user support — this is a single-dashboard demo.

## TODO

- **Text-to-speech:** `backend/app/services/tts_service.py` is stubbed out (`synthesize()` raises `NotImplementedError`), and the history dashboard has a disabled "🔊 Play as speech" button as a placeholder. Planned: an open-source TTS model (e.g. Coqui TTS or Piper) to read transcriptions back aloud.
- True low-latency streaming transcription (replacing the chunked approach) if time permits.
