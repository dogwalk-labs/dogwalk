#paths.py
from uuid import uuid4
import json

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter(prefix="/paths", tags=["paths"])


class Geometry(BaseModel):
    type: str
    coordinates: list[list[float]]


class CreatePathRequest(BaseModel):
    minutes: int
    distance_m: int
    duration_sec: int
    geometry: Geometry | None = None
    meta: dict | None = None
    route_id: str | None = None


@router.post("")
def create_path(
    req: CreatePathRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    user = db.execute(
        text("SELECT 1 FROM users WHERE id = :id"),
        {"id": user_id},
    ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="user not found")

    # ⭐ 3단계 필터로 비슷한 경로 찾기
    if req.geometry and req.geometry.coordinates:
        geometry_json_str = json.dumps(req.geometry.model_dump())
        start_lng, start_lat = req.geometry.coordinates[0]

        existing = db.execute(
            text("""
                SELECT id
                FROM paths
                WHERE
                    ST_DWithin(
                        ST_StartPoint(geom)::geography,
                        ST_SetSRID(ST_MakePoint(:start_lng, :start_lat), 4326)::geography,
                        100
                    )
                    AND ABS(distance_m - :new_distance) < 150
                    AND ABS(minutes - :new_minutes) < 5
                    AND ST_HausdorffDistance(
                        geom,
                        ST_SetSRID(ST_GeomFromGeoJSON(:new_geom), 4326)
                    ) * 111000 < 30
                LIMIT 1
            """),
            {
                "start_lng": start_lng,
                "start_lat": start_lat,
                "new_distance": req.distance_m,
                "new_minutes": req.minutes,
                "new_geom": geometry_json_str,
            },
        ).fetchone()

        if existing:
            existing_id = str(existing[0])
            print(f"### path 재사용 (경로 모양 일치): {existing_id}")
            return {"pathId": existing_id}

    # 새로 생성
    path_id = str(uuid4())

    meta_dict = req.meta or {}
    if req.route_id:
        meta_dict["route_id"] = req.route_id
    meta_json = json.dumps(meta_dict)

    geometry_json = json.dumps(req.geometry.model_dump()) if req.geometry else None

    db.execute(
        text("""
            INSERT INTO paths (
                id, user_id, minutes, distance_m, duration_sec, geom, meta
            )
            VALUES (
                :id, :uid, :min, :dist, :dur,
                CASE
                    WHEN :geometry IS NOT NULL
                    THEN ST_SetSRID(ST_GeomFromGeoJSON(:geometry), 4326)
                    ELSE NULL
                END,
                CAST(:meta AS jsonb)
            )
        """),
        {
            "id": path_id,
            "uid": user_id,
            "min": int(req.minutes),
            "dist": int(req.distance_m),
            "dur": int(req.duration_sec),
            "geometry": geometry_json,
            "meta": meta_json,
        },
    )
    db.commit()
    print(f"### path 새로 생성: {path_id}")
    return {"pathId": path_id}


@router.get("/liked")
def get_liked_paths(
    limit: int = Query(2, ge=1, le=10),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
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
        {"uid": user_id, "limit": limit},
    ).mappings().all()

    return {"paths": rows}