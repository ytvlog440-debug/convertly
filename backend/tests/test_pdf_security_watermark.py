import os
import shutil
import pytest
import fitz
from app.services.engine.pdf import (
    PdfProtectConverter,
    PdfUnlockConverter,
    PdfWatermarkConverter,
    PdfPageNumbersConverter,
    open_and_validate_pdf
)
from app.services.engine.registry import converter_registry
from app.core.errors import FileValidationError

TEST_TMP_DIR = "./temp_sec_wm_tests"


@pytest.fixture(autouse=True)
def setup_teardown():
    os.makedirs(TEST_TMP_DIR, exist_ok=True)
    yield
    if os.path.exists(TEST_TMP_DIR):
        shutil.rmtree(TEST_TMP_DIR, ignore_errors=True)


def create_sample_pdf(filename: str, page_count: int = 3) -> str:
    path = os.path.join(TEST_TMP_DIR, filename)
    doc = fitz.open()
    for i in range(page_count):
        page = doc.new_page(width=595, height=842)
        page.insert_text((50, 72), f"Confidential Content Page {i + 1}", fontsize=18)
    doc.save(path)
    doc.close()
    return path


@pytest.mark.asyncio
async def test_pdf_protect():
    converter = PdfProtectConverter()
    pdf_path = create_sample_pdf("plain.pdf", page_count=2)

    result = await converter.convert([pdf_path], TEST_TMP_DIR, {"password": "StrongPassword99!"})
    assert os.path.exists(result.output_path)
    assert result.metadata["encrypted"] is True
    assert result.size_bytes > 0

    # Verify document is actually encrypted
    doc = fitz.open(result.output_path)
    assert doc.is_encrypted is True
    assert doc.authenticate("WrongPass") == 0
    assert doc.authenticate("StrongPassword99!") > 0
    doc.close()


@pytest.mark.asyncio
async def test_pdf_protect_requires_password():
    converter = PdfProtectConverter()
    pdf_path = create_sample_pdf("plain.pdf")
    with pytest.raises(FileValidationError):
        await converter.convert([pdf_path], TEST_TMP_DIR, {"password": ""})


@pytest.mark.asyncio
async def test_pdf_unlock():
    # First create protected PDF
    protect_conv = PdfProtectConverter()
    plain_pdf = create_sample_pdf("to_encrypt.pdf", page_count=2)
    prot_result = await protect_conv.convert([plain_pdf], TEST_TMP_DIR, {"password": "UnlockMe2026"})

    # Now unlock it
    unlock_conv = PdfUnlockConverter()
    unlock_result = await unlock_conv.convert([prot_result.output_path], TEST_TMP_DIR, {"password": "UnlockMe2026"})

    assert os.path.exists(unlock_result.output_path)
    assert unlock_result.metadata["unlocked"] is True

    # Verify unlocked document can be opened without password
    doc = open_and_validate_pdf(unlock_result.output_path)
    assert doc.is_encrypted is False
    assert doc.page_count == 2
    doc.close()


@pytest.mark.asyncio
async def test_pdf_unlock_wrong_password():
    protect_conv = PdfProtectConverter()
    plain_pdf = create_sample_pdf("to_encrypt.pdf")
    prot_result = await protect_conv.convert([plain_pdf], TEST_TMP_DIR, {"password": "CorrectPassword"})

    unlock_conv = PdfUnlockConverter()
    with pytest.raises(FileValidationError, match="Incorrect password"):
        await unlock_conv.convert([prot_result.output_path], TEST_TMP_DIR, {"password": "InvalidPassword"})


@pytest.mark.asyncio
async def test_pdf_watermark():
    converter = PdfWatermarkConverter()
    pdf_path = create_sample_pdf("watermark_target.pdf", page_count=3)

    result = await converter.convert([pdf_path], TEST_TMP_DIR, {
        "text": "CONFIDENTIAL DRAFT",
        "opacity": 0.25,
        "fontsize": 42,
        "rotation": 45,
        "color": "#ef4444"
    })

    assert os.path.exists(result.output_path)
    assert result.metadata["watermark"] == "CONFIDENTIAL DRAFT"

    doc = open_and_validate_pdf(result.output_path)
    assert doc.page_count == 3
    # Check that text is inserted
    text_content = doc[0].get_text()
    assert "CONFIDENTIAL DRAFT" in text_content
    doc.close()


@pytest.mark.asyncio
async def test_pdf_page_numbers():
    converter = PdfPageNumbersConverter()
    pdf_path = create_sample_pdf("numbers_target.pdf", page_count=4)

    result = await converter.convert([pdf_path], TEST_TMP_DIR, {
        "position": "bottom-right",
        "format": "Page {n} of {total}",
        "fontsize": 11,
        "start_number": 1
    })

    assert os.path.exists(result.output_path)
    assert result.metadata["page_count"] == 4

    doc = open_and_validate_pdf(result.output_path)
    assert doc.page_count == 4
    # First page should contain Page 1 of 4
    assert "Page 1 of 4" in doc[0].get_text()
    # Last page should contain Page 4 of 4
    assert "Page 4 of 4" in doc[3].get_text()
    doc.close()


def test_registry_contains_25_tools():
    tools = converter_registry.list_tools()
    assert len(tools) >= 25, f"Expected at least 25 tools, found {len(tools)}"
    tool_ids = [t["tool_id"] for t in tools]
    assert "pdf-protect" in tool_ids
    assert "pdf-unlock" in tool_ids
    assert "pdf-watermark" in tool_ids
    assert "pdf-page-numbers" in tool_ids
