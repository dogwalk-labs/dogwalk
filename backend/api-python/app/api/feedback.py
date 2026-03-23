from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter(prefix="/feedback", tags=["feedback"])


class CreateFeedbackRequest(BaseModel):
    path_id: UUID
    value: int


@router.post("")
def create_feedback(
    payload: CreateFeedbackRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if payload.value not in (1, -1):
        raise HTTPException(status_code=400, detail="value는 1 또는 -1이어야 합니다.")

    db.execute(
        text("""
            INSERT INTO feedback (user_id, path_id, value)
            VALUES (:user_id, :path_id, :value)
        """),
        {
            "user_id": user_id,
            "path_id": str(payload.path_id),
            "value": payload.value,
        },
    )
    db.commit()
    return {"ok": True}