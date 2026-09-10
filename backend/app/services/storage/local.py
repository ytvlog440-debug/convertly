import os
from typing import Optional
import aiofiles
from pathlib import Path
from app.core.config import settings
from app.services.storage.base import BaseStorageService


class LocalStorageService(BaseStorageService):
    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path or settings.LOCAL_STORAGE_PATH).resolve()
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, storage_key: str) -> Path:
        # Strip leading slashes to prevent root traversal
        clean_key = storage_key.lstrip("/\\")
        target_path = (self.base_path / clean_key).resolve()
        if not str(target_path).startswith(str(self.base_path)):
            raise ValueError("Security violation: Path traversal detected in storage key.")
        return target_path

    async def save_file(self, file_content: bytes, destination_key: str) -> str:
        target_path = self._resolve_path(destination_key)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        async with aiofiles.open(target_path, "wb") as f:
            await f.write(file_content)
        return destination_key

    async def get_file_bytes(self, storage_key: str) -> bytes:
        target_path = self._resolve_path(storage_key)
        if not target_path.exists():
            raise FileNotFoundError(f"File not found in storage: {storage_key}")
        async with aiofiles.open(target_path, "rb") as f:
            return await f.read()

    async def get_file_path(self, storage_key: str) -> str:
        target_path = self._resolve_path(storage_key)
        if not target_path.exists():
            raise FileNotFoundError(f"File not found in storage: {storage_key}")
        return str(target_path)

    async def delete_file(self, storage_key: str) -> bool:
        try:
            target_path = self._resolve_path(storage_key)
            if target_path.exists():
                target_path.unlink()
                return True
            return False
        except Exception:
            return False

    async def file_exists(self, storage_key: str) -> bool:
        try:
            target_path = self._resolve_path(storage_key)
            return target_path.exists()
        except Exception:
            return False
