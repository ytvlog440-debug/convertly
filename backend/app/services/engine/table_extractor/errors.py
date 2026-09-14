"""
Convertly V2 — Enterprise Table Extraction Error Hierarchy
Standardized exception hierarchy for document intelligence, routing, extraction,
validation, repair, and excel generation.
"""

from typing import Optional, Dict, Any


class TableExtractorError(Exception):
    """Root base exception for all Convertly table extractor errors."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "details": self.details,
        }


class ExtractionError(TableExtractorError):
    """Raised when an extraction engine fails during document or table parsing."""
    def __init__(self, message: str, engine: Optional[str] = None, page_idx: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        if engine:
            d["engine"] = engine
        if page_idx is not None:
            d["page_idx"] = page_idx
        super().__init__(message, d)
        self.engine = engine
        self.page_idx = page_idx


class OCRFailure(TableExtractorError):
    """Raised when OCR processing or layout recognition fails or is unavailable."""
    def __init__(self, message: str, page_idx: Optional[int] = None, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        if page_idx is not None:
            d["page_idx"] = page_idx
        super().__init__(message, d)
        self.page_idx = page_idx


class ValidationError(TableExtractorError):
    """Raised when an extracted table fails structural or mathematical validation."""
    def __init__(self, message: str, violations: Optional[list] = None, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        if violations:
            d["violations"] = violations
        super().__init__(message, d)
        self.violations = violations or []


class RoutingError(TableExtractorError):
    """Raised when engine routing cannot resolve a viable extraction engine."""
    def __init__(self, message: str, document_type: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        if document_type:
            d["document_type"] = document_type
        super().__init__(message, d)
        self.document_type = document_type


class RepairError(TableExtractorError):
    """Raised when deterministic repair of broken rows, columns, or cells fails."""
    def __init__(self, message: str, stage: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        if stage:
            d["stage"] = stage
        super().__init__(message, d)
        self.stage = stage


class ExcelWriterError(TableExtractorError):
    """Raised when generating openpyxl Excel output encounters an unrecoverable issue."""
    def __init__(self, message: str, sheet_name: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        if sheet_name:
            d["sheet_name"] = sheet_name
        super().__init__(message, d)
        self.sheet_name = sheet_name


class ConfigurationError(TableExtractorError):
    """Raised when an invalid configuration value, missing dependency, or invalid parameter is given."""
    pass


class QualityThresholdError(TableExtractorError):
    """Raised when extracted table quality falls below required acceptance thresholds."""
    def __init__(self, message: str, quality_score: float, threshold: float, details: Optional[Dict[str, Any]] = None):
        d = details or {}
        d["quality_score"] = quality_score
        d["threshold"] = threshold
        super().__init__(message, d)
        self.quality_score = quality_score
        self.threshold = threshold
