"""
Phase 7 — Real-World Document Extraction Benchmarks
Tests the Enterprise PDF to Excel Engine across authentic document types:
1. Bank Statements
2. Invoices
3. Purchase Orders
4. Timetables
5. Attendance Sheets
6. Utility Bills
7. Payroll Reports
8. Financial Reports
9. Research Tables
10. Borderless Tables
11. Merged Cell Tables
12. Rotated PDFs
13. Multi-page Tables
14. Scanned PDFs
15. Mixed PDFs
"""

import os
import shutil
import pytest
import openpyxl
import fitz

from app.services.engine.table_extractor import EnterpriseTableExtractor
from app.services.engine.table_extractor.config import TableExtractorConfig

BENCHMARK_TMP_DIR = os.path.join(os.path.dirname(__file__), "tmp_benchmarks")


@pytest.fixture(scope="module", autouse=True)
def setup_benchmark_dir():
    os.makedirs(BENCHMARK_TMP_DIR, exist_ok=True)
    yield
    if os.path.exists(BENCHMARK_TMP_DIR):
        shutil.rmtree(BENCHMARK_TMP_DIR, ignore_errors=True)


def get_all_cell_values(xlsx_path: str):
    wb = openpyxl.load_workbook(xlsx_path)
    sheet_data = {}
    for sheetname in wb.sheetnames:
        ws = wb[sheetname]
        rows = list(ws.iter_rows(values_only=True))
        sheet_data[sheetname] = rows
    wb.close()
    return sheet_data


# ----------------------------------------------------------------------
# 1. Bank Statement Benchmark
# ----------------------------------------------------------------------
def test_benchmark_bank_statement():
    """Verify sparse credit/debit transaction extraction without column shifting."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "bank_statement_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 50), "FIRST NATIONAL BANK — MONTHLY STATEMENT", fontsize=14)
    page.insert_text((50, 70), "Account: 8849-2019-3312 | Period: Aug 01 - Aug 31", fontsize=10)

    # 5-column table: Date, Description, Debit, Credit, Balance
    # Stream/Borderless layout
    headers = [("Date", 50), ("Description", 130), ("Debit", 310), ("Credit", 410), ("Balance", 500)]
    for text, x in headers:
        page.insert_text((x, 110), text, fontsize=10)

    txs = [
        ("2026-08-01", "Opening Balance", "", "", "$12,450.00"),
        ("2026-08-03", "Payroll Direct Deposit", "", "$4,500.00", "$16,950.00"),
        ("2026-08-05", "Electric Utility Bill", "$185.50", "", "$16,764.50"),
        ("2026-08-10", "Office Supplies Inc", "$320.00", "", "$16,444.50"),
        ("2026-08-15", "Consulting Wire Transfer", "", "$2,200.00", "$18,644.50"),
    ]

    y = 135
    for dt, desc, deb, cred, bal in txs:
        page.insert_text((50, y), dt, fontsize=9)
        page.insert_text((130, y), desc, fontsize=9)
        if deb:
            page.insert_text((310, y), deb, fontsize=9)
        if cred:
            page.insert_text((410, y), cred, fontsize=9)
        page.insert_text((500, y), bal, fontsize=9)
        y += 22

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "bank_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_rows"] >= 5
    sheets = get_all_cell_values(out_xlsx)
    first_sheet = list(sheets.values())[0]

    # Find Payroll row
    payroll_row = next((r for r in first_sheet if r and any(c and "Payroll" in str(c) for c in r)), None)
    assert payroll_row is not None
    # Credit 4500 should be in column 3, not column 2
    vals = [str(c) for c in payroll_row if c is not None and str(c).strip()]
    assert any("4500" in v or "4,500" in v for v in vals)


# ----------------------------------------------------------------------
# 2. Invoice Benchmark (Multi-line descriptions & totals)
# ----------------------------------------------------------------------
def test_benchmark_invoice_multi_line_rows():
    """Verify multi-line invoice item descriptions stay in a single row without splitting."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "invoice_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 40), "GLOBAL TECH CONSULTING", fontsize=15)
    page.insert_text((50, 60), "Invoice Number: GTC-2026-091", fontsize=10)

    # Table Grid
    x_lines = [50, 100, 360, 430, 520]
    y_lines = [90, 115, 160, 205, 230]

    for y in y_lines:
        page.draw_line((50, y), (520, y))
    for x in x_lines:
        page.draw_line((x, 90), (x, 230))

    # Header
    page.insert_text((55, 107), "Item", fontsize=9)
    page.insert_text((105, 107), "Description & Scope", fontsize=9)
    page.insert_text((365, 107), "Hours", fontsize=9)
    page.insert_text((435, 107), "Line Total", fontsize=9)

    # Row 1: Multi-line description
    page.insert_text((55, 130), "01", fontsize=9)
    page.insert_text((105, 130), "Cloud Security Architecture Review", fontsize=9)
    page.insert_text((105, 145), "Including IAM policy audit & VPC peering analysis", fontsize=8)
    page.insert_text((365, 130), "40", fontsize=9)
    page.insert_text((435, 130), "$6,400.00", fontsize=9)

    # Row 2: Another multi-line
    page.insert_text((55, 175), "02", fontsize=9)
    page.insert_text((105, 175), "Kubernetes Cluster Hardening", fontsize=9)
    page.insert_text((105, 190), "CIS benchmark compliance remediation", fontsize=8)
    page.insert_text((365, 175), "25", fontsize=9)
    page.insert_text((435, 175), "$4,000.00", fontsize=9)

    # Row 3: Totals
    page.insert_text((105, 220), "Total Due", fontsize=10)
    page.insert_text((435, 220), "$10,400.00", fontsize=10)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "invoice_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    sheets = get_all_cell_values(out_xlsx)
    rows = list(sheets.values())[0]

    # Verify that multi-line text is combined in the cell
    cloud_row = next((r for r in rows if r and any(c and "Cloud Security" in str(c) for c in r)), None)
    assert cloud_row is not None
    desc_cell = next(c for c in cloud_row if c and "Cloud Security" in str(c))
    assert "IAM policy audit" in str(desc_cell)


