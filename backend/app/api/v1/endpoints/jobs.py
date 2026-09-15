import hashlib
import os
import tempfile
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.errors import ResourceNotFoundError, FileValidationError, ConversionExecutionError
from app.core.logging import logger
from app.db.session import get_db, AsyncSessionLocal
from app.models.job import ConversionJob, JobStatus
from app.models.file_record import FileRecord
from app.schemas.common import ApiResponse
from app.schemas.job import CreateJobRequest, JobResponse
from app.services.engine.registry import converter_registry
from app.services.storage import get_storage_service
from app.services.cleaner import purge_expired_files
from app.core.timing import log_stage

router = APIRouter()


async def execute_job_pipeline(job_id: str, tool_id: str, input_file_ids: List[str], options: Dict[str, Any]):
    """Background task orchestrating file retrieval, conversion execution, and output persistence."""
    with log_stage("Background Task", extra=f"job_id={job_id} tool={tool_id}"):
        storage = get_storage_service()
        temp_dir = tempfile.mkdtemp(prefix="convertly_job_")

        async with AsyncSessionLocal() as session:
            # Load job
            stmt = select(ConversionJob).where(ConversionJob.id == job_id)
            res = await session.execute(stmt)
            job = res.scalar_one_or_none()
            if not job:
                return

            try:
                job.status = JobStatus.PROCESSING
                job.progress = 25
                await session.commit()

                # Retrieve records in exact ordered sequence
                file_records_map = {}
                stmt = select(FileRecord).where(
                    FileRecord.id.in_(input_file_ids),
                    FileRecord.is_deleted == False
                )
                res = await session.execute(stmt)
                for rec in res.scalars().all():
                    file_records_map[rec.id] = rec

                ordered_records = [file_records_map[fid] for fid in input_file_ids if fid in file_records_map]
                if len(ordered_records) != len(input_file_ids):
                    raise FileValidationError("One or more input files are missing or have been deleted.")

                input_paths = [await storage.get_file_path(rec.storage_key) for rec in ordered_records]

                job.progress = 50
                await session.commit()

                # Run converter
                converter = converter_registry.get(tool_id)
                result = await converter.convert(input_paths, temp_dir, options)

                # Persist output file
                with open(result.output_path, "rb") as f:
                    output_bytes = f.read()

                output_file_id = str(uuid.uuid4())
                dest_storage_key = f"outputs/{output_file_id}_{result.output_filename}"
                await storage.save_file(output_bytes, dest_storage_key)

                output_hash = hashlib.sha256(output_bytes).hexdigest()
                output_record = FileRecord(
                    id=output_file_id,
                    original_filename=result.output_filename,
                    storage_key=dest_storage_key,
                    file_size_bytes=len(output_bytes),
                    mime_type=result.mime_type,
                    file_hash=output_hash
                )
                session.add(output_record)

                # Mark job complete
                job.output_file_id = output_file_id
                job.status = JobStatus.COMPLETED
                job.progress = 100
                import json
                try:
                    clean_meta = json.loads(json.dumps(result.metadata, default=str))
                except Exception:
                    clean_meta = {}
                job.options = {**(job.options or {}), **clean_meta}
                await session.commit()

            except Exception as e:
                logger.error(f"Job {job_id} failed: {e}", exc_info=True)
                await session.rollback()
                job.status = JobStatus.FAILED
                job.error_message = str(e)
                job.progress = 100
                await session.commit()
            finally:
                # Clean up temp dir
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)


@router.get("/tools", summary="List Available Conversion Tools")
async def list_available_tools():
    """Returns all registered, verified conversion tools."""
    return ApiResponse(
        success=True,
        data=converter_registry.list_tools()
    )


@router.post("/jobs", response_model=ApiResponse[JobResponse], summary="Submit a Conversion Job")
async def create_conversion_job(
    req: CreateJobRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    # Stage 2: Request validation
    with log_stage("Request Validation", extra=f"tool={req.tool_id}"):
        converter = converter_registry.get(req.tool_id)

        stmt = select(FileRecord).where(
            FileRecord.id.in_(req.input_file_ids),
            FileRecord.is_deleted == False
        )
        result = await db.execute(stmt)
        records = result.scalars().all()

        if len(records) != len(req.input_file_ids):
            raise FileValidationError("One or more input file IDs are invalid or expired.")

    # Stage 3: FastAPI endpoint
    with log_stage("FastAPI Endpoint", extra=f"tool={req.tool_id}"):
        job = ConversionJob(
            tool_id=req.tool_id,
            status=JobStatus.PENDING,
            progress=0,
            input_file_ids=req.input_file_ids,
            options=req.options
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        # Dispatch processing immediately
        background_tasks.add_task(
            execute_job_pipeline,
            job_id=job.id,
            tool_id=job.tool_id,
            input_file_ids=job.input_file_ids,
            options=job.options
        )

        # Background maintenance
        async def run_cleanup():
            async with AsyncSessionLocal() as session:
                await purge_expired_files(session)

        background_tasks.add_task(run_cleanup)

    # Stage 14: Response generation
    with log_stage("Response Generation", extra=f"job_id={job.id}"):
        response = ApiResponse(
            success=True,
            message="Conversion job created and queued for processing.",
            data=JobResponse(
                id=job.id,
                tool_id=job.tool_id,
                status=job.status,
                progress=job.progress,
                error_message=job.error_message,
                input_file_ids=job.input_file_ids,
                output_file_id=job.output_file_id,
                options=job.options,
                created_at=job.created_at,
                updated_at=job.updated_at
            )
        )
    return response


@router.get("/jobs/{job_id}", response_model=ApiResponse[JobResponse], summary="Get Job Status")
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    # Stage 15: Frontend polling
    with log_stage("Frontend Polling", extra=f"job_id={job_id}"):
        stmt = select(ConversionJob).where(ConversionJob.id == job_id)
        result = await db.execute(stmt)
        job = result.scalar_one_or_none()

        if not job:
            raise ResourceNotFoundError(f"Job with ID '{job_id}' not found.")

        return ApiResponse(
            success=True,
            data=JobResponse(
                id=job.id,
                tool_id=job.tool_id,
                status=job.status,
                progress=job.progress,
                error_message=job.error_message,
                input_file_ids=job.input_file_ids,
                output_file_id=job.output_file_id,
                options=job.options,
                created_at=job.created_at,
                updated_at=job.updated_at
            )
        )
