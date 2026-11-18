
print("### recommend_routes.py loaded ###")

import json
import math
import os
import urllib.request
import urllib.error
from uuid import uuid4
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.config import OSRM_BASE_URL, OSRM_PROFILE
from app.core.security import get_current_user_id


router = APIRouter(prefix="/routes", tags=["recommend"])


# ===================================================
# 요청 모델
# ===================================================

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


class CuratedRouteRequest(BaseModel):
    title: str = Field(
        default="추천 산책 코스",
        min_length=1,
        max_length=100,
    )
    distanceM: int = Field(..., gt=0)
    durationSec: int = Field(..., gt=0)
    geometry: dict


# ===================================================
# 공통 함수
# ===================================================

def get_admin_ids():
    return {
        value.strip()
        for value in os.getenv(
            "CURATED_ROUTE_ADMIN_IDS", ""
        ).split(",")
        if value.strip()
    }


def validate_geometry(geometry):
    if not isinstance(geometry, dict):
        raise HTTPException(
            status_code=400,
            detail="geometry는 GeoJSON 객체여야 합니다.",
        )

    if geometry.get("type") != "LineString":
        raise HTTPException(
            status_code=400,
            detail="LineString 경로만 저장할 수 있습니다.",
        )

    coordinates = geometry.get("coordinates")

    if (
        not isinstance(coordinates, list)
        or len(coordinates) < 2
    ):
        raise HTTPException(
            status_code=400,
            detail="경로 좌표가 부족합니다.",
        )

    if len(coordinates) > 20000:
        raise HTTPException(
            status_code=400,
            detail="경로 좌표가 너무 많습니다.",
        )

    for point in coordinates:
        if (
            not isinstance(point, list)
            or len(point) != 2
        ):
            raise HTTPException(
                status_code=400,
                detail="경로 좌표 형식이 잘못되었습니다.",
            )

        lng, lat = point

        if (
            isinstance(lng, bool)
            or isinstance(lat, bool)
            or not isinstance(lng, (int, float))
            or not isinstance(lat, (int, float))
            or not math.isfinite(lng)
            or not math.isfinite(lat)
            or not (-180 <= lng <= 180)
            or not (-90 <= lat <= 90)
        ):
            raise HTTPException(
                status_code=400,
                detail="경로 좌표 범위가 잘못되었습니다.",
            )


def parse_db_geometry(value):
    if value is None:
        return None

    if isinstance(value, str):
        value = json.loads(value)

    if isinstance(value, list):
        value = {
            "type": "LineString",
            "coordinates": value,
        }

    if not isinstance(value, dict):
        return None

    if value.get("type") != "LineString":
        return None

    if not isinstance(value.get("coordinates"), list):
        return None

    return value


# ===================================================
# 1. OSRM 연결 테스트 API
# ===================================================

@router.post("/osrm/route")
async def osrm_route(req: OsrmTestRequest):
    import httpx

    base = OSRM_BASE_URL.rstrip("/")

    url = (
        f"{base}/route/v1/{OSRM_PROFILE}/"
        f"{req.start.lng},{req.start.lat};"
        f"{req.end.lng},{req.end.lat}"
    )

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

        async with httpx.AsyncClient(
            timeout=timeout,
            trust_env=False,
        ) as client:
            r = await client.get(
                url,
                params=params,
            )

            r.raise_for_status()
            data = r.json()

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=(
                f"OSRM call failed: "
                f"{type(e).__name__}: {repr(e)}"
            ),
        )

    routes = data.get("routes") or []

    if not routes:
        raise HTTPException(
            status_code=502,
            detail="OSRM returned no routes",
        )

    r0 = routes[0]

    return {
        "distance_m": r0.get("distance"),
        "duration_sec": r0.get("duration"),
        "geometry": r0.get("geometry"),
    }


# ===================================================
# 2. 관리자 제작 경로 저장 API
# ===================================================

