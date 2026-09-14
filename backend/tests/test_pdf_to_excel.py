import os
import shutil
import pytest
import openpyxl
import fitz  # PyMuPDF

from app.services.engine.pdf_to_excel import (
    PdfToExcelConverter,
    detect_cell_type,
)
from app.services.engine.registry import converter_registry
from app.core.errors import FileValidationError

TEST_TMP_DIR = "./temp_pdf_excel_tests"


@pytest.fixture(autouse=True)
def setup_teardown():
    os.makedirs(TEST_TMP_DIR, exist_ok=True)
    yield
    if os.path.exists(TEST_TMP_DIR):
        shutil.rmtree(TEST_TMP_DIR, ignore_errors=True)


def create_sample_pdf_with_table(path: str) -> str:
    """Create a PDF with drawn table lines and text cells."""
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)  # Standard Letter

    # Title
    page.insert_text((50, 50), "Quarterly Financial Statement", fontsize=16)

    # Draw table borders
    # 4 columns, 4 rows
    x_coords = [50, 180, 300, 420, 550]
    y_coords = [100, 130, 160, 190, 220]

    for y in y_coords:
        page.draw_line((x_coords[0], y), (x_coords[-1], y))
    for x in x_coords:
        page.draw_line((x, y_coords[0]), (x, y_coords[-1]))

    # Headers
    page.insert_text((55, 120), "Department", fontsize=11)
    page.insert_text((185, 120), "Q1 Revenue", fontsize=11)
    page.insert_text((305, 120), "Growth %", fontsize=11)
    page.insert_text((425, 120), "Status", fontsize=11)

    # Row 1
    page.insert_text((55, 150), "Enterprise Cloud", fontsize=10)
    page.insert_text((185, 150), "$1,450,200.50", fontsize=10)
    page.insert_text((305, 150), "18.5%", fontsize=10)
    page.insert_text((425, 150), "Active", fontsize=10)

    # Row 2
    page.insert_text((55, 180), "Consumer SaaS", fontsize=10)
    page.insert_text((185, 180), "$850,000.00", fontsize=10)
    page.insert_text((305, 180), "24.0%", fontsize=10)
    page.insert_text((425, 180), "Active", fontsize=10)

    # Row 3
    page.insert_text((55, 210), "Professional Svcs", fontsize=10)
    page.insert_text((185, 210), "$320,500.25", fontsize=10)
    page.insert_text((305, 210), "5.2%", fontsize=10)
    page.insert_text((425, 210), "Pending", fontsize=10)

    doc.save(path)
    doc.close()
    return path


def test_registry_registration():
    """Verify converter is registered in the global registry."""
    converter = converter_registry.get("pdf-to-excel")
    assert converter is not None
    assert converter.tool_id == "pdf-to-excel"
    assert "pdf" in converter.supported_inputs
    assert converter.output_extension == "xlsx"


def test_data_type_detection():
    """Test smart cell type inference for currency, percentages, integers, and floats."""
    val, num_format = detect_cell_type("$1,450,200.50")
    assert val == 1450200.50
    assert "$" in (num_format or "")

    val, num_format = detect_cell_type("18.5%")
    assert pytest.approx(val, 0.001) == 0.185
    assert "%" in (num_format or "")

    val, _ = detect_cell_type("42")
    assert val == 42

    val, _ = detect_cell_type("1,234.56")
    assert val == 1234.56

    val, _ = detect_cell_type("(500.00)")
    assert val == -500.00

    val, _ = detect_cell_type("Regular Text String")
    assert val == "Regular Text String"


