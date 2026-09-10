import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from app.core.config import settings


class FileRecord(Base):
    __tablename__ = "file_records"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=True)  # SHA-256

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(minutes=settings.FILE_RETENTION_MINUTES),
        nullable=False
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        if self.expires_at.tzinfo is None:
            return self.expires_at <= now.replace(tzinfo=None)
        return self.expires_at <= now
