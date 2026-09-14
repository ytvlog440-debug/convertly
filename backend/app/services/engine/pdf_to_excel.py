"""
Convertly V2 — PDF to Excel Converter Engine
Extracts tables, financial data, and structured content from PDF documents
into editable Excel (XLSX) spreadsheets with smart type detection.

Pipeline:
  1. PyMuPDF validates and opens the PDF
  2. Scanned PDF auto-detection via text density heuristic
  3. OCR fallback via pytesseract for scanned pages
  4. pdfplumber (primary) + tabula-py (secondary) table extraction
  5. Smart data type detection (currency, dates, percentages, numbers)
  6. openpyxl XLSX generation with formatting and auto-width columns
"""

import io
import os
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

import fitz  # PyMuPDF
import openpyxl
from openpyxl.styles import Font, Alignment, numbers
from openpyxl.utils import get_column_letter

from app.core.errors import FileValidationError, ConversionExecutionError
from app.core.logging import logger
from app.services.engine.base import BaseConverter, ConversionResult
from app.services.engine.pdf import open_and_validate_pdf


# ---------------------------------------------------------------------------
# Data Type Detection Utilities
# ---------------------------------------------------------------------------

# Currency symbols and patterns
_CURRENCY_SYMBOLS = r'[\$\u20ac\u00a3\u00a5\u20b9\u20a9\u20ab\u20aa\u20ba\u20b1\u20bf]'
_CURRENCY_PATTERN = re.compile(
    rf'^\s*{_CURRENCY_SYMBOLS}\s*[\-\(]?\s*[\d,]+\.?\d*\s*\)?\s*$'
    r'|'
    rf'^\s*[\-\(]?\s*[\d,]+\.?\d*\s*\)?\s*{_CURRENCY_SYMBOLS}\s*$',
    re.UNICODE
)

# Accounting negative: (1,234.56)
_ACCOUNTING_NEG_PATTERN = re.compile(
    r'^\s*\(\s*[\d,]+\.?\d*\s*\)\s*$'
)

# Percentage: 12.5%, 0.5 %, -3.2%
_PERCENTAGE_PATTERN = re.compile(
    r'^\s*[\-+]?\s*[\d,]+\.?\d*\s*%\s*$'
)

# Date patterns
_DATE_PATTERNS = [
    # MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
    (re.compile(r'^\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\s*$'), '%m/%d/%Y'),
    # DD/MM/YYYY (European)
    (re.compile(r'^\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\s*$'), '%d/%m/%Y'),
    # YYYY-MM-DD (ISO)
    (re.compile(r'^\s*(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\s*$'), '%Y-%m-%d'),
    # Mon DD, YYYY or DD Mon YYYY
    (re.compile(r'^\s*\w{3,9}\s+\d{1,2},?\s+\d{4}\s*$'), None),
    (re.compile(r'^\s*\d{1,2}\s+\w{3,9}\s+\d{4}\s*$'), None),
]

# Pure number: 1,234.56  or  -1234.56  or  1234
_NUMBER_PATTERN = re.compile(
    r'^\s*[\-+]?\s*[\d,]+\.?\d*\s*$'
)


def _strip_currency(text: str) -> str:
    """Remove currency symbols from text."""
    return re.sub(rf'{_CURRENCY_SYMBOLS}', '', text).strip()


def _parse_number(text: str) -> Optional[float]:
    """Try to parse a string as a number, handling commas and accounting format."""
    cleaned = text.strip()
    if not cleaned:
        return None

    # Handle accounting negative: (1,234.56) -> -1234.56
    is_negative = False
    if _ACCOUNTING_NEG_PATTERN.match(cleaned):
        is_negative = True
        cleaned = cleaned.replace('(', '').replace(')', '').strip()

    # Handle explicit negative sign
    if cleaned.startswith('-') or cleaned.startswith('\u2212'):
        is_negative = True
        cleaned = cleaned.lstrip('-\u2212').strip()
    elif cleaned.startswith('+'):
        cleaned = cleaned.lstrip('+').strip()

    # Remove thousand separators
    cleaned = cleaned.replace(',', '')

    if not cleaned:
        return None

    try:
        value = float(cleaned)
        return -value if is_negative else value
    except (ValueError, OverflowError):
        return None


