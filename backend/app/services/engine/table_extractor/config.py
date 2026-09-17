"""
Convertly V2 — Enterprise Table Extraction Configuration
Centralized, runtime-tunable configuration system for OCR, geometric thresholds,
quality scoring, projection profiling, memory limits, and parallel workers.
"""

import os
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, Optional

from .constants import (
    DEFAULT_SNAP_TOLERANCE,
    MIN_LINE_LENGTH_PTS,
    DEFAULT_GUTTER_MIN_WIDTH_PTS,
    DEFAULT_KERNING_SPACE_RATIO,
    DEFAULT_INDENT_STEP_PTS,
    DEFAULT_OCR_DPI,
    DEFAULT_BINARIZATION_THRESH,
    CONFIDENCE_HIGH,
    QUALITY_FALLBACK_THRESHOLD,
    STREAMING_PAGE_THRESHOLD,
    DEFAULT_MAX_WORKER_MEMORY_MB,
    DEFAULT_PER_PAGE_TIMEOUT_SEC,
    DEFAULT_MAX_PARALLEL_WORKERS,
    DEFAULT_OCR_MAX_WORKERS,
)


@dataclass
class OCRConfig:
    """OCR processing and pre-processing tunables."""
    enabled: bool = True
    dpi: int = DEFAULT_OCR_DPI
    psm: int = 6  # Assume a single uniform block of text
    oem: int = 3  # Default LSTM engine
    language: str = "eng"
    binarization_threshold: int = DEFAULT_BINARIZATION_THRESH
    deskew_enabled: bool = True
    max_deskew_angle_deg: float = 45.0
    tesseract_cmd: Optional[str] = None


@dataclass
class ThresholdConfig:
    """Geometric coordinate alignment and snapping thresholds (in PDF points)."""
    snap_tolerance: float = DEFAULT_SNAP_TOLERANCE
    min_line_length: float = MIN_LINE_LENGTH_PTS
    gutter_min_width: float = DEFAULT_GUTTER_MIN_WIDTH_PTS
    kerning_space_ratio: float = DEFAULT_KERNING_SPACE_RATIO
    indent_step: float = DEFAULT_INDENT_STEP_PTS
    header_font_size_ratio: float = 1.15
    line_merge_vertical_tol: float = 2.0


@dataclass
class ConfidenceConfig:
    """Confidence boundaries and arbiter fallback thresholds."""
    min_acceptable_quality: float = 0.60
    high_quality_threshold: float = CONFIDENCE_HIGH
    fallback_threshold: float = QUALITY_FALLBACK_THRESHOLD
    min_text_native_density: float = 0.05  # characters / pt^2 threshold for scanned detection


@dataclass
class ProjectionConfig:
    """X/Y profile histogram projection settings for Stream extraction."""
    bin_size_pts: float = 1.0
    smoothing_window_size: int = 3
    valley_threshold_ratio: float = 0.15
    min_column_width_pts: float = 20.0


@dataclass
class DetectionConfig:
    """Table area detection and boundary filtering."""
    min_table_area_ratio: float = 0.04
    min_cells_count: int = 4
    min_rows_count: int = 2
    min_cols_count: int = 2
    max_cell_aspect_ratio: float = 25.0


@dataclass
class MemoryConfig:
    """Memory consumption guardrails and large document streaming."""
    streaming_page_threshold: int = STREAMING_PAGE_THRESHOLD
    max_worker_memory_mb: int = DEFAULT_MAX_WORKER_MEMORY_MB
    aggressive_gc: bool = True
    page_batch_size: int = 10


@dataclass
class WorkerConfig:
    """Parallel execution and process pool orchestration."""
    max_workers: int = DEFAULT_MAX_PARALLEL_WORKERS
    ocr_max_workers: int = DEFAULT_OCR_MAX_WORKERS
    timeout_seconds_per_page: int = DEFAULT_PER_PAGE_TIMEOUT_SEC
    use_multiprocessing: bool = False  # Threads by default to avoid process spawning overhead on Windows


