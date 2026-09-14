"""
Convertly V2 — Document Intelligence & Table Classifier
Analyzes PDF byte streams and document structures to classify document type
(native vs scanned vs mixed), document genre (20 tabular domain genres),
and per-page table topology (lattice vs semi-bordered vs stream vs nested).
"""

import re
import fitz  # PyMuPDF
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter

from ..constants import (
    DocumentType,
    TableTopology,
    DocumentGenre,
    DEFAULT_SNAP_TOLERANCE,
    MIN_LINE_LENGTH_PTS,
)
from ..models import DocumentProfile
from ..interfaces import BaseClassifier
from ..config import TableExtractorConfig
from ..utils.parsing import clean_text


# Genre heuristic keywords map
GENRE_KEYWORD_MAP: Dict[DocumentGenre, List[str]] = {
    DocumentGenre.BANK_STATEMENT: [
        "statement", "account number", "opening balance", "closing balance",
        "withdrawal", "deposit", "transaction date", "debit", "credit", "ledger",
    ],
    DocumentGenre.CREDIT_CARD_STATEMENT: [
        "credit card", "card number", "payment due", "minimum payment",
        "credit limit", "available credit", "rewards balance", "apr",
    ],
    DocumentGenre.INVOICE: [
        "invoice", "bill to", "ship to", "invoice number", "invoice date",
        "due date", "subtotal", "tax", "total due", "amount due", "remit to",
    ],
    DocumentGenre.PURCHASE_ORDER: [
        "purchase order", "po number", "vendor", "requisition", "deliver to",
        "item description", "order date", "payment terms", "buyer",
    ],
    DocumentGenre.BALANCE_SHEET: [
        "balance sheet", "assets", "liabilities", "equity", "current assets",
        "total assets", "current liabilities", "retained earnings", "shareholder",
    ],
    DocumentGenre.PROFIT_AND_LOSS: [
        "profit and loss", "income statement", "revenue", "gross profit",
        "operating expenses", "ebitda", "net income", "cost of goods",
    ],
    DocumentGenre.FINANCIAL_REPORT: [
        "financial report", "fiscal year", "quarter ended", "consolidated",
        "cash flow", "operating activities", "investing activities",
    ],
    DocumentGenre.PAYROLL: [
        "payroll", "pay stub", "earnings", "deductions", "gross pay",
        "net pay", "ytd", "hourly rate", "overtime", "withholding",
    ],
    DocumentGenre.TAX_FORM: [
        "tax form", "internal revenue", "w-2", "1099", "tax return",
        "adjusted gross income", "federal tax", "exemptions", "taxable income",
    ],
    DocumentGenre.UTILITY_BILL: [
        "utility bill", "electric", "gas", "water service", "meter reading",
        "kwh", "service address", "billing period", "previous reading",
    ],
    DocumentGenre.TIMETABLE: [
        "timetable", "schedule", "monday", "tuesday", "wednesday", "thursday",
        "friday", "departure", "arrival", "period", "course code",
    ],
    DocumentGenre.ATTENDANCE_SHEET: [
        "attendance", "roll call", "present", "absent", "leave",
        "signature", "time in", "time out", "status",
    ],
    DocumentGenre.SCHOOL_RESULT: [
        "transcript", "grade report", "semester", "credits", "gpa",
        "marks", "grade point", "course title", "examination",
    ],
    DocumentGenre.MEDICAL_REPORT: [
        "medical report", "patient name", "diagnosis", "doctor", "physician",
        "laboratory", "test name", "reference range", "clinical",
    ],
    DocumentGenre.PRICE_LIST: [
        "price list", "unit price", "catalog", "sku", "msrp", "wholesale", "retail",
    ],
    DocumentGenre.SHIPPING_MANIFEST: [
        "manifest", "bill of lading", "consignee", "carrier", "tracking number",
        "vessel", "port of loading", "gross weight", "containers",
    ],
    DocumentGenre.INVENTORY_REPORT: [
        "inventory", "stock on hand", "warehouse", "reorder level",
        "qty available", "batch number", "bin location",
    ],
    DocumentGenre.GOVERNMENT_FORM: [
        "official form", "department of", "application number", "jurisdiction",
        "statutory", "affidavit", "registration",
    ],
    DocumentGenre.RESEARCH_TABLE: [
        "table 1", "table 2", "p-value", "confidence interval", "standard deviation",
        "n=", "mean", "median", "sample size", "correlation",
    ],
}