@pytest.mark.asyncio
async def test_pdf_to_excel_conversion():
    """Verify full conversion pipeline from PDF to XLSX."""
    pdf_path = os.path.join(TEST_TMP_DIR, "sample_financial.pdf")
    create_sample_pdf_with_table(pdf_path)

    converter = PdfToExcelConverter()
    output_dir = os.path.join(TEST_TMP_DIR, "output")
    os.makedirs(output_dir, exist_ok=True)

    result = await converter.convert(
        input_paths=[pdf_path],
        output_dir=output_dir,
        options={"output_format": "xlsx", "ocr": False}
    )

    assert os.path.exists(result.output_path)
    assert result.output_path.endswith(".xlsx")
    assert result.size_bytes > 0

    # Verify workbook validity with openpyxl
    wb = openpyxl.load_workbook(result.output_path)
    assert len(wb.sheetnames) >= 1

    ws = wb.active
    assert ws is not None

    # Check that rows were populated
    rows = list(ws.iter_rows(values_only=True))
    assert len(rows) >= 1

    wb.close()


def test_advanced_cell_type_and_currency_detection():
    """Verify European decimal formatting, currencies, and XML sanitization."""
    # Euros with European dot/comma notation
    val, fmt = detect_cell_type("€ 1.250,50")
    assert val == 1250.50
    assert "€" in (fmt or "")

    # British Pounds
    val, fmt = detect_cell_type("£450.75")
    assert val == 450.75
    assert "£" in (fmt or "")

    # Japanese Yen
    val, fmt = detect_cell_type("¥12,000")
    assert val == 12000
    assert "¥" in (fmt or "")

    # European pure number with comma decimals
    val, fmt = detect_cell_type("123,45")
    assert val == 123.45

    # Negative accounting notation with comma thousands
    val, fmt = detect_cell_type("(2,500.00)")
    assert val == -2500.00
    assert "#,##0.00" in (fmt or "")

    # Control character sanitization
    val, _ = detect_cell_type("Clean\x00\x08Text")
    assert val == "CleanText"


@pytest.mark.asyncio
async def test_multi_page_pdf_consolidation():
    """Verify that multi-page PDFs with matching table structures generate a consolidated sheet."""
    pdf_path = os.path.join(TEST_TMP_DIR, "multi_page_statement.pdf")
    doc = fitz.open()

    for page_idx in range(2):
        page = doc.new_page(width=612, height=792)
        page.insert_text((50, 50), f"Financial Statement - Page {page_idx + 1}", fontsize=14)

        # Draw 3-column table
        x_coords = [50, 200, 380, 550]
        y_coords = [100, 130, 160, 190]
        for y in y_coords:
            page.draw_line((x_coords[0], y), (x_coords[-1], y))
        for x in x_coords:
            page.draw_line((x, y_coords[0]), (x, y_coords[-1]))

        # Header
        page.insert_text((55, 120), "Account Code", fontsize=10)
        page.insert_text((205, 120), "Description", fontsize=10)
        page.insert_text((385, 120), "Amount", fontsize=10)

        # Row 1
        page.insert_text((55, 150), f"ACT-{page_idx}01", fontsize=10)
        page.insert_text((205, 150), f"Service Ledger {page_idx + 1}A", fontsize=10)
        page.insert_text((385, 150), "$1,200.00", fontsize=10)

        # Row 2
        page.insert_text((55, 180), f"ACT-{page_idx}02", fontsize=10)
        page.insert_text((205, 180), f"Service Ledger {page_idx + 1}B", fontsize=10)
        page.insert_text((385, 180), "$2,450.50", fontsize=10)

    doc.save(pdf_path)
    doc.close()

    converter = PdfToExcelConverter()
    output_dir = os.path.join(TEST_TMP_DIR, "multi_output")
    os.makedirs(output_dir, exist_ok=True)

    result = await converter.convert(
        input_paths=[pdf_path],
        output_dir=output_dir,
        options={"output_format": "xlsx", "ocr": False}
    )

    wb = openpyxl.load_workbook(result.output_path)
    # Check that consolidated sheet and per-page sheets exist
    assert "All Data (Consolidated)" in wb.sheetnames
    assert "Page 1" in wb.sheetnames
    assert "Page 2" in wb.sheetnames

    # Check that consolidated sheet has rows from both pages
    ws_cons = wb["All Data (Consolidated)"]
    cons_rows = list(ws_cons.iter_rows(values_only=True))
    # 1 header + 2 rows from page 1 + 2 rows from page 2 = 5 rows
    assert len(cons_rows) >= 5

    wb.close()


