from typing import Any, Dict, Optional
from fastapi import Request
from fastapi.responses import JSONResponse


class ConvertlyException(Exception):
    """Base exception for all Convertly application domain errors."""
    def __init__(
        self,
        message: str,
        status_code: int = 400,
        error_code: str = "CONVERTLY_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class FileValidationError(ConvertlyException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code="FILE_VALIDATION_ERROR",
            details=details
        )


class UnsupportedFormatError(ConvertlyException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=415,
            error_code="UNSUPPORTED_FORMAT_ERROR",
            details=details
        )


class ConversionExecutionError(ConvertlyException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="CONVERSION_FAILED",
            details=details
        )


class ResourceNotFoundError(ConvertlyException):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            message=message,
            status_code=404,
            error_code="RESOURCE_NOT_FOUND"
        )


async def convertly_exception_handler(request: Request, exc: ConvertlyException) -> JSONResponse:
    """Formats domain exceptions according to RFC 7807 problem details."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": f"https://convertly.app/errors/{exc.error_code.lower()}",
            "title": exc.error_code.replace("_", " ").title(),
            "status": exc.status_code,
            "detail": exc.message,
            "instance": str(request.url),
            "details": exc.details
        }
    )
