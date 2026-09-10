from typing import Generic, TypeVar, Optional, Any, Dict
from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[T] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str
    storage: str
    system: Dict[str, Any]
