from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.profile import UserProfileRequest, DogRequest

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.post("/user")
def create_user_profile(payload: UserProfileRequest, db: Session = Depends(get_db)):
    db.execute(
        text("""
            INSERT INTO user_profiles
            (user_id, nickname, age, gender, emergency_contact)
            VALUES
            (:user_id, :nickname, :age, :gender, :emergency_contact)
        """),
        {
            "user_id": payload.user_id,
            "nickname": payload.nickname,
            "age": payload.age,
            "gender": payload.gender,
            "emergency_contact": payload.emergency_contact,
        },
    )

    db.commit()

    return {"ok": True}


@router.post("/dog")
def create_dog(payload: DogRequest, db: Session = Depends(get_db)):
    db.execute(
        text("""
            INSERT INTO dogs
            (user_id, name, age, gender, breed)
            VALUES
            (:user_id, :name, :age, :gender, :breed)
        """),
        {
            "user_id": payload.user_id,
            "name": payload.name,
            "age": payload.age,
            "gender": payload.gender,
            "breed": payload.breed,
        },
    )

    db.commit()

    return {"ok": True}

