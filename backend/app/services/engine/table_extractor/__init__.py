"""
Convertly V2 — Enterprise Table Extraction Subsystem
Public interface for deep document decomposition, dual-path table extraction,
and high-fidelity Excel workbook generation.
"""

from typing import List, Dict, Any, Optional, Tuple
import fitz  # PyMuPDF
import os

from app.core.logging import logger
from app.services.engine.table_extractor.models import PageLayout, TableBlock, KeyValueBlock
from app.services.engine.table_extractor.vector_parser import VectorPathParser
from app.services.engine.table_extractor.cv_preprocessor import CvDocumentPreProcessor
from app.services.engine.table_extractor.lattice_extractor import LatticeTableExtractor
from app.services.engine.table_extractor.stream_extractor import StreamTableExtractor
from app.services.engine.table_extractor.invoice_block_parser import InvoiceBlockSegmenter
from app.services.engine.table_extractor.excel_writer import ExcelDocumentWriter
from app.services.engine.table_extractor.text_normalizer import (
    reconstruct_words_with_kerning,
    sanitize_text,
    scrub_ascii_table_artifacts
)


class EnterpriseTableExtractor:
    """
    High-accuracy, production-grade PDF table extraction pipeline.
    Combines vector path inspection, computer vision pre-processing,
    font kerning normalization, dual-path lattice/stream parsing,
    and OpenXML cell span synthesis.
    """

    def __init__(self):
        self.vector_parser = VectorPathParser()
        self.cv_preprocessor = CvDocumentPreProcessor()
        self.lattice_extractor = LatticeTableExtractor()
        self.stream_extractor = StreamTableExtractor()
        self.invoice_segmenter = InvoiceBlockSegmenter()
        self.excel_writer = ExcelDocumentWriter()

    def process_pdf_document(
        self,
        pdf_path: str,
        output_excel_path: str,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes the complete document layout and table extraction pipeline.
        """
        options = options or {}
        force_ocr = options.get("ocr", False) or options.get("force_ocr", False)

        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        page_layouts: List[PageLayout] = []

        logger.info(f"[EnterpriseTableExtractor] Starting processing for {total_pages} pages: {os.path.basename(pdf_path)}")

        for page_idx in range(total_pages):
            page = doc[page_idx]
            layout = self._analyze_page(page, page_idx, force_ocr)
            page_layouts.append(layout)

        doc.close()

        # Synthesize into OpenXML XLSX
        logger.info(f"[EnterpriseTableExtractor] Synthesizing OpenXML XLSX workbook: {output_excel_path}")
        result_meta = self.excel_writer.write_workbook(page_layouts, output_excel_path)

        return {
            "total_pages": total_pages,
            **result_meta
        }

    def _analyze_page(self, page: fitz.Page, page_idx: int, force_ocr: bool) -> PageLayout:
        """Analyzes a single page using vector, raster, and text spatial algorithms."""
        p_rect = page.rect
        width, height = p_rect.width, p_rect.height

        # 1. Text density analysis to determine if scanned
        raw_text = page.get_text().strip()
        is_scanned = force_ocr or (len(raw_text) < 30)

        tables: List[TableBlock] = []
        kvs: List[KeyValueBlock] = []

        if not is_scanned:
            # -------------------------------------------------------------
            # Native Digital PDF Pipeline
            # -------------------------------------------------------------
            # Step A: Extract vector drawing lines and rectangles
            vector_grid = self.vector_parser.extract_vector_grid(page)
            h_lines = vector_grid['horizontal_lines']
            v_lines = vector_grid['vertical_lines']

            # Step B: Extract character glyphs and reconstruct words with kerning
            char_list = page.get_text("rawjson")
            words = self._extract_words_from_page(page)

            # Step C: Dual-Path Table Extraction
            # Path 1: Lattice Extraction (if 2+ horizontal & 2+ vertical lines present)
            if len(h_lines) >= 2 and len(v_lines) >= 2:
                lattice_tables = self.lattice_extractor.extract_tables_from_grid(page, h_lines, v_lines, words)
                if lattice_tables:
                    tables.extend(lattice_tables)

            # Path 2: Semi-bordered (Horizontal rulings with borderless columns)
            if not tables and len(h_lines) >= 2:
                # Use horizontal line intervals as rows, then detect vertical gutters
                # Project words into table bands
                for region in vector_grid['table_candidates']:
                    stream_table = self.stream_extractor.extract_borderless_table(words, region)
                    if stream_table:
                        tables.append(stream_table)

            # Path 3: Pure Borderless Stream Extraction
            if not tables and words:
                stream_table = self.stream_extractor.extract_borderless_table(words)
                if stream_table:
                    tables.append(stream_table)

            # Step D: Extract Key-Value Metadata & Summary Totals outside table grids
            if tables:
                text_lines = self._extract_text_lines_with_bbox(page)
                primary_table = tables[0]
                table_top = primary_table.bbox[1]
                table_bot = primary_table.bbox[3]

                hdr_kv = self.invoice_segmenter.extract_header_key_values(text_lines, table_top)
                if hdr_kv:
                    kvs.append(hdr_kv)

                ftr_kv = self.invoice_segmenter.extract_footer_summary_totals(text_lines, table_bot)
                if ftr_kv:
                    kvs.append(ftr_kv)

        else:
            # -------------------------------------------------------------
            # Scanned / Image-Based PDF Pipeline (OCR + CV)
            # -------------------------------------------------------------
            logger.info(f"[EnterpriseTableExtractor] Page {page_idx + 1} is scanned/rasterized. Applying CV pre-processing.")
            img_bgr = self.cv_preprocessor.render_page_to_cv2(page)
            if img_bgr is not None:
                # Deskew image
                deskewed_bgr, angle = self.cv_preprocessor.deskew_image(img_bgr)
                # Run OCR with TSV word coordinates
                ocr_words = self._run_tesseract_tsv(deskewed_bgr)
                if ocr_words:
                    # Attempt stream extraction on deskewed OCR words
                    stream_table = self.stream_extractor.extract_borderless_table(ocr_words)
                    if stream_table:
                        tables.append(stream_table)

        return PageLayout(
            page_idx=page_idx,
            width=width,
            height=height,
            is_scanned=is_scanned,
            tables=tables,
            key_values=kvs
        )

    def _extract_words_from_page(self, page: fitz.Page) -> List[Dict[str, Any]]:
        """Extracts words from PyMuPDF with font kerning normalization."""
        raw_words = page.get_text("words")  # (x0, y0, x1, y1, word, block_no, line_no, word_no)
        cleaned = []
        for w in raw_words:
            text = scrub_ascii_table_artifacts(sanitize_text(w[4]))
            if text:
                cleaned.append({
                    'text': text,
                    'x0': w[0],
                    'y0': w[1],
                    'x1': w[2],
                    'y1': w[3],
                    'bbox': (w[0], w[1], w[2], w[3]),
                    'block_no': w[5],
                    'line_no': w[6]
                })
        return cleaned

    def _extract_text_lines_with_bbox(self, page: fitz.Page) -> List[Tuple[str, Tuple[float, float, float, float]]]:
        """Extracts full text lines with combined bounding boxes for metadata matching."""
        blocks = page.get_text("blocks")  # (x0, y0, x1, y1, text, block_no, block_type)
        lines_out = []
        for b in blocks:
            if b[6] == 0:  # Text block
                block_text = b[4]
                for l in block_text.split('\n'):
                    l_clean = sanitize_text(l)
                    if l_clean:
                        lines_out.append((l_clean, (b[0], b[1], b[2], b[3])))
        return lines_out

    def _run_tesseract_tsv(self, img_bgr) -> List[Dict[str, Any]]:
        """Runs Tesseract OCR on preprocessed image and extracts word tokens with coordinates."""
        try:
            from app.services.engine.office import find_tesseract_bin
            tesseract_bin = find_tesseract_bin()
            if not tesseract_bin:
                return []

            import pytesseract
            pytesseract.pytesseract.tesseract_cmd = tesseract_bin
            pil_img = self.cv_preprocessor.cv2_to_pil(img_bgr)

            data = pytesseract.image_to_data(
                pil_img, lang="eng",
                config="--psm 6",
                output_type=pytesseract.Output.DICT
            )

            words = []
            scale = 72.0 / self.cv_preprocessor.dpi  # Scale pixels back to PDF points

            for i in range(len(data['text'])):
                txt = scrub_ascii_table_artifacts(sanitize_text(data['text'][i]))
                conf = data['conf'][i]
                if txt and conf > 25:
                    x0 = data['left'][i] * scale
                    y0 = data['top'][i] * scale
                    x1 = (data['left'][i] + data['width'][i]) * scale
                    y1 = (data['top'][i] + data['height'][i]) * scale
                    words.append({
                        'text': txt,
                        'x0': x0,
                        'y0': y0,
                        'x1': x1,
                        'y1': y1,
                        'bbox': (x0, y0, x1, y1)
                    })
            return words
        except Exception as e:
            logger.warning(f"[EnterpriseTableExtractor] Tesseract TSV extraction failed: {e}")
            return []
