from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import CORS_ALLOW_ORIGINS
from app.api.users import router as users_router

app = FastAPI(title="DogWalk API (DB Ready)")

allow_origins = [o.strip() for o in CORS_ALLOW_ORIGINS.split(",")] if CORS_ALLOW_ORIGINS else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins if allow_origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)

@app.get("/health")
def health():
    return {"ok": True}

from app.api.feedback import router as feedback_router
app.include_router(feedback_router)


from app.api.paths import router as paths_router
app.include_router(paths_router)


from app.api.recommend_routes import router as recommend_router
app.include_router(recommend_router)

