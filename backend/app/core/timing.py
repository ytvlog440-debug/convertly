"""
Convertly V2 — Pipeline Stage Instrumentation & Execution Telemetry
Tracks execution time (milliseconds) and timestamps across all 15 stages.
"""

import time
from datetime import datetime, timezone
from contextlib import contextmanager
from app.core.logging import logger


@contextmanager
def log_stage(stage_name: str, extra: str = ""):
    """
    Context manager to instrument and log pipeline stages with exact formatting:
    [Stage] {stage_name}
    Start: {ISO-8601 UTC}
    End: {ISO-8601 UTC}
    Duration: {duration_ms:.2f} ms
    """
    start_dt = datetime.now(timezone.utc).isoformat()
    t0 = time.perf_counter()
    desc = f" ({extra})" if extra else ""
    logger.info(f"[Stage] {stage_name}{desc}\nStart: {start_dt}")
    try:
        yield
    finally:
        t1 = time.perf_counter()
        end_dt = datetime.now(timezone.utc).isoformat()
        duration_ms = (t1 - t0) * 1000.0
        logger.info(f"[Stage] {stage_name}{desc}\nEnd: {end_dt}\nDuration: {duration_ms:.2f} ms")