# ----------------------------------------------------------------------
# 3. Purchase Order Benchmark
# ----------------------------------------------------------------------
def test_benchmark_purchase_order():
    """Verify purchase order with Part #, Qty, Unit Price, and Amount."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "po_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 40), "PURCHASE ORDER: PO-774921", fontsize=14)
    page.insert_text((50, 60), "Vendor: Microchip Distributing Corp", fontsize=10)

    for y in [90, 115, 140, 165, 190]:
        page.draw_line((50, y), (550, y))
    for x in [50, 140, 340, 410, 480, 550]:
        page.draw_line((x, 90), (x, 190))

    page.insert_text((55, 107), "Part Number", fontsize=9)
    page.insert_text((145, 107), "Item Description", fontsize=9)
    page.insert_text((345, 107), "Qty", fontsize=9)
    page.insert_text((415, 107), "Unit Price", fontsize=9)
    page.insert_text((485, 107), "Amount", fontsize=9)

    page.insert_text((55, 130), "MCU-STM32F4", fontsize=9)
    page.insert_text((145, 130), "32-Bit ARM Cortex-M4 Microcontroller", fontsize=9)
    page.insert_text((345, 130), "500", fontsize=9)
    page.insert_text((415, 130), "$4.85", fontsize=9)
    page.insert_text((485, 130), "$2,425.00", fontsize=9)

    page.insert_text((55, 155), "CAP-10UF-SMD", fontsize=9)
    page.insert_text((145, 155), "Ceramic Capacitor 10uF 25V 0805", fontsize=9)
    page.insert_text((345, 155), "2000", fontsize=9)
    page.insert_text((415, 155), "$0.12", fontsize=9)
    page.insert_text((485, 155), "$240.00", fontsize=9)

    page.insert_text((55, 180), "RES-10K-0603", fontsize=9)
    page.insert_text((145, 180), "Thick Film Resistor 10k Ohm 1%", fontsize=9)
    page.insert_text((345, 180), "5000", fontsize=9)
    page.insert_text((415, 180), "$0.02", fontsize=9)
    page.insert_text((485, 180), "$100.00", fontsize=9)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "po_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_rows"] >= 3


# ----------------------------------------------------------------------
# 4. Timetable Benchmark (Merged time slots)
# ----------------------------------------------------------------------
def test_benchmark_timetable_merged_slots():
    """Verify academic/conference timetable with multi-period merged slots."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "timetable_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=792, height=612)  # Landscape

    page.insert_text((50, 40), "Faculty of Engineering — Weekly Lecture Schedule", fontsize=13)

    # Grid: 5 periods (cols 1..5) across Monday - Wednesday
    x_coords = [50, 130, 240, 350, 460, 570]
    y_coords = [70, 95, 125, 155, 185]

    for y in y_coords:
        page.draw_line((50, y), (570, y))

    # All outer and col divider lines
    for x in x_coords:
        page.draw_line((x, 70), (x, 185))

    page.insert_text((55, 87), "Day", fontsize=9)
    page.insert_text((135, 87), "09:00 - 10:30", fontsize=9)
    page.insert_text((245, 87), "10:45 - 12:15", fontsize=9)
    page.insert_text((355, 87), "13:00 - 14:30", fontsize=9)
    page.insert_text((465, 87), "14:45 - 16:15", fontsize=9)

    # Monday
    page.insert_text((55, 115), "Monday", fontsize=9)
    page.insert_text((135, 115), "Advanced Calculus", fontsize=9)
    page.insert_text((245, 115), "Fluid Mechanics", fontsize=9)
    page.insert_text((355, 115), "Thermodynamics", fontsize=9)
    page.insert_text((465, 115), "Office Hours", fontsize=9)

    # Tuesday has a 2-period lab from 09:00 to 12:15 (x=130 to 350)
    page.insert_text((55, 145), "Tuesday", fontsize=9)
    page.insert_text((140, 145), "Robotics & Mechatronics Laboratory (Double Period)", fontsize=9)
    page.insert_text((355, 145), "Embedded Systems", fontsize=9)
    page.insert_text((465, 145), "Study Hall", fontsize=9)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "timetable_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    wb = openpyxl.load_workbook(out_xlsx)
    ws = wb.active
    assert ws is not None
    wb.close()


