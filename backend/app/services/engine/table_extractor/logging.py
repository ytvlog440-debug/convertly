"""
Convertly V2 — Enterprise Table Extraction Structured Logging
Provides context-managed stage timing, memory profiling, and structured telemetry
recording execution time, memory delta, engine, confidence, warnings, and errors.
"""

import time
import logging
import json
from typing import Optional, List, Dict, Any
from contextlib import contextmanager

from .models import EngineMetrics

logger = logging.getLogger("convertly.table_extractor")


def _get_process_memory_mb() -> float:
    """Safely obtain current process memory usage in Megabytes."""
    try:
        import psutil
        import os
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024.0 * 1024.0)
    except Exception:
        # Fallback if psutil is not available
        return 0.0


class StageLogger:
    """
    Context manager and telemetry collector for processing pipeline stages.
    Guarantees structured logging of:
    - execution time (ms)
    - memory delta (MB)
    - engine name
    - confidence
    - warnings
    - errors
    """

    def __init__(
        self,
        stage_name: str,
        engine_name: str = "core",
        page_idx: int = 0,
        extra_meta: Optional[Dict[str, Any]] = None,
    ):
        self.stage_name = stage_name
        self.engine_name = engine_name
        self.page_idx = page_idx
        self.extra_meta = extra_meta or {}
        self.warnings: List[str] = []
        self.errors: List[str] = []
        self.confidence: float = 1.0
        self.cell_count: int = 0
        self.table_count: int = 0
        self.execution_time_ms: float = 0.0
        self.memory_delta_mb: float = 0.0

        self._start_time: float = 0.0
        self._start_mem: float = 0.0

    def __enter__(self) -> "StageLogger":
        self._start_time = time.perf_counter()
        self._start_mem = _get_process_memory_mb()
        logger.debug(
            json.dumps({
                "event": "stage_started",
                "stage": self.stage_name,
                "engine": self.engine_name,
                "page_idx": self.page_idx,
                "timestamp": time.time(),
            })
        )
        return self

    def add_warning(self, message: str) -> None:
        """Register a non-fatal warning during stage execution."""
        self.warnings.append(message)
        logger.warning(f"[{self.engine_name}|p{self.page_idx}] {message}")

    def add_error(self, message: str) -> None:
        """Register an error encountered during stage execution."""
        self.errors.append(message)
        logger.error(f"[{self.engine_name}|p{self.page_idx}] {message}")

    def set_confidence(self, confidence: float) -> None:
        """Update the observed stage confidence."""
        self.confidence = max(0.0, min(1.0, confidence))

    def set_counts(self, tables: int = 0, cells: int = 0) -> None:
        """Record table and cell extraction volumes."""
        self.table_count = tables
        self.cell_count = cells

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        duration = (time.perf_counter() - self._start_time) * 1000.0
        end_mem = _get_process_memory_mb()
        mem_delta = max(0.0, end_mem - self._start_mem)

        self.execution_time_ms = round(duration, 2)
        self.memory_delta_mb = round(mem_delta, 2)

        if exc_val is not None:
            self.add_error(str(exc_val))

        payload = {
            "event": "stage_completed",
            "stage": self.stage_name,
            "engine": self.engine_name,
            "page_idx": self.page_idx,
            "execution_time_ms": self.execution_time_ms,
            "memory_delta_mb": self.memory_delta_mb,
            "confidence": round(self.confidence, 4),
            "table_count": self.table_count,
            "cell_count": self.cell_count,
            "warnings_count": len(self.warnings),
            "errors_count": len(self.errors),
            "warnings": self.warnings,
            "errors": self.errors,
            **self.extra_meta,
        }

        if exc_val is not None:
            logger.error(json.dumps(payload))
        elif self.warnings:
            logger.warning(json.dumps(payload))
        else:
            logger.info(json.dumps(payload))

    def to_metrics(self) -> EngineMetrics:
        """Export current telemetry as an immutable EngineMetrics dataclass."""
        return EngineMetrics(
            engine_name=self.engine_name,
            page_idx=self.page_idx,
            execution_time_ms=self.execution_time_ms,
            memory_delta_mb=self.memory_delta_mb,
            cell_count=self.cell_count,
            table_count=self.table_count,
            confidence=self.confidence,
            warnings=list(self.warnings),
        )


@contextmanager
def stage_timer(stage_name: str, engine_name: str = "core", page_idx: int = 0, **meta):
    """Convenience context manager for timing and recording metrics."""
    s_logger = StageLogger(stage_name=stage_name, engine_name=engine_name, page_idx=page_idx, extra_meta=meta)
    with s_logger:
        yield s_logger
