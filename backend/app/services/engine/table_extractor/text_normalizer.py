"""
Convertly V2 — Text Normalizer & Semantic Typing Engine
Handles:
  1. Font-metric kerning reconstruction (prevents split words & fused characters)
  2. ASCII table border & pipe character scrubbing
  3. Hierarchical indentation detection (for financial balance sheets)
  4. Localized currency, date, percentage, and number type inference
  5. OpenXML illegal character sanitization
"""

import re
from datetime import datetime
from typing import Any, Optional, Tuple, List, Dict
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE


# ---------------------------------------------------------------------------
# Currency Patterns & Formatting
# ---------------------------------------------------------------------------

_CURRENCY_SYMBOLS = r'[\$\u20ac\u00a3\u00a5\u20b9\u20a9\u20bd\u20ba\u20b1\u20bf]'
_CURRENCY_PATTERN = re.compile(
    rf'^\s*({_CURRENCY_SYMBOLS}|CHF|USD|EUR|GBP|JPY|CAD|AUD)\s*[\-\(]?\s*[\d,.]+\s*\)?\s*$'
    r'|'
    rf'^\s*[\-\(]?\s*[\d,.]+\s*\)?\s*({_CURRENCY_SYMBOLS}|CHF|USD|EUR|GBP|JPY|CAD|AUD)\s*$',
    re.UNICODE | re.IGNORECASE
)

