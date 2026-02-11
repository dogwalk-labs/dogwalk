from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db

router = APIRouter(prefix="/routes", tags=["recommend"])

class Start(BaseModel):
    lat: float
    lng: float

class RecommendRequest(BaseModel):
    user_id: UUID
    minutes: int
    start: Start

@router.post("/recommend")
def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    liked_rows = db.execute(
        text("""
            SELECT p.id, p.minutes, p.distance_m, p.duration_sec, p.meta, p.created_at
            FROM feedback f
            JOIN paths p ON p.id = f.path_id
            WHERE f.user_id = :uid AND f.value = 1
            ORDER BY f.created_at DESC
            LIMIT 2
        """),
        {"uid": str(req.user_id)},
    ).mappings().all()

    liked_routes = [{
        "source": "liked",
        "pathId": str(r["id"]),
        "userId": str(req.user_id),
        "minutes": r["minutes"],
        "distanceM": r["distance_m"],
        "durationSec": r["duration_sec"],
        "meta": r["meta"],
    } for r in liked_rows]

    if not liked_routes:
        return {"routes": [], "note": "No liked routes yet."}

    combined = liked_routes[:]
    while len(combined) < 3:
        combined.append(combined[-1])

    return {"routes": combined[:3]}
