import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

# Force SQLite for test execution
settings.DATABASE_URL = "sqlite+aiosqlite:///:memory:"
settings.STORAGE_DRIVER = "local"
settings.LOCAL_STORAGE_PATH = "./test_storage_data"


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