def detect_cell_type(text: str) -> Tuple[Any, Optional[str]]:
    """
    Detect the data type of a cell value and return (typed_value, number_format).
    Returns (original_text, None) if no specific type is detected.
    """
    if text is None:
        return None, None

    stripped = str(text).strip()
    if not stripped:
        return None, None

    # 1. Currency detection
    if _CURRENCY_PATTERN.match(stripped):
        num_str = _strip_currency(stripped)
        value = _parse_number(num_str)
        if value is not None:
            return value, '$#,##0.00'

    # 2. Percentage detection
    if _PERCENTAGE_PATTERN.match(stripped):
        num_str = stripped.replace('%', '').strip()
        value = _parse_number(num_str)
        if value is not None:
            return value / 100.0, '0.00%'

    # 3. Date detection
    for pattern, fmt in _DATE_PATTERNS:
        if pattern.match(stripped):
            # Try common date formats
            for try_fmt in [
                '%m/%d/%Y', '%d/%m/%Y', '%Y-%m-%d', '%Y/%m/%d',
                '%m-%d-%Y', '%d-%m-%Y', '%m.%d.%Y', '%d.%m.%Y',
                '%b %d, %Y', '%B %d, %Y', '%d %b %Y', '%d %B %Y',
                '%b %d %Y', '%B %d %Y',
            ]:
                try:
                    dt = datetime.strptime(stripped, try_fmt)
                    # Sanity check: year between 1900 and 2100
                    if 1900 <= dt.year <= 2100:
                        return dt, 'YYYY-MM-DD'
                except ValueError:
                    continue
            break  # Pattern matched but couldn't parse - don't try further

    # 4. Accounting negative: (1,234.56)
    if _ACCOUNTING_NEG_PATTERN.match(stripped):
        value = _parse_number(stripped)
        if value is not None:
            return value, '#,##0.00'

    # 5. Plain number
    if _NUMBER_PATTERN.match(stripped):
        value = _parse_number(stripped)
        if value is not None:
            # Use integer format for whole numbers
            if value == int(value) and abs(value) < 1e15:
                return int(value), '#,##0'
            return value, '#,##0.00'

    # 6. Default: keep as string
    return stripped, None


# ---------------------------------------------------------------------------
# Table Extraction Strategies
# ---------------------------------------------------------------------------

def _extract_tables_pymupdf(pdf_path: str, page_indices: List[int]) -> Dict[int, List[List[List[str]]]]:
    """
    Fallback extraction using PyMuPDF's built-in table finder and layout heuristics.
    Requires no external dependencies beyond fitz/pymupdf.
    """
    results: Dict[int, List[List[List[str]]]] = {}
    try:
        doc = fitz.open(pdf_path)
        for page_idx in page_indices:
            if page_idx >= len(doc):
                continue
            page = doc[page_idx]
            page_tables: List[List[List[str]]] = []

            # Try PyMuPDF find_tables (available in PyMuPDF >= 1.23.0)
            try:
                tabs = page.find_tables()
                if tabs and tabs.tables:
                    for tab in tabs.tables:
                        extracted = tab.extract()
                        if extracted:
                            cleaned_table = []
                            for row in extracted:
                                cleaned_row = [
                                    (cell.strip() if cell and isinstance(cell, str) else (str(cell).strip() if cell is not None else ''))
                                    for cell in row
                                ]
                                cleaned_table.append(cleaned_row)
                            if cleaned_table:
                                page_tables.append(cleaned_table)
            except Exception as e:
                logger.debug(f"PyMuPDF find_tables warning on page {page_idx}: {e}")

            # Fallback to text line grid heuristics
            if not page_tables:
                text = page.get_text("text")
                if text and text.strip():
                    lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
                    grid = []
                    for line in lines:
                        cells = re.split(r'\t|  {2,}', line)
                        cells = [c.strip() for c in cells if c.strip()]
                        if cells:
                            grid.append(cells)
                    if grid:
                        page_tables.append(grid)

            if page_tables:
                results[page_idx] = page_tables
        doc.close()
    except Exception as e:
        logger.warning(f"PyMuPDF table extraction failed: {e}")

    return results