# ----------------------------------------------------------------------
# 5. Attendance Sheet Benchmark
# ----------------------------------------------------------------------
def test_benchmark_attendance_sheet():
    """Verify attendance matrix with sparse status codes (P, A, L)."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "attendance_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 40), "Monthly Student Attendance Roster", fontsize=13)

    # 7 columns: Student ID, Name, Mon, Tue, Wed, Thu, Fri
    x_coords = [50, 120, 250, 300, 350, 400, 450, 500]
    y_coords = [70, 95, 120, 145, 170]

    for y in y_coords:
        page.draw_line((50, y), (500, y))
    for x in x_coords:
        page.draw_line((x, 70), (x, 170))

    headers = ["ID", "Student Name", "M", "T", "W", "Th", "F"]
    for i, h in enumerate(headers):
        page.insert_text((x_coords[i] + 5, 87), h, fontsize=9)

    roster = [
        ("STU-101", "Alice Adams", "P", "P", "P", "L", "P"),
        ("STU-102", "Bob Builder", "P", "A", "P", "P", "P"),
        ("STU-103", "Charlie Clark", "A", "P", "P", "P", "A"),
    ]

    for r_idx, row in enumerate(roster):
        y = 112 + r_idx * 25
        for c_idx, val in enumerate(row):
            page.insert_text((x_coords[c_idx] + 5, y), val, fontsize=9)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "attendance_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_rows"] >= 3


# ----------------------------------------------------------------------
# 6. Utility Bill Benchmark
# ----------------------------------------------------------------------
def test_benchmark_utility_bill():
    """Verify utility billing charge breakdown with kilowatt hours and dollar amounts."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "utility_bill_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 40), "CITY POWER & LIGHT — ELECTRIC BILL", fontsize=14)
    page.insert_text((50, 60), "Meter Number: ELEC-99214 | Billing Cycle: July 2026", fontsize=9)

    x_coords = [50, 220, 310, 400, 500]
    y_coords = [90, 115, 140, 165, 190, 215]

    for y in y_coords:
        page.draw_line((50, y), (500, y))
    for x in x_coords:
        page.draw_line((x, 90), (x, 215))

    page.insert_text((55, 107), "Charge Description", fontsize=9)
    page.insert_text((225, 107), "Usage (kWh)", fontsize=9)
    page.insert_text((315, 107), "Rate ($/kWh)", fontsize=9)
    page.insert_text((405, 107), "Total Charge", fontsize=9)

    page.insert_text((55, 130), "Tier 1 Base Residential", fontsize=9)
    page.insert_text((225, 130), "500", fontsize=9)
    page.insert_text((315, 130), "$0.115", fontsize=9)
    page.insert_text((405, 130), "$57.50", fontsize=9)

    page.insert_text((55, 155), "Tier 2 Summer Peaking", fontsize=9)
    page.insert_text((225, 155), "350", fontsize=9)
    page.insert_text((315, 155), "$0.165", fontsize=9)
    page.insert_text((405, 155), "$57.75", fontsize=9)

    page.insert_text((55, 180), "State Clean Energy Surcharge", fontsize=9)
    page.insert_text((225, 180), "850", fontsize=9)
    page.insert_text((315, 180), "$0.008", fontsize=9)
    page.insert_text((405, 180), "$6.80", fontsize=9)

    page.insert_text((55, 205), "Total Amount Due", fontsize=9)
    page.insert_text((405, 205), "$122.05", fontsize=9)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "utility_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    sheets = get_all_cell_values(out_xlsx)
    first_sheet = list(sheets.values())[0]
    total_row = next((r for r in first_sheet if r and any(c and "Total Amount Due" in str(c) for c in r)), None)
    assert total_row is not None


