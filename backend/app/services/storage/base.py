from abc import ABC, abstractmethod
from typing import BinaryIO, Optional


class BaseStorageService(ABC):
    """
    Abstract storage interface. Allows frictionless swapping between
    local filesystem (for development/self-hosting) and Cloudflare R2 / AWS S3
    for production cloud deployment.
    """

    @abstractmethod
    async def save_file(self, file_content: bytes, destination_key: str) -> str:
        """Save bytes to storage and return canonical key/path."""
        pass

    @abstractmethod
    async def get_file_bytes(self, storage_key: str) -> bytes:
        """Read and return complete byte contents."""
        pass

    @abstractmethod
    async def get_file_path(self, storage_key: str) -> str:
        """
        Return a local accessible filesystem path for engines (e.g. LibreOffice/Ghostscript).
        If stored on S3/R2, downloads to temporary local cache first.
        """
        pass

    @abstractmethod
    async def delete_file(self, storage_key: str) -> bool:
        """Delete file from storage."""
        pass

    @abstractmethod
    async def file_exists(self, storage_key: str) -> bool:
        """Check if file exists in storage."""
        pass
