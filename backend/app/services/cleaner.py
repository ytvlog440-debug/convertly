import asyncio
import os
import shutil
import tempfile
import time
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.db.session import AsyncSessionLocal
from app.models.file_record import FileRecord
from app.services.storage import get_storage_service


async def purge_expired_files(session: AsyncSession) -> int:
    """
    Finds and physically unlinks all files whose retention TTL has expired.
    Safely marks database records as deleted without leaking user filenames in logs.
    """
    now = datetime.now(timezone.utc)
    stmt = select(FileRecord).where(
        FileRecord.is_deleted == False,
        FileRecord.expires_at <= now
    )
    result = await session.execute(stmt)
    expired_records = result.scalars().all()

    if not expired_records:
        return 0

    storage = get_storage_service()
    deleted_count = 0

    for record in expired_records:
        try:
            await storage.delete_file(record.storage_key)
            record.is_deleted = True
            deleted_count += 1
        except Exception as e:
            # Safe logging: Log only record ID, never user filename or storage key
            logger.error(f"Failed to delete file ID {record.id}: {e}")

    await session.commit()
    if deleted_count > 0:
        logger.info(f"Purged {deleted_count} expired files from storage.")
    return deleted_count


def cleanup_stale_temp_dirs(max_age_minutes: Optional[int] = None) -> int:
    """
    Sweeps orphaned temporary conversion folders (convertly_job_*) in the system temp directory
    that were abandoned due to abrupt worker crashes or timeouts.
    """
    age_threshold = (max_age_minutes or settings.FILE_RETENTION_MINUTES) * 60
    now = time.time()
    temp_base = tempfile.gettempdir()
    cleaned = 0

    try:
        if not os.path.exists(temp_base):
            return 0

        for item in os.listdir(temp_base):
            if item.startswith("convertly_job_"):
                dir_path = os.path.join(temp_base, item)
                try:
                    if os.path.isdir(dir_path):
                        mtime = os.path.getmtime(dir_path)
                        if (now - mtime) > age_threshold:
                            shutil.rmtree(dir_path, ignore_errors=True)
                            cleaned += 1
                except Exception as e:
                    logger.debug(f"Could not inspect or remove temp dir {item}: {e}")
    except Exception as e:
        logger.debug(f"Error scanning temp directory for stale job folders: {e}")

    if cleaned > 0:
        logger.info(f"Cleaned {cleaned} stale temporary conversion directories.")
    return cleaned


async def run_periodic_cleanup_loop(stop_event: Optional[asyncio.Event] = None) -> None:
    """
    Managed background cleanup loop running periodically during the application lifespan.
    Ensures expired files are purged independently of user traffic without crashing or overlapping.
    """
    logger.info(
        f"Starting periodic file retention cleaner (Interval: {settings.CLEANUP_INTERVAL_SECONDS}s, "
        f"Retention: {settings.FILE_RETENTION_MINUTES}m)."
    )

    while True:
        try:
            # Check stop condition before starting cycle
            if stop_event and stop_event.is_set():
                break

            async with AsyncSessionLocal() as session:
                await purge_expired_files(session)

            # Cleanup orphaned temp directories in system temp
            cleanup_stale_temp_dirs()

        except asyncio.CancelledError:
            logger.info("Periodic file cleaner task cancelled during shutdown.")
            break
        except Exception as e:
            # Guard against unexpected failures: log safely and continue loop
            logger.error(f"Periodic file cleanup cycle encountered an error: {e}", exc_info=True)

        # Wait for next interval or stop event
        try:
            interval = max(0.01, float(settings.CLEANUP_INTERVAL_SECONDS))
            if stop_event:
                try:
                    await asyncio.wait_for(stop_event.wait(), timeout=interval)
                    # If stop_event was set, wait_for returns True
                    break
                except asyncio.TimeoutError:
                    # Timeout elapsed normally, proceed to next cycle
                    pass
            else:
                await asyncio.sleep(interval)
        except asyncio.CancelledError:
            logger.info("Periodic file cleaner sleep interrupted by shutdown cancellation.")
            break

    logger.info("Periodic file retention cleaner stopped gracefully.")