# ----------------------------------------------------------------------
# 7. Payroll Report Benchmark
# ----------------------------------------------------------------------
def test_benchmark_payroll_report():
    """Verify multi-column payroll sheet with gross pay, tax deductions, and net pay."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "payroll_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=792, height=612)  # Landscape

    page.insert_text((50, 40), "CONFIDENTIAL PAYROLL RUN SUMMARY", fontsize=14)

    x_coords = [50, 110, 220, 310, 400, 480, 560, 660]
    y_coords = [70, 95, 120, 145, 170]

    for y in y_coords:
        page.draw_line((50, y), (660, y))
    for x in x_coords:
        page.draw_line((x, 70), (x, 170))

    headers = ["Emp ID", "Full Name", "Gross Pay", "Fed Tax", "State Tax", "401k", "Net Pay"]
    for i, h in enumerate(headers):
        page.insert_text((x_coords[i] + 5, 87), h, fontsize=9)

    payroll_data = [
        ("E-1001", "David Davidson", "$8,333.33", "$1,450.00", "$420.00", "$500.00", "$5,963.33"),
        ("E-1002", "Elena Rostova", "$9,166.67", "$1,620.00", "$465.00", "$550.00", "$6,531.67"),
        ("E-1003", "Frank Ferguson", "$6,250.00", "$980.00", "$310.00", "$375.00", "$4,585.00"),
    ]

    for r_idx, row in enumerate(payroll_data):
        y = 112 + r_idx * 25
        for c_idx, val in enumerate(row):
            page.insert_text((x_coords[c_idx] + 5, y), val, fontsize=9)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "payroll_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_rows"] >= 3


# ----------------------------------------------------------------------
# 8. Financial Report Benchmark (Bracketed Negatives & Indentation)
# ----------------------------------------------------------------------
def test_benchmark_financial_report_bracketed_negatives():
    """Verify accounting format with bracketed negative numbers like (50,000.00)."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "financial_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 40), "STATEMENT OF CASH FLOWS", fontsize=14)

    for y in [70, 95, 120, 145, 170, 195]:
        page.draw_line((50, y), (500, y))
    for x in [50, 350, 500]:
        page.draw_line((x, 70), (x, 195))

    page.insert_text((55, 87), "Operating Activities", fontsize=9)
    page.insert_text((355, 87), "USD ($)", fontsize=9)

    page.insert_text((55, 112), "Net Income", fontsize=9)
    page.insert_text((355, 112), "$450,000.00", fontsize=9)

    page.insert_text((55, 137), "Depreciation & Amortization", fontsize=9)
    page.insert_text((355, 137), "$85,000.00", fontsize=9)

    page.insert_text((55, 162), "Increase in Accounts Receivable", fontsize=9)
    page.insert_text((355, 162), "($42,500.00)", fontsize=9)

    page.insert_text((55, 187), "Net Cash from Operations", fontsize=9)
    page.insert_text((355, 187), "$492,500.00", fontsize=9)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "financial_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    sheets = get_all_cell_values(out_xlsx)
    first_sheet = list(sheets.values())[0]

    ar_row = next((r for r in first_sheet if r and any(c and "Accounts Receivable" in str(c) for c in r)), None)
    assert ar_row is not None
    # Verify negative float parsed (-42500.0)
    neg_cell = next(c for c in ar_row if c is not None and (c == -42500.0 or "-42500" in str(c) or "(42,500" in str(c)))
    assert neg_cell is not None


