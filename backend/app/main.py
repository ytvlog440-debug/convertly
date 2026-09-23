import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.errors import ConvertlyException, convertly_exception_handler
from app.db.session import init_db
from app.api.v1.router import api_router
from app.services.cleaner import run_periodic_cleanup_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    logger.info("Initializing Convertly V2 Backend Services...")
    await init_db()
    logger.info("Database schemas initialized.")

    # Start periodic file retention cleaner
    cleanup_stop_event = asyncio.Event()
    cleanup_task = asyncio.create_task(run_periodic_cleanup_loop(stop_event=cleanup_stop_event))
    app.state.cleanup_task = cleanup_task
    app.state.cleanup_stop_event = cleanup_stop_event

    yield

    # Shutdown
    logger.info("Shutting down Convertly V2 Backend gracefully...")
    cleanup_stop_event.set()
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    logger.info("Convertly V2 Backend shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Enterprise-grade Document & Media Conversion SaaS Platform API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Custom Exception Handlers
app.add_exception_handler(ConvertlyException, convertly_exception_handler)

# CORS Middleware
origins = list(set([
    "https://convertlytools.xyz",
    "https://www.convertlytools.xyz",
    "https://convertly-production-285a.up.railway.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
] + settings.CORS_ORIGINS))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    """Enforces sliding-window rate limits and injects strict security headers."""
    from app.core.security import get_trusted_client_ip, mutation_rate_limiter, polling_rate_limiter

    path = request.url.path
    method = request.method
    is_mutation = method in ("POST", "PUT", "DELETE", "PATCH")

    # 1. Mutation rate limit: upload and job creation
    if path.startswith("/api/v1/files/upload") or (path == "/api/v1/jobs" and is_mutation):
        client_ip = get_trusted_client_ip(request)
        if not mutation_rate_limiter.is_allowed(client_ip):
            return JSONResponse(
                status_code=429,
                content={
                    "type": "https://convertlytools.xyz/errors/rate_limit_exceeded",
                    "title": "Rate Limit Exceeded",
                    "status": 429,
                    "detail": "Too many conversion or upload requests. Please slow down and try again in a moment.",
                },
                headers={"Retry-After": "60"},
            )

    # 2. Polling rate limit: job status checking (protects against aggressive polling DoS)
    elif path.startswith("/api/v1/jobs/") and method == "GET":
        client_ip = get_trusted_client_ip(request)
        if not polling_rate_limiter.is_allowed(client_ip):
            return JSONResponse(
                status_code=429,
                content={
                    "type": "https://convertlytools.xyz/errors/rate_limit_exceeded",
                    "title": "Rate Limit Exceeded",
                    "status": 429,
                    "detail": "Excessive status polling detected. Please slow down.",
                },
                headers={"Retry-After": "60"},
            )

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Robots-Tag"] = "noindex, nofollow"
    return response


# Include API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root Health Probe")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "operational",
        "version": "2.0.0",
        "docs_url": f"{settings.API_V1_STR}/docs"
    }
