"""
Convertly V2 — Extraction Engines & Quality Arbiter Test Suite
Validates LatticeExtractor, StreamExtractor, OCRExtractor, HybridExtractor,
and QualityArbiter multi-candidate evaluation.
"""

import pytest
import fitz  # PyMuPDF
from typing import List, Dict, Any

from app.services.engine.table_extractor.constants import EngineType, TableTopology
from app.services.engine.table_extractor.models import (
    TableCell,
    TableRow,
    TableBlock,
    ExtractionCandidate,
    ConfidenceScore,
    QualityScore,
)
from app.services.engine.table_extractor.config import TableExtractorConfig
from app.services.engine.table_extractor.engines.lattice import LatticeExtractor
from app.services.engine.table_extractor.engines.stream import StreamExtractor
from app.services.engine.table_extractor.engines.ocr import OCRExtractor
from app.services.engine.table_extractor.engines.hybrid import HybridExtractor
from app.services.engine.table_extractor.arbiter.quality_arbiter import QualityArbiter
from app.services.engine.table_extractor.container import get_default_container


def _create_test_pdf(elements: list) -> bytes:
    """
    Creates a synthetic PDF in memory with specified text and lines.
    elements: list of dicts:
      - {'type': 'text', 'pos': (x, y), 'content': str}
      - {'type': 'line', 'p1': (x0, y0), 'p2': (x1, y1)}
    """
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    for el in elements:
        if el["type"] == "text":
            page.insert_text(el["pos"], el["content"], fontsize=10)
        elif el["type"] == "line":
            page.draw_line(el["p1"], el["p2"], color=(0, 0, 0), width=1)
    b = doc.tobytes()
    doc.close()
    return b


# =====================================================================
# 1. Lattice Extractor Tests
# =====================================================================

def test_lattice_extractor_bordered_grid():
    # 3 horizontal lines and 3 vertical lines forming a 2x2 grid
    elements = [
        {"type": "line", "p1": (50, 100), "p2": (250, 100)},
        {"type": "line", "p1": (50, 150), "p2": (250, 150)},
        {"type": "line", "p1": (50, 200), "p2": (250, 200)},
        {"type": "line", "p1": (50, 100), "p2": (50, 200)},
        {"type": "line", "p1": (150, 100), "p2": (150, 200)},
        {"type": "line", "p1": (250, 100), "p2": (250, 200)},
        {"type": "text", "pos": (70, 130), "content": "Header A"},
        {"type": "text", "pos": (170, 130), "content": "Header B"},
        {"type": "text", "pos": (70, 180), "content": "$100.00"},
        {"type": "text", "pos": (170, 180), "content": "25%"},
    ]
    pdf_bytes = _create_test_pdf(elements)

    extractor = LatticeExtractor()
    assert extractor.name == "lattice"

    cand = extractor.extract_page(pdf_bytes, 0)
    assert cand.engine_type == "lattice"
    assert len(cand.tables) == 1

    table = cand.tables[0]
    assert table.row_count == 2
    assert table.col_count == 2
    assert table.rows[0].is_header is True
    assert table.rows[0].cells[0].text == "Header A"
    assert table.rows[1].cells[0].data_type == "currency"
    assert table.rows[1].cells[0].typed_value == 100.0
    assert table.rows[1].cells[1].data_type == "percentage"
    assert cand.confidence.overall > 0.8


# =====================================================================
# 2. Stream Extractor Tests
# =====================================================================

def test_stream_extractor_borderless_table():
    elements = [
        {"type": "text", "pos": (50, 100), "content": "Description"},
        {"type": "text", "pos": (200, 100), "content": "Qty"},
        {"type": "text", "pos": (350, 100), "content": "Total"},
        {"type": "text", "pos": (50, 140), "content": "Server License"},
        {"type": "text", "pos": (200, 140), "content": "2"},
        {"type": "text", "pos": (350, 140), "content": "$2,000.00"},
        {"type": "text", "pos": (50, 180), "content": "Maintenance"},
        {"type": "text", "pos": (200, 180), "content": "1"},
        {"type": "text", "pos": (350, 180), "content": "$500.00"},
    ]
    pdf_bytes = _create_test_pdf(elements)

    extractor = StreamExtractor()
    assert extractor.name == "stream"

    cand = extractor.extract_page(pdf_bytes, 0)
    assert cand.engine_type == "stream"
    assert len(cand.tables) == 1

    table = cand.tables[0]
    assert table.row_count >= 2
    assert table.col_count == 3
    assert cand.confidence.overall > 0.7