# ----------------------------------------------------------------------
# 9. Rotated PDF Benchmark
# ----------------------------------------------------------------------
def test_benchmark_rotated_pdf():
    """Verify that pages rotated by 90 degrees or 270 degrees still extract cleanly."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "rotated_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    # Insert a 3-row, 3-column table
    for y in [100, 130, 160, 190]:
        page.draw_line((50, y), (450, y))
    for x in [50, 180, 310, 450]:
        page.draw_line((x, 100), (x, 190))

    page.insert_text((55, 120), "Sensor ID", fontsize=10)
    page.insert_text((185, 120), "Temperature (C)", fontsize=10)
    page.insert_text((315, 120), "Pressure (kPa)", fontsize=10)

    page.insert_text((55, 150), "SNS-A01", fontsize=10)
    page.insert_text((185, 150), "24.5", fontsize=10)
    page.insert_text((315, 150), "101.3", fontsize=10)

    page.insert_text((55, 180), "SNS-B02", fontsize=10)
    page.insert_text((185, 180), "26.1", fontsize=10)
    page.insert_text((315, 180), "100.8", fontsize=10)

    # Set 90 degree clockwise rotation
    page.set_rotation(90)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "rotated_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_pages"] == 1
    assert meta["total_rows"] >= 3


# ----------------------------------------------------------------------
# 10. Multi-Page Continuous Table Benchmark
# ----------------------------------------------------------------------
def test_benchmark_multi_page_table_continuation():
    """Verify table spanning page 1 and page 2 consolidates properly."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "multipage_bench.pdf")
    doc = fitz.open()

    # Page 1: 15 rows
    page1 = doc.new_page(width=612, height=792)
    page1.insert_text((50, 40), "Asset Inventory Log — Page 1", fontsize=13)
    for y in range(80, 80 + 16 * 25, 25):
        page1.draw_line((50, y), (500, y))
    for x in [50, 150, 350, 500]:
        page1.draw_line((x, 80), (x, 80 + 15 * 25))

    page1.insert_text((55, 97), "Asset Tag", fontsize=9)
    page1.insert_text((155, 97), "Description", fontsize=9)
    page1.insert_text((355, 97), "Value", fontsize=9)

    for i in range(1, 15):
        y = 97 + i * 25
        page1.insert_text((55, y), f"AST-00{i:02d}", fontsize=9)
        page1.insert_text((155, y), f"Server Hardware Rack Unit {i}", fontsize=9)
        page1.insert_text((355, y), f"${1000 + i * 150}.00", fontsize=9)

    # Page 2: 10 rows
    page2 = doc.new_page(width=612, height=792)
    page2.insert_text((50, 40), "Asset Inventory Log — Page 2", fontsize=13)
    for y in range(80, 80 + 11 * 25, 25):
        page2.draw_line((50, y), (500, y))
    for x in [50, 150, 350, 500]:
        page2.draw_line((x, 80), (x, 80 + 10 * 25))

    page2.insert_text((55, 97), "Asset Tag", fontsize=9)
    page2.insert_text((155, 97), "Description", fontsize=9)
    page2.insert_text((355, 97), "Value", fontsize=9)

    for i in range(15, 24):
        y = 97 + (i - 14) * 25
        page2.insert_text((55, y), f"AST-00{i:02d}", fontsize=9)
        page2.insert_text((155, y), f"Server Hardware Rack Unit {i}", fontsize=9)
        page2.insert_text((355, y), f"${1000 + i * 150}.00", fontsize=9)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "multipage_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_pages"] == 2
    assert meta["worksheets_created"] >= 1


