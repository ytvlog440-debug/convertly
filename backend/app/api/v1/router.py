from fastapi import APIRouter
from app.api.v1.endpoints import health, files, jobs

api_router = APIRouter()

api_router.include_router(health.router, tags=["System & Diagnostics"])
api_router.include_router(files.router, prefix="/files", tags=["File Management"])
api_router.include_router(jobs.router, tags=["Conversion Jobs"])
