from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
import json

from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter(prefix="/feedback", tags=["feedback"])


ALLOWED_TAGS = {
    "park",
    "river",
    "trail",
    "wideRoad",
    "carFree",
    "smellGood",
    "nightWalk",
    "flatRoad",
    "quiet",
    "nature",
}


class CreateFeedbackRequest(BaseModel):
    path_id: UUID
    value: int
    tags: List[str] = Field(default_factory=list)


@router.post("")
def create_feedback(
    payload: CreateFeedbackRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    if payload.value not in (1, -1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="value는 1 또는 -1이어야 합니다.",
        )

    if len(payload.tags) > 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tags는 최대 3개까지 선택할 수 있습니다.",
        )

    invalid_tags = [tag for tag in payload.tags if tag not in ALLOWED_TAGS]
    if invalid_tags:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"허용되지 않은 tags가 있습니다: {invalid_tags}",
        )

    existing_feedback = db.execute(
        text("""
            SELECT id
            FROM feedback
            WHERE user_id = :user_id AND path_id = :path_id
        """),
        {
            "user_id": user_id,
            "path_id": str(payload.path_id),
        },
    ).fetchone()

    if existing_feedback:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 이 경로에 대한 피드백을 남겼습니다.",
        )

    try:
        db.execute(
            text("""
                INSERT INTO feedback (user_id, path_id, value, tags)
                VALUES (:user_id, :path_id, :value, CAST(:tags AS jsonb))
            """),
            {
                "user_id": user_id,
                "path_id": str(payload.path_id),
                "value": payload.value,
                "tags": json.dumps(payload.tags),
            },
        )
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 이 경로에 대한 피드백을 남겼습니다.",
        )

    return {
        "ok": True,
        "path_id": str(payload.path_id),
        "value": payload.value,
        "tags": payload.tags,
    }