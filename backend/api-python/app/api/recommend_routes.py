from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
import httpx

from app.core.database import get_db
from app.core.config import OSRM_BASE_URL, OSRM_PROFILE

router = APIRouter(prefix="/routes", tags=["recommend"])


# -----------------------------
# Request Models
# -----------------------------
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


# -----------------------------
# OSRM Test Endpoint
# -----------------------------
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

# Recommend Endpoint
@router.post("/recommend")
async def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    # =========================================================
    # [수정 1] 기존 "liked 기반만 반환" 로직 제거
    #         -> 전체 사용자 기준 인기경로 1개 조회
     # 현재 위치 기준 500m 이내 인기경로 1개 조회
    popular_row = db.execute(
        text("""
            SELECT
                p.id,
                p.minutes,
                p.distance_m,
                p.duration_sec,
                p.meta
            FROM feedback f
            JOIN paths p ON p.id = f.path_id
            WHERE f.value = 1
                AND p.geom IS NOT NULL
                AND ST_DWithin(
                    p.geom::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    500
              )
            GROUP BY p.id, p.minutes, p.distance_m, p.duration_sec, p.meta
            ORDER BY COUNT(*) DESC, MAX(f.created_at) DESC
            LIMIT 1
    """),
    {
        "lng": req.start.lng,
        "lat": req.start.lat,
    }
).mappings().first()

    routes = []

    # [수정 2] 인기경로가 있으면 먼저 1개 넣고,
    #         Node에는 2개만 요청
    #         인기경로가 없으면 Node에 3개 요청
    node_count = 3

    if popular_row:
        routes.append({
            "source": "popular",
            "pathId": str(popular_row["id"]),
            "minutes": popular_row["minutes"],
            "distanceM": popular_row["distance_m"],
            "durationSec": popular_row["duration_sec"],
            "meta": popular_row["meta"],
        })
        node_count = 2

    # [수정 3] Node recommender 호출
    #         count 값을 전달해서 2개 또는 3개 요청
    try:
        timeout = httpx.Timeout(
            connect=5.0,
            read=30.0,
            write=5.0,
            pool=5.0,
        )

        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(
                "http://recommender:8080/recommend",
                json={
                    "start": req.start.dict(),
                    "minutes": req.minutes,
                    "userId": str(req.user_id),
                    "count": node_count,   # ✅ 추가된 핵심
                },
            )
            r.raise_for_status()
            node_data = r.json()

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Recommender call failed: {type(e).__name__}: {repr(e)}"
        )

    node_routes = node_data.get("routes", [])

    # [수정 4] 인기경로 + Node 추천 결과 합치기
    #         - 인기경로 있으면 1 + 2 = 3
    #         - 없으면 0 + 3 = 3
    routes.extend(node_routes)

    return {
        "routes": routes
    }