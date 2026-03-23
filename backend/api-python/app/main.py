from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.feedback import router as feedback_router
from app.api.paths import router as paths_router
from app.api.recommend_routes import router as recommend_router
from app.api.users import router as users_router
from app.core.config import CORS_ALLOW_ORIGINS

app = FastAPI(title="dogwalk api")

origins = ["*"] if CORS_ALLOW_ORIGINS == "*" else [x.strip() for x in CORS_ALLOW_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(feedback_router)
app.include_router(paths_router)
app.include_router(recommend_router)


@app.get("/")
def root():
    return {"ok": True}