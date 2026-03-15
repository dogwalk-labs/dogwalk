from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.post("")
def create_user(db: Session = Depends(get_db)):
    row = db.execute(
        text("INSERT INTO users DEFAULT VALUES RETURNING id")
    ).fetchone()
    db.commit()
    return {"userId": row[0]}

@router.post("/upsert-temp")
def upsert_temp_user(db: Session = Depends(get_db)):
    db.execute(
        text("""
            INSERT INTO users (id)
            VALUES ('11111111-1111-1111-1111-111111111111')
            ON CONFLICT (id) DO NOTHING
        """)
    )
    db.commit()
    return {"ok": True}