from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(prefix="/feedback", tags=["feedback"])

class FeedbackRequest(BaseModel):
    user_id: UUID
    path_id: UUID
    value: int  # 1 = like, -1 = dislike

@router.post("")
def create_feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    if req.value not in (1, -1):
        raise HTTPException(status_code=400, detail="value must be 1 or -1")

    # user 존재 확인
    user = db.execute(
        text("SELECT 1 FROM users WHERE id = :id"),
        {"id": str(req.user_id)}
    ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    # path 존재 확인
    path = db.execute(
        text("SELECT 1 FROM paths WHERE id = :id"),
        {"id": str(req.path_id)}
    ).fetchone()

    if not path:
        raise HTTPException(status_code=404, detail="path not found")

    # feedback 저장
    result = db.execute(
        text("""
            INSERT INTO feedback (user_id, path_id, value)
            VALUES (:uid, :pid, :val)
            RETURNING id
        """),
        {
            "uid": str(req.user_id),
            "pid": str(req.path_id),
            "val": req.value
        }
    )

    db.commit()

    return {"feedbackId": result.fetchone()[0]}