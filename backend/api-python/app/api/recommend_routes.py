print("### recommend_routes.py loaded ###")

import json
import urllib.request
import urllib.error
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.config import OSRM_BASE_URL, OSRM_PROFILE
from app.core.security import get_current_user_id

router = APIRouter(prefix="/routes", tags=["recommend"])


class Start(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class RecommendRequest(BaseModel):
    minutes: int = Field(..., gt=0)
    start: Start
    tags: List[str] = Field(default_factory=list)


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
async def recommend(
    req: RecommendRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    print("### /routes/recommend entered ###", flush=True)

    # 일단 원인 분리 위해 DB 인기경로 로직은 잠시 빼고
    # Node 추천 3개만 프록시

    """
    # ===== 나중에 다시 붙일 DB 개인화 로직 =====

    # 1. 사용자가 좋아요(value=1)한 피드백의 tags 가져오기
    liked_rows = db.execute(
        text(\"\"\"
            SELECT tags
            FROM feedback
            WHERE user_id = :uid AND value = 1
        \"\"\"),
        {"uid": user_id},
    ).fetchall()

    liked_tags = []
    for row in liked_rows:
        row_tags = row[0] or []
        if isinstance(row_tags, list):
            liked_tags.extend(row_tags)

    # 중복 제거
    liked_tags = list(dict.fromkeys(liked_tags))

    # 2. 사용자가 이미 평가한 경로 제외용 path_id 가져오기
    banned_rows = db.execute(
        text(\"\"\"
            SELECT path_id
            FROM feedback
            WHERE user_id = :uid
        \"\"\"),
        {"uid": user_id},
    ).fetchall()

    banned_route_ids = [str(row[0]) for row in banned_rows]

    # 3. 현재 화면에서 선택한 tags + 과거 선호 tags 합치기
    merged_tags = list(dict.fromkeys(req.tags + liked_tags))
    """

    payload = {
        "start": req.start.model_dump(),
        "minutes": req.minutes,
        "userId": user_id,
        "count": 3,
        "tags": req.tags,
    }

    # 나중에 DB 개인화 다시 붙일 때 사용할 코드
    """
    payload["tags"] = merged_tags
    payload["bannedRouteIds"] = banned_route_ids
    """

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