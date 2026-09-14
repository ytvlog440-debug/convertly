"""
Convertly V2 — Document Intelligence & Dynamic Router Test Suite
Validates document type detection, genre classification, topology analysis,
profile generation, and routing decisions.
"""

import pytest
import fitz  # PyMuPDF
from typing import Dict, Any

from app.services.engine.table_extractor.constants import (
    DocumentType,
    TableTopology,
    DocumentGenre,
    EngineType,
)
from app.services.engine.table_extractor.models import (
    DocumentProfile,
    RoutingDecision,
)
from app.services.engine.table_extractor.config import TableExtractorConfig
from app.services.engine.table_extractor.intelligence.classifier import (
    DocumentClassifier,
    GENRE_KEYWORD_MAP,
)
from app.services.engine.table_extractor.intelligence.router import EngineRouter
from app.services.engine.table_extractor.container import get_default_container, ExtractorContainer


def _create_mock_pdf(page_specs: list) -> bytes:
    """
    Helper to synthesize test PDF bytes with customizable text, vector lines, and raster images.
    page_spec: dict with keys:
      - 'text': str
      - 'h_lines': list of (x0, y0, x1, y1)
      - 'v_lines': list of (x0, y0, x1, y1)
      - 'add_image': bool
    """
    doc = fitz.open()
    for spec in page_specs:
        page = doc.new_page(width=595, height=842)

        # Draw text
        text = spec.get("text", "")
        if text:
            page.insert_text((50, 50), text, fontsize=11)

        # Draw horizontal lines
        for x0, y0, x1, y1 in spec.get("h_lines", []):
            page.draw_line((x0, y0), (x1, y1), color=(0, 0, 0), width=1)

        # Draw vertical lines
        for x0, y0, x1, y1 in spec.get("v_lines", []):
            page.draw_line((x0, y0), (x1, y1), color=(0, 0, 0), width=1)

        # Insert dummy raster image if requested
        if spec.get("add_image", False):
            # Create a 50x50 white pixmap and insert as image
            pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 50, 50), 1)
            page.insert_image(fitz.Rect(50, 100, 200, 250), pixmap=pix)

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


# =====================================================================
# 1. Document Type Detection Tests
# =====================================================================

def test_native_text_document_classification():
    classifier = DocumentClassifier()
    pdf_bytes = _create_mock_pdf([
        {
            "text": "This is native digital vector text rendered directly inside the PDF document.",
            "h_lines": [(50, 100, 400, 100), (50, 150, 400, 150)],
            "v_lines": [(50, 100, 50, 150), (400, 100, 400, 150)],
        }
    ])

    profile = classifier.profile_document(pdf_bytes)
    assert profile.total_pages == 1
    assert profile.doc_type == DocumentType.NATIVE_TEXT.value
    assert not profile.has_scanned_pages
    assert profile.has_ruling_lines


def test_scanned_document_classification():
    classifier = DocumentClassifier()
    # Scanned PDF: has image with virtually no text
    pdf_bytes = _create_mock_pdf([
        {
            "text": "",
            "add_image": True,
        }
    ])

    profile = classifier.profile_document(pdf_bytes)
    assert profile.total_pages == 1
    assert profile.doc_type == DocumentType.SCANNED.value
    assert profile.has_scanned_pages


def test_mixed_document_classification():
    classifier = DocumentClassifier()
    # Page 1: Native text, Page 2: Scanned image
    pdf_bytes = _create_mock_pdf([
        {
            "text": "Page 1 contains lots of searchable digital text and table figures.",
        },
        {
            "text": "",
            "add_image": True,
        }
    ])

    profile = classifier.profile_document(pdf_bytes)
    assert profile.total_pages == 2
    assert profile.doc_type == DocumentType.MIXED.value
    assert profile.has_scanned_pages


# =====================================================================
# 2. Topology Detection Tests
# =====================================================================

def test_topology_lattice_detection():
    classifier = DocumentClassifier()
    # 3 H-lines and 3 V-lines forms a lattice grid
    pdf_bytes = _create_mock_pdf([
        {
            "text": "Header 1 Header 2 Header 3\nData 1 Data 2 Data 3",
            "h_lines": [(50, 100, 300, 100), (50, 140, 300, 140), (50, 180, 300, 180)],
            "v_lines": [(50, 100, 50, 180), (170, 100, 170, 180), (300, 100, 300, 180)],
        }
    ])

    profile = classifier.profile_document(pdf_bytes)
    assert profile.page_profiles[0]["topology"] == TableTopology.LATTICE.value


def test_topology_semi_bordered_detection():
    classifier = DocumentClassifier()
    # Only horizontal lines (no vertical lines)
    pdf_bytes = _create_mock_pdf([
        {
            "text": "Col A Col B Col C\n10 20 30",
            "h_lines": [(50, 100, 300, 100), (50, 140, 300, 140)],
            "v_lines": [],
        }
    ])

    profile = classifier.profile_document(pdf_bytes)
    assert profile.page_profiles[0]["topology"] == TableTopology.SEMI_BORDERED.value


def test_topology_stream_detection():
    classifier = DocumentClassifier()
    # No ruling lines at all
    pdf_bytes = _create_mock_pdf([
        {
            "text": "Col A    Col B    Col C\n10       20       30",
            "h_lines": [],
            "v_lines": [],
        }
    ])

    profile = classifier.profile_document(pdf_bytes)
    assert profile.page_profiles[0]["topology"] == TableTopology.STREAM.value
    assert not profile.has_ruling_lines


