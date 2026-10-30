import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.router import router as api_router
from app.core.config import CORS_ORIGINS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stock_analysis_api")

app = FastAPI(
    title="Stock Market Trend Analysis API",
    version="1.0.0",
    description="Full-stack financial analytics and machine-learning trend prediction API using FastAPI and Scikit-Learn.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration restricted to frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth_router)
app.include_router(api_router)


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return structured JSON without stack traces."""
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred while processing your request."},
    )


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Stock Market Trend Analysis API is running.",
        "documentation": "/docs",
        "health": "/api/health",
        "default_dataset": "/api/dataset/default",
    }
