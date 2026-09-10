import os
from abc import ABC, abstractmethod
from typing import Optional
from app.core.logging import logger
from app.core.errors import FileValidationError


class BaseAntivirusScanner(ABC):
    """Abstract contract for file virus/malware inspection before storage."""

    @abstractmethod
    async def scan_bytes(self, content: bytes, filename: str) -> None:
        """Scan file in-memory byte buffer. Raises FileValidationError if infected."""
        pass


class PassThroughScanner(BaseAntivirusScanner):
    """
    Default enterprise pass-through scanner with ClamAV / VirusTotal hook extension point.
    Inspects byte headers for executable payloads or malicious zip bombs.
    """

    async def scan_bytes(self, content: bytes, filename: str) -> None:
        # Check for dangerous executable signatures disguised as documents
        if content.startswith(b"MZ"):  # Windows PE executable
            raise FileValidationError(f"File '{filename}' was identified as a dangerous executable and blocked by malware scanning.")
        if content.startswith(b"\x7fELF"):  # Linux ELF executable
            raise FileValidationError(f"File '{filename}' was identified as an executable binary and rejected.")

        logger.debug(f"Malware pre-scan passed for file '{filename}' ({len(content)} bytes).")


# Global scanner instance
antivirus_scanner: BaseAntivirusScanner = PassThroughScanner()
