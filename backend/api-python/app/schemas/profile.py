from typing import Optional

from pydantic import BaseModel


class UserProfileRequest(BaseModel):
    user_id: str
    nickname: str
    age: int
    gender: str
    emergency_contact: str
    image_url: Optional[str] = None


class DogRequest(BaseModel):
    user_id: str
    name: str
    age: int
    gender: str
    breed: str
    image_url: Optional[str] = None

