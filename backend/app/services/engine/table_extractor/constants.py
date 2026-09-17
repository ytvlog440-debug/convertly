"""
Convertly V2 — Enterprise Table Extraction System Constants
Centralized definitions for geometry, tolerances, confidence metrics,
regex patterns, and operational thresholds. Avoids magic numbers.
"""

import re
from enum import Enum


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class DocumentType(str, Enum):
    NATIVE_TEXT = "native_text"
    SCANNED = "scanned"
    SCANNED_IMAGE = "scanned_image"
    MIXED = "mixed"


class TableTopology(str, Enum):
    LATTICE = "lattice"            # Full bordered grid (H-lines >= 2 and V-lines >= 2)
    SEMI_BORDERED = "semi_bordered"# Rulings present (H-lines >= 2, V-lines < 2)
    STREAM = "stream"              # Borderless stream (H-lines < 2, V-lines == 0)
    NESTED = "nested"              # Embedded sub-table within outer cell


class DocumentGenre(str, Enum):
    INVOICE = "invoice"
    PURCHASE_ORDER = "purchase_order"
    BANK_STATEMENT = "bank_statement"
    CREDIT_CARD_STATEMENT = "credit_card_statement"
    FINANCIAL_REPORT = "financial_report"
    BALANCE_SHEET = "balance_sheet"
    PROFIT_AND_LOSS = "profit_and_loss"
    PAYROLL = "payroll"
    TAX_FORM = "tax_form"
    UTILITY_BILL = "utility_bill"
    SCHOOL_RESULT = "school_result"
    TIMETABLE = "timetable"
    ATTENDANCE_SHEET = "attendance_sheet"
    MEDICAL_REPORT = "medical_report"
    RESEARCH_TABLE = "research_table"
    PRICE_LIST = "price_list"
    GOVERNMENT_FORM = "government_form"
    SHIPPING_MANIFEST = "shipping_manifest"
    INVENTORY_REPORT = "inventory_report"
    GENERIC_TABLE = "generic_table"


class EngineType(str, Enum):
    LATTICE = "lattice"
    STREAM = "stream"
    HYBRID = "hybrid"
    VECTOR_MESH = "vector_mesh"
    MORPHOLOGICAL_LATTICE = "morphological_lattice"
    ADAPTIVE_EDGE = "adaptive_edge"
    PROJECTION_STREAM = "projection_stream"
    OCR_TSV = "ocr_tsv"
    EASY_OCR = "easy_ocr"


# ---------------------------------------------------------------------------
# Geometric & Tolerances Constants (in PDF Points: 72 points = 1 inch)
# ---------------------------------------------------------------------------

DEFAULT_SNAP_TOLERANCE: float = 3.0
DEFAULT_LINE_MERGE_TOLERANCE: float = 1.5
MIN_LINE_LENGTH_PTS: float = 8.0
MIN_STROKE_WIDTH_PTS: float = 0.1

DEFAULT_GUTTER_MIN_WIDTH_PTS: float = 8.0
DEFAULT_ROW_MERGE_Y_TOLERANCE: float = 4.0
DEFAULT_KERNING_SPACE_RATIO: float = 0.28
DEFAULT_INDENT_STEP_PTS: float = 12.0
DEFAULT_MIN_COLS: int = 2
DEFAULT_MIN_ROWS: int = 2


# ---------------------------------------------------------------------------
# Confidence & Scoring Thresholds
# ---------------------------------------------------------------------------

CONFIDENCE_HIGH: float = 0.85
CONFIDENCE_MEDIUM: float = 0.65
CONFIDENCE_LOW: float = 0.40
QUALITY_FALLBACK_THRESHOLD: float = 0.90  # If Q_total < 90%, recommend secondary fallback

WEIGHT_COL_UNIFORMITY: float = 0.25
WEIGHT_ROW_ALIGNMENT: float = 0.20
WEIGHT_NUMERIC_DENSITY: float = 0.20
WEIGHT_HEADER_CONFIDENCE: float = 0.15
WEIGHT_GRID_FILL: float = 0.20
PENALTY_PIPE_ARTIFACTS: float = 0.30
PENALTY_FRAGMENTATION: float = 0.20