def _extract_tables_pdfplumber(pdf_path: str, page_indices: List[int]) -> Dict[int, List[List[List[str]]]]:
    """
    Primary extraction using pdfplumber with automatic fallback to PyMuPDF.
    Returns: {page_index: [table1_rows, table2_rows, ...]}
    Each table is a list of rows, each row is a list of cell strings.
    """
    try:
        import pdfplumber
    except ImportError:
        logger.info("pdfplumber not installed, using native PyMuPDF table extraction")
        return _extract_tables_pymupdf(pdf_path, page_indices)

    results: Dict[int, List[List[List[str]]]] = {}

    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_idx in page_indices:
                if page_idx >= len(pdf.pages):
                    continue

                page = pdf.pages[page_idx]
                page_tables: List[List[List[str]]] = []

                # Strategy 1: Try with line-based detection (bordered tables)
                tables = page.extract_tables(table_settings={
                    "vertical_strategy": "lines",
                    "horizontal_strategy": "lines",
                    "snap_tolerance": 4,
                    "join_tolerance": 4,
                    "edge_min_length": 10,
                    "min_words_vertical": 2,
                    "min_words_horizontal": 1,
                })

                if tables:
                    for table in tables:
                        if table and len(table) > 0:
                            # Clean cells
                            cleaned_table = []
                            for row in table:
                                cleaned_row = [
                                    (cell.strip() if cell and isinstance(cell, str) else (str(cell).strip() if cell is not None else ''))
                                    for cell in row
                                ]
                                cleaned_table.append(cleaned_row)
                            if cleaned_table:
                                page_tables.append(cleaned_table)

                # Strategy 2: If no tables found, try text-based detection (borderless tables)
                if not page_tables:
                    tables = page.extract_tables(table_settings={
                        "vertical_strategy": "text",
                        "horizontal_strategy": "text",
                        "snap_tolerance": 5,
                        "join_tolerance": 5,
                        "min_words_vertical": 2,
                        "min_words_horizontal": 1,
                    })

                    if tables:
                        for table in tables:
                            if table and len(table) > 0:
                                cleaned_table = []
                                for row in table:
                                    cleaned_row = [
                                        (cell.strip() if cell and isinstance(cell, str) else (str(cell).strip() if cell is not None else ''))
                                        for cell in row
                                    ]
                                    cleaned_table.append(cleaned_row)
                                if cleaned_table:
                                    page_tables.append(cleaned_table)

                # Strategy 3: If still no tables, extract full-page text as single-column grid
                if not page_tables:
                    text = page.extract_text()
                    if text and text.strip():
                        lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
                        if lines:
                            # Attempt to detect tab or multi-space delimited columns
                            grid = []
                            for line in lines:
                                # Split on 2+ spaces or tabs
                                cells = re.split(r'\t|  {2,}', line)
                                cells = [c.strip() for c in cells if c.strip()]
                                if cells:
                                    grid.append(cells)
                            if grid:
                                page_tables.append(grid)

                if page_tables:
                    results[page_idx] = page_tables

    except Exception as e:
        logger.warning(f"pdfplumber extraction failed: {e}")

    return results


