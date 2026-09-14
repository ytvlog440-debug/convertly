"""
Convertly V2 — Enterprise Table Extractor Parsing & Normalization Utilities
Cleans OCR artifacts, normalizes ligatures/whitespace, and extracts typed numeric,
currency, percentage, and date values with OpenXML format strings.
"""

import re
import unicodedata
from datetime import datetime
from typing import Optional, Tuple, Any, Union

from ..constants import (
    CURRENCY_SYMBOLS,
    FORMAT_CURRENCY_USD,
    FORMAT_CURRENCY_EUR,
    FORMAT_CURRENCY_GBP,
    FORMAT_PERCENTAGE,
    FORMAT_NUMBER_INT,
    FORMAT_NUMBER_FLOAT,
    FORMAT_DATE_ISO,
)

# Common ligature map
LIGATURE_MAP = {
    "\ufb00": "ff",
    "\ufb01": "fi",
    "\ufb02": "fl",
    "\ufb03": "ffi",
    "\ufb04": "ffl",
    "\ufb05": "ft",
    "\ufb06": "st",
}

# OCR artifact pipe patterns
PIPE_RE = re.compile(r"(^\s*[|│¦]+\s*|\s*[|│¦]+\s*$)")

# Regex for percentages: e.g. 15%, 15.5 %, -2.4%, (5%)
PERCENTAGE_RE = re.compile(r"^\s*([-(]?\s*\d+(?:[.,]\d+)?\s*\)?)\s*%\s*$")

# Regex for currency symbols: $, €, £, ¥, ₹, CHF, USD, EUR, etc.
CURRENCY_PREFIX_RE = re.compile(
    r"^\s*([$€£¥₹]|USD|EUR|GBP|CAD|AUD|INR|CHF)\s*([-(]?\s*\d[\d., ]*\)?)\s*$",
    re.IGNORECASE,
)
CURRENCY_SUFFIX_RE = re.compile(
    r"^\s*([-(]?\s*\d[\d., ]*\)?)\s*([$€£¥₹]|USD|EUR|GBP|CAD|AUD|INR|CHF)\s*$",
    re.IGNORECASE,
)

# Date regexes
DATE_PATTERNS = [
    # YYYY-MM-DD or YYYY/MM/DD
    (re.compile(r"^\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s*$"), "%Y-%m-%d", "yyyy-mm-dd"),
    # DD/MM/YYYY or MM/DD/YYYY
    (re.compile(r"^\s*(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\s*$"), None, "mm/dd/yyyy"),
    # DD-Mon-YYYY (e.g. 15-Jan-2024)
    (re.compile(r"^\s*(\d{1,2})[- ]([A-Za-z]{3})[- ](\d{4})\s*$"), "%d-%b-%Y", "dd-mmm-yyyy"),
]


def clean_text(text: Optional[str]) -> str:
    """
    Standardize text: normalize unicode (NFKC), expand typographic ligatures,
    replace smart quotes, and collapse excessive horizontal whitespace.
    """
    if not text:
        return ""

    # Unicode NFKC normalization
    s = unicodedata.normalize("NFKC", str(text))

    # Replace ligatures
    for lig, replacement in LIGATURE_MAP.items():
        s = s.replace(lig, replacement)

    # Standardize quotes and hyphens
    s = s.replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2018", "'").replace("\u2019", "'")
    s = s.replace("\u2013", "-").replace("\u2014", "-")

    # Strip zero-width characters
    s = re.sub(r"[\u200b\ufeff\u200e\u200f]", "", s)

    # Clean horizontal whitespace per line (keep line breaks)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in s.splitlines()]
    return "\n".join(lines).strip()