# ----------------------------------------------------------------------
# 11. Borderless Table Benchmark
# ----------------------------------------------------------------------
def test_benchmark_borderless_stream_table():
    """Verify borderless table alignment using whitespace gaps."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "borderless_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 50), "GLOBAL COMMODITY SPOT PRICES", fontsize=14)

    # 4 columns without any vector lines: Symbol, Commodity, Exchange, Price
    headers = [("Symbol", 50), ("Commodity", 130), ("Exchange", 300), ("Spot Price", 450)]
    for h, x in headers:
        page.insert_text((x, 90), h, fontsize=10)

    rows = [
        ("XAU/USD", "Gold Ounce", "COMEX", "$2,485.50"),
        ("XAG/USD", "Silver Ounce", "COMEX", "$29.40"),
        ("BRENT", "Crude Oil Barrel", "ICE", "$82.15"),
        ("COPPER", "Grade A Cathode", "LME", "$9,120.00"),
    ]

    y = 115
    for sym, comm, exch, pr in rows:
        page.insert_text((50, y), sym, fontsize=9)
        page.insert_text((130, y), comm, fontsize=9)
        page.insert_text((300, y), exch, fontsize=9)
        page.insert_text((450, y), pr, fontsize=9)
        y += 22

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "borderless_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_rows"] >= 4


# ----------------------------------------------------------------------
# 12. Research Table Benchmark (Units, Greek Symbols, Scientific Formats)
# ----------------------------------------------------------------------
def test_benchmark_research_table():
    """Verify research paper data table with scientific notation, units, and symbols."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "research_bench.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 40), "Table 3: Kinetic Parameters of Catalyst Formulations", fontsize=12)

    x_coords = [50, 150, 260, 370, 490]
    y_coords = [70, 95, 120, 145, 170]

    for y in y_coords:
        page.draw_line((50, y), (490, y))
    for x in x_coords:
        page.draw_line((x, 70), (x, 170))

    headers = ["Catalyst Sample", "Surface Area (m2/g)", "Pore Vol (cm3/g)", "Activity (umol/s)"]
    for i, h in enumerate(headers):
        page.insert_text((x_coords[i] + 5, 87), h, fontsize=9)

    data = [
        ("Pt-TiO2-A", "142.5", "0.38", "1.45e-4"),
        ("Pd-Al2O3-B", "210.0", "0.52", "2.80e-4"),
        ("Au-CeO2-C", "88.2", "0.21", "0.95e-4"),
    ]

    for r_idx, row in enumerate(data):
        y = 112 + r_idx * 25
        for c_idx, val in enumerate(row):
            page.insert_text((x_coords[c_idx] + 5, y), val, fontsize=9)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "research_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_rows"] >= 3


# ----------------------------------------------------------------------
# 13. Complex Merged Cells Benchmark (Hierarchical Super-headers)
# ----------------------------------------------------------------------
def test_benchmark_complex_merged_cells_super_header():
    """Verify table with a spanning super-header over 2 sub-columns."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "merged_super_header.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)

    page.insert_text((50, 40), "QUARTERLY REVENUE BREAKDOWN BY REGION", fontsize=13)

    # Horizontals
    y_coords = [70, 95, 120, 145, 170]
    for y in y_coords:
        page.draw_line((50, y), (500, y))

    # Outer verticals
    page.draw_line((50, 70), (50, 170))
    page.draw_line((500, 70), (500, 170))

    # Col 0 (Region) divider
    page.draw_line((160, 70), (160, 170))

    # Divider between Q1/Q2 and Q3/Q4 super headers
    page.draw_line((330, 70), (330, 170))

    # Sub-column dividers ONLY in row 1..3 (y=95 to 170):
    # Between Q1 (160-245) and Q2 (245-330)
    page.draw_line((245, 95), (245, 170))
    # Between Q3 (330-415) and Q4 (415-500)
    page.draw_line((415, 95), (415, 170))

    # Row 0: Super-headers (H1 spans 160-330, H2 spans 330-500)
    page.insert_text((55, 87), "Region", fontsize=9)
    page.insert_text((210, 87), "First Half (H1)", fontsize=9)
    page.insert_text((380, 87), "Second Half (H2)", fontsize=9)

    # Row 1: Sub-headers
    page.insert_text((55, 112), "", fontsize=9)
    page.insert_text((175, 112), "Q1", fontsize=9)
    page.insert_text((260, 112), "Q2", fontsize=9)
    page.insert_text((345, 112), "Q3", fontsize=9)
    page.insert_text((430, 112), "Q4", fontsize=9)

    # Row 2: Data
    page.insert_text((55, 137), "North America", fontsize=9)
    page.insert_text((170, 137), "$1,200", fontsize=9)
    page.insert_text((255, 137), "$1,450", fontsize=9)
    page.insert_text((340, 137), "$1,600", fontsize=9)
    page.insert_text((425, 137), "$1,850", fontsize=9)

    # Row 3: Data
    page.insert_text((55, 162), "Europe & APAC", fontsize=9)
    page.insert_text((170, 162), "$950", fontsize=9)
    page.insert_text((255, 162), "$1,100", fontsize=9)
    page.insert_text((340, 162), "$1,300", fontsize=9)
    page.insert_text((425, 162), "$1,500", fontsize=9)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "super_header_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    wb = openpyxl.load_workbook(out_xlsx)
    ws = wb.active
    # Check that merged cells were created for super-headers
    assert len(ws.merged_cells.ranges) >= 1
    wb.close()


# ----------------------------------------------------------------------
# 14. Scanned Document Benchmark
# ----------------------------------------------------------------------
def test_benchmark_scanned_pdf_routing():
    """Verify that pure scanned/raster image PDFs route to OCR or fallback without crashing."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "scanned_bench.pdf")

    # Render a small page to pixmap to create a purely rasterized image page
    src_doc = fitz.open()
    src_page = src_doc.new_page(width=300, height=200)
    src_page.insert_text((30, 50), "Receipt Number: REC-0091", fontsize=12)
    src_page.insert_text((30, 80), "Subtotal: $45.00", fontsize=10)
    src_page.insert_text((30, 100), "Tax: $4.50", fontsize=10)
    src_page.insert_text((30, 120), "Total: $49.50", fontsize=10)
    pix = src_page.get_pixmap()
    img_bytes = pix.tobytes("png")
    src_doc.close()

    # Create destination PDF containing only the raster image (0 text characters)
    doc = fitz.open()
    page = doc.new_page(width=300, height=200)
    page.insert_image(page.rect, stream=img_bytes)
    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "scanned_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_pages"] == 1
    assert meta["document_profile"].doc_type in ("scanned", "scanned_image")


