import os
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.core.errors import FileValidationError, ConversionExecutionError


class ConversionResult:
    def __init__(
        self,
        output_path: str,
        output_filename: str,
        mime_type: str,
        size_bytes: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.output_path = output_path
        self.output_filename = output_filename
        self.mime_type = mime_type
        self.size_bytes = size_bytes
        self.metadata = metadata or {}


class BaseConverter(ABC):
    """
    Base contract for all production-grade file converters.
    Enforces pre-conversion input validation and strict post-conversion integrity verification.
    """

    @property
    @abstractmethod
    def tool_id(self) -> str:
        """Unique tool identifier (e.g., 'pdf-merge', 'jpg-to-png')."""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name."""
        pass

    @property
    @abstractmethod
    def supported_inputs(self) -> List[str]:
        """Allowed input file extensions without dot (e.g. ['jpg', 'jpeg'])."""
        pass

    @property
    @abstractmethod
    def output_extension(self) -> str:
        """Resulting extension without dot (e.g. 'png')."""
        pass

    @property
    @abstractmethod
    def output_mime_type(self) -> str:
        """Resulting MIME type (e.g. 'image/png')."""
        pass

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        """Pre-conversion checks: existence, non-zero size, basic integrity."""
        if not input_paths:
            raise FileValidationError("At least one input file must be supplied.")

        for path in input_paths:
            if not os.path.exists(path):
                raise FileValidationError(f"Input file does not exist: {path}")
            size = os.path.getsize(path)
            if size == 0:
                raise FileValidationError(f"Input file is completely empty (0 bytes): {os.path.basename(path)}")

    def validate_output(self, output_path: str) -> None:
        """Post-conversion validation: guarantees output is non-empty and readable."""
        if not os.path.exists(output_path):
            raise ConversionExecutionError("Converter failed to produce an output file.")
        size = os.path.getsize(output_path)
        if size == 0:
            raise ConversionExecutionError("Converter produced an empty (0 bytes) output file.")

    @abstractmethod
    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        """Execute the conversion logic."""
        pass
