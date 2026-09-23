import tempfile
import os
from typing import Optional
import aiofiles
from app.core.config import settings
from app.services.storage.base import BaseStorageService

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    boto3 = None
    ClientError = Exception


class S3R2StorageService(BaseStorageService):
    """Storage implementation for AWS S3 and Cloudflare R2."""

    def __init__(self):
        if not boto3:
            raise RuntimeError("boto3 is not installed. Please install boto3 to use S3/R2 storage.")
        
        endpoint_url = settings.R2_ENDPOINT_URL
        if not endpoint_url and settings.R2_ACCOUNT_ID:
            endpoint_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

        self.s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name="auto"
        )
        self.bucket = settings.R2_BUCKET_NAME

    async def save_file(self, file_content: bytes, destination_key: str) -> str:
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=destination_key,
            Body=file_content
        )
        return destination_key

    async def get_file_bytes(self, storage_key: str) -> bytes:
        response = self.s3_client.get_object(Bucket=self.bucket, Key=storage_key)
        return response["Body"].read()

    async def get_file_path(self, storage_key: str) -> str:
        # Download object to a local temporary cache for engines requiring local file descriptors
        temp_dir = os.path.join(tempfile.gettempdir(), "convertly_cache")
        os.makedirs(temp_dir, exist_ok=True)
        local_path = os.path.join(temp_dir, os.path.basename(storage_key))
        content = await self.get_file_bytes(storage_key)
        async with aiofiles.open(local_path, "wb") as f:
            await f.write(content)
        return local_path

    async def delete_file(self, storage_key: str) -> bool:
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=storage_key)
            # Clean up local cache if previously downloaded
            cached_path = os.path.join(tempfile.gettempdir(), "convertly_cache", os.path.basename(storage_key))
            if os.path.exists(cached_path):
                try:
                    os.unlink(cached_path)
                except Exception:
                    pass
            return True
        except ClientError:
            return False

    async def file_exists(self, storage_key: str) -> bool:
        try:
            self.s3_client.head_object(Bucket=self.bucket, Key=storage_key)
            return True
        except ClientError:
            return False
