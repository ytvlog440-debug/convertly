"""
Convertly V2 — Enterprise OCR TSV Extraction Engine
Handles scanned and rasterized PDFs using computer-vision preprocessing,
Tesseract TSV coordinate parsing, and post-OCR tabular projection.
"""

import fitz  # PyMuPDF
from typing import List, Dict, Any, Optional, Tuple

from ..constants import (
    EngineType,
    TableTopology,
    DEFAULT_OCR_DPI,
    MIN_OCR_CONFIDENCE,
)
from ..models import (
    TableCell,
    TableRow,
    TableBlock,
    ExtractionCandidate,
    ConfidenceScore,
    QualityScore,
)
from ..interfaces import BaseExtractor
from ..config import TableExtractorConfig
from ..logging import stage_timer
from ..utils.parsing import clean_text, clean_ocr_artifacts, detect_cell_data_type


class OCRExtractor(BaseExtractor):
    """
    Extracts tabular data from scanned or rasterized PDF pages using image rendering,
    TSV token extraction, and stream geometry projection.
    """

    @property
    def name(self) -> str:
        return EngineType.OCR_TSV.value

    def extract_page(
        self,
        pdf_bytes: bytes,
        page_idx: int,
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> ExtractionCandidate:
        """Extract table from scanned PDF page using OCR."""
        cfg = config or TableExtractorConfig()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        if page_idx < 0 or page_idx >= len(doc):
            doc.close()
            raise IndexError(f"Page index {page_idx} out of range (total {len(doc)} pages).")

        page = doc[page_idx]

        with stage_timer("ocr_extraction", engine_name=self.name, page_idx=page_idx) as st:
            tables, ocr_conf = self._extract_tables_from_page(page, page_idx, cfg, st)
            cell_count = sum(t.row_count * t.col_count for t in tables)
            st.set_counts(tables=len(tables), cells=cell_count)

            conf = self._compute_confidence(tables, ocr_conf)
            st.set_confidence(conf.overall)
            metrics = st.to_metrics()

        doc.close()

        return ExtractionCandidate(
            engine_type=self.name,
            tables=tables,
            confidence=conf,
            quality=QualityScore(score=conf.overall, is_acceptable=conf.overall >= cfg.confidence.min_acceptable_quality),
            metrics=metrics,
            warnings=metrics.warnings,
        )

    def extract_document(
        self,
        pdf_bytes: bytes,
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> List[ExtractionCandidate]:
        """Extract OCR tables across all pages."""
        cfg = config or TableExtractorConfig()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)
        doc.close()

        candidates = []
        for p in range(total_pages):
            candidates.append(self.extract_page(pdf_bytes, p, cfg, **kwargs))
        return candidates

    def _extract_tables_from_page(
        self,
        page: fitz.Page,
        page_idx: int,
        config: TableExtractorConfig,
        st: Any
    ) -> Tuple[List[TableBlock], float]:
        """Renders page and extracts OCR word tokens."""
        dpi = config.ocr.dpi
        words = []
        avg_conf = 85.0

        # Check if tesseract binary is available
        tess_cmd = config.ocr.tesseract_cmd
        if not tess_cmd:
            try:
                from app.services.engine.office import find_tesseract_bin
                tess_cmd = find_tesseract_bin()
            except ImportError:
                tess_cmd = None

        if tess_cmd:
            try:
                import pytesseract
                from PIL import Image
                import io

                pytesseract.pytesseract.tesseract_cmd = tess_cmd
                pix = page.get_pixmap(dpi=dpi)
                img = Image.open(io.BytesIO(pix.tobytes("png")))

                data = pytesseract.image_to_data(
                    img,
                    lang=config.ocr.language,
                    config=f"--psm {config.ocr.psm}",
                    output_type=pytesseract.Output.DICT,
                    timeout=max(5, getattr(config.workers, 'timeout_seconds_per_page', 15)),
                )

                scale = 72.0 / dpi
                conf_sum = 0
                conf_count = 0

                for i in range(len(data["text"])):
                    raw_w = data["text"][i]
                    txt = clean_ocr_artifacts(raw_w)
                    c = data["conf"][i]
                    if txt and c > MIN_OCR_CONFIDENCE:
                        x0 = data["left"][i] * scale
                        y0 = data["top"][i] * scale
                        x1 = (data["left"][i] + data["width"][i]) * scale
                        y1 = (data["top"][i] + data["height"][i]) * scale
                        words.append({"text": txt, "x0": x0, "y0": y0, "x1": x1, "y1": y1})
                        conf_sum += c
                        conf_count += 1

                if conf_count > 0:
                    avg_conf = conf_sum / conf_count
            except Exception as e:
                st.add_warning(f"OCR invocation failed: {e}. Falling back to page words.")

        # Fallback to page vector words if OCR yielded nothing
        if not words:
            raw_words = page.get_text("words")
            for w in raw_words:
                txt = clean_ocr_artifacts(w[4])
                if txt:
                    words.append({"text": txt, "x0": w[0], "y0": w[1], "x1": w[2], "y1": w[3]})

        if len(words) < 4:
            return [], 0.0

        # Cluster words into table bands and columns
        words.sort(key=lambda w: ((w["y0"] + w["y1"]) / 2.0, w["x0"]))
        row_bands: List[List[Dict[str, Any]]] = []
        current_band: List[Dict[str, Any]] = []
        current_cy = None
        y_tol = 6.0

        for w in words:
            cy = (w["y0"] + w["y1"]) / 2.0
            if current_cy is None:
                current_band.append(w)
                current_cy = cy
            elif abs(cy - current_cy) <= y_tol:
                current_band.append(w)
                current_cy = sum((item["y0"] + item["y1"]) / 2.0 for item in current_band) / len(current_band)
            else:
                if current_band:
                    current_band.sort(key=lambda item: item["x0"])
                    row_bands.append(current_band)
                current_band = [w]
                current_cy = cy

        if current_band:
            current_band.sort(key=lambda item: item["x0"])
            row_bands.append(current_band)

        if len(row_bands) < 2:
            return [], avg_conf

        # Column intervals
        all_x0 = sorted(w["x0"] for band in row_bands for w in band)
        col_starts: List[float] = []
        for x in all_x0:
            if not col_starts or abs(x - col_starts[-1]) > 15.0:
                col_starts.append(x)

        if len(col_starts) < 2:
            return [], avg_conf

        col_intervals: List[Tuple[float, float]] = []
        for i in range(len(col_starts)):
            start = col_starts[i]
            end = col_starts[i + 1] if i + 1 < len(col_starts) else (col_starts[i] + 200.0)
            col_intervals.append((start, end))

        table_rows: List[TableRow] = []
        for r_idx, band in enumerate(row_bands):
            row_y0 = min(w["y0"] for w in band)
            row_y1 = max(w["y1"] for w in band)
            cells: List[TableCell] = []

            for c_idx, (c_start, c_end) in enumerate(col_intervals):
                col_words = [w for w in band if c_start - 4.0 <= w["x0"] < c_end - 4.0]
                cell_text = " ".join(w["text"] for w in col_words).strip()
                cell_box = (
                    min((w["x0"] for w in col_words), default=c_start),
                    row_y0,
                    max((w["x1"] for w in col_words), default=c_end),
                    row_y1,
                )

                is_header = (r_idx == 0)
                data_type, typed_val, fmt_code = detect_cell_data_type(cell_text)

                cell = TableCell(
                    text=cell_text,
                    bbox=cell_box,
                    row_idx=r_idx,
                    col_idx=c_idx,
                    is_header=is_header,
                    data_type=data_type,
                    typed_value=typed_val,
                    format_code=fmt_code,
                    confidence=round(avg_conf / 100.0, 2),
                )
                cells.append(cell)

            table_rows.append(TableRow(
                cells=cells,
                row_idx=r_idx,
                bbox=(col_intervals[0][0], row_y0, col_intervals[-1][1], row_y1),
                is_header=(r_idx == 0),
            ))

        if not table_rows:
            return [], avg_conf

        t_bbox = (
            min(r.bbox[0] for r in table_rows),
            min(r.bbox[1] for r in table_rows),
            max(r.bbox[2] for r in table_rows),
            max(r.bbox[3] for r in table_rows),
        )

        table = TableBlock(
            bbox=t_bbox,
            rows=table_rows,
            table_type=TableTopology.STREAM.value,
            has_merged_cells=False,
            page_idx=page_idx,
            engine=self.name,
            confidence=round(avg_conf / 100.0, 2),
        )
        return [table], avg_conf

    def _compute_confidence(self, tables: List[TableBlock], ocr_conf: float) -> ConfidenceScore:
        """Calculate confidence based on OCR word confidence and structural symmetry."""
        if not tables:
            return ConfidenceScore(overall=0.0)

        t = tables[0]
        col_lens = [len(r.cells) for r in t.rows]
        is_uniform = len(set(col_lens)) == 1
        col_align = 1.0 if is_uniform else 0.7

        base_conf = min(1.0, max(0.2, ocr_conf / 100.0))
        overall = round(0.5 * base_conf + 0.3 * col_align + 0.2 * 0.9, 4)

        return ConfidenceScore(
            overall=overall,
            column_alignment=col_align,
            row_continuity=0.85,
            type_consistency=0.85,
            header_validity=0.85,
            density_score=0.8,
        )
