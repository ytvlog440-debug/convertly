"""
Convertly V2 — Cell Reconstruction & Deterministic Repair Test Suite
Validates broken row multi-line merger, split word stitching, ghost row pruning,
merged cell span discovery, hierarchical indentation, and container integration.
"""

import pytest
from app.services.engine.table_extractor.models import (
    TableCell,
    TableRow,
    TableBlock,
)
from app.services.engine.table_extractor.config import TableExtractorConfig
from app.services.engine.table_extractor.reconstruction.reconstructor import CellReconstructor
from app.services.engine.table_extractor.container import get_default_container


# =====================================================================
# 1. Split Word Repair Tests
# =====================================================================

def test_repair_split_words():
    reconstructor = CellReconstructor()

    cell1 = TableCell(
        text="Monthly compen-\nsation package",
        bbox=(50, 100, 150, 130),
        row_idx=0,
        col_idx=0,
    )
    cell2 = TableCell(
        text="Standard trans-\naction record",
        bbox=(150, 100, 250, 130),
        row_idx=0,
        col_idx=1,
    )
    row = TableRow(cells=[cell1, cell2], row_idx=0)
    table = TableBlock(bbox=(50, 100, 250, 130), rows=[row])

    repaired = reconstructor.repair_split_words(table)
    assert repaired.rows[0].cells[0].text == "Monthly compensation package"
    assert repaired.rows[0].cells[1].text == "Standard transaction record"


# =====================================================================
# 2. Broken Row Multi-Line Merger Tests
# =====================================================================

def test_repair_broken_rows_invoice_wrapping():
    reconstructor = CellReconstructor()

    # Header row
    h1 = TableCell("Description", (50, 100, 250, 120), 0, 0, is_header=True)
    h2 = TableCell("Qty", (250, 100, 300, 120), 0, 1, is_header=True)
    h3 = TableCell("Total", (300, 100, 400, 120), 0, 2, is_header=True)
    row_hdr = TableRow([h1, h2, h3], row_idx=0, bbox=(50, 100, 400, 120), is_header=True)

    # Parent row with data
    c1 = TableCell("Enterprise Database Cluster", (50, 125, 250, 140), 1, 0)
    c2 = TableCell("2", (250, 125, 300, 140), 1, 1, data_type="number", typed_value=2)
    c3 = TableCell("$10,000.00", (300, 125, 400, 140), 1, 2, data_type="currency", typed_value=10000.0)
    row_parent = TableRow([c1, c2, c3], row_idx=1, bbox=(50, 125, 400, 140))

    # Orphan row with wrapped description continuation and empty quantities
    w1 = TableCell("with high-availability multi-region replication", (50, 142, 250, 155), 2, 0)
    w2 = TableCell("", (250, 142, 300, 155), 2, 1)
    w3 = TableCell("", (300, 142, 400, 155), 2, 2)
    row_orphan = TableRow([w1, w2, w3], row_idx=2, bbox=(50, 142, 400, 155))

    table = TableBlock(bbox=(50, 100, 400, 155), rows=[row_hdr, row_parent, row_orphan])

    repaired = reconstructor.repair_broken_rows(table)
    # The orphan row must be merged into the parent row, leaving 2 rows (header + parent)
    assert repaired.row_count == 2
    merged_parent = repaired.rows[1]
    assert "Enterprise Database Cluster with high-availability multi-region replication" in merged_parent.cells[0].text
    assert merged_parent.cells[1].text == "2"
    assert merged_parent.cells[2].text == "$10,000.00"
    # Row index should be re-indexed
    assert merged_parent.row_idx == 1


# =====================================================================
# 3. Ghost Empty Row Pruning Tests
# =====================================================================

def test_strip_empty_rows():
    reconstructor = CellReconstructor()

    row1 = TableRow([TableCell("Row 1", (50, 100, 150, 120), 0, 0)], row_idx=0)
    row_empty = TableRow([TableCell("", (50, 125, 150, 140), 1, 0)], row_idx=1)
    row2 = TableRow([TableCell("Row 2", (50, 145, 150, 160), 2, 0)], row_idx=2)

    table = TableBlock(bbox=(50, 100, 150, 160), rows=[row1, row_empty, row2])

    repaired = reconstructor.strip_empty_rows(table)
    assert repaired.row_count == 2
    assert repaired.rows[0].cells[0].text == "Row 1"
    assert repaired.rows[1].cells[0].text == "Row 2"
    assert repaired.rows[1].row_idx == 1