# =====================================================================
# 3. Genre Classification Tests
# =====================================================================

def test_genre_classification_invoice():
    classifier = DocumentClassifier()
    pdf_bytes = _create_mock_pdf([
        {
            "text": "INVOICE #INV-2024-001\nBill To: ACME Corp\nDue Date: 2024-10-31\nSubtotal: $1,200.00\nTotal Due: $1,200.00",
        }
    ])
    profile = classifier.profile_document(pdf_bytes)
    assert profile.genre == DocumentGenre.INVOICE.value


def test_genre_classification_bank_statement():
    classifier = DocumentClassifier()
    pdf_bytes = _create_mock_pdf([
        {
            "text": "Account Number: 123456789\nOpening Balance: $5,000.00\nClosing Balance: $4,200.00\nWithdrawal: -$800.00\nDeposit: $0.00",
        }
    ])
    profile = classifier.profile_document(pdf_bytes)
    assert profile.genre == DocumentGenre.BANK_STATEMENT.value


def test_genre_classification_balance_sheet():
    classifier = DocumentClassifier()
    pdf_bytes = _create_mock_pdf([
        {
            "text": "Consolidated Balance Sheet\nCurrent Assets: $100,000\nTotal Assets: $250,000\nCurrent Liabilities: $40,000\nShareholder Equity: $210,000",
        }
    ])
    profile = classifier.profile_document(pdf_bytes)
    assert profile.genre == DocumentGenre.BALANCE_SHEET.value


def test_genre_classification_generic_fallback():
    classifier = DocumentClassifier()
    pdf_bytes = _create_mock_pdf([
        {
            "text": "General information notes and miscellaneous comments without financial tags.",
        }
    ])
    profile = classifier.profile_document(pdf_bytes)
    assert profile.genre == DocumentGenre.GENERIC_TABLE.value


# =====================================================================
# 4. Dynamic Router Tests
# =====================================================================

def test_router_scanned_document():
    router = EngineRouter()
    profile = DocumentProfile(
        total_pages=2,
        doc_type=DocumentType.SCANNED.value,
        has_scanned_pages=True,
        page_profiles=[
            {"page_idx": 0, "is_scanned": True, "topology": "stream"},
            {"page_idx": 1, "is_scanned": True, "topology": "stream"},
        ]
    )

    decision = router.route(profile)
    assert decision.primary_engine == EngineType.OCR_TSV.value
    assert decision.fallback_engine == EngineType.STREAM.value
    assert decision.ocr_required is True
    assert decision.page_routes[0] == EngineType.OCR_TSV.value


def test_router_lattice_document():
    router = EngineRouter()
    profile = DocumentProfile(
        total_pages=1,
        doc_type=DocumentType.NATIVE_TEXT.value,
        has_ruling_lines=True,
        page_profiles=[
            {"page_idx": 0, "is_scanned": False, "topology": TableTopology.LATTICE.value}
        ]
    )

    decision = router.route(profile)
    assert decision.primary_engine == EngineType.LATTICE.value
    assert decision.fallback_engine == EngineType.STREAM.value
    assert decision.ocr_required is False
    assert decision.page_routes[0] == EngineType.LATTICE.value


def test_router_semi_bordered_document():
    router = EngineRouter()
    profile = DocumentProfile(
        total_pages=1,
        doc_type=DocumentType.NATIVE_TEXT.value,
        has_ruling_lines=True,
        page_profiles=[
            {"page_idx": 0, "is_scanned": False, "topology": TableTopology.SEMI_BORDERED.value}
        ]
    )

    decision = router.route(profile)
    assert decision.primary_engine == EngineType.HYBRID.value
    assert decision.fallback_engine == EngineType.STREAM.value
    assert decision.page_routes[0] == EngineType.HYBRID.value


def test_router_borderless_stream_document():
    router = EngineRouter()
    profile = DocumentProfile(
        total_pages=1,
        doc_type=DocumentType.NATIVE_TEXT.value,
        has_ruling_lines=False,
        page_profiles=[
            {"page_idx": 0, "is_scanned": False, "topology": TableTopology.STREAM.value}
        ]
    )

    decision = router.route(profile)
    assert decision.primary_engine == EngineType.STREAM.value
    assert decision.fallback_engine == EngineType.HYBRID.value
    assert decision.page_routes[0] == EngineType.STREAM.value


def test_router_streaming_page_threshold():
    router = EngineRouter()
    config = TableExtractorConfig()
    config.memory.streaming_page_threshold = 50

    # Under threshold
    p_small = DocumentProfile(total_pages=49, page_profiles=[])
    assert router.route(p_small, config).streaming_mode is False

    # At or above threshold
    p_large = DocumentProfile(total_pages=50, page_profiles=[])
    assert router.route(p_large, config).streaming_mode is True


# =====================================================================
# 5. Container Integration Tests
# =====================================================================

def test_container_default_resolution():
    container = get_default_container()
    classifier = container.get_classifier()
    assert isinstance(classifier, DocumentClassifier)

    router = container.get_router()
    assert isinstance(router, EngineRouter)
