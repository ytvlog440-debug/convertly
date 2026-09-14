"""
Convertly V2 — Enterprise Table Extraction Subsystem
Public interface for deep document decomposition, dual-path table extraction,
and high-fidelity Excel workbook generation.
"""

from typing import List, Dict, Any, Optional, Tuple
import fitz  # PyMuPDF
import os

from app.core.logging import logger
from dataclasses import asdict
from app.services.engine.table_extractor.constants import (
    DocumentType,
    TableTopology,
    DocumentGenre,
    EngineType,
)
from app.services.engine.table_extractor.models import (
    TableCell,
    TableRow,
    TableBlock,
    PageLayout,
    KeyValueBlock,
    BoundingBox,
    ConfidenceScore,
    QualityScore,
    ExtractionCandidate,
    DocumentProfile,
    RoutingDecision,
    ValidationReport,
    EngineMetrics,
    ExtractionResult,
)
from app.services.engine.table_extractor.errors import (
    TableExtractorError,
    ExtractionError,
    OCRFailure,
    ValidationError,
    RoutingError,
    RepairError,
    ExcelWriterError,
    ConfigurationError,
    QualityThresholdError,
)
from app.services.engine.table_extractor.config import TableExtractorConfig
from app.services.engine.table_extractor.container import ExtractorContainer, get_default_container
from app.services.engine.table_extractor.logging import StageLogger, stage_timer
from app.services.engine.table_extractor.interfaces import (
    BaseExtractor,
    BaseClassifier,
    BaseRouter,
    BaseArbiter,
    BaseValidator,
    BaseReconstructor,
    BaseExcelWriter,
)
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
    Combines Document Intelligence, Dynamic Engine Routing, Multi-Engine
    Arbitration, Cell Reconstruction & Deterministic Repair, and
    High-Fidelity OpenXML Excel generation.
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
        Executes the complete document layout and table extraction pipeline using the
        modular Enterprise V2 architecture (Intelligence -> Router -> Arbiter -> Reconstructor -> Validator -> ExcelWriter).
        """
        options = options or {}
        config = TableExtractorConfig.from_options(options)
        container = get_default_container()

        if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) == 0:
            raise ExtractionError(f"PDF file is empty or does not exist: {pdf_path}")

        try:
            doc = fitz.open(pdf_path)
        except Exception as e:
            raise ExtractionError(f"Failed to open or parse damaged PDF file: {e}") from e

        # Check password / encryption
        was_encrypted = False
        if doc.is_encrypted or doc.needs_pass:
            was_encrypted = True
            pwd = options.get("password")
            if pwd:
                authenticated = doc.authenticate(pwd)
                if not authenticated:
                    doc.close()
                    raise ExtractionError("Invalid password provided for encrypted PDF document.")
            else:
                doc.close()
                raise ExtractionError("PDF document is encrypted and requires a password.")

        total_pages = len(doc)
        if total_pages == 0:
            doc.close()
            # Return empty response for 0-page documents
            return {
                "total_pages": 0,
                "total_tables_extracted": 0,
                "total_rows": 0,
                "worksheets_created": 0,
                "pages_with_data": 0,
                "total_pages_processed": 0,
                "quality_score": 0.0,
                "validation_reports": [],
            }

        if was_encrypted:
            pdf_bytes = doc.tobytes(encryption=fitz.PDF_ENCRYPT_NONE)
        else:
            with open(pdf_path, "rb") as f:
                pdf_bytes = f.read()

        from app.core.timing import log_stage

        logger.info(f"[EnterpriseTableExtractor] Processing {total_pages} pages: {os.path.basename(pdf_path)}")

        # Stage 5: PDF loading (PyMuPDF)
        with log_stage("PDF loading (PyMuPDF)", extra=f"{total_pages} pages"):
            pass

        # Stage 6: Document classification
        with log_stage("Document classification", extra=f"pages: {total_pages}"):
            classifier = container.get_classifier()
            profile = classifier.profile_document(pdf_bytes, config)

        # Stage 7: Routing engine
        with log_stage("Routing engine"):
            router = container.get_router()
            decision = router.route(profile, config)

        # Stage 8: OCR detection
        with log_stage("OCR detection", extra=f"doc_type={profile.doc_type}, ocr_required={decision.ocr_required}"):
            if not decision.ocr_required and options.get("ocr", False):
                logger.info("[EnterpriseTableExtractor] Text-based PDF detected with native character layers. Skipping OCR automatically.")

        arbiter = container.get_arbiter()
        reconstructor = container.get_reconstructor()
        validator = container.get_validator()

        def _process_single_page(p_idx: int, p_doc: fitz.Document) -> Tuple[int, PageLayout, List[Dict[str, Any]], Optional[float]]:
            page = p_doc[p_idx]
            p_rect = page.rect
            width, height = p_rect.width, p_rect.height
            page_val_reports: List[Dict[str, Any]] = []
            q_score_val: Optional[float] = None

            primary_engine_name = decision.page_routes.get(p_idx, decision.primary_engine)
            tables: List[TableBlock] = []

            # Stage 9: Table extraction
            with log_stage("Table extraction", extra=f"page {p_idx + 1}, engine={primary_engine_name}"):
                try:
                    primary_engine = container.get_extractor(primary_engine_name)
                    candidate = primary_engine.extract_page(pdf_bytes, p_idx, config)
                    q_score = arbiter.score_candidate(candidate, config)

                    if (q_score.score < config.confidence.fallback_threshold) and decision.fallback_engine and decision.fallback_engine != primary_engine_name:
                        fallback_engine = container.get_extractor(decision.fallback_engine)
                        fallback_candidate = fallback_engine.extract_page(pdf_bytes, p_idx, config)
                        winner = arbiter.arbitrate([candidate, fallback_candidate], config)
                    else:
                        winner = candidate

                    # Stage 10: Reconstruction
                    if winner.tables:
                        with log_stage("Reconstruction", extra=f"page {p_idx + 1}"):
                            repaired_tables = [reconstructor.reconstruct(t, config) for t in winner.tables]
                            tables = repaired_tables

                        # Stage 11: Validation
                        with log_stage("Validation", extra=f"page {p_idx + 1}"):
                            for t in tables:
                                val_rep = validator.validate(t, config)
                                page_val_reports.append(asdict(val_rep))

                        q_score_val = winner.quality.score
                except Exception as e:
                    logger.warning(f"[EnterpriseTableExtractor] Modular extraction on page {p_idx + 1} encountered: {e}. Attempting fallback.", exc_info=True)

            if not tables:
                fallback_layout = self._analyze_page(page, p_idx, force_ocr=decision.ocr_required)
                tables = fallback_layout.tables
                kvs = fallback_layout.key_values
            else:
                kvs = []
                text_lines = self._extract_text_lines_with_bbox(page)
                if text_lines and tables:
                    table_top = tables[0].bbox[1]
                    table_bot = tables[0].bbox[3]
                    hdr_kv = self.invoice_segmenter.extract_header_key_values(text_lines, table_top)
                    if hdr_kv:
                        kvs.append(hdr_kv)
                    ftr_kv = self.invoice_segmenter.extract_footer_summary_totals(text_lines, table_bot)
                    if ftr_kv:
                        kvs.append(ftr_kv)

            layout = PageLayout(
                page_idx=p_idx,
                width=width,
                height=height,
                is_scanned=(decision.page_routes.get(p_idx) == EngineType.OCR_TSV.value),
                tables=tables,
                key_values=kvs,
            )
            return (p_idx, layout, page_val_reports, q_score_val)

        page_results: List[Tuple[int, PageLayout, List[Dict[str, Any]], Optional[float]]] = []

        import concurrent.futures
        import gc

        max_workers = min(config.workers.max_workers, total_pages)
        # For small PDFs (< 4 pages), sequential execution is faster and avoids thread pool overhead.
        # For larger PDFs, parallel execution is bounded with per-page timeouts.
        if total_pages >= 4 and max_workers > 1:
            def _thread_worker(p_idx: int):
                thread_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                try:
                    return _process_single_page(p_idx, thread_doc)
                finally:
                    thread_doc.close()

            timeout = max(15.0, float(config.workers.timeout_seconds_per_page * total_pages))
            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {executor.submit(_thread_worker, i): i for i in range(total_pages)}
                try:
                    for future in concurrent.futures.as_completed(futures, timeout=timeout):
                        page_results.append(future.result(timeout=10.0))
                except (concurrent.futures.TimeoutError, Exception) as exc:
                    logger.error(f"[EnterpriseTableExtractor] Processing error or timeout ({timeout}s): {exc}. Cleaning up futures.")
                    for f in futures:
                        f.cancel()
                    executor.shutdown(wait=False, cancel_futures=True)
                    # Process any missing pages sequentially via fallback
                    completed_indices = {r[0] for r in page_results}
                    for p_idx in range(total_pages):
                        if p_idx not in completed_indices:
                            page_results.append(_process_single_page(p_idx, doc))
            doc.close()
        else:
            try:
                for p_idx in range(total_pages):
                    page_results.append(_process_single_page(p_idx, doc))
            finally:
                doc.close()

        # Sort results strictly by page index
        page_results.sort(key=lambda item: item[0])

        page_layouts: List[PageLayout] = [item[1] for item in page_results]
        validation_reports: List[Dict[str, Any]] = [rep for item in page_results for rep in item[2]]
        total_quality_scores: List[float] = [item[3] for item in page_results if item[3] is not None]

        # Trigger garbage collection for large documents
        if total_pages >= config.memory.streaming_page_threshold and config.memory.aggressive_gc:
            gc.collect()

        # Stage 12: Excel generation & Stage 13: File writing
        logger.info(f"[EnterpriseTableExtractor] Synthesizing OpenXML XLSX workbook: {output_excel_path}")
        with log_stage("Excel generation", extra=f"{len(page_layouts)} page layouts"):
            pass

        with log_stage("File writing", extra=output_excel_path):
            result_meta = self.excel_writer.write_workbook(page_layouts, output_excel_path)

        avg_quality = (sum(total_quality_scores) / len(total_quality_scores)) if total_quality_scores else 1.0

        import json
        import dataclasses
        def _safe_serialize(val):
            return json.loads(json.dumps(val, default=lambda o: o.value if hasattr(o, 'value') else (dataclasses.asdict(o) if dataclasses.is_dataclass(o) else str(o))))

        return {
            "total_pages": total_pages,
            "document_profile": _safe_serialize(profile),
            "routing_decision": _safe_serialize(decision),
            "quality_score": round(avg_quality, 4),
            "validation_reports": _safe_serialize(validation_reports),
            **result_meta
        }

    def _analyze_page(self, page: fitz.Page, page_idx: int, force_ocr: bool) -> PageLayout:
        """Analyzes a single page using vector, raster, and text spatial algorithms."""
        p_rect = page.rect
        width, height = p_rect.width, p_rect.height

        # 1. Text density analysis to determine if scanned
        raw_text = page.get_text().strip()
        # Automatically skip OCR for text-based PDFs. OCR must ONLY run for scanned/image PDFs.
        is_scanned = (len(raw_text) < 30) and bool(page.get_images())
        if force_ocr and len(raw_text) >= 30:
            logger.info(f"[EnterpriseTableExtractor] Page {page_idx + 1} has native text ({len(raw_text)} chars). Skipping OCR automatically.")
            is_scanned = False

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
                output_type=pytesseract.Output.DICT,
                timeout=15,
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
