from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=4)
    password_confirm: str = Field(min_length=4)
    nickname: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id: str
    email: Optional[str] = None
    nickname: Optional[str] = None

class MeResponse(BaseModel):
    id: str
    email: Optional[str] = None
    nickname: Optional[str] = None
    provider: str