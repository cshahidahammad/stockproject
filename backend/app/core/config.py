import os
from pathlib import Path
from typing import List

# Base directory for backend
BACKEND_DIR = Path(__file__).resolve().parents[2]
WORKSPACE_ROOT = BACKEND_DIR.parent

# Original project directory and dataset
ORIGINAL_PROJECT_DIR = WORKSPACE_ROOT / "Stock_Market_Trend_Analysis_Ready_Project" / "Stock_Market_Trend_Analysis"
DEFAULT_DATASET_PATH = ORIGINAL_PROJECT_DIR / "dataset" / "stock_data.csv"

# Storage for user-uploaded CSVs (isolated by session / dataset_id)
UPLOADS_DIR = BACKEND_DIR / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# CORS configuration
DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

env_cors = os.getenv("CORS_ORIGINS")
if env_cors:
    CORS_ORIGINS: List[str] = [origin.strip() for origin in env_cors.split(",") if origin.strip()]
else:
    CORS_ORIGINS = DEFAULT_CORS_ORIGINS

MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
API_PREFIX = "/api"
