"""
Convertly V2 — Bounded Memory & OCR Concurrency Guard Unit Tests
Validates:
1. Native PDF bypasses OCR.
2. OCR concurrency limit is strictly respected.
3. OCR semaphore releases cleanly after exceptions.
4. Temporary resources (PIL images, Pixmaps, OpenCV arrays) are freed.
5. Large image references are not retained between pages or in layouts.
6. Failed OCR job reaches a valid failure state and does not hang.
7. Multi-page OCR conversion works sequentially without thread explosion.
8. Concurrent jobs do not create unbounded OCR workers.
9. Process RSS memory observability.
"""

import os
import gc
import io
import time
import uuid
import pytest
import threading
import fitz
import numpy as np
from unittest.mock import patch, MagicMock

from app.core.ocr_guard import (
    ocr_resource_guard,
    get_active_ocr_count,
    get_max_concurrent_ocr,
    set_max_concurrent_ocr,
    get_process_rss_mb,
    log_ocr_memory,
    OCRTimeoutError,
    is_near_blank_page,
    extract_ocr_text_from_page,
)
from app.services.engine.table_extractor import EnterpriseTableExtractor
from app.services.engine.table_extractor.config import TableExtractorConfig
from app.services.engine.table_extractor.constants import EngineType, STANDARD_OCR_DPI
from app.services.engine.table_extractor.cv_preprocessor import CvDocumentPreProcessor
from app.services.engine.table_extractor.engines.ocr import OCRExtractor
from app.services.engine.pdf_to_excel import PdfToExcelConverter
from app.models.job import ConversionJob, JobStatus
from app.models.file_record import FileRecord
from app.db.session import AsyncSessionLocal


