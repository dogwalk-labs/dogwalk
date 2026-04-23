# feedback.py
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text
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

    # ⭐ 중복 체크 로직 제거 (같은 경로 여러 번 평가 가능)

    try:
        # 1. feedback 저장 (개별 평가 기록)
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

        # 2. ⭐ 좋아요(value=1) + tags 있으면 → path_tag_counts 누적
        if payload.value == 1 and payload.tags:
            for tag in payload.tags:
                db.execute(
                    text("""
                        INSERT INTO path_tag_counts (path_id, tag, count)
                        VALUES (:path_id, :tag, 1)
                        ON CONFLICT (path_id, tag)
                        DO UPDATE SET count = path_tag_counts.count + 1
                    """),
                    {
                        "path_id": str(payload.path_id),
                        "tag": tag,
                    },
                )
            print(f"### tag counts 업데이트: path_id={payload.path_id}, tags={payload.tags}")

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"### feedback 저장 실패: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"피드백 저장 실패: {str(e)}",
        )

    return {
        "ok": True,
        "path_id": str(payload.path_id),
        "value": payload.value,
        "tags": payload.tags,
    }