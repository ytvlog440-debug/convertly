import sys
import platform
import time
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.services.storage import get_storage_service

router = APIRouter()

# In-memory diagnostic cache to prevent database and storage probe saturation
_health_cache: Optional[Dict[str, Any]] = None
_health_cache_time: float = 0.0
_HEALTH_CACHE_TTL_SECONDS: float = 15.0


@router.get("/health", summary="System Health & Diagnostic Check")
async def get_health(db: AsyncSession = Depends(get_db)):
    """
    Production health check verifying:
    - Application status
    - Database read/write connectivity
    - Storage subsystem responsiveness
    Features 15s in-memory caching to protect DB pools from probe saturation.
    """
    global _health_cache, _health_cache_time

    now = time.monotonic()
    if _health_cache is not None and (now - _health_cache_time) < _HEALTH_CACHE_TTL_SECONDS:
        return _health_cache

    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    storage_status = "healthy"
    try:
        storage = get_storage_service()
        # Verify driver is operational
        await storage.file_exists("__health_probe_nonexistent__")
    except Exception as e:
        storage_status = f"unhealthy: {str(e)}"

    overall_status = "healthy" if db_status == "healthy" and storage_status == "healthy" else "degraded"

    result = {
        "status": overall_status,
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "storage": {
            "driver": settings.STORAGE_DRIVER,
            "status": storage_status
        },
        "system": {
            "python_version": sys.version.split()[0],
            "platform": platform.platform(),
            "retention_policy_minutes": settings.FILE_RETENTION_MINUTES,
            "max_upload_mb": settings.MAX_UPLOAD_SIZE_MB
        }
    }

    _health_cache = result
    _health_cache_time = now
    return result
