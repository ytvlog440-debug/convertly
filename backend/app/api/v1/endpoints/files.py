import hashlib
import uuid
import mimetypes
from fastapi import APIRouter, Depends, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io

from app.core.config import settings
from app.core.errors import FileValidationError, ResourceNotFoundError
from app.core.security import sanitize_filename, validate_file_magic
from app.db.session import get_db
from app.models.file_record import FileRecord
from app.schemas.common import ApiResponse
from app.schemas.file import FileUploadResponse, FileInspectionResponse
from app.services.storage import get_storage_service

router = APIRouter()


@router.post("/inspect", response_model=ApiResponse[FileInspectionResponse], summary="Inspect PDF Security and Metadata")
async def inspect_pdf_file(
    file: UploadFile = File(...)
):
    if not file.filename:
        raise FileValidationError("Filename is missing.")

    clean_name = sanitize_filename(file.filename)
    extension = clean_name.split(".")[-1].lower() if "." in clean_name else ""
    if extension != "pdf":
        raise FileValidationError("Pre-flight privacy inspection requires a valid PDF file.")

    content = await file.read()
    if len(content) == 0:
        raise FileValidationError("Uploaded file is empty (0 bytes).")

    if not validate_file_magic(content[:32], "pdf"):
        raise FileValidationError("File signature does not match a valid PDF document.")

    from app.services.scanner import antivirus_scanner, inspect_pdf_security
    await antivirus_scanner.scan_bytes(content, clean_name)

    inspection = inspect_pdf_security(content, clean_name)

    return ApiResponse(
        success=True,
        message="PDF security and privacy pre-flight inspection completed.",
        data=inspection
    )


@router.post("/upload", response_model=ApiResponse[FileUploadResponse], summary="Upload File with Strict Validation")
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename:
        raise FileValidationError("Filename is missing.")

    clean_name = sanitize_filename(file.filename)
    extension = clean_name.split(".")[-1] if "." in clean_name else ""

    # Read content into memory up to max allowed size
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    content = await file.read()

    if len(content) == 0:
        raise FileValidationError("Uploaded file is empty (0 bytes).")

    if len(content) > max_bytes:
        raise FileValidationError(
            f"File size exceeds maximum allowable limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # Magic byte signature validation
    if extension and not validate_file_magic(content[:32], extension):
        raise FileValidationError(
            f"File content does not match claimed file extension '.{extension}'. Upload rejected."
        )

    # Antivirus & malware pre-inspection hook
    from app.services.scanner import antivirus_scanner
    await antivirus_scanner.scan_bytes(content, clean_name)

    # Calculate SHA256
    file_hash = hashlib.sha256(content).hexdigest()

    # Generate unique storage key
    file_id = str(uuid.uuid4())
    storage_key = f"uploads/{file_id}_{clean_name}"

    # Save to storage abstraction
    storage = get_storage_service()
    await storage.save_file(content, storage_key)

    # Determine MIME type
    mime = file.content_type or mimetypes.guess_type(clean_name)[0] or "application/octet-stream"

    # Pre-extract PDF page count & check if blank/empty
    page_count = None
    is_blank = None
    if extension.lower() == "pdf" or mime == "application/pdf":
        try:
            import fitz
            doc = fitz.open(stream=content, filetype="pdf")
            page_count = doc.page_count
            if page_count == 1:
                p0 = doc[0]
                text_len = len(p0.get_text().strip())
                images_len = len(p0.get_images())
                drawings_len = len(p0.get_drawings())
                if text_len == 0 and images_len == 0 and drawings_len == 0:
                    is_blank = True
                else:
                    is_blank = False
            elif page_count == 0:
                is_blank = True
            else:
                is_blank = False
            doc.close()
        except Exception:
            pass

    # Persist database record
    record = FileRecord(
        id=file_id,
        original_filename=clean_name,
        storage_key=storage_key,
        file_size_bytes=len(content),
        mime_type=mime,
        file_hash=file_hash
    )
    db.add(record)
    await db.flush()

    return ApiResponse(
        success=True,
        message="File uploaded and verified successfully.",
        data=FileUploadResponse(
            id=record.id,
            original_filename=record.original_filename,
            file_size_bytes=record.file_size_bytes,
            mime_type=record.mime_type,
            file_hash=record.file_hash,
            page_count=page_count,
            is_blank=is_blank,
            created_at=record.created_at,
            expires_at=record.expires_at
        )
    )


@router.get("/{file_id}/download", summary="Download File with Safe Headers")
async def download_file(
    file_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FileRecord).where(
        FileRecord.id == file_id,
        FileRecord.is_deleted == False
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        raise ResourceNotFoundError("File not found or has been expired and deleted.")

    if record.is_expired():
        raise ResourceNotFoundError("This file has expired per our privacy retention policy.")

    storage = get_storage_service()
    file_bytes = await storage.get_file_bytes(record.storage_key)

    safe_filename = record.original_filename.replace('"', '\\"')

    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=record.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "Content-Length": str(record.file_size_bytes),
            "X-Content-Type-Options": "nosniff"
        }
    )
