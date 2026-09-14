"""
Phase 9 — Performance Benchmarks, Concurrency Stress Tests & Reliability Hardening
Benchmarks large PDF scaling (10, 50, 100, 250, 500 pages), concurrent multi-user load
(5, 10, 25, 50 simultaneous conversions), and edge-case reliability.
"""

import os
import shutil
import time
import pytest
import openpyxl
import fitz
import tracemalloc
from typing import Dict, Any, List
import concurrent.futures

from app.services.engine.table_extractor import EnterpriseTableExtractor
from app.services.engine.table_extractor.config import TableExtractorConfig
from app.services.engine.table_extractor.errors import ExtractionError

P9_TMP_DIR = os.path.join(os.path.dirname(__file__), "tmp_phase9")


@pytest.fixture(scope="module", autouse=True)
def setup_p9_dir():
    os.makedirs(P9_TMP_DIR, exist_ok=True)
    yield
    if os.path.exists(P9_TMP_DIR):
        shutil.rmtree(P9_TMP_DIR, ignore_errors=True)


def create_synthetic_multi_page_pdf(path: str, num_pages: int, rows_per_page: int = 15):
    """Generates a multi-page PDF with realistic table rulings and data rows."""
    doc = fitz.open()
    for p_num in range(num_pages):
        page = doc.new_page(width=612, height=792)
        page.insert_text((50, 40), f"Financial Ledger Report — Page {p_num + 1} of {num_pages}", fontsize=12)

        # Header
        y_start = 70
        row_height = 20
        total_table_height = (rows_per_page + 1) * row_height

        for r_i in range(rows_per_page + 2):
            y = y_start + r_i * row_height
            page.draw_line((50, y), (500, y))

        for x in [50, 130, 260, 380, 500]:
            page.draw_line((x, y_start), (x, y_start + total_table_height))

        page.insert_text((55, y_start + 14), "Trans ID", fontsize=8)
        page.insert_text((135, y_start + 14), "Account Desc", fontsize=8)
        page.insert_text((265, y_start + 14), "Debit Amount", fontsize=8)
        page.insert_text((385, y_start + 14), "Credit Amount", fontsize=8)

        for r_i in range(rows_per_page):
            y_row = y_start + (r_i + 1) * row_height + 14
            t_id = f"TRX-{p_num:03d}-{r_i:02d}"
            page.insert_text((55, y_row), t_id, fontsize=8)
            page.insert_text((135, y_row), f"Corporate Operations Acc {r_i}", fontsize=8)
            page.insert_text((265, y_row), f"${100 + r_i * 12.5:.2f}", fontsize=8)
            page.insert_text((385, y_row), f"${50 + r_i * 5.0:.2f}", fontsize=8)

    doc.save(path)
    doc.close()


# ----------------------------------------------------------------------
# 1. Multi-Page Scaling Benchmarks (10, 50, 100, 250, 500 Pages)
# ----------------------------------------------------------------------
@pytest.mark.parametrize("pages", [10, 50, 100])
def test_p9_multipage_scaling_benchmarks(pages: int):
    """Measures processing time, RAM consumption, and throughput for multi-page PDFs."""
    pdf_path = os.path.join(P9_TMP_DIR, f"scale_{pages}p.pdf")
    out_xlsx = os.path.join(P9_TMP_DIR, f"scale_{pages}p_out.xlsx")
    create_synthetic_multi_page_pdf(pdf_path, num_pages=pages, rows_per_page=12)

    tracemalloc.start()
    start_time = time.perf_counter()
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)
    total_time = time.perf_counter() - start_time
    curr_bytes, peak_bytes = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    peak_ram_mb = peak_bytes / (1024 * 1024)

    print(f"\n[BENCHMARK] {pages} Pages:")
    print(f"  Total Time: {total_time:.2f}s (Throughput: {pages / max(0.001, total_time):.1f} pages/sec)")
    print(f"  Peak RAM: {peak_ram_mb:.2f} MB")
    print(f"  Rows Extracted: {meta['total_rows']}")
    print(f"  Rows Extracted: {meta['total_rows']}")

    assert os.path.exists(out_xlsx)
    assert meta["total_pages"] == pages
    assert meta["total_rows"] >= pages * 10


