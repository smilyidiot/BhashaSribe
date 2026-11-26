from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Transcription
from app.db.schemas import TranscriptionRead, TranscriptionUpdate

router = APIRouter(prefix="/api/transcriptions", tags=["transcriptions"])


@router.get("", response_model=list[TranscriptionRead])
def list_transcriptions(
    limit: int = 50, offset: int = 0, db: Session = Depends(get_db)
):
    stmt = (
        select(Transcription)
        .order_by(Transcription.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return db.scalars(stmt).all()


@router.get("/{transcription_id}", response_model=TranscriptionRead)
def get_transcription(transcription_id: str, db: Session = Depends(get_db)):
    transcription = db.get(Transcription, transcription_id)
    if transcription is None:
        raise HTTPException(status_code=404, detail="Transcription not found")
    return transcription


@router.put("/{transcription_id}", response_model=TranscriptionRead)
def update_transcription(
    transcription_id: str, payload: TranscriptionUpdate, db: Session = Depends(get_db)
):
    transcription = db.get(Transcription, transcription_id)
    if transcription is None:
        raise HTTPException(status_code=404, detail="Transcription not found")
    transcription.text = payload.text
    db.commit()
    db.refresh(transcription)
    return transcription


@router.delete("/{transcription_id}", status_code=204)
def delete_transcription(transcription_id: str, db: Session = Depends(get_db)):
    transcription = db.get(Transcription, transcription_id)
    if transcription is None:
        raise HTTPException(status_code=404, detail="Transcription not found")
    db.delete(transcription)
    db.commit()