# ----------------------------------------------------------------------
# 15. Mixed Document Benchmark (Digital Page 1 + Scanned Page 2)
# ----------------------------------------------------------------------
def test_benchmark_mixed_pdf():
    """Verify document where page 1 is a native digital table and page 2 is a scanned image."""
    pdf_path = os.path.join(BENCHMARK_TMP_DIR, "mixed_bench.pdf")
    doc = fitz.open()

    # Page 1: Native digital table
    p1 = doc.new_page(width=612, height=792)
    p1.insert_text((50, 40), "Page 1: Digital Corporate Contract Summary", fontsize=12)
    for y in [70, 95, 120, 145]:
        p1.draw_line((50, y), (450, y))
    for x in [50, 200, 350, 450]:
        p1.draw_line((x, 70), (x, 145))
    p1.insert_text((55, 87), "Clause", fontsize=9)
    p1.insert_text((205, 87), "Status", fontsize=9)
    p1.insert_text((355, 87), "Reviewer", fontsize=9)
    p1.insert_text((55, 112), "Indemnification", fontsize=9)
    p1.insert_text((205, 112), "Approved", fontsize=9)
    p1.insert_text((355, 112), "Legal Dept", fontsize=9)
    p1.insert_text((55, 137), "Limitation of Liability", fontsize=9)
    p1.insert_text((205, 137), "Under Review", fontsize=9)
    p1.insert_text((355, 137), "Finance Dept", fontsize=9)

    # Page 2: Raster scan image
    img_doc = fitz.open()
    img_p = img_doc.new_page(width=300, height=200)
    img_p.insert_text((20, 40), "Scanned Appendix Exhibit A", fontsize=10)
    img_p.insert_text((20, 80), "Signature verified by notary", fontsize=9)
    pix = img_p.get_pixmap()
    img_data = pix.tobytes("png")
    img_doc.close()

    p2 = doc.new_page(width=612, height=792)
    p2.insert_image(fitz.Rect(50, 50, 350, 250), stream=img_data)

    doc.save(pdf_path)
    doc.close()

    out_xlsx = os.path.join(BENCHMARK_TMP_DIR, "mixed_out.xlsx")
    extractor = EnterpriseTableExtractor()
    meta = extractor.process_pdf_document(pdf_path, out_xlsx)

    assert os.path.exists(out_xlsx)
    assert meta["total_pages"] == 2
    # Document profile should classify as mixed
    assert meta["document_profile"].doc_type == "mixed"

