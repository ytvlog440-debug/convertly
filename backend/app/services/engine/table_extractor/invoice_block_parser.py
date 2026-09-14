"""
Convertly V2 — Invoice & Document Block Segmenter
Segments complex business documents (invoices, purchase orders, utility bills, receipts)
into distinct semantic zones:
  1. Top Key-Value Metadata (Vendor, Invoice #, Date, Bill-To)
  2. Main Line Items Table
  3. Bottom Financial Totals & Payment Terms (Subtotal, Tax, Total Due)
"""

import re
from typing import List, Tuple, Dict, Any, Optional
from app.services.engine.table_extractor.models import KeyValueBlock, TableBlock


class InvoiceBlockSegmenter:
    """
    Identifies and formats key-value blocks and summary totals outside the main line-item grid.
    """

    # Common invoice metadata prefixes
    KEY_VALUE_PATTERNS = [
        re.compile(r'^(invoice\s*(?:number|no|#)?|inv\s*#?)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(date|invoice\s*date|issue\s*date|billing\s*date)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(due\s*date|payment\s*due)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(po\s*(?:number|no|#)?|purchase\s*order)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(account\s*(?:number|no|#)?|acc\s*#?)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(bill\s*to|billed\s*to|client|customer)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(ship\s*to|deliver\s*to)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(subtotal|sub-total|net\s*amount)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(tax|vat|sales\s*tax|gst|hst)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(total\s*(?:due|amount)?|balance\s*due|amount\s*due)[:\s]+(.+)$', re.IGNORECASE),
        re.compile(r'^(terms|payment\s*terms)[:\s]+(.+)$', re.IGNORECASE),
    ]

    def extract_header_key_values(
        self,
        text_lines: List[Tuple[str, Tuple[float, float, float, float]]],
        table_top_y: float
    ) -> Optional[KeyValueBlock]:
        """
        Extracts key-value pairs positioned above the primary line-item table.
        """
        header_lines = [
            (txt, box) for txt, box in text_lines
            if box[3] <= table_top_y - 4.0 and txt.strip()
        ]

        if not header_lines:
            return None

        items: List[Tuple[str, str]] = []
        min_x = min(box[0] for _, box in header_lines)
        min_y = min(box[1] for _, box in header_lines)
        max_x = max(box[2] for _, box in header_lines)
        max_y = max(box[3] for _, box in header_lines)

        for line_text, _ in header_lines:
            cleaned = line_text.strip()
            # Try matching known patterns
            matched = False
            for pat in self.KEY_VALUE_PATTERNS:
                m = pat.match(cleaned)
                if m:
                    items.append((m.group(1).strip(), m.group(2).strip()))
                    matched = True
                    break

            if not matched:
                # Try splitting by colon or multiple spaces
                parts = re.split(r':\s+|  {2,}|\t', cleaned, maxsplit=1)
                if len(parts) == 2 and len(parts[0]) <= 30:
                    items.append((parts[0].strip(), parts[1].strip()))
                elif len(cleaned) <= 60:
                    items.append(("Info", cleaned))

        if items:
            return KeyValueBlock(items=items, bbox=(min_x, min_y, max_x, max_y), section="header")

        return None

    def extract_footer_summary_totals(
        self,
        text_lines: List[Tuple[str, Tuple[float, float, float, float]]],
        table_bottom_y: float
    ) -> Optional[KeyValueBlock]:
        """
        Extracts financial totals and terms positioned below the primary line-item table.
        """
        footer_lines = [
            (txt, box) for txt, box in text_lines
            if box[1] >= table_bottom_y + 4.0 and txt.strip()
        ]

        if not footer_lines:
            return None

        items: List[Tuple[str, str]] = []
        min_x = min(box[0] for _, box in footer_lines)
        min_y = min(box[1] for _, box in footer_lines)
        max_x = max(box[2] for _, box in footer_lines)
        max_y = max(box[3] for _, box in footer_lines)

        for line_text, _ in footer_lines:
            cleaned = line_text.strip()
            matched = False
            for pat in self.KEY_VALUE_PATTERNS:
                m = pat.match(cleaned)
                if m:
                    items.append((m.group(1).strip(), m.group(2).strip()))
                    matched = True
                    break

            if not matched:
                parts = re.split(r':\s+|  {2,}|\t', cleaned, maxsplit=1)
                if len(parts) == 2 and len(parts[0]) <= 30:
                    items.append((parts[0].strip(), parts[1].strip()))
                elif len(cleaned) <= 80:
                    items.append(("Note", cleaned))

        if items:
            return KeyValueBlock(items=items, bbox=(min_x, min_y, max_x, max_y), section="footer")

        return None
