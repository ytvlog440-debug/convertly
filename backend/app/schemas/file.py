from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    id: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    file_hash: Optional[str] = None
    created_at: datetime
    expires_at: datetime


class FileMetadataResponse(FileUploadResponse):
    is_expired: bool
