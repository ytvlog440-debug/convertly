import os
import shutil
import pytest
import fitz
from app.services.engine.pdf import (
    PdfToTxtConverter,
    PdfGrayscaleConverter,
    open_and_validate_pdf
)
from app.services.engine.registry import converter_registry

TEST_TMP_DIR = "./temp_txt_gray_tests"


@pytest.fixture(autouse=True)
def setup_teardown():
    os.makedirs(TEST_TMP_DIR, exist_ok=True)
    yield
    if os.path.exists(TEST_TMP_DIR):
        shutil.rmtree(TEST_TMP_DIR, ignore_errors=True)


def create_color_pdf(filename: str, page_count: int = 2) -> str:
    path = os.path.join(TEST_TMP_DIR, filename)
    doc = fitz.open()
    for i in range(page_count):
        page = doc.new_page(width=595, height=842)
        # Add rich colored text and rectangles
        page.draw_rect(fitz.Rect(50, 50, 250, 150), color=(1, 0, 0), fill=(0, 0.8, 0.2))
        page.insert_text((60, 100), f"Section {i + 1}: Important Project Briefing", fontsize=16, color=(0.1, 0.2, 0.9))
    doc.save(path)
    doc.close()
    return path


@pytest.mark.asyncio
async def test_pdf_to_txt():
    converter = PdfToTxtConverter()
    pdf_path = create_color_pdf("input_doc.pdf", page_count=3)

    result = await converter.convert([pdf_path], TEST_TMP_DIR, {})
    assert os.path.exists(result.output_path)
    assert result.mime_type == "text/plain; charset=utf-8"
    assert result.output_path.endswith(".txt")

    with open(result.output_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "--- Page 1 of 3 ---" in content
    assert "Section 1: Important Project Briefing" in content
    assert "--- Page 3 of 3 ---" in content
    assert result.metadata["characters"] == len(content)


@pytest.mark.asyncio
async def test_pdf_grayscale():
    converter = PdfGrayscaleConverter()
    pdf_path = create_color_pdf("color_doc.pdf", page_count=2)

    result = await converter.convert([pdf_path], TEST_TMP_DIR, {"dpi": 150})
    assert os.path.exists(result.output_path)
    assert result.mime_type == "application/pdf"
    assert result.metadata["grayscale"] is True

    # Validate resulting PDF
    doc = open_and_validate_pdf(result.output_path)
    assert doc.page_count == 2
    doc.close()


def test_registry_contains_30_tools():
    tools = converter_registry.list_tools()
    assert len(tools) >= 30, f"Expected at least 30 tools, found {len(tools)}"
    tool_ids = [t["tool_id"] for t in tools]
    assert "pdf-to-txt" in tool_ids
    assert "pdf-grayscale" in tool_ids
