"""
Convertly V2 — Enterprise Stream Extraction Engine
High-precision borderless table extraction using whitespace projection profiles,
horizontal row baseline clustering, and vertical gutter discovery.
"""

import fitz  # PyMuPDF
from typing import List, Dict, Any, Optional, Tuple

from ..constants import (
    EngineType,
    TableTopology,
    DEFAULT_GUTTER_MIN_WIDTH_PTS,
    CONFIDENCE_HIGH,
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
from ..utils.parsing import clean_text, detect_cell_data_type


class StreamExtractor(BaseExtractor):
    """
    Extracts borderless tables using X-axis whitespace projections and baseline alignment.
    Handles irregular spacing and column gutter detection.
    """

    @property
    def name(self) -> str:
        return EngineType.STREAM.value

    def extract_page(
        self,
        pdf_bytes: bytes,
        page_idx: int,
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> ExtractionCandidate:
        """Extract borderless stream tables from a single page."""
        cfg = config or TableExtractorConfig()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        if page_idx < 0 or page_idx >= len(doc):
            doc.close()
            raise IndexError(f"Page index {page_idx} out of range (total {len(doc)} pages).")

        page = doc[page_idx]

        with stage_timer("stream_extraction", engine_name=self.name, page_idx=page_idx) as st:
            tables = self._extract_tables_from_page(page, page_idx, cfg)
            cell_count = sum(t.row_count * t.col_count for t in tables)
            st.set_counts(tables=len(tables), cells=cell_count)

            conf = self._compute_confidence(tables)
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
        """Extract borderless tables across all document pages."""
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
        config: TableExtractorConfig
    ) -> List[TableBlock]:
        """Internal stream extraction logic."""
        raw_words = page.get_text("words")
        if not raw_words or len(raw_words) < 4:
            return []

        words = []
        for w in raw_words:
            t = clean_text(w[4])
            if t:
                words.append({
                    "text": t,
                    "x0": float(w[0]),
                    "y0": float(w[1]),
                    "x1": float(w[2]),
                    "y1": float(w[3]),
                })

        if len(words) < 4:
            return []

        # 1. Cluster words into rows based on Y-center proximity
        words.sort(key=lambda w: ((w["y0"] + w["y1"]) / 2.0, w["x0"]))
        raw_row_bands: List[List[Dict[str, Any]]] = []
        current_band: List[Dict[str, Any]] = []
        current_y_center = None

        y_tol = 4.0  # Vertical proximity tolerance

        for w in words:
            cy = (w["y0"] + w["y1"]) / 2.0
            if current_y_center is None:
                current_band.append(w)
                current_y_center = cy
            elif abs(cy - current_y_center) <= y_tol:
                current_band.append(w)
                current_y_center = sum((item["y0"] + item["y1"]) / 2.0 for item in current_band) / len(current_band)
            else:
                if current_band:
                    current_band.sort(key=lambda item: item["x0"])
                    raw_row_bands.append(current_band)
                current_band = [w]
                current_y_center = cy

        if current_band:
            current_band.sort(key=lambda item: item["x0"])
            raw_row_bands.append(current_band)

        if len(raw_row_bands) < 2:
            return []

        # Merge adjacent words on the same line whose horizontal gap <= 12 pts (normal word space)
        row_bands: List[List[Dict[str, Any]]] = []
        for band in raw_row_bands:
            merged_band: List[Dict[str, Any]] = []
            for w in band:
                if not merged_band:
                    merged_band.append(dict(w))
                else:
                    prev = merged_band[-1]
                    if 0 <= w["x0"] - prev["x1"] <= 12.0:
                        prev["text"] += " " + w["text"]
                        prev["x1"] = max(prev["x1"], w["x1"])
                    else:
                        merged_band.append(dict(w))
            row_bands.append(merged_band)

        # 2. Discover column boundaries using X coordinate projection / clustering
        all_x0 = [w["x0"] for band in row_bands for w in band]
        gutter_min = max(20.0, config.thresholds.gutter_min_width)

        # Find distinct column start clusters
        sorted_x = sorted(all_x0)
        col_starts: List[float] = []
        for x in sorted_x:
            if not col_starts:
                col_starts.append(x)
            elif abs(x - col_starts[-1]) > gutter_min:
                col_starts.append(x)

        if len(col_starts) < 2:
            return []

        # Determine column intervals [start, end)
        col_intervals: List[Tuple[float, float]] = []
        for i in range(len(col_starts)):
            start = col_starts[i]
            end = col_starts[i + 1] if i + 1 < len(col_starts) else (col_starts[i] + 200.0)
            col_intervals.append((start, end))

        # 3. Construct TableRows and TableCells
        table_rows: List[TableRow] = []
        for r_idx, band in enumerate(row_bands):
            row_y0 = min(w["y0"] for w in band)
            row_y1 = max(w["y1"] for w in band)
            cells: List[TableCell] = []

            for c_idx, (c_start, c_end) in enumerate(col_intervals):
                # Words belonging to this column interval
                col_words = [w for w in band if c_start - 3.0 <= w["x0"] < c_end - 3.0]
                cell_text = " ".join(w["text"] for w in col_words).strip()

                x0 = min((w["x0"] for w in col_words), default=c_start)
                x1 = max((w["x1"] for w in col_words), default=c_end)
                cell_box = (x0, row_y0, x1, row_y1)

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
                    confidence=0.88 if cell_text else 1.0,
                )
                cells.append(cell)

            table_row = TableRow(
                cells=cells,
                row_idx=r_idx,
                bbox=(col_intervals[0][0], row_y0, col_intervals[-1][1], row_y1),
                is_header=(r_idx == 0),
            )
            table_rows.append(table_row)

        if not table_rows:
            return []

        t_x0 = min(r.bbox[0] for r in table_rows)
        t_y0 = min(r.bbox[1] for r in table_rows)
        t_x1 = max(r.bbox[2] for r in table_rows)
        t_y1 = max(r.bbox[3] for r in table_rows)

        table = TableBlock(
            bbox=(t_x0, t_y0, t_x1, t_y1),
            rows=table_rows,
            table_type=TableTopology.STREAM.value,
            has_merged_cells=False,
            page_idx=page_idx,
            engine=self.name,
            confidence=0.88,
        )
        return [table]

    def _compute_confidence(self, tables: List[TableBlock]) -> ConfidenceScore:
        """Calculate multi-dimensional confidence score for stream extraction."""
        if not tables:
            return ConfidenceScore(overall=0.0)

        t = tables[0]
        if not t.rows:
            return ConfidenceScore(overall=0.0)

        col_lens = [len(r.cells) for r in t.rows]
        is_uniform = len(set(col_lens)) == 1
        col_align = 1.0 if is_uniform else 0.75

        total_cells = sum(len(r.cells) for r in t.rows)
        filled_cells = sum(1 for r in t.rows for c in r.cells if c.text.strip())
        fill_ratio = (filled_cells / total_cells) if total_cells > 0 else 0.0

        overall = round(0.4 * col_align + 0.3 * fill_ratio + 0.3 * 0.9, 4)

        return ConfidenceScore(
            overall=overall,
            column_alignment=col_align,
            row_continuity=0.9,
            type_consistency=0.9,
            header_validity=0.9,
            density_score=fill_ratio,
        )
