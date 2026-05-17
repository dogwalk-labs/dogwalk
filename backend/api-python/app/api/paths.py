# paths.py
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
    try:
        db.execute(
            text("""
                INSERT INTO users (id)
                VALUES (:id)
                ON CONFLICT (id) DO NOTHING
            """),
            {"id": user_id},
        )

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
                            ST_SetSRID(ST_GeomFromGeoJSON(:new_geom)::geometry, 4326)
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

        path_id = str(uuid4())
        meta_dict = req.meta or {}

        if req.route_id:
            meta_dict["route_id"] = req.route_id

        meta_json = json.dumps(meta_dict)
        geometry_json = (
            json.dumps(req.geometry.model_dump())
            if req.geometry
            else None
        )

        print("### path insert 시작")
        print("### user_id:", user_id)
        print("### distance:", req.distance_m)
        print("### duration:", req.duration_sec)

        db.execute(
            text("""
                INSERT INTO paths (
                    id,
                    user_id,
                    minutes,
                    distance_m,
                    duration_sec,
                    geom,
                    meta
                )
                VALUES (
                    :id,
                    :uid,
                    :min,
                    :dist,
                    :dur,
                    CASE
                        WHEN :geometry IS NOT NULL
                        THEN ST_SetSRID(
                            ST_GeomFromGeoJSON(:geometry)::geometry,
                            4326
                        )
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

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print("### path 저장 실패 실제 에러:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))


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
            WHERE
                f.user_id = :uid
                AND f.value = 1
            ORDER BY f.created_at DESC
            LIMIT :limit
        """),
        {"uid": user_id, "limit": limit},
    ).mappings().all()

    return {"paths": rows}


@router.get("/ranking/monthly")
def get_monthly_ranking(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    rows = db.execute(
        text("""
            SELECT
                u.id,
                up.nickname,
                d.name AS dog_name,
                SUM(p.distance_m) AS total_distance_m,
                RANK() OVER (ORDER BY SUM(p.distance_m) DESC) AS rank
            FROM paths p
            JOIN users u ON u.id = p.user_id
            LEFT JOIN user_profiles up ON up.user_id = u.id
            LEFT JOIN dogs d ON d.user_id = u.id
            WHERE
                DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
            GROUP BY u.id, up.nickname, d.name
            ORDER BY total_distance_m DESC
            LIMIT 10
        """)
    ).mappings().all()

    my_row = db.execute(
        text("""
            SELECT
                SUM(p.distance_m) AS total_distance_m,
                RANK() OVER (ORDER BY SUM(p.distance_m) DESC) AS rank
            FROM paths p
            WHERE
                p.user_id = :uid
                AND DATE_TRUNC('month', p.created_at) = DATE_TRUNC('month', NOW())
            GROUP BY p.user_id
        """),
        {"uid": user_id},
    ).mappings().fetchone()

    return {
        "leaderboard": [
            {
                "id": str(r["id"]),
                "nickname": r["nickname"] or "이름 없음",
                "dogName": r["dog_name"] or "반려견",
                "distanceKm": round(r["total_distance_m"] / 1000, 1),
                "rank": r["rank"],
            }
            for r in rows
        ],
        "myStats": {
            "distanceKm": round(my_row["total_distance_m"] / 1000, 1) if my_row else 0,
            "rank": my_row["rank"] if my_row else "-",
        },
    }
    
@router.get("/stats")
def get_walk_stats(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    weekly = db.execute(
        text("""
            SELECT
                COALESCE(SUM(distance_m), 0) AS total_distance_m,
                COALESCE(SUM(duration_sec), 0) AS total_duration_sec
            FROM paths
            WHERE
                user_id = :uid
                AND created_at >= date_trunc('week', NOW())
        """),
        {"uid": user_id},
    ).mappings().fetchone()

    monthly = db.execute(
        text("""
            SELECT
                COALESCE(SUM(distance_m), 0) AS total_distance_m,
                COALESCE(SUM(duration_sec), 0) AS total_duration_sec
            FROM paths
            WHERE
                user_id = :uid
                AND created_at >= date_trunc('month', NOW())
        """),
        {"uid": user_id},
    ).mappings().fetchone()

    def fmt_duration(sec):
        h = int(sec) // 3600
        m = (int(sec) % 3600) // 60
        if h > 0:
            return f"{h}시간 {m}분"
        return f"{m}분"

    return {
        "weekly": {
            "distanceKm": round(weekly["total_distance_m"] / 1000, 1),
            "duration": fmt_duration(weekly["total_duration_sec"]),
        },
        "monthly": {
            "distanceKm": round(monthly["total_distance_m"] / 1000, 1),
            "duration": fmt_duration(monthly["total_duration_sec"]),
        },
    }
    
@router.get("/stats/user/{target_user_id}")
def get_user_walk_stats(
    target_user_id: str,
    db: Session = Depends(get_db),
):
    weekly = db.execute(
        text("""
            SELECT
                COALESCE(SUM(distance_m), 0) AS total_distance_m,
                COALESCE(SUM(duration_sec), 0) AS total_duration_sec
            FROM paths
            WHERE
                user_id = :uid
                AND created_at >= date_trunc('week', NOW())
        """),
        {"uid": target_user_id},
    ).mappings().fetchone()

    monthly = db.execute(
        text("""
            SELECT
                COALESCE(SUM(distance_m), 0) AS total_distance_m,
                COALESCE(SUM(duration_sec), 0) AS total_duration_sec
            FROM paths
            WHERE
                user_id = :uid
                AND created_at >= date_trunc('month', NOW())
        """),
        {"uid": target_user_id},
    ).mappings().fetchone()

    def fmt_duration(sec):
        h = int(sec) // 3600
        m = (int(sec) % 3600) // 60
        if h > 0:
            return f"{h}시간 {m}분"
        return f"{m}분"

    return {
        "weekly": {
            "distanceKm": round(weekly["total_distance_m"] / 1000, 1),
            "duration": fmt_duration(weekly["total_duration_sec"]),
        },
        "monthly": {
            "distanceKm": round(monthly["total_distance_m"] / 1000, 1),
            "duration": fmt_duration(monthly["total_duration_sec"]),
        },
    }