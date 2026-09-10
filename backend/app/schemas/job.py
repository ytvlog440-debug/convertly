from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.job import JobStatus


class CreateJobRequest(BaseModel):
    tool_id: str = Field(..., description="ID of the converter tool, e.g. 'pdf-merge'")
    input_file_ids: List[str] = Field(..., min_length=1, description="List of uploaded file UUIDs")
    options: Dict[str, Any] = Field(default_factory=dict, description="Tool-specific conversion parameters")


class JobResponse(BaseModel):
    id: str
    tool_id: str
    status: JobStatus
    progress: int
    error_message: Optional[str] = None
    input_file_ids: List[str]
    output_file_id: Optional[str] = None
    options: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
