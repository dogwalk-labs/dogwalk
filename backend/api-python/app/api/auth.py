from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session
import random
import string
import smtplib
import ssl
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.schemas.auth import AuthResponse, LoginRequest, SignUpRequest

router = APIRouter(prefix="/auth", tags=["auth"])


async def send_reset_email(email: str, code: str):
    smtp_user = os.getenv("MAIL_USERNAME")
    smtp_pass = os.getenv("MAIL_PASSWORD")
    smtp_pass = smtp_pass.replace(" ", "") if smtp_pass else ""

    print("### SMTP 유저:", smtp_user)
    print("### SMTP 패스 길이:", len(smtp_pass) if smtp_pass else 0)
    msg = MIMEMultipart()
    msg["From"] = smtp_user
    msg["To"] = email
    msg["Subject"] = "[멍멍워크] 비밀번호 재설정 인증번호"

    body = f"""
    안녕하세요! 멍멍워크입니다 🐾

    비밀번호 재설정 인증번호: {code}

    인증번호는 10분간 유효합니다.
    본인이 요청하지 않았다면 이 메일을 무시해주세요.
    """
    msg.attach(MIMEText(body, "plain", "utf-8"))

    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE

    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.ehlo()
        smtp.starttls(context=context)
        smtp.login(smtp_user, smtp_pass)
        smtp.sendmail(smtp_user, email, msg.as_string())

@router.post("/signup", response_model=AuthResponse)
def signup(payload: SignUpRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    print("=== signup debug start ===")
    print("payload =", payload)
    print("email repr =", repr(payload.email))
    print("password repr =", repr(payload.password))
    print("password len =", len(payload.password))
    print("password type =", type(payload.password))
    print("password_confirm repr =", repr(payload.password_confirm))
    print("password_confirm len =", len(payload.password_confirm))
    print("password_confirm type =", type(payload.password_confirm))
    print("nickname repr =", repr(payload.nickname))
    print("=== signup debug end ===")

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

    hashed_password = hash_password(payload.password)

    row = db.execute(
        text("""
            INSERT INTO users (email, password_hash, nickname, provider)
            VALUES (:email, :password_hash, :nickname, 'local')
            RETURNING id, email, nickname
        """),
        {
            "email": email,
            "password_hash": hashed_password,
            "nickname": payload.nickname,
        },
    ).mappings().fetchone()

    db.commit()

    access_token = create_access_token(str(row["id"]))

    return AuthResponse(
        access_token=access_token,
        id=str(row["id"]),
        email=row["email"],
        nickname=row["nickname"],
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()

    print("=== login debug start ===")
    print("email repr =", repr(payload.email))
    print("password repr =", repr(payload.password))
    print("password len =", len(payload.password))
    print("password type =", type(payload.password))
    print("=== login debug end ===")

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
        id=str(user["id"]),
        email=user["email"],
        nickname=user["nickname"],
    )


@router.post("/password-reset/request")
async def password_reset_request(
    payload: dict,
    db: Session = Depends(get_db),
):
    email = payload.get("email", "").strip().lower()
    print("### 비밀번호 찾기 요청 이메일:", repr(email))

    if not email:
        raise HTTPException(status_code=400, detail="이메일을 입력해주세요.")

    user = db.execute(
        text("""
            SELECT id FROM users
            WHERE provider = 'local' AND email = :email
        """),
        {"email": email},
    ).fetchone()

    print("### 유저 조회 결과:", user)

    if not user:
        raise HTTPException(status_code=400, detail="가입이 확인되지 않은 이메일입니다.")

    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    db.execute(
        text("DELETE FROM password_reset_codes WHERE email = :email"),
        {"email": email},
    )
    db.execute(
        text("""
            INSERT INTO password_reset_codes (email, code, expires_at)
            VALUES (:email, :code, :expires_at)
        """),
        {"email": email, "code": code, "expires_at": expires_at},
    )
    db.commit()

    try:
        await send_reset_email(email, code)
    except Exception as e:
        print("이메일 발송 실패:", e)
        raise HTTPException(status_code=500, detail="이메일 발송에 실패했습니다.")

    return {"ok": True}


@router.post("/password-reset/verify")
def password_reset_verify(
    payload: dict,
    db: Session = Depends(get_db),
):
    email = payload.get("email", "").strip().lower()
    code = payload.get("code", "").strip()

    if not email or not code:
        raise HTTPException(status_code=400, detail="이메일과 인증번호를 입력해주세요.")

    row = db.execute(
        text("""
            SELECT code, expires_at FROM password_reset_codes
            WHERE email = :email
            ORDER BY created_at DESC
            LIMIT 1
        """),
        {"email": email},
    ).mappings().fetchone()

    if not row:
        raise HTTPException(status_code=400, detail="인증번호를 먼저 요청해주세요.")

    if datetime.now(timezone.utc) > row["expires_at"]:
        raise HTTPException(status_code=400, detail="인증번호가 만료되었습니다.")

    if row["code"] != code:
        raise HTTPException(status_code=400, detail="인증번호가 일치하지 않습니다.")

    return {"ok": True}


@router.post("/password-reset/confirm")
def password_reset_confirm(
    payload: dict,
    db: Session = Depends(get_db),
):
    email = payload.get("email", "").strip().lower()
    new_password = payload.get("new_password", "")
    new_password_confirm = payload.get("new_password_confirm", "")

    if not email or not new_password:
        raise HTTPException(status_code=400, detail="필수 항목을 입력해주세요.")

    if new_password != new_password_confirm:
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다.")

    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 최소 8자 이상이어야 합니다.")

    row = db.execute(
        text("""
            SELECT code FROM password_reset_codes
            WHERE email = :email
        """),
        {"email": email},
    ).fetchone()

    if not row:
        raise HTTPException(status_code=400, detail="인증이 완료되지 않았습니다.")

    hashed = hash_password(new_password)
    db.execute(
        text("""
            UPDATE users SET password_hash = :hash
            WHERE provider = 'local' AND email = :email
        """),
        {"hash": hashed, "email": email},
    )

    db.execute(
        text("DELETE FROM password_reset_codes WHERE email = :email"),
        {"email": email},
    )

    db.commit()

    return {"ok": True}