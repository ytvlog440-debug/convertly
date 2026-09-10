import pytest
import os
import shutil
from app.services.storage.local import LocalStorageService

TEST_DIR = "./temp_test_storage"


@pytest.fixture(autouse=True)
def clean_storage():
    os.makedirs(TEST_DIR, exist_ok=True)
    yield
    if os.path.exists(TEST_DIR):
        shutil.rmtree(TEST_DIR, ignore_errors=True)


@pytest.mark.asyncio
async def test_storage_save_and_retrieve():
    storage = LocalStorageService(TEST_DIR)
    content = b"Convertly V2 Test Byte Stream - High Performance Storage"
    key = "documents/test_file.txt"

    saved_key = await storage.save_file(content, key)
    assert saved_key == key
    assert await storage.file_exists(key) is True

    retrieved_bytes = await storage.get_file_bytes(key)
    assert retrieved_bytes == content

    path = await storage.get_file_path(key)
    assert os.path.exists(path)

    deleted = await storage.delete_file(key)
    assert deleted is True
    assert await storage.file_exists(key) is False


@pytest.mark.asyncio
async def test_storage_path_traversal_prevention():
    storage = LocalStorageService(TEST_DIR)
    with pytest.raises(ValueError, match="Security violation"):
        await storage.save_file(b"malicious", "../../etc/passwd")
