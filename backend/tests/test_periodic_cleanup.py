import asyncio
import os
import shutil
import tempfile
import time
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal, init_db
from app.main import app
from app.models.file_record import FileRecord
from app.services.cleaner import (
    purge_expired_files,
    cleanup_stale_temp_dirs,
    run_periodic_cleanup_loop
)
from app.services.storage import get_storage_service


# Initialize database schema for tests
try:
    asyncio.run(init_db())
except RuntimeError:
    pass


@pytest.mark.asyncio
async def test_file_younger_than_120_min_not_deleted():
    storage = get_storage_service()
    file_id = str(uuid.uuid4())
    storage_key = f"uploads/{file_id}_active.txt"
    content = b"Active valid document data"
    await storage.save_file(content, storage_key)

    async with AsyncSessionLocal() as session:
        # Flush any pre-existing expired records from prior test suites
        await purge_expired_files(session)

        # Created 30 minutes ago, expires in 90 minutes
        record = FileRecord(
            id=file_id,
            original_filename="active.txt",
            storage_key=storage_key,
            file_size_bytes=len(content),
            mime_type="text/plain",
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=90),
            is_deleted=False
        )
        session.add(record)
        await session.commit()

        purged = await purge_expired_files(session)
        assert purged == 0

        # Verify file still exists on disk and in database
        assert await storage.file_exists(storage_key) is True
        stmt = select(FileRecord).where(FileRecord.id == file_id)
        res = await session.execute(stmt)
        updated_record = res.scalar_one()
        assert updated_record.is_deleted is False

    # Clean up
    await storage.delete_file(storage_key)


@pytest.mark.asyncio
async def test_expired_file_is_deleted_and_soft_deleted():
    storage = get_storage_service()
    file_id = str(uuid.uuid4())
    storage_key = f"uploads/{file_id}_expired.txt"
    content = b"Expired document data to purge"
    await storage.save_file(content, storage_key)

    async with AsyncSessionLocal() as session:
        # Expired 5 minutes ago
        record = FileRecord(
            id=file_id,
            original_filename="expired.txt",
            storage_key=storage_key,
            file_size_bytes=len(content),
            mime_type="text/plain",
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=5),
            is_deleted=False
        )
        session.add(record)
        await session.commit()

        purged = await purge_expired_files(session)
        assert purged >= 1

        # Verify physical file was unlinked and record marked is_deleted=True
        assert await storage.file_exists(storage_key) is False
        stmt = select(FileRecord).where(FileRecord.id == file_id)
        res = await session.execute(stmt)
        updated_record = res.scalar_one()
        assert updated_record.is_deleted is True


@pytest.mark.asyncio
async def test_already_missing_file_idempotency():
    storage = get_storage_service()
    file_id = str(uuid.uuid4())
    storage_key = f"uploads/{file_id}_missing_on_disk.txt"

    # Make sure file does NOT exist on disk
    if await storage.file_exists(storage_key):
        await storage.delete_file(storage_key)

    async with AsyncSessionLocal() as session:
        record = FileRecord(
            id=file_id,
            original_filename="missing_on_disk.txt",
            storage_key=storage_key,
            file_size_bytes=100,
            mime_type="text/plain",
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=10),
            is_deleted=False
        )
        session.add(record)
        await session.commit()

        # Should handle missing file gracefully without crashing
        purged = await purge_expired_files(session)
        assert purged >= 1

        stmt = select(FileRecord).where(FileRecord.id == file_id)
        res = await session.execute(stmt)
        updated_record = res.scalar_one()
        assert updated_record.is_deleted is True


@pytest.mark.asyncio
async def test_repeated_cleanup_is_idempotent():
    async with AsyncSessionLocal() as session:
        # Running cleanup multiple times consecutively should be completely safe
        run1 = await purge_expired_files(session)
        run2 = await purge_expired_files(session)
        assert run2 == 0


@pytest.mark.asyncio
async def test_cleaner_exception_does_not_crash_loop():
    stop_event = asyncio.Event()

    call_count = 0
    original_purge = purge_expired_files

    async def flaky_purge(session):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise RuntimeError("Simulated transient database/storage error during cleanup")
        return await original_purge(session)

    # Use 50ms interval for rapid test cycle
    with patch("app.services.cleaner.purge_expired_files", side_effect=flaky_purge):
        with patch.object(settings, "CLEANUP_INTERVAL_SECONDS", 0.05):
            task = asyncio.create_task(run_periodic_cleanup_loop(stop_event=stop_event))

            # Allow loop to execute cycle with error, then next cycle
            await asyncio.sleep(0.15)
            stop_event.set()
            await task

            assert call_count >= 2
            assert task.done()


