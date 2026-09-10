from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logging import logger
from app.models.file_record import FileRecord
from app.services.storage import get_storage_service


async def purge_expired_files(session: AsyncSession) -> int:
    """
    Finds and physically deletes all files whose retention TTL has expired.
    Ensures zero permanent storage footprint and full user privacy.
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
            logger.error(f"Failed to delete file key {record.storage_key}: {e}")

    await session.commit()
    logger.info(f"Purged {deleted_count} expired files from storage.")
    return deleted_count