# ---------------------------------------------------------------------------
# OCR & Image Processing Thresholds
# ---------------------------------------------------------------------------

DEFAULT_OCR_DPI: int = 300             # Baseline configuration DPI
STANDARD_OCR_DPI: int = 200            # Safe standard production DPI (memory-optimized)
FALLBACK_HIGHRES_OCR_DPI: int = 300    # High-resolution adaptive retry for low-confidence pages
DEFAULT_OCR_PSM: int = 6               # Assume a single uniform block of text / table
DEFAULT_BINARIZATION_THRESH: int = 200
MIN_OCR_CONFIDENCE: float = 25.0       # Tesseract confidence threshold (0-100)
SKEW_CORRECTION_MAX_ANGLE: float = 15.0  # Affine rotation limit (-15° to +15°)


# ---------------------------------------------------------------------------
# Operational & Memory Limits
# ---------------------------------------------------------------------------

STREAMING_PAGE_THRESHOLD: int = 50   # Use write_only streaming mode if > 50 pages
DEFAULT_MAX_WORKERS: int = 4         # Native vector text parallelism
DEFAULT_MAX_PARALLEL_WORKERS: int = 4
DEFAULT_OCR_MAX_WORKERS: int = 1     # Strict bounded concurrency for memory-heavy OCR
DEFAULT_MAX_WORKER_MEMORY_MB: int = 2048
DEFAULT_PER_PAGE_TIMEOUT_SEC: int = 30
MAX_COL_WIDTH_EXCEL: int = 60
MIN_COL_WIDTH_EXCEL: int = 10
FILE_RETENTION_MINUTES: int = 120    # Zero retention SLA shredding


# ---------------------------------------------------------------------------
# Formatting & Currency Map
# ---------------------------------------------------------------------------

CURRENCY_SYMBOLS = {
    '$': '$',
    '€': '€',
    '£': '£',
    '¥': '¥',
    '₹': '₹',
    '₩': '₩',
    '₽': '₽',
    '₺': '₺',
    'CHF': 'CHF',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': '$',
    'AUD': '$',
    'INR': '₹',
}

CURRENCY_SYMBOLS_PATTERN = r'[\$\u20ac\u00a3\u00a5\u20b9\u20a9\u20bd\u20ba\u20b1\u20bf]'

CURRENCY_FORMAT_MAP = {
    '$': '$#,##0.00;($#,##0.00);"-"',
    '€': '€#,##0.00;(€#,##0.00);"-"',
    '£': '£#,##0.00;(£#,##0.00);"-"',
    '¥': '¥#,##0;(¥#,##0);"-"',
    '₹': '₹#,##0.00;(₹#,##0.00);"-"',
    '₩': '₩#,##0;(₩#,##0);"-"',
    '₽': '₽#,##0.00;(₽#,##0.00);"-"',
    '₺': '₺#,##0.00;(₺#,##0.00);"-"',
    'USD': '$#,##0.00;($#,##0.00);"-"',
    'EUR': '€#,##0.00;(€#,##0.00);"-"',
    'GBP': '£#,##0.00;(£#,##0.00);"-"',
    'JPY': '¥#,##0;(¥#,##0);"-"',
    'CHF': 'CHF #,##0.00;(CHF #,##0.00);"-"',
    'CAD': '$#,##0.00;($#,##0.00);"-"',
    'AUD': '$#,##0.00;($#,##0.00);"-"',
}

FORMAT_CURRENCY_USD = '$#,##0.00;($#,##0.00);"-"'
FORMAT_CURRENCY_EUR = '€#,##0.00;(€#,##0.00);"-"'
FORMAT_CURRENCY_GBP = '£#,##0.00;(£#,##0.00);"-"'
FORMAT_PERCENTAGE = '0.00%'
FORMAT_NUMBER_INT = '#,##0'
FORMAT_NUMBER_FLOAT = '#,##0.00'
FORMAT_DATE_ISO = 'yyyy-mm-dd'

EXCEL_DATE_FORMAT = 'YYYY-MM-DD'
EXCEL_PERCENT_FORMAT = '0.00%'
EXCEL_INTEGER_FORMAT = '#,##0'
EXCEL_FLOAT_FORMAT = '#,##0.00'
EXCEL_TEXT_FORMAT = '@'
