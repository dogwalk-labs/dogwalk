print("### recommend_routes.py loaded ###")

from uuid import UUID
import json
import urllib.request
import urllib.error

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.config import OSRM_BASE_URL, OSRM_PROFILE

router = APIRouter(prefix="/routes", tags=["recommend"])


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

@router.post("/osrm/route")
async def osrm_route(req: OsrmTestRequest):
    import httpx

    base = OSRM_BASE_URL.rstrip("/")
    url = f"{base}/route/v1/{OSRM_PROFILE}/{req.start.lng},{req.start.lat};{req.end.lng},{req.end.lat}"

    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "false",
    }

    try:
        timeout = httpx.Timeout(connect=5.0, read=30.0, write=5.0, pool=5.0)
        async with httpx.AsyncClient(timeout=timeout, trust_env=False) as client:
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


@router.post("/recommend")
async def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    print("### /routes/recommend entered ###", flush=True)
    # 일단 원인 분리 위해 DB 인기경로 로직은 잠시 빼고
    # Node 추천 3개만 프록시
    payload = {
        "start": req.start.model_dump(),
        "minutes": req.minutes,
        "userId": str(req.user_id),
        "count": 3,
    }

    url = "http://127.0.0.1:8080/recommend"

    try:
        body = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read().decode("utf-8")
            node_data = json.loads(raw)

        return {"routes": node_data.get("routes", [])}

    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        raise HTTPException(
            status_code=502,
            detail=f"Recommender HTTPError: {e.code} / {detail}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Recommender call failed: {type(e).__name__}: {repr(e)}"
        )