class DocumentClassifier(BaseClassifier):
    """
    Intelligent document inspector. Profiles PDF documents and pages to extract
    topological, visual, and semantic characteristics prior to extraction.
    """

    def profile_document(
        self,
        pdf_bytes: bytes,
        config: Optional[TableExtractorConfig] = None
    ) -> DocumentProfile:
        """
        Analyze the complete document byte stream to generate an authoritative DocumentProfile.
        """
        cfg = config or TableExtractorConfig()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)

        page_profiles: List[Dict[str, Any]] = []
        scanned_count = 0
        total_density = 0.0
        all_font_sizes: List[float] = []
        combined_text = []
        any_ruling_lines = False

        for page_idx in range(total_pages):
            page = doc[page_idx]
            p_prof = self._analyze_single_page(page, page_idx, cfg)
            page_profiles.append(p_prof)

            if p_prof["is_scanned"]:
                scanned_count += 1
            if p_prof["has_rulings"]:
                any_ruling_lines = True

            total_density += p_prof["char_density"]
            all_font_sizes.extend(p_prof["font_sizes"])
            combined_text.append(p_prof["sample_text"])

        doc.close()

        # Determine overall DocumentType
        if total_pages == 0:
            doc_type = DocumentType.NATIVE_TEXT.value
        elif scanned_count == total_pages:
            doc_type = DocumentType.SCANNED.value
        elif scanned_count > 0:
            doc_type = DocumentType.MIXED.value
        else:
            doc_type = DocumentType.NATIVE_TEXT.value

        # Calculate average density
        avg_density = total_density / max(1, total_pages)

        # Determine dominant font sizes (most frequent 3)
        size_counts = Counter([round(s, 1) for s in all_font_sizes if s > 0])
        dominant_sizes = [size for size, _ in size_counts.most_common(3)]

        # Classify Document Genre
        full_text_corpus = " ".join(combined_text).lower()
        genre = self._classify_genre(full_text_corpus)

        # Check for mixed layouts
        topologies = {p["topology"] for p in page_profiles}
        has_mixed_layouts = len(topologies) > 1

        return DocumentProfile(
            total_pages=total_pages,
            doc_type=doc_type,
            genre=genre,
            page_profiles=page_profiles,
            has_scanned_pages=scanned_count > 0,
            has_mixed_layouts=has_mixed_layouts,
            has_ruling_lines=any_ruling_lines,
            avg_char_density=round(avg_density, 5),
            dominant_font_sizes=dominant_sizes,
            metadata={
                "scanned_pages_count": scanned_count,
                "topologies_found": list(topologies),
            }
        )

    def profile_page(
        self,
        pdf_bytes: bytes,
        page_idx: int,
        config: Optional[TableExtractorConfig] = None
    ) -> Dict[str, Any]:
        """Profile an individual page within the document."""
        cfg = config or TableExtractorConfig()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if page_idx < 0 or page_idx >= len(doc):
            doc.close()
            raise IndexError(f"Page index {page_idx} out of range (document has {len(doc)} pages).")

        page = doc[page_idx]
        p_prof = self._analyze_single_page(page, page_idx, cfg)
        doc.close()
        return p_prof

    def _analyze_single_page(
        self,
        page: fitz.Page,
        page_idx: int,
        config: TableExtractorConfig
    ) -> Dict[str, Any]:
        """Internal page analysis routine using PyMuPDF vector and text extractions."""
        rect = page.rect
        width, height = rect.width, rect.height
        area = max(1.0, width * height)

        # 1. Text & Character density
        raw_text = page.get_text().strip()
        char_count = len(raw_text)
        char_density = char_count / area

        # 2. Scanned detection
        # Skip OCR automatically for text-based PDFs.
        # OCR must ONLY run for scanned/image PDFs (lacking native text and containing raster images).
        image_list = page.get_images()
        has_images = len(image_list) > 0
        is_scanned = (char_count < 30) and has_images

        # 3. Vector rulings analysis
        h_lines, v_lines = self._extract_rulings(page, config.thresholds.min_line_length)
        has_rulings = len(h_lines) > 0 or len(v_lines) > 0

        # 4. Topology classification
        topology = self._classify_page_topology(len(h_lines), len(v_lines), char_count)

        # 5. Font metrics
        font_sizes = []
        blocks = page.get_text("dict", flags=fitz.TEXTFLAGS_SEARCH).get("blocks", [])
        for b in blocks:
            if "lines" in b:
                for line in b["lines"]:
                    for span in line.get("spans", []):
                        if "size" in span:
                            font_sizes.append(span["size"])

        return {
            "page_idx": page_idx,
            "width": width,
            "height": height,
            "char_count": char_count,
            "char_density": char_density,
            "is_scanned": is_scanned,
            "has_rulings": has_rulings,
            "h_line_count": len(h_lines),
            "v_line_count": len(v_lines),
            "topology": topology,
            "font_sizes": font_sizes,
            "sample_text": raw_text[:500],
        }

    def _extract_rulings(
        self,
        page: fitz.Page,
        min_length: float
    ) -> Tuple[List[Dict[str, float]], List[Dict[str, float]]]:
        """Extract horizontal and vertical vector drawing paths."""
        drawings = page.get_drawings()
        h_lines = []
        v_lines = []

        for d in drawings:
            rect = d["rect"]
            w = rect.width
            h = rect.height

            # Horizontal line: width >= min_length and height is slim (< 4 pts)
            if w >= min_length and h <= 4.0:
                h_lines.append({"x0": rect.x0, "y0": rect.y0, "x1": rect.x1, "y1": rect.y1})
            # Vertical line: height >= min_length and width is slim (< 4 pts)
            elif h >= min_length and w <= 4.0:
                v_lines.append({"x0": rect.x0, "y0": rect.y0, "x1": rect.x1, "y1": rect.y1})

        return h_lines, v_lines

    def _classify_page_topology(
        self,
        h_line_count: int,
        v_line_count: int,
        char_count: int
    ) -> str:
        """
        Determine table topology from ruling lines and character volume:
        - Lattice: Both H-lines >= 2 and V-lines >= 2 (bordered grid)
        - Semi-bordered: H-lines >= 2 but V-lines < 2 (horizontal rules only)
        - Stream: H-lines < 2 and V-lines < 2 (borderless column alignment)
        - Nested: High line counts with complex dense subdivisions
        """
        if h_line_count >= 10 and v_line_count >= 10 and char_count > 300:
            return TableTopology.NESTED.value
        elif h_line_count >= 2 and v_line_count >= 2:
            return TableTopology.LATTICE.value
        elif h_line_count >= 2:
            return TableTopology.SEMI_BORDERED.value
        else:
            return TableTopology.STREAM.value

    def _classify_genre(self, corpus: str) -> str:
        """
        Evaluate vocabulary occurrences to find the highest-matching DocumentGenre.
        Defaults to GENERIC_TABLE if insufficient specialized markers match.
        """
        if not corpus:
            return DocumentGenre.GENERIC_TABLE.value

        best_genre = DocumentGenre.GENERIC_TABLE
        max_matches = 0

        for genre, keywords in GENRE_KEYWORD_MAP.items():
            matches = sum(1 for kw in keywords if kw in corpus)
            if matches > max_matches:
                max_matches = matches
                best_genre = genre

        # Require at least 2 strong keyword hits for specialized genre attribution
        if max_matches >= 2:
            return best_genre.value

        return DocumentGenre.GENERIC_TABLE.value