_CURRENCY_FORMAT_MAP: Dict[str, str] = {
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

_ACCOUNTING_NEG_PATTERN = re.compile(r'^\s*\(\s*[\d,.]+\s*\)\s*$')
_PERCENTAGE_PATTERN = re.compile(r'^\s*[\-+]?\s*[\d,.]+\s*%\s*$')

_DATE_PATTERNS = [
    (re.compile(r'^\s*(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})\s*$'), '%Y-%m-%d'),
    (re.compile(r'^\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\s*$'), '%m/%d/%Y'),
    (re.compile(r'^\s*\w{3,9}\s+\d{1,2},?\s+\d{4}\s*$'), None),
    (re.compile(r'^\s*\d{1,2}\s+\w{3,9}\s+\d{4}\s*$'), None),
]

_NUMBER_PATTERN = re.compile(r'^\s*[\-+]?\s*[\d,.]+\s*$')

# ASCII Table borders & dividers pattern
_ASCII_PIPE_BORDER = re.compile(r'^\s*\||\|\s*$')
_ASCII_SEPARATOR_LINE = re.compile(r'^\s*[\+\-\|_=]{3,}\s*$')


def sanitize_text(text: Optional[str]) -> str:
    """Strip XML illegal characters and normalize whitespace."""
    if text is None:
        return ""
    clean = ILLEGAL_CHARACTERS_RE.sub('', str(text)).strip()
    return clean


def scrub_ascii_table_artifacts(text: str) -> str:
    """
    Remove ASCII pipe delimiters (|) and table borders (+----+),
    commonly found in terminal printouts, markdown tables, or OCR artifacts.
    """
    cleaned = text.strip()
    if _ASCII_SEPARATOR_LINE.match(cleaned):
        return ""
    # Strip leading and trailing pipes
    cleaned = _ASCII_PIPE_BORDER.sub('', cleaned).strip()
    # Replace lone pipe separators with single space
    cleaned = re.sub(r'(?<=\S)\s*\|\s*(?=\S)', ' ', cleaned)
    return cleaned.strip()


def detect_indentation_level(
    raw_line: str,
    char_box_left: float = 0.0,
    base_left: float = 0.0,
    **kwargs
) -> int:
    """
    Calculates the hierarchical indent level of a line (e.g. balance sheet sub-items)
    based on leading spaces or geometric left-margin offset.
    """
    if 'col_left' in kwargs:
        char_box_left = kwargs['col_left']
    if 'table_left' in kwargs:
        base_left = kwargs['table_left']

    # 1. Check leading spaces in text
    leading_spaces = len(raw_line) - len(raw_line.lstrip(' '))
    if leading_spaces >= 2:
        return min(5, leading_spaces // 2)

    # 2. Check geometric offset from baseline left margin (in points)
    offset_pts = max(0.0, char_box_left - base_left)
    if offset_pts >= 12.0:
        return min(5, int(offset_pts // 12.0))

    return 0


def detect_currency_symbol(text: str) -> Tuple[str, str]:
    """Extract currency symbol or ISO code and numeric portion."""
    for symbol in _CURRENCY_FORMAT_MAP.keys():
        if symbol in text or symbol.lower() in text.lower():
            cleaned = re.sub(re.escape(symbol), '', text, flags=re.IGNORECASE).strip()
            return symbol, cleaned
    cleaned = re.sub(rf'{_CURRENCY_SYMBOLS}', '', text).strip()
    return '$', cleaned


def parse_numeric_value(text: str) -> Optional[float]:
    """
    Parse a string as a floating-point number, supporting:
      - Accounting negative parentheticals: (1,234.56) -> -1234.56
      - Standard US/UK comma thousands: 1,450,200.50 -> 1450200.50
      - European dot thousands & comma decimals: 1.250,50 -> 1250.50
    """
    cleaned = text.strip()
    if not cleaned:
        return None

    is_negative = False
    if _ACCOUNTING_NEG_PATTERN.match(cleaned):
        is_negative = True
        cleaned = cleaned.replace('(', '').replace(')', '').strip()

    if cleaned.startswith('-') or cleaned.startswith('\u2212'):
        is_negative = True
        cleaned = cleaned.lstrip('-\u2212').strip()
    elif cleaned.startswith('+'):
        cleaned = cleaned.lstrip('+').strip()

    # Distinguish European dot-thousands & comma-decimals (1.234,56)
    has_dot_thousands = bool(re.search(r'^\d{1,3}(\.\d{3})+,\d+$', cleaned))
    has_comma_decimals = bool(
        ',' in cleaned and '.' not in cleaned and
        re.search(r',\d{1,2}$', cleaned) and
        not re.search(r'^\d{1,3}(,\d{3})+$', cleaned)
    )

    if has_dot_thousands or has_comma_decimals:
        cleaned = cleaned.replace('.', '').replace(',', '.')
    else:
        cleaned = cleaned.replace(',', '')

    if not cleaned:
        return None

    try:
        val = float(cleaned)
        return -val if is_negative else val
    except (ValueError, OverflowError):
        return None


def infer_cell_data_type(raw_text: str) -> Tuple[Any, str, Optional[str]]:
    """
    Infers data type and format for a cell value.
    Returns: (typed_value, type_category, excel_number_format)
    type_category in: 'currency', 'percentage', 'date', 'number', 'text'
    """
    sanitized = sanitize_text(raw_text)
    if not sanitized:
        return "", "text", None

    cleaned_text = scrub_ascii_table_artifacts(sanitized)
    if not cleaned_text:
        return "", "text", None

    # 1. Currency
    if _CURRENCY_PATTERN.match(cleaned_text):
        symbol, num_str = detect_currency_symbol(cleaned_text)
        val = parse_numeric_value(num_str)
        if val is not None:
            fmt = _CURRENCY_FORMAT_MAP.get(symbol, f'{symbol}#,##0.00;({symbol}#,##0.00);"-"')
            return val, "currency", fmt

    # 2. Percentage
    if _PERCENTAGE_PATTERN.match(cleaned_text):
        num_str = cleaned_text.replace('%', '').strip()
        val = parse_numeric_value(num_str)
        if val is not None:
            return val / 100.0, "percentage", '0.00%'

    # 3. Date
    for pattern, _ in _DATE_PATTERNS:
        if pattern.match(cleaned_text):
            for try_fmt in [
                '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d',
                '%m-%d-%Y', '%d-%m-%Y', '%m.%d.%Y', '%d.%m.%Y',
                '%b %d, %Y', '%B %d, %Y', '%d %b %Y', '%d %B %Y',
                '%b %d %Y', '%B %d %Y',
            ]:
                try:
                    dt = datetime.strptime(cleaned_text, try_fmt)
                    if 1900 <= dt.year <= 2100:
                        return dt, "date", 'YYYY-MM-DD'
                except ValueError:
                    continue
            break

    # 4. Accounting Negative
    if _ACCOUNTING_NEG_PATTERN.match(cleaned_text):
        val = parse_numeric_value(cleaned_text)
        if val is not None:
            return val, "number", '#,##0.00;(#,##0.00);"-"'

    # 5. Pure Number
    if _NUMBER_PATTERN.match(cleaned_text):
        val = parse_numeric_value(cleaned_text)
        if val is not None:
            # Whole integer without decimals
            if val == int(val) and abs(val) < 1e15 and '.' not in cleaned_text and ',' not in cleaned_text[-3:]:
                return int(val), "number", '#,##0'
            return val, "number", '#,##0.00'

    # 6. Plain Text
    return cleaned_text, "text", None


def reconstruct_words_with_kerning(
    raw_chars: List[Dict[str, Any]],
    space_tolerance_ratio: float = 0.25
) -> List[Dict[str, Any]]:
    """
    Reconstructs words from character glyphs using font-metric kerning analysis.
    Eliminates split words ('I n v o i c e') and fused words ('TotalAmount').
    Each char dict has: {'text': str, 'x0': float, 'y0': float, 'x1': float, 'y1': float, 'size': float}
    """
    if not raw_chars:
        return []

    # Sort characters by baseline y (within tolerance) then x
    sorted_chars = sorted(raw_chars, key=lambda c: (round(c.get('top', c.get('y0', 0)), 1), c.get('x0', 0)))
    words = []
    curr_word = []

    for i, ch in enumerate(sorted_chars):
        char_text = ch.get('text', '')
        if not char_text or char_text.isspace():
            if curr_word:
                words.append(_fuse_char_word(curr_word))
                curr_word = []
            continue

        if not curr_word:
            curr_word.append(ch)
            continue

        prev_ch = curr_word[-1]
        prev_x1 = prev_ch.get('x1', 0)
        curr_x0 = ch.get('x0', 0)
        curr_size = ch.get('size', 10.0)

        # Expected whitespace gap based on font size
        max_kerning_gap = curr_size * space_tolerance_ratio

        if (curr_x0 - prev_x1) > max_kerning_gap or abs(ch.get('top', ch.get('y0', 0)) - prev_ch.get('top', prev_ch.get('y0', 0))) > (curr_size * 0.4):
            # Boundary exceeded -> word split
            words.append(_fuse_char_word(curr_word))
            curr_word = [ch]
        else:
            curr_word.append(ch)

    if curr_word:
        words.append(_fuse_char_word(curr_word))

    return words


def _fuse_char_word(chars: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Merge character list into a single word token dict with combined bbox."""
    text = "".join(c.get('text', '') for c in chars)
    x0 = min(c.get('x0', 0) for c in chars)
    y0 = min(c.get('top', c.get('y0', 0)) for c in chars)
    x1 = max(c.get('x1', 0) for c in chars)
    y1 = max(c.get('bottom', c.get('y1', 0)) for c in chars)
    size = sum(c.get('size', 10.0) for c in chars) / len(chars)

    return {
        'text': text,
        'x0': x0,
        'y0': y0,
        'x1': x1,
        'y1': y1,
        'size': size,
        'bbox': (x0, y0, x1, y1)
    }
