import enum
import uuid
from typing import Optional, Any, Dict
from sqlalchemy import String, Integer, JSON, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ConversionJob(Base):
    __tablename__ = "conversion_jobs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    tool_id: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        Enum(JobStatus, name="job_status_enum", native_enum=False),
        default=JobStatus.PENDING,
        nullable=False
    )
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Input and output file links
    input_file_ids: Mapped[Dict[str, Any]] = mapped_column(JSON, default=list, nullable=False)
    output_file_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    options: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