@router.post("/curated")
async def save_curated_route(
    req: CuratedRouteRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    admin_ids = get_admin_ids()

    if str(user_id) not in admin_ids:
        raise HTTPException(
            status_code=403,
            detail="관리자만 경로를 저장할 수 있습니다.",
        )

    validate_geometry(req.geometry)

    route_id = str(uuid4())
    minutes = max(1, round(req.durationSec / 60))

    try:
        result = db.execute(
            text("""
                SELECT public.save_curated_route(
                    :route_id,
                    :minutes,
                    :distance_m,
                    :duration_sec,
                    CAST(:geometry AS jsonb),
                    :title
                ) AS path_id
            """),
            {
                "route_id": route_id,
                "minutes": minutes,
                "distance_m": req.distanceM,
                "duration_sec": req.durationSec,
                "geometry": json.dumps(req.geometry),
                "title": req.title,
            },
        ).mappings().one()

        db.commit()

        print(
            "### 관리자 경로 저장 완료:",
            result["path_id"],
            flush=True,
        )

        return {
            "ok": True,
            "routeId": route_id,
            "pathId": str(result["path_id"]),
            "message": "관리자 추천 경로가 저장되었습니다.",
        }

    except Exception as e:
        db.rollback()

        print(
            "### 관리자 경로 저장 실패:",
            repr(e),
            flush=True,
        )

        raise HTTPException(
            status_code=500,
            detail="관리자 경로 저장에 실패했습니다.",
        )


# ===================================================
# 3. 관리자 추천 경로 조회
# ===================================================

def find_curated_route(req, db):
    try:
        rows = db.execute(
            text("""
                SELECT
                    p.id AS path_id,
                    p.route_id,
                    p.minutes,
                    p.distance_m,
                    p.duration_sec,
                    ST_AsGeoJSON(p.geom) AS geometry_json,
                    p.meta
                FROM public.paths p
                WHERE
                    p.meta->>'source' = 'admin_curated'
                    AND p.geom IS NOT NULL
                    AND ST_DWithin(
                        ST_StartPoint(p.geom)::geography,
                        ST_SetSRID(
                            ST_MakePoint(:lng, :lat),
                            4326
                        )::geography,
                        500
                    )
                    AND p.minutes BETWEEN
                        :min_low AND :min_high
                ORDER BY
                    ST_Distance(
                        ST_StartPoint(p.geom)::geography,
                        ST_SetSRID(
                            ST_MakePoint(:lng, :lat),
                            4326
                        )::geography
                    ) ASC
                LIMIT 1
            """),
            {
                "lng": req.start.lng,
                "lat": req.start.lat,
                "min_low": max(1, req.minutes - 10),
                "min_high": req.minutes + 10,
            },
        ).mappings().all()

        result = []

        for row in rows:
            geometry = parse_db_geometry(
                row["geometry_json"]
            )

            if not geometry:
                continue

            meta = row["meta"] or {}

            result.append({
                "routeId": (
                    row["route_id"]
                    or str(row["path_id"])
                ),
                "pathId": str(row["path_id"]),
                "minutes": row["minutes"],
                "title": meta.get(
                    "title",
                    "관리자 추천 코스",
                ),
                "distanceM": row["distance_m"],
                "durationSec": row["duration_sec"],
                "geometry": geometry,
                "fromDb": True,
                "curated": True,
                "traits": {
                    "tags": ["관리자 추천"],
                    "explanation": (
                        "직접 설계한 추천 산책 코스입니다."
                    ),
                },
                "explanation": (
                    "직접 설계한 추천 산책 코스입니다."
                ),
            })

        print(
            f"### 관리자 경로 {len(result)}개 검색",
            flush=True,
        )

        return result

    except Exception as e:
        db.rollback()

        print(
            "### 관리자 경로 조회 실패:",
            repr(e),
            flush=True,
        )

        return []


# ===================================================
# 4. 기존 인기코스 조회
# ===================================================

def find_popular_route(req, db):
    if not req.tags:
        return []

    try:
        rows = db.execute(
            text("""
                SELECT
                    p.id AS path_id,
                    p.route_id,
                    p.minutes,
                    p.distance_m,
                    p.duration_sec,
                    ST_AsGeoJSON(p.geom) AS geometry_json,
                    p.meta,
                    SUM(ptc.count) AS match_score
                FROM public.paths p
                JOIN public.path_tag_counts ptc
                    ON p.id = ptc.path_id
                WHERE
                    p.geom IS NOT NULL
                    AND ST_DWithin(
                        ST_StartPoint(p.geom)::geography,
                        ST_SetSRID(
                            ST_MakePoint(:lng, :lat),
                            4326
                        )::geography,
                        500
                    )
                    AND ptc.tag = ANY(:tags)
                    AND p.minutes BETWEEN
                        :min_low AND :min_high
                    AND COALESCE(
                        p.meta->>'source',
                        ''
                    ) <> 'admin_curated'
                GROUP BY
                    p.id,
                    p.route_id,
                    p.minutes,
                    p.distance_m,
                    p.duration_sec,
                    p.geom,
                    p.meta
                ORDER BY match_score DESC
                LIMIT 1
            """),
            {
                "lng": req.start.lng,
                "lat": req.start.lat,
                "tags": req.tags,
                "min_low": max(1, req.minutes - 10),
                "min_high": req.minutes + 10,
            },
        ).mappings().all()

        result = []

        for row in rows:
            geometry = parse_db_geometry(
                row["geometry_json"]
            )

            if not geometry:
                continue

            meta = row["meta"] or {}

            result.append({
                "routeId": (
                    meta.get("route_id")
                    or row["route_id"]
                    or str(row["path_id"])
                ),
                "pathId": str(row["path_id"]),
                "minutes": row["minutes"],
                "title": (
                    f"🔥 인기 코스 "
                    f"(추천 {row['match_score']}회)"
                ),
                "distanceM": row["distance_m"],
                "durationSec": row["duration_sec"],
                "geometry": geometry,
                "fromDb": True,
                "curated": False,
            })

        print(
            f"### 기존 인기코스 {len(result)}개 검색",
            flush=True,
        )

        return result

    except Exception as e:
        db.rollback()

        print(
            "### 기존 인기코스 조회 실패:",
            repr(e),
            flush=True,
        )

        return []


# ===================================================
# 5. 최종 경로 추천 API
# ===================================================

@router.post("/recommend")
async def recommend(
    req: RecommendRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    print(
        "### /routes/recommend entered ###",
        flush=True,
    )

    print(
        f"### user_id={user_id}, "
        f"tags={req.tags}, "
        f"minutes={req.minutes}",
        flush=True,
    )

    # 1순위: 관리자 제작 코스
    db_routes = find_curated_route(req, db)

    # 2순위: 기존 인기코스
    if not db_routes:
        db_routes = find_popular_route(req, db)

    # 3순위: 나머지는 OSRM 자동 생성
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

        url = os.getenv(
            "NODE_RECOMMEND_URL",
            "http://localhost:8080/recommend",
        )

        try:
            body = json.dumps(payload).encode("utf-8")

            request = urllib.request.Request(
                url,
                data=body,
                headers={
                    "Content-Type": "application/json",
                },
                method="POST",
            )

            with urllib.request.urlopen(
                request,
                timeout=30,
            ) as response:
                raw = response.read().decode("utf-8")
                node_data = json.loads(raw)

                osrm_routes = node_data.get(
                    "routes",
                    [],
                )

            print(
                f"### OSRM에서 "
                f"{len(osrm_routes)}개 경로 받음",
                flush=True,
            )

        except urllib.error.HTTPError as e:
            detail = e.read().decode(
                "utf-8",
                errors="ignore",
            )

            print(
                f"### OSRM 호출 실패: "
                f"{e.code} / {detail}",
                flush=True,
            )

            if not db_routes:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"Recommender HTTPError: "
                        f"{e.code} / {detail}"
                    ),
                )

        except Exception as e:
            print(
                f"### OSRM 호출 실패: {e}",
                flush=True,
            )

            if not db_routes:
                raise HTTPException(
                    status_code=502,
                    detail=(
                        f"Recommender call failed: "
                        f"{type(e).__name__}: {repr(e)}"
                    ),
                )

    # DB 경로 + OSRM 경로 합치기
    all_routes = db_routes + osrm_routes

    print(
        f"### 최종 추천: "
        f"DB {len(db_routes)}개 + "
        f"OSRM {len(osrm_routes)}개 = "
        f"{len(all_routes)}개",
        flush=True,
    )

    return {
        "routes": all_routes[:3],
    }
