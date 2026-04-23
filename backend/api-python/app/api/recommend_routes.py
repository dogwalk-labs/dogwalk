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
    print(f"### user_id={user_id}, tags={req.tags}, minutes={req.minutes}")

    # ⭐ 1단계: DB에서 인기 경로 1개만 찾기
    db_routes = []

    if req.tags:
        try:
            rows = db.execute(
                text("""
                    SELECT
                        p.id AS path_id,
                        p.minutes,
                        p.distance_m,
                        p.duration_sec,
                        ST_AsGeoJSON(p.geom) AS geometry_json,
                        p.meta,
                        SUM(ptc.count) AS match_score
                    FROM paths p
                    JOIN path_tag_counts ptc ON p.id = ptc.path_id
                    WHERE
                        ST_DWithin(
                            ST_StartPoint(p.geom)::geography,
                            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                            500
                        )
                        AND ptc.tag = ANY(:tags)
                        AND p.minutes BETWEEN :min_low AND :min_high
                    GROUP BY p.id, p.minutes, p.distance_m, p.duration_sec, p.geom, p.meta
                    ORDER BY match_score DESC
                    LIMIT 1
                """),
                {
                    "lng": req.start.lng,
                    "lat": req.start.lat,
                    "tags": req.tags,
                    "min_low": req.minutes - 10,
                    "min_high": req.minutes + 10,
                },
            ).mappings().all()

            for row in rows:
                geometry = json.loads(row["geometry_json"]) if row["geometry_json"] else None
                meta = row["meta"] or {}

                db_routes.append({
                    "routeId": meta.get("route_id") or str(row["path_id"]),
                    "pathId": str(row["path_id"]),
                    "minutes": row["minutes"],
                    "title": f"🔥 인기 코스 (추천 {row['match_score']}회)",
                    "distanceM": row["distance_m"],
                    "durationSec": row["duration_sec"],
                    "geometry": geometry,
                    "fromDb": True,
                })

            print(f"### DB에서 {len(db_routes)}개 경로 찾음")

        except Exception as e:
            print(f"### DB 조회 실패 (무시하고 OSRM으로 진행): {e}")
            db_routes = []

    # ⭐ 2단계: 나머지를 OSRM에서 새로 만들기 (DB가 1개면 2개, 없으면 3개)
    needed = 3 - len(db_routes)
    osrm_routes = []

    if needed > 0:
        payload = {
            "start": req.start.model_dump(),
            "minutes": req.minutes,
            "userId": user_id,
            "count": needed,
            "tags": req.tags,
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
                osrm_routes = node_data.get("routes", [])

            print(f"### OSRM에서 {len(osrm_routes)}개 경로 받음")

        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="ignore")
            print(f"### OSRM 호출 실패: {e.code} / {detail}")
            if not db_routes:
                raise HTTPException(
                    status_code=502,
                    detail=f"Recommender HTTPError: {e.code} / {detail}"
                )
        except Exception as e:
            print(f"### OSRM 호출 실패: {e}")
            if not db_routes:
                raise HTTPException(
                    status_code=502,
                    detail=f"Recommender call failed: {type(e).__name__}: {repr(e)}"
                )

    # ⭐ 3단계: DB 1개 + OSRM N개 합쳐서 반환
    all_routes = db_routes + osrm_routes
    print(f"### 최종 추천: DB {len(db_routes)}개 + OSRM {len(osrm_routes)}개 = {len(all_routes)}개")

    return {"routes": all_routes}