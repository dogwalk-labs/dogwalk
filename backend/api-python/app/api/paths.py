from uuid import UUID, uuid4
import json

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter(prefix="/paths", tags=["paths"])


class CreatePathRequest(BaseModel):
    user_id: UUID
    minutes: int
    distance_m: int
    duration_sec: int
    meta: dict | None = None  # optional


@router.post("")
def create_path(req: CreatePathRequest, db: Session = Depends(get_db)):
    # user 존재 확인
    user = db.execute(
        text("SELECT 1 FROM users WHERE id = :id"),
        {"id": str(req.user_id)},
    ).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    path_id = str(uuid4())
    meta_json = json.dumps(req.meta or {})

    db.execute(
        text("""
            INSERT INTO paths (id, user_id, minutes, distance_m, duration_sec, meta)
            VALUES (:id, :uid, :min, :dist, :dur, CAST(:meta AS jsonb))
        """),
        {
            "id": path_id,
            "uid": str(req.user_id),
            "min": int(req.minutes),
            "dist": int(req.distance_m),
            "dur": int(req.duration_sec),
            "meta": meta_json,
        },
    )
    db.commit()
    return {"pathId": path_id}


@router.get("/liked")
def get_liked_paths(
    user_id: UUID,
    limit: int = Query(2, ge=1, le=10),
    db: Session = Depends(get_db),
):
    rows = db.execute(
        text("""
            SELECT
              p.id,
              p.user_id,
              p.minutes,
              p.distance_m,
              p.duration_sec,
              p.meta,
              p.created_at
            FROM feedback f
            JOIN paths p ON p.id = f.path_id
            WHERE f.user_id = :uid AND f.value = 1
            ORDER BY f.created_at DESC
            LIMIT :limit
        """),
        {"uid": str(user_id), "limit": limit},
    ).mappings().all()

    return {"paths": rows}