def test_periodic_task_starts_and_stops_with_lifespan():
    with TestClient(app) as test_client:
        task = getattr(app.state, "cleanup_task", None)
        assert task is not None
        assert not task.done()

    # After exiting lifespan context manager, the background task should be finished
    assert task.done()


def test_expired_file_cannot_be_downloaded(client: TestClient):
    file_id = str(uuid.uuid4())
    storage_key = f"uploads/{file_id}_expired_dl.txt"

    async def setup_record():
        storage = get_storage_service()
        await storage.save_file(b"secret expired content", storage_key)
        async with AsyncSessionLocal() as session:
            record = FileRecord(
                id=file_id,
                original_filename="expired_dl.txt",
                storage_key=storage_key,
                file_size_bytes=22,
                mime_type="text/plain",
                expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
                is_deleted=False
            )
            session.add(record)
            await session.commit()

    asyncio.run(setup_record())

    # Download must be rejected with 404 because file has expired
    response = client.get(f"/api/v1/files/{file_id}/download")
    assert response.status_code == 404
    data = response.json()
    assert "expired" in data["detail"].lower() or "not found" in data["detail"].lower()


def test_soft_deleted_file_cannot_be_downloaded(client: TestClient):
    file_id = str(uuid.uuid4())
    storage_key = f"uploads/{file_id}_deleted_dl.txt"

    async def setup_record():
        storage = get_storage_service()
        await storage.save_file(b"deleted content", storage_key)
        async with AsyncSessionLocal() as session:
            record = FileRecord(
                id=file_id,
                original_filename="deleted_dl.txt",
                storage_key=storage_key,
                file_size_bytes=15,
                mime_type="text/plain",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=60),
                is_deleted=True
            )
            session.add(record)
            await session.commit()

    asyncio.run(setup_record())

    # Soft-deleted record must be rejected with 404
    response = client.get(f"/api/v1/files/{file_id}/download")
    assert response.status_code == 404


def test_active_file_can_be_downloaded(client: TestClient):
    file_id = str(uuid.uuid4())
    storage_key = f"uploads/{file_id}_active_dl.txt"
    content = b"Active downloadable content stream"

    async def setup_record():
        storage = get_storage_service()
        await storage.save_file(content, storage_key)
        async with AsyncSessionLocal() as session:
            record = FileRecord(
                id=file_id,
                original_filename="active_dl.txt",
                storage_key=storage_key,
                file_size_bytes=len(content),
                mime_type="text/plain",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=60),
                is_deleted=False
            )
            session.add(record)
            await session.commit()

    asyncio.run(setup_record())

    response = client.get(f"/api/v1/files/{file_id}/download")
    assert response.status_code == 200
    assert response.content == content


def test_cleanup_stale_temp_dirs():
    temp_base = tempfile.gettempdir()
    stale_dir = os.path.join(temp_base, "convertly_job_test_stale_fixture")
    active_dir = os.path.join(temp_base, "convertly_job_test_active_fixture")

    os.makedirs(stale_dir, exist_ok=True)
    os.makedirs(active_dir, exist_ok=True)

    try:
        # Age stale_dir by 3 hours (180 minutes)
        past_time = time.time() - (180 * 60)
        os.utime(stale_dir, (past_time, past_time))

        # Active dir has current mtime
        os.utime(active_dir, (time.time(), time.time()))

        cleaned = cleanup_stale_temp_dirs(max_age_minutes=120)
        assert cleaned >= 1
        assert not os.path.exists(stale_dir)
        assert os.path.exists(active_dir)
    finally:
        shutil.rmtree(stale_dir, ignore_errors=True)
        shutil.rmtree(active_dir, ignore_errors=True)


@pytest.mark.asyncio
async def test_s3_r2_cache_cleanup_on_delete():
    from unittest.mock import MagicMock
    from app.services.storage.s3_r2 import S3R2StorageService

    # Create dummy S3 instance with mocked client
    service = object.__new__(S3R2StorageService)
    service.bucket = "test-bucket"
    service.s3_client = MagicMock()
    service.s3_client.delete_object.return_value = {}

    storage_key = "uploads/cache_test_file.pdf"
    cache_dir = os.path.join(tempfile.gettempdir(), "convertly_cache")
    os.makedirs(cache_dir, exist_ok=True)
    cache_file = os.path.join(cache_dir, "cache_test_file.pdf")

    with open(cache_file, "wb") as f:
        f.write(b"cached pdf bytes")

    assert os.path.exists(cache_file)

    deleted = await service.delete_file(storage_key)
    assert deleted is True
    service.s3_client.delete_object.assert_called_once_with(Bucket="test-bucket", Key=storage_key)
    # Cached copy must be unlinked
    assert not os.path.exists(cache_file)
