from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    id: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    file_hash: Optional[str] = None
    page_count: Optional[int] = None
    is_blank: Optional[bool] = None
    created_at: datetime
    expires_at: datetime


class FileMetadataResponse(FileUploadResponse):
    is_expired: bool


class RecommendationItem(BaseModel):
    tool_id: str
    title: str
    reason: str


class FileInspectionResponse(BaseModel):
    filename: str
    file_size_bytes: int
    page_count: int
    pdf_version: str
    is_encrypted: bool
    has_javascript: bool
    has_annotations: bool
    has_forms: bool
    metadata: dict[str, str]
    privacy_score: int
    risk_level: str
    recommendations: list[RecommendationItem]
