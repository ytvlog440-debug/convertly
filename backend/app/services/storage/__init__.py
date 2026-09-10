from app.core.config import settings
from app.services.storage.base import BaseStorageService
from app.services.storage.local import LocalStorageService

_storage_instance: BaseStorageService | None = None


def get_storage_service() -> BaseStorageService:
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_DRIVER == "s3_r2":
            from app.services.storage.s3_r2 import S3R2StorageService
            _storage_instance = S3R2StorageService()
        else:
            _storage_instance = LocalStorageService(settings.LOCAL_STORAGE_PATH)
    return _storage_instance