def _extract_tables_tabula(pdf_path: str, page_indices: List[int]) -> Dict[int, List[List[List[str]]]]:
    """
    Secondary extraction using tabula-py (requires Java).
    Returns same format as pdfplumber extractor.
    """
    results: Dict[int, List[List[List[str]]]] = {}

    try:
        import tabula

        for page_idx in page_indices:
            page_num = page_idx + 1  # tabula uses 1-based page numbers
            page_tables: List[List[List[str]]] = []

            # Try lattice mode first (for bordered tables)
            try:
                dfs = tabula.read_pdf(
                    pdf_path,
                    pages=str(page_num),
                    lattice=True,
                    multiple_tables=True,
                    pandas_options={'header': None},
                    silent=True,
                )
                for df in dfs:
                    if df is not None and not df.empty:
                        table = []
                        for _, row in df.iterrows():
                            table.append([str(cell).strip() if str(cell).strip() != 'nan' else '' for cell in row])
                        if table:
                            page_tables.append(table)
            except Exception:
                pass

            # If lattice didn't find tables, try stream mode (borderless)
            if not page_tables:
                try:
                    dfs = tabula.read_pdf(
                        pdf_path,
                        pages=str(page_num),
                        stream=True,
                        multiple_tables=True,
                        pandas_options={'header': None},
                        silent=True,
                    )
                    for df in dfs:
                        if df is not None and not df.empty:
                            table = []
                            for _, row in df.iterrows():
                                table.append([str(cell).strip() if str(cell).strip() != 'nan' else '' for cell in row])
                            if table:
                                page_tables.append(table)
                except Exception:
                    pass

            if page_tables:
                results[page_idx] = page_tables

    except ImportError:
        logger.info("tabula-py not available, skipping tabula extraction")
    except Exception as e:
        logger.warning(f"tabula extraction failed: {e}")

    return results


def _extract_tables_ocr(
    doc: fitz.Document,
    page_indices: List[int],
    tesseract_bin: Optional[str] = None,
) -> Dict[int, List[List[List[str]]]]:
    """
    OCR-based table extraction for scanned PDFs.
    Renders each page, runs OCR, then attempts grid reconstruction
    from the OCR text output.
    """
    results: Dict[int, List[List[List[str]]]] = {}

    if not tesseract_bin:
        return results

    try:
        import pytesseract
        from PIL import Image

        pytesseract.pytesseract.tesseract_cmd = tesseract_bin
    except Exception as e:
        logger.warning(f"Failed to initialize pytesseract for table OCR: {e}")
        return results

    for page_idx in page_indices:
        if page_idx >= len(doc):
            continue

        page = doc[page_idx]
        page_tables: List[List[List[str]]] = []

        try:
            # Render at 200 DPI for good OCR quality
            pix = page.get_pixmap(dpi=200)
            pil_img = Image.open(io.BytesIO(pix.tobytes("png")))

            # Use pytesseract TSV output for coordinate-based cell detection
            try:
                tsv_data = pytesseract.image_to_data(
                    pil_img, lang="eng", output_type=pytesseract.Output.DICT
                )

                # Group words by their block/paragraph/line
                word_entries = []
                for i in range(len(tsv_data['text'])):
                    text = str(tsv_data['text'][i]).strip()
                    if text and tsv_data['conf'][i] > 20:  # Confidence threshold
                        word_entries.append({
                            'text': text,
                            'left': tsv_data['left'][i],
                            'top': tsv_data['top'][i],
                            'width': tsv_data['width'][i],
                            'height': tsv_data['height'][i],
                            'block_num': tsv_data['block_num'][i],
                            'line_num': tsv_data['line_num'][i],
                        })

                if word_entries:
                    # Group by y-coordinate proximity (same row)
                    rows_by_y: Dict[int, List[Dict]] = {}
                    y_tolerance = 12  # pixels

                    for entry in word_entries:
                        center_y = entry['top'] + entry['height'] // 2
                        matched_y = None
                        for existing_y in rows_by_y:
                            if abs(center_y - existing_y) <= y_tolerance:
                                matched_y = existing_y
                                break
                        if matched_y is not None:
                            rows_by_y[matched_y].append(entry)
                        else:
                            rows_by_y[center_y] = [entry]

                    # Sort rows by y-coordinate
                    sorted_ys = sorted(rows_by_y.keys())

                    # Detect columns by analyzing x-coordinate clusters
                    all_x_positions = []
                    for y_key in sorted_ys:
                        for entry in rows_by_y[y_key]:
                            all_x_positions.append(entry['left'])

                    if all_x_positions:
                        # Find column boundaries via gap detection
                        unique_xs = sorted(set(all_x_positions))
                        col_boundaries = [0]

                        if len(unique_xs) > 1:
                            gaps = []
                            for i in range(1, len(unique_xs)):
                                gaps.append((unique_xs[i] - unique_xs[i - 1], unique_xs[i]))

                            # Significant gaps define column boundaries
                            avg_gap = sum(g[0] for g in gaps) / len(gaps) if gaps else 50
                            threshold = max(avg_gap * 1.5, 30)

                            for gap_size, gap_x in gaps:
                                if gap_size > threshold:
                                    col_boundaries.append(gap_x)

                        col_boundaries.append(99999)  # Right edge

                        # Build grid
                        grid = []
                        for y_key in sorted_ys:
                            row_words = sorted(rows_by_y[y_key], key=lambda e: e['left'])
                            row_cells = [''] * (len(col_boundaries) - 1)

                            for entry in row_words:
                                # Find which column this word belongs to
                                for col_idx in range(len(col_boundaries) - 1):
                                    if col_boundaries[col_idx] <= entry['left'] < col_boundaries[col_idx + 1]:
                                        if row_cells[col_idx]:
                                            row_cells[col_idx] += ' ' + entry['text']
                                        else:
                                            row_cells[col_idx] = entry['text']
                                        break

                            grid.append(row_cells)

                        if grid:
                            page_tables.append(grid)

            except Exception as e:
                logger.warning(f"OCR TSV extraction failed for page {page_idx + 1}: {e}")
                # Fallback: simple line-based extraction
                text = pytesseract.image_to_string(pil_img, lang="eng")
                if text and text.strip():
                    lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
                    grid = []
                    for line in lines:
                        cells = re.split(r'\t|  {2,}', line)
                        cells = [c.strip() for c in cells if c.strip()]
                        if cells:
                            grid.append(cells)
                    if grid:
                        page_tables.append(grid)

        except Exception as e:
            logger.warning(f"OCR page rendering failed for page {page_idx + 1}: {e}")

        if page_tables:
            results[page_idx] = page_tables

    return results


