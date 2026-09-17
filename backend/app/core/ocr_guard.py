"""
Convertly V2 — Global OCR Resource & Memory Guard
Provides bounded process-wide concurrency for memory-heavy OCR tasks,
deterministic resource tracking, and high-fidelity RSS memory logging.
"""

import os
import sys
import time
import threading
import logging
from contextlib import contextmanager
from typing import Optional

logger = logging.getLogger("convertly.ocr_guard")

# Default maximum concurrent OCR operations across the entire process
DEFAULT_MAX_CONCURRENT_OCR = int(os.environ.get("CONVERTLY_MAX_CONCURRENT_OCR", "1"))

_lock = threading.Lock()
_semaphore = threading.BoundedSemaphore(value=max(1, DEFAULT_MAX_CONCURRENT_OCR))
_active_ocr_count = 0
_max_concurrent_ocr = max(1, DEFAULT_MAX_CONCURRENT_OCR)


def set_max_concurrent_ocr(val: int) -> None:
    """Dynamically reconfigure maximum concurrent OCR operations (primarily for testing/tuning)."""
    global _semaphore, _max_concurrent_ocr
    with _lock:
        val = max(1, val)
        _max_concurrent_ocr = val
        _semaphore = threading.BoundedSemaphore(value=val)


def get_max_concurrent_ocr() -> int:
    """Returns the current concurrency limit for OCR operations."""
    with _lock:
        return _max_concurrent_ocr


def get_active_ocr_count() -> int:
    """Returns the number of currently executing OCR tasks."""
    with _lock:
        return _active_ocr_count


def get_process_rss_mb() -> float:
    """
    Returns the current process Resident Set Size (RSS) memory in megabytes.
    Uses psutil if installed; otherwise falls back to /proc/self/status on Linux
    or ctypes on Windows.
    """
    # Strategy 1: psutil
    try:
        import psutil
        return psutil.Process().memory_info().rss / (1024.0 * 1024.0)
    except Exception:
        pass

    # Strategy 2: Linux /proc/self/status (Railway production environment)
    if sys.platform.startswith("linux"):
        try:
            with open("/proc/self/status", "r") as f:
                for line in f:
                    if line.startswith("VmRSS:"):
                        parts = line.split()
                        # VmRSS: 123456 kB
                        return float(parts[1]) / 1024.0
        except Exception:
            pass

    # Strategy 3: Windows ctypes fallback
    if sys.platform == "win32":
        try:
            import ctypes
            from ctypes import wintypes

            class PROCESS_MEMORY_COUNTERS(ctypes.Structure):
                _fields_ = [
                    ('cb', wintypes.DWORD),
                    ('PageFaultCount', wintypes.DWORD),
                    ('PeakWorkingSetSize', ctypes.c_size_t),
                    ('WorkingSetSize', ctypes.c_size_t),
                    ('QuotaPeakPagedPoolUsage', ctypes.c_size_t),
                    ('QuotaPagedPoolUsage', ctypes.c_size_t),
                    ('QuotaPeakNonPagedPoolUsage', ctypes.c_size_t),
                    ('QuotaNonPagedPoolUsage', ctypes.c_size_t),
                    ('PagefileUsage', ctypes.c_size_t),
                    ('PeakPagefileUsage', ctypes.c_size_t),
                ]

            pmc = PROCESS_MEMORY_COUNTERS()
            pmc.cb = ctypes.sizeof(PROCESS_MEMORY_COUNTERS)
            handle = ctypes.windll.kernel32.GetCurrentProcess()
            func = ctypes.windll.psapi.GetProcessMemoryInfo
            func.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD]
            func.restype = wintypes.BOOL
            if func(handle, ctypes.byref(pmc), pmc.cb):
                return pmc.WorkingSetSize / (1024.0 * 1024.0)
        except Exception:
            pass

    return 0.0


def log_ocr_memory(
    job_id: str = "unknown",
    page_idx: int = -1,
    stage: str = "general",
    engine: str = "tesseract",
    duration_s: Optional[float] = None,
) -> None:
    """
    Logs structured RSS memory usage for an OCR job stage without revealing sensitive data.
    """
    rss = get_process_rss_mb()
    active = get_active_ocr_count()
    dur_str = f" duration_s={duration_s:.3f}" if duration_s is not None else ""
    page_num = page_idx + 1 if page_idx >= 0 else 0

    logger.info(
        f"[OCR_MEMORY] job={job_id} page={page_num} stage={stage} "
        f"engine={engine} active_ocr={active} rss_mb={rss:.1f}{dur_str}"
    )


class OCRTimeoutError(Exception):
    """Raised when an OCR operation cannot acquire the concurrency semaphore within the allotted time."""
    pass


@contextmanager
def ocr_resource_guard(
    job_id: str = "unknown",
    page_idx: int = -1,
    engine: str = "tesseract",
    timeout: float = 120.0,
):
    """
    Thread-safe context manager guaranteeing bounded OCR concurrency across all requests and jobs.
    Acquires the global semaphore, records active count, emits structured memory logs,
    and guarantees resource release in finally.
    """
    global _active_ocr_count
    start_wait = time.perf_counter()
    acquired = _semaphore.acquire(blocking=True, timeout=timeout)
    wait_duration = time.perf_counter() - start_wait

    if not acquired:
        logger.error(
            f"[OCR_RESOURCE] Concurrency limit timeout after {wait_duration:.2f}s "
            f"for job={job_id} page={page_idx + 1}. Max concurrent={_max_concurrent_ocr}."
        )
        raise OCRTimeoutError(
            f"Server busy: OCR concurrency limit reached. Timed out waiting {timeout:.0f}s for OCR worker."
        )

    with _lock:
        _active_ocr_count += 1

    log_ocr_memory(job_id=job_id, page_idx=page_idx, stage="ocr_lock_acquired", engine=engine)

    start_exec = time.perf_counter()
    try:
        yield
    finally:
        exec_duration = time.perf_counter() - start_exec
        log_ocr_memory(
            job_id=job_id,
            page_idx=page_idx,
            stage="ocr_lock_releasing",
            engine=engine,
            duration_s=exec_duration,
        )
        with _lock:
            _active_ocr_count = max(0, _active_ocr_count - 1)
        _semaphore.release()
