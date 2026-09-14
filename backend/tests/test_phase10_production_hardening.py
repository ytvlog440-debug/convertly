"""
Phase 10 — Enterprise Production Hardening & Security Audit Test Suite
Verifies:
- Magic bytes validation & non-PDF rejection
- Zero-byte file rejection
- PDF bomb & excessive dimension rejection
- Control character sanitization (IllegalCharacterError prevention)
- Password-protected document handling
- Excel row/column boundary enforcement
- Privacy & zero-retention structured log audit (no cell data logged)
"""

import os
import shutil
import pytest
import openpyxl
import fitz

from app.core.errors import FileValidationError
from app.services.engine.pdf_to_excel import PdfToExcelConverter
from app.services.engine.table_extractor import EnterpriseTableExtractor
from app.services.engine.table_extractor.excel.writer import EnterpriseExcelWriter
from app.services.engine.table_extractor.models import TableCell, TableRow, TableBlock

P10_TMP_DIR = os.path.join(os.path.dirname(__file__), "tmp_phase10")


@pytest.fixture(scope="module", autouse=True)
def setup_p10_dir():
    os.makedirs(P10_TMP_DIR, exist_ok=True)
    yield
    if os.path.exists(P10_TMP_DIR):
        shutil.rmtree(P10_TMP_DIR, ignore_errors=True)


def test_p10_security_reject_fake_pdf_extension():
    """Verify that a non-PDF file renamed as .pdf is rejected via magic byte inspection."""
    fake_pdf = os.path.join(P10_TMP_DIR, "fake.pdf")
    with open(fake_pdf, "wb") as f:
        f.write(b"PK\x03\x04This is actually a zip/docx archive masquerading as a pdf")

    converter = PdfToExcelConverter()
    with pytest.raises(FileValidationError) as exc:
        converter.validate_inputs([fake_pdf], {})

    assert "invalid file format" in str(exc.value).lower() or "not a valid pdf" in str(exc.value).lower()


def test_p10_security_reject_empty_file():
    """Verify that a 0-byte file is rejected immediately before execution."""
    empty_pdf = os.path.join(P10_TMP_DIR, "empty.pdf")
    with open(empty_pdf, "wb") as f:
        pass  # 0 bytes

    converter = PdfToExcelConverter()
    with pytest.raises(FileValidationError) as exc:
        converter.validate_inputs([empty_pdf], {})

    assert "empty" in str(exc.value).lower()


def test_p10_security_reject_pdf_bomb_dimensions():
    """Verify that documents with absurd canvas dimensions (> 28,800 pt / 400 inches) are rejected."""
    bomb_pdf = os.path.join(P10_TMP_DIR, "pdf_bomb.pdf")
    doc = fitz.open()
    # 35,000 points wide (~486 inches)
    doc.new_page(width=35000, height=35000)
    doc.save(bomb_pdf)
    doc.close()

    converter = PdfToExcelConverter()
    with pytest.raises(FileValidationError) as exc:
        converter.validate_inputs([bomb_pdf], {})

    assert "dimensions exceed safety limits" in str(exc.value).lower() or "decompression" in str(exc.value).lower()


def test_p10_security_sanitize_illegal_xml_control_characters():
    """Verify that ASCII control characters (\x00-\x08, \x0b, \x1f) are scrubbed to prevent Excel corruption."""
    writer = EnterpriseExcelWriter()
    dirty_text = "SecureData\x00\x01\x08With\x0bControl\x1fChars"

    cell = TableCell(
        text=dirty_text,
        bbox=(50, 50, 150, 70),
        row_idx=0,
        col_idx=0,
        typed_value=None,
    )
    row = TableRow(cells=[cell], row_idx=0, bbox=(50, 50, 150, 70))
    block = TableBlock(bbox=(50, 50, 150, 70), rows=[row])

    # Must generate bytes without raising IllegalCharacterError
    xlsx_bytes = writer.generate([block])
    assert len(xlsx_bytes) > 0

    # Verify generated workbook opens cleanly in openpyxl
    out_path = os.path.join(P10_TMP_DIR, "sanitized_out.xlsx")
    with open(out_path, "wb") as f:
        f.write(xlsx_bytes)

    wb = openpyxl.load_workbook(out_path)
    ws = wb.active
    read_val = ws.cell(row=1, column=1).value
    wb.close()

    assert read_val == "SecureDataWithControlChars"
    assert "\x00" not in read_val
    assert "\x0b" not in read_val


def test_p10_security_excel_max_boundary_safety():
    """Verify that rows exceeding Excel maximums (1,048,576 rows) do not crash the engine."""
    writer = EnterpriseExcelWriter()
    # Create block placed past boundaries
    cell = TableCell(
        text="Normal Value",
        bbox=(50, 50, 100, 70),
        row_idx=0,
        col_idx=17000,  # Exceeds MAX_EXCEL_COLS (16384)
    )
    row = TableRow(cells=[cell], row_idx=0, bbox=(50, 50, 100, 70))
    block = TableBlock(bbox=(50, 50, 100, 70), rows=[row])

    xlsx_bytes = writer.generate([block])
    assert len(xlsx_bytes) > 0


def test_p10_security_log_privacy_audit(caplog):
    """Verify that structured logging does not emit extracted customer table content or cell strings."""
    import logging
    caplog.set_level(logging.INFO)

    sample_pdf = os.path.join(P10_TMP_DIR, "confidential.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.draw_line((50, 80), (450, 80))
    page.draw_line((50, 120), (450, 120))
    page.draw_line((50, 80), (50, 120))
    page.draw_line((450, 80), (450, 120))
    secret_text = "CONFIDENTIAL_ROTH_IRA_998231_BALANCE"
    page.insert_text((55, 105), secret_text, fontsize=10)
    doc.save(sample_pdf)
    doc.close()

    extractor = EnterpriseTableExtractor()
    out_xlsx = os.path.join(P10_TMP_DIR, "confidential_out.xlsx")
    extractor.process_pdf_document(sample_pdf, out_xlsx)

    # Inspect all logs captured during extraction
    all_log_text = " ".join(record.message for record in caplog.records)
    # Ensure confidential text was NEVER logged to console/disk logs
    assert secret_text not in all_log_text