@dataclass
class TableExtractorConfig:
    """Root configuration object controlling all table extraction subsystems."""
    ocr: OCRConfig = field(default_factory=OCRConfig)
    thresholds: ThresholdConfig = field(default_factory=ThresholdConfig)
    confidence: ConfidenceConfig = field(default_factory=ConfidenceConfig)
    projection: ProjectionConfig = field(default_factory=ProjectionConfig)
    detection: DetectionConfig = field(default_factory=DetectionConfig)
    memory: MemoryConfig = field(default_factory=MemoryConfig)
    workers: WorkerConfig = field(default_factory=WorkerConfig)

    def to_dict(self) -> Dict[str, Any]:
        """Convert entire config to plain serializable dictionary."""
        return asdict(self)

    @classmethod
    def from_env(cls) -> "TableExtractorConfig":
        """
        Build configuration initialized from environment variables with fallback defaults.
        Env vars follow CONVERTLY_TABLE_* pattern.
        """
        cfg = cls()

        # OCR
        if "CONVERTLY_TABLE_OCR_ENABLED" in os.environ:
            cfg.ocr.enabled = os.environ["CONVERTLY_TABLE_OCR_ENABLED"].strip().lower() in ("1", "true", "yes")
        if "CONVERTLY_TABLE_OCR_DPI" in os.environ:
            try:
                cfg.ocr.dpi = int(os.environ["CONVERTLY_TABLE_OCR_DPI"])
            except ValueError:
                pass
        if "CONVERTLY_TABLE_OCR_LANG" in os.environ:
            cfg.ocr.language = os.environ["CONVERTLY_TABLE_OCR_LANG"].strip()
        if "CONVERTLY_TABLE_TESSERACT_CMD" in os.environ:
            cfg.ocr.tesseract_cmd = os.environ["CONVERTLY_TABLE_TESSERACT_CMD"].strip()

        # Thresholds
        if "CONVERTLY_TABLE_SNAP_TOLERANCE" in os.environ:
            try:
                cfg.thresholds.snap_tolerance = float(os.environ["CONVERTLY_TABLE_SNAP_TOLERANCE"])
            except ValueError:
                pass
        if "CONVERTLY_TABLE_GUTTER_MIN_WIDTH" in os.environ:
            try:
                cfg.thresholds.gutter_min_width = float(os.environ["CONVERTLY_TABLE_GUTTER_MIN_WIDTH"])
            except ValueError:
                pass

        # Confidence
        if "CONVERTLY_TABLE_FALLBACK_THRESHOLD" in os.environ:
            try:
                cfg.confidence.fallback_threshold = float(os.environ["CONVERTLY_TABLE_FALLBACK_THRESHOLD"])
            except ValueError:
                pass

        # Memory & Workers
        if "CONVERTLY_TABLE_MAX_WORKERS" in os.environ:
            try:
                cfg.workers.max_workers = max(1, int(os.environ["CONVERTLY_TABLE_MAX_WORKERS"]))
            except ValueError:
                pass
        ocr_worker_env = os.environ.get("CONVERTLY_TABLE_OCR_MAX_WORKERS") or os.environ.get("CONVERTLY_OCR_MAX_WORKERS")
        if ocr_worker_env:
            try:
                cfg.workers.ocr_max_workers = max(1, int(ocr_worker_env))
            except ValueError:
                pass
        if "CONVERTLY_TABLE_STREAMING_PAGE_THRESHOLD" in os.environ:
            try:
                cfg.memory.streaming_page_threshold = int(os.environ["CONVERTLY_TABLE_STREAMING_PAGE_THRESHOLD"])
            except ValueError:
                pass
        if "CONVERTLY_TABLE_MAX_WORKER_MEMORY_MB" in os.environ:
            try:
                cfg.memory.max_worker_memory_mb = int(os.environ["CONVERTLY_TABLE_MAX_WORKER_MEMORY_MB"])
            except ValueError:
                pass

        return cfg

    @classmethod
    def from_options(cls, options: Optional[Dict[str, Any]] = None) -> "TableExtractorConfig":
        """
        Merge per-request options dict on top of environment/defaults.
        """
        cfg = cls.from_env()
        if not options:
            return cfg

        # OCR overrides
        if "ocr_enabled" in options:
            cfg.ocr.enabled = bool(options["ocr_enabled"])
        if "ocr_dpi" in options:
            cfg.ocr.dpi = int(options["ocr_dpi"])
        if "ocr_language" in options:
            cfg.ocr.language = str(options["ocr_language"])

        # Threshold overrides
        if "snap_tolerance" in options:
            cfg.thresholds.snap_tolerance = float(options["snap_tolerance"])
        if "gutter_min_width" in options:
            cfg.thresholds.gutter_min_width = float(options["gutter_min_width"])

        # Confidence overrides
        if "fallback_threshold" in options:
            cfg.confidence.fallback_threshold = float(options["fallback_threshold"])

        # Memory overrides
        if "streaming_page_threshold" in options:
            cfg.memory.streaming_page_threshold = int(options["streaming_page_threshold"])
        if "max_workers" in options:
            cfg.workers.max_workers = int(options["max_workers"])
        if "ocr_max_workers" in options:
            cfg.workers.ocr_max_workers = int(options["ocr_max_workers"])

        return cfg