# ---------------------------------------------------------------------------
# XLSX Generation
# ---------------------------------------------------------------------------

def _normalize_table_columns(table: List[List[str]]) -> List[List[str]]:
    """Ensure all rows in a table have the same number of columns."""
    if not table:
        return table
    max_cols = max(len(row) for row in table)
    return [row + [''] * (max_cols - len(row)) for row in table]


def _is_likely_header(row: List[str], total_rows: int) -> bool:
    """Heuristic: a header row usually has mostly non-numeric text cells."""
    if total_rows < 2:
        return False
    non_empty = [c for c in row if c and str(c).strip()]
    if not non_empty:
        return False
    numeric_count = sum(1 for c in non_empty if _NUMBER_PATTERN.match(str(c).strip()) or _CURRENCY_PATTERN.match(str(c).strip()))
    return numeric_count < len(non_empty) * 0.5


def _build_xlsx(
    all_page_tables: Dict[int, List[List[List[str]]]],
    total_pages: int,
    output_path: str,
) -> Dict[str, Any]:
    """
    Build an XLSX workbook from extracted table data.
    Each page with tables gets its own worksheet.
    Returns metadata about the generation.
    """
    wb = openpyxl.Workbook()
    # Remove default sheet
    default_sheet = wb.active
    if default_sheet:
        wb.remove(default_sheet)

    total_tables = 0
    total_rows_written = 0
    pages_with_data = 0

    header_font = Font(bold=True, size=11)
    normal_font = Font(size=11)
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    normal_alignment = Alignment(vertical='top', wrap_text=True)

    for page_idx in range(total_pages):
        page_tables = all_page_tables.get(page_idx, [])

        if not page_tables:
            continue

        pages_with_data += 1
        # Create worksheet
        ws_title = f"Page {page_idx + 1}"
        # Excel sheet names have a 31-char limit
        ws = wb.create_sheet(title=ws_title[:31])

        current_row = 1

        for table_idx, table in enumerate(page_tables):
            if not table:
                continue

            table = _normalize_table_columns(table)
            total_tables += 1

            # Add table spacing between multiple tables on the same page
            if table_idx > 0:
                current_row += 2  # 2-row gap between tables

            is_first_row = True
            has_header = _is_likely_header(table[0], len(table))

            for row_data in table:
                for col_idx, cell_value in enumerate(row_data):
                    cell = ws.cell(row=current_row, column=col_idx + 1)

                    # Detect and apply typed value
                    typed_value, num_format = detect_cell_type(cell_value)
                    cell.value = typed_value

                    if num_format:
                        cell.number_format = num_format

                    # Apply header styling
                    if is_first_row and has_header:
                        cell.font = header_font
                        cell.alignment = header_alignment
                    else:
                        cell.font = normal_font
                        cell.alignment = normal_alignment

                is_first_row = False
                current_row += 1
                total_rows_written += 1

        # Auto-width columns
        for col_idx in range(1, (ws.max_column or 0) + 1):
            max_width = 8  # minimum width
            col_letter = get_column_letter(col_idx)
            for row_idx in range(1, (ws.max_row or 0) + 1):
                cell = ws.cell(row=row_idx, column=col_idx)
                if cell.value is not None:
                    cell_len = len(str(cell.value))
                    max_width = max(max_width, min(cell_len + 2, 50))
            ws.column_dimensions[col_letter].width = max_width

    # If no data was extracted at all, create a single empty sheet with a message
    if not wb.sheetnames:
        ws = wb.create_sheet(title="Results")
        ws.cell(row=1, column=1, value="No tables or structured data found in the PDF document.")
        ws.cell(row=2, column=1, value="The PDF may contain only text, images, or non-tabular content.")
        ws.column_dimensions['A'].width = 60

    wb.save(output_path)

    return {
        "total_tables_extracted": total_tables,
        "total_rows": total_rows_written,
        "pages_with_data": pages_with_data,
        "total_pages_processed": total_pages,
        "worksheets_created": len(wb.sheetnames),
    }


