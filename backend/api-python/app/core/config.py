import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
CORS_ALLOW_ORIGINS = os.getenv("CORS_ALLOW_ORIGINS", "*")

OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "http://osrm-routed:5000")
OSRM_PROFILE = os.getenv("OSRM_PROFILE", "foot")
OSRM_TIMEOUT_SEC = float(os.getenv("OSRM_TIMEOUT_SEC", "5"))