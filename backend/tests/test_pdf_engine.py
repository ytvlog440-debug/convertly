import os
import shutil
import pytest
import fitz  # PyMuPDF
from app.services.engine.pdf import (
    PdfMergeConverter,
    PdfSplitConverter,
    PdfCompressConverter,
    PdfRotateConverter,
    PdfDeletePagesConverter,
    PdfExtractPagesConverter,
    PdfReorderPagesConverter,
    open_and_validate_pdf
)
from app.core.errors import FileValidationError

TEST_TMP_DIR = "./temp_pdf_tests"


@pytest.fixture(autouse=True)
def setup_teardown():
    os.makedirs(TEST_TMP_DIR, exist_ok=True)
    yield
    if os.path.exists(TEST_TMP_DIR):
        shutil.rmtree(TEST_TMP_DIR, ignore_errors=True)


def create_dummy_pdf(filename: str, page_count: int = 3, text_prefix: str = "Page") -> str:
    """Helper to generate a real, valid PDF file with text."""
    path = os.path.join(TEST_TMP_DIR, filename)
    doc = fitz.open()
    for i in range(page_count):
        page = doc.new_page(width=595, height=842)  # A4
        page.insert_text((50, 72), f"{text_prefix} {i + 1}", fontsize=20)
    doc.save(path)
    doc.close()
    return path


@pytest.mark.asyncio
async def test_pdf_merge():
    converter = PdfMergeConverter()
    pdf1 = create_dummy_pdf("doc1.pdf", page_count=2, text_prefix="Doc1")
    pdf2 = create_dummy_pdf("doc2.pdf", page_count=3, text_prefix="Doc2")

    result = await converter.convert([pdf1, pdf2], TEST_TMP_DIR, {"add_bookmarks": True})
    assert os.path.exists(result.output_path)
    assert result.mime_type == "application/pdf"
    assert result.metadata["page_count"] == 5
    assert result.metadata["documents_merged"] == 2
    assert len(result.metadata["document_details"]) == 2
    assert result.metadata["document_details"][0]["title"] == "doc1"
    assert result.metadata["document_details"][1]["title"] == "doc2"

    # Verify output structure and bookmarks
    doc = open_and_validate_pdf(result.output_path)
    assert doc.page_count == 5
    toc = doc.get_toc()
    assert len(toc) >= 2  # Bookmarks for doc1 and doc2
    assert toc[0][1] == "doc1"
    assert toc[0][2] == 1
    assert toc[1][1] == "doc2"
    assert toc[1][2] == 3
    doc.close()

    # Test duplex padding (doc2 has 3 pages which is odd, but doc1 has 2 pages which is even)
    pdf_odd1 = create_dummy_pdf("odd1.pdf", page_count=3, text_prefix="Odd1")
    pdf_odd2 = create_dummy_pdf("odd2.pdf", page_count=2, text_prefix="Odd2")
    duplex_result = await converter.convert([pdf_odd1, pdf_odd2], TEST_TMP_DIR, {"duplex_mode": True})
    # odd1 has 3 pages -> adds 1 blank page -> total 3 + 1 + 2 = 6 pages
    assert duplex_result.metadata["page_count"] == 6


@pytest.mark.asyncio
async def test_pdf_split():
    converter = PdfSplitConverter()
    pdf = create_dummy_pdf("to_split.pdf", page_count=5)

    # Split pages 2-4
    result = await converter.convert([pdf], TEST_TMP_DIR, {"range": "2-4"})
    assert os.path.exists(result.output_path)
    assert result.metadata["page_count"] == 3

    doc = open_and_validate_pdf(result.output_path)
    assert doc.page_count == 3
    doc.close()


@pytest.mark.asyncio
async def test_pdf_compress():
    converter = PdfCompressConverter()
    pdf = create_dummy_pdf("to_compress.pdf", page_count=4)

    result = await converter.convert([pdf], TEST_TMP_DIR, {"level": "recommended"})
    assert os.path.exists(result.output_path)
    assert result.size_bytes > 0
    assert "savings_ratio_percent" in result.metadata

    doc = open_and_validate_pdf(result.output_path)
    assert doc.page_count == 4
    doc.close()


@pytest.mark.asyncio
async def test_pdf_rotate():
    converter = PdfRotateConverter()
    pdf = create_dummy_pdf("to_rotate.pdf", page_count=2)

    result = await converter.convert([pdf], TEST_TMP_DIR, {"angle": 90, "scope": "all"})
    assert os.path.exists(result.output_path)

    doc = open_and_validate_pdf(result.output_path)
    assert doc[0].rotation == 90
    assert doc[1].rotation == 90
    doc.close()


@pytest.mark.asyncio
async def test_pdf_delete_pages():
    converter = PdfDeletePagesConverter()
    pdf = create_dummy_pdf("to_delete.pdf", page_count=5)

    # Delete pages 1 and 3 (1-indexed)
    result = await converter.convert([pdf], TEST_TMP_DIR, {"pages": "1, 3"})
    assert os.path.exists(result.output_path)
    assert result.metadata["remaining_pages"] == 3

    doc = open_and_validate_pdf(result.output_path)
    assert doc.page_count == 3
    doc.close()


@pytest.mark.asyncio
async def test_pdf_delete_all_pages_error():
    converter = PdfDeletePagesConverter()
    pdf = create_dummy_pdf("to_delete_all.pdf", page_count=2)

    # Attempt to delete all pages should fail
    with pytest.raises(FileValidationError, match="Cannot delete all pages"):
        await converter.convert([pdf], TEST_TMP_DIR, {"pages": "1-2"})


@pytest.mark.asyncio
async def test_pdf_extract_pages():
    converter = PdfExtractPagesConverter()
    pdf = create_dummy_pdf("to_extract.pdf", page_count=6)

    result = await converter.convert([pdf], TEST_TMP_DIR, {"pages": "1, 4-5"})
    assert os.path.exists(result.output_path)
    assert result.metadata["extracted_page_count"] == 3

    doc = open_and_validate_pdf(result.output_path)
    assert doc.page_count == 3
    doc.close()


@pytest.mark.asyncio
async def test_pdf_reorder_pages():
    converter = PdfReorderPagesConverter()
    pdf = create_dummy_pdf("to_reorder.pdf", page_count=3)

    # Reorder as page 3, 1, 2
    result = await converter.convert([pdf], TEST_TMP_DIR, {"order": [3, 1, 2]})
    assert os.path.exists(result.output_path)

    doc = open_and_validate_pdf(result.output_path)
    assert doc.page_count == 3
    # Check text content of first page is indeed from page 3
    page1_text = doc[0].get_text()
    assert "Page 3" in page1_text
    doc.close()