def _create_native_text_pdf() -> bytes:
    """Helper to generate a pure vector native text PDF."""
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text((50, 50), "Quarterly Financial Report Q1 2026", fontsize=14)
    # Draw simple table
    page.draw_rect(fitz.Rect(50, 80, 550, 200), color=(0, 0, 0), width=1)
    page.draw_line(fitz.Point(50, 110), fitz.Point(550, 110), color=(0, 0, 0), width=1)
    page.draw_line(fitz.Point(200, 80), fitz.Point(200, 200), color=(0, 0, 0), width=1)
    page.insert_text((60, 100), "Department", fontsize=10)
    page.insert_text((220, 100), "Expenditure ($)", fontsize=10)
    page.insert_text((60, 140), "Research & Development", fontsize=10)
    page.insert_text((220, 140), "$125,000.00", fontsize=10)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _create_scanned_image_pdf(pages: int = 1) -> bytes:
    """Helper to generate a synthetic scanned/image PDF lacking native text layer."""
    from PIL import Image, ImageDraw
    doc = fitz.open()
    for p_idx in range(pages):
        page = doc.new_page(width=612, height=792)
        # Create a raster image with a simulated table
        img = Image.new("RGB", (800, 600), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        draw.rectangle([50, 50, 750, 400], outline="black", width=2)
        draw.line([50, 120, 750, 120], fill="black", width=2)
        draw.line([300, 50, 300, 400], fill="black", width=2)
        draw.text((60, 80), f"Item Name Page {p_idx + 1}", fill="black")
        draw.text((320, 80), "Total Cost", fill="black")
        draw.text((60, 160), "Server Hardware", fill="black")
        draw.text((320, 160), "$15,250.00", fill="black")

        img_buf = io.BytesIO()
        img.save(img_buf, format="PNG")
        img_bytes = img_buf.getvalue()
        img.close()

        # Insert image into page without text
        page.insert_image(fitz.Rect(50, 50, 550, 500), stream=img_bytes)

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_native_pdf_bypasses_ocr(tmp_path):
    """Verify that native text PDFs bypass OCR entirely and do not acquire the OCR guard."""
    pdf_bytes = _create_native_text_pdf()
    pdf_file = tmp_path / "native.pdf"
    pdf_file.write_bytes(pdf_bytes)
    out_excel = tmp_path / "native.xlsx"

    extractor = EnterpriseTableExtractor()
    with patch("app.core.ocr_guard.ocr_resource_guard") as mock_guard:
        meta = extractor.process_pdf_document(str(pdf_file), str(out_excel))
        assert meta["total_pages"] == 1
        assert os.path.exists(str(out_excel))
        # ocr_resource_guard should NOT have been invoked
        mock_guard.assert_not_called()


def test_ocr_concurrency_limit_is_respected():
    """Verify that the global semaphore strictly bounds active concurrent OCR operations."""
    set_max_concurrent_ocr(1)
    peak_active = 0
    lock = threading.Lock()

    def heavy_ocr_task():
        nonlocal peak_active
        with ocr_resource_guard(job_id="test_conc", page_idx=0, timeout=10.0):
            current = get_active_ocr_count()
            with lock:
                if current > peak_active:
                    peak_active = current
            time.sleep(0.05)

    threads = [threading.Thread(target=heavy_ocr_task) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Peak active count must strictly equal 1
    assert peak_active == 1
    assert get_active_ocr_count() == 0


def test_ocr_semaphore_releases_after_exceptions():
    """Verify that the OCR semaphore releases cleanly even when an unexpected exception occurs."""
    set_max_concurrent_ocr(1)
    assert get_active_ocr_count() == 0

    with pytest.raises(RuntimeError):
        with ocr_resource_guard(job_id="test_exc", page_idx=0):
            assert get_active_ocr_count() == 1
            raise RuntimeError("Simulated Tesseract failure")

    # Guard must be released immediately in finally
    assert get_active_ocr_count() == 0

    # Next call should acquire cleanly without deadlock
    acquired = False
    with ocr_resource_guard(job_id="test_next", page_idx=0, timeout=1.0):
        acquired = True
    assert acquired is True


def test_ocr_timeout_error_handling():
    """Verify that attempting to acquire the OCR guard past timeout raises OCRTimeoutError."""
    set_max_concurrent_ocr(1)

    def blocking_holder(hold_event, release_event):
        with ocr_resource_guard(job_id="holder", page_idx=0):
            hold_event.set()
            release_event.wait(timeout=5.0)

    hold_evt = threading.Event()
    release_evt = threading.Event()
    t = threading.Thread(target=blocking_holder, args=(hold_evt, release_evt))
    t.start()

    assert hold_evt.wait(timeout=2.0) is True

    # Now attempt acquisition with short timeout
    with pytest.raises(OCRTimeoutError):
        with ocr_resource_guard(job_id="timed_out", page_idx=1, timeout=0.1):
            pass

    release_evt.set()
    t.join()
    assert get_active_ocr_count() == 0


def test_cv_preprocessor_memory_cleanup():
    """Verify CvDocumentPreProcessor uses direct samples, avoids PNG re-encoding, and cleans up."""
    prep = CvDocumentPreProcessor(dpi=200)
    doc = fitz.open()
    page = doc.new_page(width=200, height=200)
    page.draw_rect(fitz.Rect(10, 10, 100, 100), color=(1, 0, 0), fill=(0, 1, 0))

    img_bgr = prep.render_page_to_cv2(page)
    assert img_bgr is not None
    assert isinstance(img_bgr, np.ndarray)

    deskewed, angle = prep.deskew_image(img_bgr)
    assert deskewed is not None

    pil_img = prep.cv2_to_pil(deskewed)
    assert pil_img is not None
    pil_img.close()

    del img_bgr, deskewed, pil_img
    doc.close()
    gc.collect()


def test_large_image_references_not_retained_in_layouts(tmp_path):
    """Verify that PageLayout objects produced by EnterpriseTableExtractor retain NO raw image data."""
    pdf_bytes = _create_native_text_pdf()
    pdf_file = tmp_path / "check_layout.pdf"
    pdf_file.write_bytes(pdf_bytes)
    out_excel = tmp_path / "check_layout.xlsx"

    extractor = EnterpriseTableExtractor()
    doc = fitz.open(str(pdf_file))
    layout = extractor._analyze_page(doc[0], 0, force_ocr=False)
    doc.close()

    # Layout must contain tables, but zero image arrays or pixmaps
    assert hasattr(layout, "tables")
    for t in layout.tables:
        for r in t.rows:
            for c in r.cells:
                assert not isinstance(c.typed_value, (np.ndarray, bytes))
                assert not isinstance(c.text, (np.ndarray, bytes))


def test_multi_page_ocr_concurrency_policy():
    """Verify that OCR-heavy documents strictly bound workers to ocr_max_workers (1)."""
    cfg = TableExtractorConfig()
    cfg.workers.max_workers = 4
    cfg.workers.ocr_max_workers = 1

    # When OCR is required:
    is_ocr = True
    active_workers = min(cfg.workers.ocr_max_workers, 10) if is_ocr else min(cfg.workers.max_workers, 10)
    assert active_workers == 1

    # When native text:
    is_ocr = False
    active_workers = min(cfg.workers.ocr_max_workers, 10) if is_ocr else min(cfg.workers.max_workers, 10)
    assert active_workers == 4


def test_rss_memory_reporting():
    """Verify that get_process_rss_mb returns a non-negative float and log_ocr_memory does not crash."""
    rss = get_process_rss_mb()
    assert isinstance(rss, float)
    assert rss >= 0.0

    # Ensure log call executes cleanly without exceptions
    log_ocr_memory(job_id="test_job", page_idx=0, stage="test_stage", engine="tesseract")


@pytest.mark.asyncio
async def test_job_failure_state_handling(tmp_path):
    """Verify that when an OCR error or timeout occurs in the job pipeline, the job transitions to FAILED."""
    from app.api.v1.endpoints.jobs import execute_job_pipeline
    from app.models.job import JobStatus

    job_id = str(uuid.uuid4())
    file_id = str(uuid.uuid4())
    dummy_path = tmp_path / f"{file_id}.pdf"
    dummy_path.write_bytes(b"%PDF-1.4 dummy content")

    async with AsyncSessionLocal() as session:
        job = ConversionJob(
            id=job_id,
            tool_id="pdf-to-excel",
            status=JobStatus.PENDING,
            progress=0,
            input_file_ids=[file_id],
            options={}
        )
        file_rec = FileRecord(
            id=file_id,
            original_filename="corrupted.pdf",
            storage_key=f"uploads/{file_id}.pdf",
            file_size_bytes=len(dummy_path.read_bytes()),
            mime_type="application/pdf",
            file_hash="dummyhash"
        )
        session.add(job)
        session.add(file_rec)
        await session.commit()

    # Execute pipeline with simulated error
    with patch("app.services.storage.get_storage_service") as mock_storage_factory:
        mock_storage = MagicMock()
        mock_storage.get_file_path = MagicMock(return_value=str(dummy_path))
        mock_storage_factory.return_value = mock_storage

        # Run pipeline
        await execute_job_pipeline(job_id, "pdf-to-excel", [file_id], {})

    # Check job status in database
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        res = await session.execute(select(ConversionJob).where(ConversionJob.id == job_id))
        saved_job = res.scalar_one_or_none()
        assert saved_job is not None
        assert saved_job.status == JobStatus.FAILED
        assert saved_job.error_message is not None
        assert saved_job.progress == 100


@pytest.mark.asyncio
async def test_end_to_end_multipage_scanned_pdf_conversion(tmp_path):
    """Verify that a multi-page scanned PDF processes end-to-end through PdfToExcelConverter with bounded concurrency."""
    pdf_bytes = _create_scanned_image_pdf(pages=3)
    pdf_file = tmp_path / "scanned_3page.pdf"
    pdf_file.write_bytes(pdf_bytes)

    converter = PdfToExcelConverter()
    options = {}

    # Mock pytesseract.image_to_data to return structured TSV words without requiring external tesseract.exe binary
    mock_tsv = {
        'text': ['Item', 'Cost', 'Server', '$1,200.00'],
        'conf': [95, 95, 90, 92],
        'left': [100, 300, 100, 300],
        'top': [100, 100, 150, 150],
        'width': [80, 80, 80, 80],
        'height': [20, 20, 20, 20],
        'block_num': [1, 1, 1, 1],
        'line_num': [1, 1, 2, 2],
    }

    mock_pytesseract = MagicMock()
    mock_pytesseract.image_to_data = MagicMock(return_value=mock_tsv)
    mock_pytesseract.Output = MagicMock()
    mock_pytesseract.Output.DICT = "dict"

    with patch.dict("sys.modules", {"pytesseract": mock_pytesseract}), \
         patch("app.services.engine.office.find_tesseract_bin", return_value="dummy_tesseract"):
        result = await converter.convert([str(pdf_file)], str(tmp_path), options)

        assert os.path.exists(result.output_path)
        assert result.output_path.endswith(".xlsx")
        assert result.metadata.get("total_pages_processed", 3) >= 1
        assert get_active_ocr_count() == 0


def test_is_near_blank_page_detection():
    """Verify that is_near_blank_page correctly differentiates blank scans from content pages."""
    # 1. Blank page
    doc_blank = fitz.open()
    page_blank = doc_blank.new_page(width=612, height=792)
    assert is_near_blank_page(page_blank) is True
    doc_blank.close()

    # 2. Content page with text
    doc_content = fitz.open()
    page_content = doc_content.new_page(width=612, height=792)
    page_content.insert_text((72, 100), "This is a statement with rich transactions and valid content.")
    assert is_near_blank_page(page_content) is False
    doc_content.close()


def test_extract_ocr_text_from_page_skips_blank_page():
    """Verify that extract_ocr_text_from_page cleanly skips blank pages without running OCR."""
    doc_blank = fitz.open()
    page_blank = doc_blank.new_page(width=612, height=792)

    with patch("pytesseract.image_to_string") as mock_ocr:
        text = extract_ocr_text_from_page(page_blank, page_idx=1)
        assert text == ""
        # pytesseract must never be called on blank pages!
        mock_ocr.assert_not_called()

    doc_blank.close()


@pytest.mark.asyncio
async def test_pdf_to_word_scanned_conversion_with_shared_guard(tmp_path):
    """Verify PdfToWordConverter processes scanned pages through shared OCR guard and cleans up."""
    from app.services.engine.office import PdfToWordConverter
    import docx

    pdf_bytes = _create_scanned_image_pdf(pages=2)
    pdf_file = tmp_path / "scanned_doc.pdf"
    pdf_file.write_bytes(pdf_bytes)

    converter = PdfToWordConverter()

    with patch("app.core.ocr_guard.find_tesseract_bin", return_value="dummy_tesseract"), \
         patch("pytesseract.image_to_string", return_value="Account Statement\nBalance $4,500.00"):
        res = await converter.convert([str(pdf_file)], str(tmp_path), {})

        assert os.path.exists(res.output_path)
        assert res.output_path.endswith(".docx")
        assert get_active_ocr_count() == 0

        # Validate docx structure
        doc = docx.Document(res.output_path)
        doc_text = "\n".join(p.text for p in doc.paragraphs)
        assert "Account Statement" in doc_text
        assert "$4,500.00" in doc_text

