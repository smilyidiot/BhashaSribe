from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TranscriptionBase(BaseModel):
    text: str
    language: str | None = None
    duration_seconds: float | None = None


class TranscriptionUpdate(BaseModel):
    text: str


class TranscriptionRead(TranscriptionBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    created_at: datetime
    updated_at: datetime
