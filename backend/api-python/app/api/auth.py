from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user_id,
    hash_password,
    verify_password,
)
from app.schemas.auth import AuthResponse, LoginRequest, MeResponse, SignUpRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignUpRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    if payload.password != payload.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호가 일치하지 않습니다.",
        )

    existing_user = db.execute(
        text("""
            SELECT id
            FROM users
            WHERE provider = 'local' AND email = :email
        """),
        {"email": email},
    ).fetchone()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 가입된 이메일입니다.",
        )

    row = db.execute(
        text("""
            INSERT INTO users (email, password_hash, nickname, provider)
            VALUES (:email, :password_hash, :nickname, 'local')
            RETURNING id, email, nickname
        """),
        {
            "email": email,
            "password_hash": hash_password(payload.password),
            "nickname": payload.nickname,
        },
    ).mappings().fetchone()

    db.commit()

    access_token = create_access_token(str(row["id"]))

    return AuthResponse(
        access_token=access_token,
        user_id=str(row["id"]),
        email=row["email"],
        nickname=row["nickname"],
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    user = db.execute(
        text("""
            SELECT id, email, password_hash, nickname
            FROM users
            WHERE provider = 'local' AND email = :email
        """),
        {"email": email},
    ).mappings().fetchone()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    if not user["password_hash"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="소셜 로그인 계정입니다. 일반 로그인을 사용할 수 없습니다.",
        )

    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )

    access_token = create_access_token(str(user["id"]))

    return AuthResponse(
        access_token=access_token,
        user_id=str(user["id"]),
        email=user["email"],
        nickname=user["nickname"],
    )


@router.get("/me", response_model=MeResponse)
def me(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = db.execute(
        text("""
            SELECT id, email, nickname, provider
            FROM users
            WHERE id = :user_id
        """),
        {"user_id": user_id},
    ).mappings().fetchone()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다.",
        )

    return MeResponse(
        user_id=str(user["id"]),
        email=user["email"],
        nickname=user["nickname"],
        provider=user["provider"],
    )