# =====================================================================
# 4. Merged Cell Span Discovery Tests
# =====================================================================

def test_detect_merged_spans():
    reconstructor = CellReconstructor()

    # Row 0: Full width merged title spanning across 3 normal columns (width 300)
    title_cell = TableCell("Consolidated Financial Report", (50, 50, 350, 80), 0, 0, is_header=True)
    row_title = TableRow([title_cell], row_idx=0, bbox=(50, 50, 350, 80))

    # Row 1: 3 regular columns (width ~100 each)
    c1 = TableCell("Quarter", (50, 85, 150, 110), 1, 0)
    c2 = TableCell("Revenue", (150, 85, 250, 110), 1, 1)
    c3 = TableCell("Net Income", (250, 85, 350, 110), 1, 2)
    row_data = TableRow([c1, c2, c3], row_idx=1, bbox=(50, 85, 350, 110))

    table = TableBlock(bbox=(50, 50, 350, 110), rows=[row_title, row_data])

    repaired = reconstructor.detect_merged_spans(table)
    assert repaired.has_merged_cells is True
    assert repaired.rows[0].cells[0].colspan >= 2


# =====================================================================
# 5. Indentation Level Detection Tests
# =====================================================================

def test_detect_indentation_levels():
    reconstructor = CellReconstructor()
    config = TableExtractorConfig()
    config.thresholds.indent_step = 8.0  # 8 pts per indent

    # Financial hierarchy:
    # Assets (x0=50.0) -> indent 0
    #   Current Assets (x0=58.0) -> indent 1
    #     Cash and Cash Equivalents (x0=66.0) -> indent 2
    r1 = TableRow([TableCell("Assets", (50.0, 100, 200, 115), 0, 0)], row_idx=0)
    r2 = TableRow([TableCell("Current Assets", (58.0, 120, 200, 135), 1, 0)], row_idx=1)
    r3 = TableRow([TableCell("Cash and Cash Equivalents", (66.0, 140, 200, 155), 2, 0)], row_idx=2)

    table = TableBlock(bbox=(50.0, 100, 200, 155), rows=[r1, r2, r3])

    repaired = reconstructor.detect_indentation_levels(table, config)
    assert repaired.rows[0].cells[0].indent_level == 0
    assert repaired.rows[1].cells[0].indent_level == 1
    assert repaired.rows[2].cells[0].indent_level == 2


# =====================================================================
# 6. Complete Reconstruction Pipeline Tests
# =====================================================================

def test_full_reconstruction_pipeline():
    reconstructor = CellReconstructor()

    cell1 = TableCell("Soft-\nware License", (50, 100, 200, 120), 0, 0)
    cell2 = TableCell("$1,000.00", (200, 100, 300, 120), 0, 1, data_type="currency")
    row1 = TableRow([cell1, cell2], row_idx=0, bbox=(50, 100, 300, 120))

    cell3 = TableCell("(1 Year Subscription)", (50, 122, 200, 135), 1, 0)
    cell4 = TableCell("", (200, 122, 300, 135), 1, 1)
    row2 = TableRow([cell3, cell4], row_idx=1, bbox=(50, 122, 300, 135))

    empty_row = TableRow([TableCell("", (50, 138, 200, 150), 2, 0), TableCell("", (200, 138, 300, 150), 2, 1)], row_idx=2)

    table = TableBlock(bbox=(50, 100, 300, 150), rows=[row1, row2, empty_row])

    result = reconstructor.reconstruct(table)

    # 1. Hyphen repaired ("Software License")
    # 2. Wrapped continuation merged ("Software License (1 Year Subscription)")
    # 3. Empty row pruned
    assert result.row_count == 1
    assert "Software License (1 Year Subscription)" in result.rows[0].cells[0].text
    assert result.rows[0].cells[1].text == "$1,000.00"


# =====================================================================
# 7. Container Registration Test
# =====================================================================

def test_container_reconstructor_resolution():
    container = get_default_container()
    rec = container.get_reconstructor()
    assert isinstance(rec, CellReconstructor)
