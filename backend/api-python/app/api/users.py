from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def get_my_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.execute(
        text("""
            SELECT id, email, nickname, provider, created_at
            FROM users
            WHERE id = :user_id
        """),
        {"user_id": user_id},
    ).mappings().fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")

    return {
        "id": str(user["id"]),
        "email": user["email"],
        "nickname": user["nickname"],
        "provider": user["provider"],
        "created_at": user["created_at"],
    }