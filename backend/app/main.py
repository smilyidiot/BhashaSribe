from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_transcriptions import router as transcriptions_router
from app.api.routes_ws import router as ws_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="BhashaScribe API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcriptions_router)
app.include_router(ws_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