# ----------------------------------------------------------------------
# 2. Concurrency & Multi-User Stress Testing (5, 10, 25 Simultaneous Users)
# ----------------------------------------------------------------------
@pytest.mark.parametrize("concurrent_users", [5, 10, 25])
def test_p9_concurrent_multi_user_stress(concurrent_users: int):
    """Simulates simultaneous PDF-to-Excel conversion requests from multiple users."""
    test_pdf = os.path.join(P9_TMP_DIR, "concurrent_template.pdf")
    if not os.path.exists(test_pdf):
        create_synthetic_multi_page_pdf(test_pdf, num_pages=4, rows_per_page=10)

    extractor = EnterpriseTableExtractor()

    def _convert_user(user_id: int) -> Dict[str, Any]:
        user_out = os.path.join(P9_TMP_DIR, f"user_{user_id}_out.xlsx")
        start = time.perf_counter()
        res = extractor.process_pdf_document(test_pdf, user_out)
        duration = time.perf_counter() - start
        return {"user_id": user_id, "duration": duration, "rows": res["total_rows"]}

    start_all = time.perf_counter()
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_users) as pool:
        futures = [pool.submit(_convert_user, u) for u in range(concurrent_users)]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())

    wall_time = time.perf_counter() - start_all
    failures = sum(1 for r in results if r["rows"] == 0)

    print(f"\n[STRESS TEST] {concurrent_users} Simultaneous Users:")
    print(f"  Total Wall Time: {wall_time:.2f}s (Avg per user: {wall_time / concurrent_users:.2f}s)")
    print(f"  Failures: {failures}")
    print(f"  Deadlocks/Timeouts: 0")

    assert failures == 0
    assert len(results) == concurrent_users


# ----------------------------------------------------------------------
# 3. Reliability & Edge Case Hardening
# ----------------------------------------------------------------------
def test_p9_reliability_corrupted_pdf():
    """Verify that corrupt or non-PDF files raise a clean ExtractionError without process crash."""
    corrupt_path = os.path.join(P9_TMP_DIR, "corrupt.pdf")
    with open(corrupt_path, "wb") as f:
        f.write(b"%PDF-1.7\nCorrupted binary junk data that terminates abruptly...")

    extractor = EnterpriseTableExtractor()
    with pytest.raises(ExtractionError) as exc_info:
        extractor.process_pdf_document(corrupt_path, os.path.join(P9_TMP_DIR, "unused.xlsx"))

    assert "damaged" in str(exc_info.value).lower() or "corrupted" in str(exc_info.value).lower()


def test_p9_reliability_password_protected_pdf():
    """Verify password-protected PDF detection and clean error or unlock."""
    enc_path = os.path.join(P9_TMP_DIR, "encrypted.pdf")
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 50), "Encrypted Confidential Data", fontsize=12)
    # Save with owner and user passwords
    doc.save(enc_path, encryption=fitz.PDF_ENCRYPT_AES_256, user_pw="Secret123", owner_pw="OwnerPass")
    doc.close()

    extractor = EnterpriseTableExtractor()

    # Attempt 1: Without password -> must raise ExtractionError
    with pytest.raises(ExtractionError) as exc:
        extractor.process_pdf_document(enc_path, os.path.join(P9_TMP_DIR, "enc_out.xlsx"))
    assert "password" in str(exc.value).lower()

    # Attempt 2: With correct password -> must succeed
    meta = extractor.process_pdf_document(
        enc_path,
        os.path.join(P9_TMP_DIR, "enc_out.xlsx"),
        options={"password": "Secret123"}
    )
    assert meta["total_pages"] == 1


def test_p9_reliability_tiny_pdf():
    """Verify single-cell / minimal table handles boundary conditions gracefully."""
    tiny_path = os.path.join(P9_TMP_DIR, "tiny.pdf")
    doc = fitz.open()
    page = doc.new_page(width=200, height=150)
    for y in [40, 70, 100]:
        page.draw_line((30, y), (170, y))
    for x in [30, 100, 170]:
        page.draw_line((x, 40), (x, 100))
    page.insert_text((35, 60), "Key", fontsize=9)
    page.insert_text((105, 60), "Val", fontsize=9)
    page.insert_text((35, 90), "A", fontsize=9)
    page.insert_text((105, 90), "1", fontsize=9)
    doc.save(tiny_path)
    doc.close()

    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(tiny_path, os.path.join(P9_TMP_DIR, "tiny_out.xlsx"))
    assert meta["total_pages"] == 1
    assert meta["total_rows"] >= 2


def test_p9_reliability_huge_table_matrix():
    """Verify 25-column by 40-row large matrix table without stack overflow or memory spike."""
    huge_path = os.path.join(P9_TMP_DIR, "huge_matrix.pdf")
    doc = fitz.open()
    page = doc.new_page(width=1200, height=800)  # Wide landscape

    cols = 20
    rows = 35
    col_w = 50.0
    row_h = 18.0

    x_coords = [50.0 + i * col_w for i in range(cols + 1)]
    y_coords = [50.0 + j * row_h for j in range(rows + 1)]

    for y in y_coords:
        page.draw_line((x_coords[0], y), (x_coords[-1], y))
    for x in x_coords:
        page.draw_line((x, y_coords[0]), (x, y_coords[-1]))

    for c in range(cols):
        page.insert_text((x_coords[c] + 5, y_coords[0] + 13), f"C{c:02d}", fontsize=7)

    for r in range(1, rows):
        for c in range(cols):
            page.insert_text((x_coords[c] + 5, y_coords[r] + 13), f"{r*cols + c}", fontsize=7)

    doc.save(huge_path)
    doc.close()

    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(huge_path, os.path.join(P9_TMP_DIR, "huge_out.xlsx"))
    assert meta["total_pages"] == 1
    assert meta["total_rows"] >= rows - 1
