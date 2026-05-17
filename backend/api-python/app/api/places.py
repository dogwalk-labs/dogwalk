# places.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import get_db
from app.core.security import get_current_user_id

router = APIRouter(prefix="/places", tags=["places"])


class CreateReviewRequest(BaseModel):
    rating: int
    content: str

@router.get("/my-favorites")
def get_favorites(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    rows = db.execute(
        text("""
            SELECT poi_id FROM favorites
            WHERE user_id = :user_id
        """),
        {"user_id": user_id},
    ).mappings().all()

    return {"favorites": [r["poi_id"] for r in rows]}


@router.post("/{poi_id}/reviews")
def create_review(
    poi_id: str,
    req: CreateReviewRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    existing = db.execute(
        text("""
            SELECT id FROM place_reviews
            WHERE poi_id = :poi_id AND user_id = :user_id
        """),
        {"poi_id": poi_id, "user_id": user_id},
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="이미 리뷰를 작성했어요!")

    db.execute(
        text("""
            INSERT INTO place_reviews (poi_id, user_id, rating, content)
            VALUES (:poi_id, :user_id, :rating, :content)
        """),
        {
            "poi_id": poi_id,
            "user_id": user_id,
            "rating": req.rating,
            "content": req.content,
        },
    )
    db.commit()
    return {"ok": True}


@router.get("/{poi_id}/reviews")
def get_reviews(
    poi_id: str,
    db: Session = Depends(get_db),
):
    rows = db.execute(
        text("""
            SELECT
                pr.id,
                pr.rating,
                pr.content,
                pr.created_at,
                pr.user_id,
                up.nickname AS user_name
            FROM place_reviews pr
            LEFT JOIN user_profiles up ON up.user_id = pr.user_id
            WHERE pr.poi_id = :poi_id
            ORDER BY pr.created_at DESC
        """),
        {"poi_id": poi_id},
    ).mappings().all()

    return {
        "reviews": [
            {
                "id": str(r["id"]),
                "userId": str(r["user_id"]),
                "userName": r["user_name"] or "사용자",
                "rating": r["rating"],
                "content": r["content"],
                "date": r["created_at"].strftime("%Y.%m.%d") if r["created_at"] else "",
            }
            for r in rows
        ]
    }


@router.get("/{poi_id}/stats")
def get_review_stats(
    poi_id: str,
    db: Session = Depends(get_db),
):
    row = db.execute(
        text("""
            SELECT
                COUNT(*) AS review_count,
                COALESCE(AVG(rating), 0) AS avg_rating
            FROM place_reviews
            WHERE poi_id = :poi_id
        """),
        {"poi_id": poi_id},
    ).mappings().fetchone()

    return {
        "reviewCount": row["review_count"],
        "avgRating": round(float(row["avg_rating"]), 1),
    }


@router.post("/{poi_id}/favorite")
def add_favorite(
    poi_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    existing = db.execute(
        text("""
            SELECT id FROM favorites
            WHERE poi_id = :poi_id AND user_id = :user_id
        """),
        {"poi_id": poi_id, "user_id": user_id},
    ).fetchone()

    if existing:
        return {"ok": True, "message": "already favorited"}

    db.execute(
        text("""
            INSERT INTO favorites (poi_id, user_id)
            VALUES (:poi_id, :user_id)
        """),
        {"poi_id": poi_id, "user_id": user_id},
    )
    db.commit()
    return {"ok": True}


@router.delete("/{poi_id}/favorite")
def remove_favorite(
    poi_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    db.execute(
        text("""
            DELETE FROM favorites
            WHERE poi_id = :poi_id AND user_id = :user_id
        """),
        {"poi_id": poi_id, "user_id": user_id},
    )
    db.commit()
    return {"ok": True}