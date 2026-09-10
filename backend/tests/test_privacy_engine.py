import os
import shutil
import pytest
import fitz
from app.services.engine.pdf import (
    PdfRedactConverter,
    PdfFlattenConverter,
    PdfScrubMetadataConverter,
    open_and_validate_pdf
)
from app.services.engine.registry import converter_registry
from app.core.errors import FileValidationError

TEST_TMP_DIR = "./temp_privacy_tests"


@pytest.fixture(autouse=True)
def setup_teardown():
    os.makedirs(TEST_TMP_DIR, exist_ok=True)
    yield
    if os.path.exists(TEST_TMP_DIR):
        shutil.rmtree(TEST_TMP_DIR, ignore_errors=True)


def create_sample_pdf_with_sensitive_data(filename: str) -> str:
    path = os.path.join(TEST_TMP_DIR, filename)
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 80), "Client Name: Alice Smith", fontsize=14)
    page.insert_text((50, 110), "Social Security Number: 987-65-4321", fontsize=14)
    page.insert_text((50, 140), "Credit Card: 4111-2222-3333-4444", fontsize=14)
    page.insert_text((50, 170), "Public Information: Standard Terms and Conditions", fontsize=14)
    doc.set_metadata({
        "title": "Confidential Tax Statement",
        "author": "Secret Financial Officer",
        "subject": "Private Banking",
        "keywords": "Banking, Tax, Secret"
    })
    doc.save(path)
    doc.close()
    return path


@pytest.mark.asyncio
async def test_pdf_redact():
    converter = PdfRedactConverter()
    pdf_path = create_sample_pdf_with_sensitive_data("to_redact.pdf")

    result = await converter.convert([pdf_path], TEST_TMP_DIR, {
        "keywords": "987-65-4321, 4111-2222-3333-4444, Alice Smith"
    })

    assert os.path.exists(result.output_path)
    assert result.metadata["redactions_applied"] >= 3

    # Verify that redacted text is completely absent from the parsed text stream
    doc = open_and_validate_pdf(result.output_path)
    extracted = doc[0].get_text()
    assert "987-65-4321" not in extracted
    assert "4111-2222-3333-4444" not in extracted
    assert "Alice Smith" not in extracted
    # Non-sensitive text should still remain
    assert "Public Information" in extracted
    doc.close()


@pytest.mark.asyncio
async def test_pdf_redact_requires_keywords():
    converter = PdfRedactConverter()
    pdf_path = create_sample_pdf_with_sensitive_data("to_redact.pdf")
    with pytest.raises(FileValidationError):
        await converter.convert([pdf_path], TEST_TMP_DIR, {"keywords": ""})


@pytest.mark.asyncio
async def test_pdf_flatten():
    converter = PdfFlattenConverter()
    pdf_path = create_sample_pdf_with_sensitive_data("to_flatten.pdf")

    # Add an interactive annotation
    doc = fitz.open(pdf_path)
    page = doc[0]
    page.add_text_annot((100, 100), "Review comment pending approval")
    doc.saveIncr()
    doc.close()

    result = await converter.convert([pdf_path], TEST_TMP_DIR, {})
    assert os.path.exists(result.output_path)
    assert result.metadata["flattened"] is True

    # Verify output is valid
    res_doc = open_and_validate_pdf(result.output_path)
    assert res_doc.page_count == 1
    res_doc.close()


@pytest.mark.asyncio
async def test_pdf_scrub_metadata():
    converter = PdfScrubMetadataConverter()
    pdf_path = create_sample_pdf_with_sensitive_data("to_scrub.pdf")

    # Ensure metadata exists before scrub
    before_doc = fitz.open(pdf_path)
    assert before_doc.metadata.get("author") == "Secret Financial Officer"
    before_doc.close()

    result = await converter.convert([pdf_path], TEST_TMP_DIR, {})
    assert os.path.exists(result.output_path)
    assert result.metadata["metadata_scrubbed"] is True

    # Verify metadata is wiped clean
    after_doc = fitz.open(result.output_path)
    meta = after_doc.metadata
    assert not meta.get("author")
    assert not meta.get("title")
    assert not meta.get("keywords")
    after_doc.close()


def test_registry_contains_28_tools():
    tools = converter_registry.list_tools()
    assert len(tools) >= 28, f"Expected at least 28 tools, found {len(tools)}"
    tool_ids = [t["tool_id"] for t in tools]
    assert "pdf-redact" in tool_ids
    assert "pdf-flatten" in tool_ids
    assert "pdf-scrub-metadata" in tool_ids