# ---------------------------------------------------------------------------
# Main Converter Class
# ---------------------------------------------------------------------------

class PdfToExcelConverter(BaseConverter):
    """
    Production-grade PDF to Excel converter.
    Extracts tables, financial data, invoices, and bank statements
    from PDF documents into structured XLSX spreadsheets.
    """

    @property
    def tool_id(self) -> str:
        return "pdf-to-excel"

    @property
    def name(self) -> str:
        return "PDF to Excel"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "xlsx"

    @property
    def output_mime_type(self) -> str:
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        super().validate_inputs(input_paths, options)
        # Validate it's actually a PDF
        src_path = input_paths[0]
        try:
            doc = fitz.open(src_path)
            if doc.is_encrypted:
                is_authenticated = False
                try:
                    is_authenticated = bool(doc.authenticate(""))
                except Exception:
                    pass
                if not is_authenticated:
                    doc.close()
                    raise FileValidationError(
                        "This PDF is password-protected. Please use the Unlock PDF tool first, then convert to Excel."
                    )
            if doc.page_count < 1:
                doc.close()
                raise FileValidationError("PDF contains 0 pages and is invalid.")
            doc.close()
        except FileValidationError:
            raise
        except Exception as e:
            raise FileValidationError(f"File is corrupted or not a valid PDF: {str(e)}")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]

        force_ocr = options.get("ocr", False) or options.get("force_ocr", False)

        # Open and inspect the PDF
        doc = open_and_validate_pdf(src_path)
        total_pages = doc.page_count
        page_indices = list(range(total_pages))

        # Detect if PDF is scanned (low text density)
        page_texts = [page.get_text().strip() for page in doc]
        total_chars = sum(len(t) for t in page_texts)
        is_scanned = force_ocr or (total_chars < max(30, total_pages * 15))

        logger.info(
            f"PDF to Excel: {total_pages} pages, {total_chars} chars, "
            f"scanned={'yes' if is_scanned else 'no'}, force_ocr={force_ocr}"
        )

        # ---------------------------------------------------------------
        # Stage 1: Extract tables
        # ---------------------------------------------------------------
        all_page_tables: Dict[int, List[List[List[str]]]] = {}

        if not is_scanned:
            # Primary: pdfplumber extraction
            logger.info("Running pdfplumber table extraction...")
            all_page_tables = _extract_tables_pdfplumber(src_path, page_indices)
            extraction_method = "pdfplumber"

            # Check coverage - if pdfplumber missed pages that have text, try tabula
            missing_pages = [
                idx for idx in page_indices
                if idx not in all_page_tables and len(page_texts[idx]) > 20
            ]

            if missing_pages:
                logger.info(f"Trying tabula-py for {len(missing_pages)} pages with no pdfplumber results...")
                tabula_results = _extract_tables_tabula(src_path, missing_pages)
                for page_idx, tables in tabula_results.items():
                    if page_idx not in all_page_tables:
                        all_page_tables[page_idx] = tables
                        extraction_method = "pdfplumber+tabula"

            # Final fallback: for pages with text but no extracted tables,
            # do a raw text grid extraction using PyMuPDF
            still_missing = [
                idx for idx in page_indices
                if idx not in all_page_tables and len(page_texts[idx]) > 20
            ]
            if still_missing:
                logger.info(f"Raw text grid fallback for {len(still_missing)} remaining pages...")
                for page_idx in still_missing:
                    text = page_texts[page_idx]
                    lines = [line.strip() for line in text.split('\n') if line.strip()]
                    if lines:
                        grid = []
                        for line in lines:
                            cells = re.split(r'\t|  {2,}', line)
                            cells = [c.strip() for c in cells]
                            if any(c for c in cells):
                                grid.append(cells)
                        if grid:
                            all_page_tables[page_idx] = [grid]
                            extraction_method = "pdfplumber+text"

        else:
            # Scanned PDF -> OCR pipeline
            logger.info("Scanned PDF detected - running OCR extraction pipeline...")
            extraction_method = "ocr"

            # Find Tesseract
            from app.services.engine.office import find_tesseract_bin
            tesseract_bin = find_tesseract_bin()

            if tesseract_bin:
                all_page_tables = _extract_tables_ocr(doc, page_indices, tesseract_bin)
            else:
                logger.warning("Tesseract not available. Attempting raw text extraction from scanned PDF...")
                # Even scanned PDFs sometimes have a thin text layer
                for page_idx in page_indices:
                    text = page_texts[page_idx] if page_idx < len(page_texts) else ""
                    if text and len(text.strip()) > 5:
                        lines = [line.strip() for line in text.split('\n') if line.strip()]
                        if lines:
                            grid = []
                            for line in lines:
                                cells = re.split(r'\t|  {2,}', line)
                                cells = [c.strip() for c in cells]
                                if any(c for c in cells):
                                    grid.append(cells)
                            if grid:
                                all_page_tables[page_idx] = [grid]
                extraction_method = "text_fallback"

        doc.close()

        # ---------------------------------------------------------------
        # Stage 2: Generate XLSX
        # ---------------------------------------------------------------
        out_filename = f"converted_{uuid.uuid4().hex[:8]}.xlsx"
        out_path = os.path.join(output_dir, out_filename)

        logger.info(f"Generating XLSX with {len(all_page_tables)} pages of data...")
        generation_meta = _build_xlsx(all_page_tables, total_pages, out_path)

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={
                "page_count": total_pages,
                "extraction_method": extraction_method,
                "is_scanned": is_scanned,
                **generation_meta,
            }
        )