def clean_ocr_artifacts(text: Optional[str]) -> str:
    """
    Remove spurious pipe characters and OCR noise at boundaries.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return ""

    # Remove isolated pipes at start/end of lines
    lines = [PIPE_RE.sub("", line).strip() for line in cleaned.splitlines()]
    return "\n".join(line for line in lines if line)


def _normalize_number_string(num_str: str) -> Optional[float]:
    """
    Parse a numeric string with handling for commas/dots and accounting parens (1,234.50).
    """
    s = num_str.strip()
    if not s:
        return None

    # Handle accounting parentheses for negatives: e.g. (1,234.56) -> -1234.56
    is_negative = False
    if s.startswith("(") and s.endswith(")"):
        is_negative = True
        s = s[1:-1].strip()
    elif s.startswith("-"):
        is_negative = True
        s = s[1:].strip()
    elif s.endswith("-"):
        is_negative = True
        s = s[:-1].strip()

    # Determine European vs US decimal format
    # US format: 1,234,567.89
    # EU format: 1.234.567,89
    if "," in s and "." in s:
        if s.rfind(",") > s.rfind("."):
            # European: dots are thousands, comma is decimal
            s = s.replace(".", "").replace(",", ".")
        else:
            # US: commas are thousands, dot is decimal
            s = s.replace(",", "")
    elif "," in s:
        parts = s.split(",")
        if len(parts) == 2 and len(parts[1]) in (1, 2):
            # Decimal comma: e.g. 45,50
            s = s.replace(",", ".")
        else:
            # Thousand separator: e.g. 1,000
            s = s.replace(",", "")

    # Remove spaces
    s = s.replace(" ", "")

    try:
        val = float(s)
        return -val if is_negative else val
    except ValueError:
        return None


def parse_percentage(text: str) -> Optional[Tuple[float, str]]:
    """
    Parse string as a percentage value. Returns (decimal_rate, format_code) or None.
    Example: '15.5%' -> (0.155, '0.0%')
    """
    cleaned = clean_text(text)
    m = PERCENTAGE_RE.match(cleaned)
    if not m:
        return None

    num_part = m.group(1)
    val = _normalize_number_string(num_part)
    if val is None:
        return None

    decimal_places = 0
    if "." in num_part or "," in num_part:
        dec_part = re.split(r"[.,]", num_part)[-1].rstrip(")")
        decimal_places = len(dec_part)

    fmt = f"0.{'0' * decimal_places}%" if decimal_places > 0 else "0%"
    return (round(val / 100.0, 6), fmt)


def parse_currency(text: str) -> Optional[Tuple[float, str, str]]:
    """
    Parse string as a currency value. Returns (amount, symbol, format_code) or None.
    Example: '$1,234.56' -> (1234.56, '$', '$#,##0.00')
    """
    cleaned = clean_text(text)
    if not cleaned:
        return None

    is_negative = False
    s = cleaned.strip()
    if s.startswith("(") and s.endswith(")"):
        is_negative = True
        s = s[1:-1].strip()
    elif s.startswith("-"):
        is_negative = True
        s = s[1:].strip()
    elif s.endswith("-"):
        is_negative = True
        s = s[:-1].strip()

    sym = None
    num_str = None

    m_pref = CURRENCY_PREFIX_RE.match(s)
    if m_pref:
        sym = m_pref.group(1).upper()
        num_str = m_pref.group(2)
    else:
        m_suff = CURRENCY_SUFFIX_RE.match(s)
        if m_suff:
            num_str = m_suff.group(1)
            sym = m_suff.group(2).upper()

    if not sym or not num_str:
        return None

    amount = _normalize_number_string(num_str)
    if amount is None:
        return None

    if is_negative and amount > 0:
        amount = -amount

    has_decimals = "." in num_str or ("," in num_str and len(num_str.split(",")[-1].rstrip(")")) in (1, 2))
    num_format = "#,##0.00" if has_decimals else "#,##0"

    symbol_char = CURRENCY_SYMBOLS.get(sym, sym)
    format_code = f'"{symbol_char}"{num_format}'

    return (amount, symbol_char, format_code)


def parse_number(text: str) -> Optional[Tuple[Union[int, float], str]]:
    """
    Parse string as integer or float. Returns (number, format_code) or None.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return None

    # Skip pure dates or percentage markers
    if "%" in cleaned or "/" in cleaned or ":" in cleaned:
        return None

    # Check if purely digits or digits with thousand separators/decimal
    val = _normalize_number_string(cleaned)
    if val is None:
        return None

    # Check if it should be an integer
    if val.is_integer() and "." not in cleaned and "," not in cleaned:
        return (int(val), FORMAT_NUMBER_INT)
    elif val.is_integer() and ("," in cleaned or "." in cleaned):
        # Could be formatted integer like 1,000
        # If no decimals after sep:
        parts = re.split(r"[.,]", cleaned)
        if len(parts[-1].rstrip(")")) != 2:
            return (int(val), FORMAT_NUMBER_INT)

    return (val, FORMAT_NUMBER_FLOAT)


def parse_date(text: str) -> Optional[Tuple[str, str]]:
    """
    Parse common date representations. Returns (iso_date_string, format_code) or None.
    """
    cleaned = clean_text(text)
    if len(cleaned) < 8 or len(cleaned) > 20:
        return None

    for regex, strptime_fmt, fmt_code in DATE_PATTERNS:
        m = regex.match(cleaned)
        if m:
            if strptime_fmt:
                try:
                    dt = datetime.strptime(cleaned, strptime_fmt)
                    return (dt.strftime("%Y-%m-%d"), fmt_code)
                except ValueError:
                    continue
            else:
                # Try MM/DD/YYYY and DD/MM/YYYY
                for try_fmt in ("%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y", "%d-%m-%Y"):
                    try:
                        dt = datetime.strptime(cleaned, try_fmt)
                        return (dt.strftime("%Y-%m-%d"), fmt_code)
                    except ValueError:
                        continue
    return None


def detect_cell_data_type(text: str) -> Tuple[str, Any, Optional[str]]:
    """
    Comprehensive classifier returning:
    (data_type, typed_value, format_code)
    data_type is one of: 'currency', 'percentage', 'date', 'number', 'text'.
    """
    cleaned = clean_text(text)
    if not cleaned:
        return ("text", "", None)

    # 1. Try Currency
    curr = parse_currency(cleaned)
    if curr:
        amount, _, fmt = curr
        return ("currency", amount, fmt)

    # 2. Try Percentage
    pct = parse_percentage(cleaned)
    if pct:
        rate, fmt = pct
        return ("percentage", rate, fmt)

    # 3. Try Date
    dt = parse_date(cleaned)
    if dt:
        iso_str, fmt = dt
        return ("date", iso_str, fmt)

    # 4. Try Number
    num = parse_number(cleaned)
    if num:
        val, fmt = num
        return ("number", val, fmt)

    # Default: Text
    return ("text", cleaned, None)
