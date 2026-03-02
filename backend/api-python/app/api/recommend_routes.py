from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
import httpx
from app.core.database import get_db
from app.core.config import OSRM_BASE_URL, OSRM_PROFILE

router = APIRouter(prefix="/routes", tags=["recommend"])
# Request Models
class Start(BaseModel):
    lat: float
    lng: float

class RecommendRequest(BaseModel):
    user_id: UUID
    minutes: int
    start: Start

class OsrmTestRequest(BaseModel):
    start: Start
    end: Start

# OSRM Test Endpoint
@router.post("/osrm/route")
async def osrm_route(req: OsrmTestRequest):
    """
    FastAPI -> OSRM (container internal call)
    """
    base = OSRM_BASE_URL.rstrip("/")
    url = f"{base}/route/v1/{OSRM_PROFILE}/{req.start.lng},{req.start.lat};{req.end.lng},{req.end.lat}"

    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }
    try:
        # 🔥 read timeout 넉넉히 설정 (중요)
        timeout = httpx.Timeout(
            connect=5.0,
            read=30.0,
            write=5.0,
            pool=5.0,
        )
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.get(url, params=params)
            r.raise_for_status()
            data = r.json()

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"OSRM call failed: {type(e).__name__}: {repr(e)}"
        )

    routes = data.get("routes") or []
    if not routes:
        raise HTTPException(status_code=502, detail="OSRM returned no routes")

    r0 = routes[0]

    return {
        "distance_m": r0.get("distance"),
        "duration_sec": r0.get("duration"),
        "geometry": r0.get("geometry"),
    }

# Recommend Endpoint (기존 로직 유지)
@router.post("/recommend")
async def recommend(req: RecommendRequest, db: Session = Depends(get_db)):

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

# 좋아요 없으면 node 추천 호출
    if not liked_routes:
        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    "http://recommender:8080/recommend",
                    json={
                        "start": req.start.dict(),
                        "minutes": req.minutes,
                        "userId": str(req.user_id),
                    },
                    timeout=30.0
                )
                r.raise_for_status()
                return r.json()
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail=f"Recommender call failed: {type(e).__name__}: {repr(e)}"
            )
    return {"routes": liked_routes[:3]}