# =====================================================================
# 3. Hybrid Extractor Tests
# =====================================================================

def test_hybrid_extractor_semi_bordered_table():
    elements = [
        {"type": "line", "p1": (50, 100), "p2": (400, 100)},
        {"type": "line", "p1": (50, 140), "p2": (400, 140)},
        {"type": "line", "p1": (50, 180), "p2": (400, 180)},
        {"type": "text", "pos": (60, 125), "content": "Item"},
        {"type": "text", "pos": (250, 125), "content": "Amount"},
        {"type": "text", "pos": (60, 165), "content": "Hosting Fee"},
        {"type": "text", "pos": (250, 165), "content": "$150.00"},
    ]
    pdf_bytes = _create_test_pdf(elements)

    extractor = HybridExtractor()
    assert extractor.name == "hybrid"

    cand = extractor.extract_page(pdf_bytes, 0)
    assert cand.engine_type == "hybrid"
    assert len(cand.tables) == 1
    assert cand.tables[0].row_count >= 2


# =====================================================================
# 4. OCR Extractor Tests
# =====================================================================

def test_ocr_extractor_execution():
    elements = [
        {"type": "text", "pos": (50, 100), "content": "Col A   Col B"},
        {"type": "text", "pos": (50, 140), "content": "100     200"},
    ]
    pdf_bytes = _create_test_pdf(elements)

    extractor = OCRExtractor()
    assert extractor.name == "ocr_tsv"

    cand = extractor.extract_page(pdf_bytes, 0)
    assert cand.engine_type == "ocr_tsv"
    assert isinstance(cand.confidence, ConfidenceScore)


# =====================================================================
# 5. Quality Arbiter Tests
# =====================================================================

def test_quality_arbiter_scoring_and_penalties():
    arbiter = QualityArbiter()

    # Create candidate 1: Clean, uniform table
    cell1 = TableCell("Item", (50, 100, 150, 120), 0, 0, is_header=True)
    cell2 = TableCell("Price", (150, 100, 250, 120), 0, 1, is_header=True)
    row1 = TableRow([cell1, cell2], row_idx=0, is_header=True, bbox=(50, 100, 250, 120))

    cell3 = TableCell("Apples", (50, 125, 150, 145), 1, 0)
    cell4 = TableCell("$5.00", (150, 125, 250, 145), 1, 1, data_type="currency", typed_value=5.0)
    row2 = TableRow([cell3, cell4], row_idx=1, is_header=False, bbox=(50, 125, 250, 145))

    clean_table = TableBlock(bbox=(50, 100, 250, 145), rows=[row1, row2])
    clean_cand = ExtractionCandidate(engine_type="lattice", tables=[clean_table])

    score_clean = arbiter.score_candidate(clean_cand)
    assert score_clean.score > 0.85
    assert score_clean.is_acceptable is True
    assert len(score_clean.penalties) == 0

    # Create candidate 2: Table with pipe artifacts
    cell_pipe = TableCell("| Broken |", (50, 100, 150, 120), 0, 0)
    row_pipe = TableRow([cell_pipe], row_idx=0, bbox=(50, 100, 150, 120))
    pipe_table = TableBlock(bbox=(50, 100, 150, 120), rows=[row_pipe])
    pipe_cand = ExtractionCandidate(engine_type="ocr_tsv", tables=[pipe_table])

    score_pipe = arbiter.score_candidate(pipe_cand)
    assert "pipe_artifacts" in score_pipe.penalties
    assert score_pipe.score < score_clean.score

    # Arbitration between the two: clean candidate wins
    winner = arbiter.arbitrate([pipe_cand, clean_cand])
    assert winner.engine_type == "lattice"
    assert winner.quality.score == score_clean.score


# =====================================================================
# 6. Container Registration Tests
# =====================================================================

def test_container_engines_and_arbiter_resolution():
    container = get_default_container()

    lattice = container.get_extractor("lattice")
    assert isinstance(lattice, LatticeExtractor)

    stream = container.get_extractor("stream")
    assert isinstance(stream, StreamExtractor)

    ocr = container.get_extractor("ocr_tsv")
    assert isinstance(ocr, OCRExtractor)

    hybrid = container.get_extractor("hybrid")
    assert isinstance(hybrid, HybridExtractor)

    arbiter = container.get_arbiter()
    assert isinstance(arbiter, QualityArbiter)