def test_api_tools_endpoint_includes_pdf_to_excel(client):
    """Verify that /api/v1/tools lists pdf-to-excel with correct metadata."""
    res = client.get("/api/v1/tools")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    tool_ids = [t["tool_id"] for t in data["data"]]
    assert "pdf-to-excel" in tool_ids

    pdf_to_excel_tool = next(t for t in data["data"] if t["tool_id"] == "pdf-to-excel")
    assert pdf_to_excel_tool["name"] == "PDF to Excel"
    assert "pdf" in pdf_to_excel_tool["supported_inputs"]
    assert pdf_to_excel_tool["output_extension"] == "xlsx"


@pytest.mark.asyncio
async def test_enterprise_lattice_merged_cells():
    """Verify that multi-cell spans (colspan) generate real openpyxl ws.merge_cells."""
    pdf_path = os.path.join(TEST_TMP_DIR, "merged_cell_timetable.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    # Title
    page.insert_text((50, 40), "Weekly Schedule & Conference Timetable", fontsize=14)

    # Grid:
    # Horizontals across x=50 to 450
    y_lines = [80, 110, 140]
    for y in y_lines:
        page.draw_line((50, y), (450, y))

    # Verticals:
    # Row 0: Header 1 spans x=50 to 310 (cols 1+2), Col 3 is x=310 to 450
    # Left and right outer borders
    page.draw_line((50, 80), (50, 140))
    page.draw_line((450, 80), (450, 140))
    # Mid line between col 2 and 3 exists in both rows
    page.draw_line((310, 80), (310, 140))
    # Mid line between col 1 and 2 ONLY exists in row 1 (y=110 to 140)
    page.draw_line((180, 110), (180, 140))

    # Row 0: Merged cell
    page.insert_text((80, 100), "Morning General Assembly", fontsize=11)
    page.insert_text((330, 100), "Auditorium A", fontsize=11)

    # Row 1: Split cells
    page.insert_text((60, 130), "Keynote", fontsize=10)
    page.insert_text((190, 130), "Workshops", fontsize=10)
    page.insert_text((330, 130), "Breakout Rooms", fontsize=10)

    doc.save(pdf_path)
    doc.close()

    converter = PdfToExcelConverter()
    output_dir = os.path.join(TEST_TMP_DIR, "merged_output")
    os.makedirs(output_dir, exist_ok=True)

    result = await converter.convert(
        input_paths=[pdf_path],
        output_dir=output_dir,
        options={"output_format": "xlsx", "ocr": False}
    )

    wb = openpyxl.load_workbook(result.output_path)
    ws = wb.active
    assert ws is not None

    # Check that openpyxl merged cells were registered
    merged_ranges = list(ws.merged_cells.ranges)
    assert len(merged_ranges) >= 1

    wb.close()


@pytest.mark.asyncio
async def test_enterprise_invoice_extraction():
    """Verify that invoice top metadata, line items, and bottom totals are extracted."""
    pdf_path = os.path.join(TEST_TMP_DIR, "enterprise_invoice.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    # Header Metadata
    page.insert_text((50, 50), "TAX INVOICE", fontsize=16)
    page.insert_text((50, 80), "Invoice Number: INV-98231", fontsize=10)
    page.insert_text((50, 95), "Invoice Date: 2026-09-14", fontsize=10)
    page.insert_text((50, 110), "Bill To: Convertly Enterprises Ltd", fontsize=10)

    # Line Item Table
    x_coords = [50, 250, 350, 450, 550]
    y_coords = [150, 180, 210, 240]
    for y in y_coords:
        page.draw_line((x_coords[0], y), (x_coords[-1], y))
    for x in x_coords:
        page.draw_line((x, y_coords[0]), (x, y_coords[-1]))

    # Table Header
    page.insert_text((55, 170), "Item Description", fontsize=10)
    page.insert_text((255, 170), "Hours", fontsize=10)
    page.insert_text((355, 170), "Rate", fontsize=10)
    page.insert_text((455, 170), "Total Amount", fontsize=10)

    # Table Row 1
    page.insert_text((55, 200), "Cloud Engineering", fontsize=10)
    page.insert_text((255, 200), "40", fontsize=10)
    page.insert_text((355, 200), "$150.00", fontsize=10)
    page.insert_text((455, 200), "$6,000.00", fontsize=10)

    # Table Row 2
    page.insert_text((55, 230), "Security Audit", fontsize=10)
    page.insert_text((255, 230), "20", fontsize=10)
    page.insert_text((355, 230), "$180.00", fontsize=10)
    page.insert_text((455, 230), "$3,600.00", fontsize=10)

    # Footer Totals
    page.insert_text((350, 270), "Subtotal: $9,600.00", fontsize=10)
    page.insert_text((350, 285), "Tax: $960.00", fontsize=10)
    page.insert_text((350, 300), "Total Due: $10,560.00", fontsize=11)

    doc.save(pdf_path)
    doc.close()

    converter = PdfToExcelConverter()
    output_dir = os.path.join(TEST_TMP_DIR, "invoice_output")
    os.makedirs(output_dir, exist_ok=True)

    result = await converter.convert(
        input_paths=[pdf_path],
        output_dir=output_dir,
        options={"output_format": "xlsx", "ocr": False}
    )

    wb = openpyxl.load_workbook(result.output_path)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()

    all_cell_values = [str(cell) for row in rows for cell in row if cell is not None]
    # Check that metadata, items, and totals are all present in the output
    assert any("INV-98231" in v or "Invoice Number" in v for v in all_cell_values)
    assert any("Cloud Engineering" in v for v in all_cell_values)
    assert any("Total Due" in v or "10560" in v or "10,560" in v for v in all_cell_values)


@pytest.mark.asyncio
async def test_enterprise_sparse_bank_statement_drift():
    """Verify that sparse rows with empty debit/credit cells do not shift columns left."""
    pdf_path = os.path.join(TEST_TMP_DIR, "bank_statement.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    # Statement Header
    page.insert_text((50, 50), "Commercial Checking Account Statement", fontsize=14)

    # 4-Column borderless stream table:
    # Date (x=50), Description (x=160), Withdrawal (x=330), Deposit (x=430)
    # Header
    page.insert_text((50, 100), "Date", fontsize=10)
    page.insert_text((160, 100), "Description", fontsize=10)
    page.insert_text((330, 100), "Withdrawal", fontsize=10)
    page.insert_text((430, 100), "Deposit", fontsize=10)

    # Row 1: Deposit only (Withdrawal is intentionally missing)
    page.insert_text((50, 130), "2026-09-01", fontsize=10)
    page.insert_text((160, 130), "Client Wire Transfer", fontsize=10)
    # x=330 is empty
    page.insert_text((430, 130), "$5,000.00", fontsize=10)

    # Row 2: Withdrawal only (Deposit is intentionally missing)
    page.insert_text((50, 160), "2026-09-02", fontsize=10)
    page.insert_text((160, 160), "Office Rent ACH", fontsize=10)
    page.insert_text((330, 160), "$2,200.00", fontsize=10)
    # x=430 is empty

    doc.save(pdf_path)
    doc.close()

    converter = PdfToExcelConverter()
    output_dir = os.path.join(TEST_TMP_DIR, "bank_output")
    os.makedirs(output_dir, exist_ok=True)

    result = await converter.convert(
        input_paths=[pdf_path],
        output_dir=output_dir,
        options={"output_format": "xlsx", "ocr": False}
    )

    wb = openpyxl.load_workbook(result.output_path)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()

    # Find the rows with 'Client Wire Transfer' and 'Office Rent ACH'
    deposit_row = next((r for r in rows if r and any(c and "Client Wire Transfer" in str(c) for c in r)), None)
    withdrawal_row = next((r for r in rows if r and any(c and "Office Rent ACH" in str(c) for c in r)), None)

    print("RESULT METADATA:", result.metadata)
    print("ALL ROWS IN WORKSHEET:", rows)
    assert deposit_row is not None
    assert withdrawal_row is not None

    # In deposit_row:
    # Column 0: Date, Column 1: Description, Column 2: Withdrawal (None or empty), Column 3: Deposit ($5,000.00)
    # Ensure $5000 is NOT in column index 2 (which would be left-drift into Withdrawal)!
    non_empty = [c for c in deposit_row if c is not None and str(c).strip() != '']
    assert len(non_empty) == 3  # Date, Description, Deposit
    # Deposit amount must be in the deposit column position (col index >= 3)
    val_5000 = next(c for c in deposit_row if c and ("5000" in str(c) or "5,000" in str(c)))
    idx_5000 = deposit_row.index(val_5000)
    assert idx_5000 >= 3, f"Left-drift detected: $5,000 was placed at column index {idx_5000} instead of Deposit column"


def test_enterprise_text_normalizer_and_kerning():
    """Verify font kerning reconstruction and ASCII pipe scrubbing."""
    from app.services.engine.table_extractor.text_normalizer import (
        reconstruct_words_with_kerning,
        scrub_ascii_table_artifacts,
        detect_indentation_level
    )

    # ASCII pipe scrubbing
    clean_pipe = scrub_ascii_table_artifacts("| Line Item | Quantity | Subtotal |")
    assert "|" not in clean_pipe
    assert "Line Item" in clean_pipe

    clean_border = scrub_ascii_table_artifacts("+-----------+----------+----------+")
    assert clean_border == ""

    # Indentation calculation
    assert detect_indentation_level("Cash and Cash Equivalents", col_left=75.0, table_left=50.0) >= 1
    assert detect_indentation_level("Top Level Header", col_left=50.0, table_left=50.0) == 0


@pytest.mark.asyncio
async def test_enterprise_balance_sheet_indentation():
    """Verify that hierarchical balance sheet line items preserve cell indent level in Excel."""
    pdf_path = os.path.join(TEST_TMP_DIR, "balance_sheet.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 40), "Consolidated Balance Sheet", fontsize=14)

    # Horizontal rules
    for y in [80, 110, 140, 170, 200]:
        page.draw_line((50, y), (500, y))
    # Vertical outer rules
    for x in [50, 350, 500]:
        page.draw_line((x, 80), (x, 200))

    # Header
    page.insert_text((55, 100), "Asset Category", fontsize=10)
    page.insert_text((360, 100), "Current Year", fontsize=10)

    # Row 1: Top level category (no indent)
    page.insert_text((55, 130), "Current Assets", fontsize=10)
    page.insert_text((360, 130), "$1,250,000.00", fontsize=10)

    # Row 2: Child item (indented by 20 points)
    page.insert_text((75, 160), "Cash & Cash Equivalents", fontsize=10)
    page.insert_text((360, 160), "$850,000.00", fontsize=10)

    # Row 3: Sub-child item (indented by 40 points)
    page.insert_text((95, 190), "Treasury Money Market", fontsize=10)
    page.insert_text((360, 190), "$400,000.00", fontsize=10)

    doc.save(pdf_path)
    doc.close()

    converter = PdfToExcelConverter()
    output_dir = os.path.join(TEST_TMP_DIR, "balance_output")
    os.makedirs(output_dir, exist_ok=True)

    result = await converter.convert(
        input_paths=[pdf_path],
        output_dir=output_dir,
        options={"output_format": "xlsx", "ocr": False}
    )

    wb = openpyxl.load_workbook(result.output_path)
    ws = wb.active

    # Find the cell with 'Cash & Cash Equivalents'
    indented_cell = None
    for row in ws.iter_rows():
        for cell in row:
            if cell.value and "Cash & Cash Equivalents" in str(cell.value):
                indented_cell = cell
                break

    assert indented_cell is not None
    # Verify openpyxl alignment indent is preserved
    assert indented_cell.alignment.indent >= 1, f"Expected indent >= 1, got {indented_cell.alignment.indent}"

    wb.close()




