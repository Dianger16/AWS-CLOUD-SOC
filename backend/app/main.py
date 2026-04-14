"""
main.py — FastAPI application entry point for AI Cloud Security Guardian.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.core.config import settings
from app.database import init_db
from app.services.risk_model import get_model
from app.utils.logger import get_logger
from app.api import scan_routes, risk_routes, alert_routes, auth_routes

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== AI Cloud Security Guardian starting up ===")
    try:
        init_db()
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
    try:
        get_model()
        logger.info("ML risk model loaded.")
    except Exception as e:
        logger.warning(f"ML model pre-load failed: {e}")
    logger.info("Startup complete.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="AI Cloud Security Guardian",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# CORSMiddleware MUST be added before any routers.
# allow_origins=["*"] + allow_credentials=False is the only valid wildcard combo.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_routes.router)
app.include_router(scan_routes.router)
app.include_router(risk_routes.router)
app.include_router(alert_routes.router)

# ── Manual OPTIONS handler — catches any preflight the middleware misses ──────

@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str, request: Request) -> Response:
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )

# ── Root ──────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "AI Cloud Security Guardian", "version": "1.0.0", "docs": "/docs"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},  # show real error during development
    )
