"""
Convertly V2 — Enterprise Hybrid Extraction Engine
Semi-bordered and complex table extraction combining horizontal vector band
segmentation with borderless whitespace projection column discovery.
"""

import fitz  # PyMuPDF
from typing import List, Dict, Any, Optional, Tuple

from ..constants import (
    EngineType,
    TableTopology,
    DEFAULT_SNAP_TOLERANCE,
    MIN_LINE_LENGTH_PTS,
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
from ..utils.geometry import snap_coordinate
from ..utils.parsing import clean_text, detect_cell_data_type


class HybridExtractor(BaseExtractor):
    """
    Extracts semi-bordered tables where horizontal rulings establish row boundaries
    while columns are demarcated by borderless whitespace gutters.
    """

    @property
    def name(self) -> str:
        return EngineType.HYBRID.value

    def extract_page(
        self,
        pdf_bytes: bytes,
        page_idx: int,
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> ExtractionCandidate:
        """Extract semi-bordered hybrid tables from a single page."""
        cfg = config or TableExtractorConfig()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        if page_idx < 0 or page_idx >= len(doc):
            doc.close()
            raise IndexError(f"Page index {page_idx} out of range (total {len(doc)} pages).")

        page = doc[page_idx]

        with stage_timer("hybrid_extraction", engine_name=self.name, page_idx=page_idx) as st:
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
        """Extract hybrid tables across all pages."""
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
        """Internal hybrid extraction combining horizontal rulings with stream columns."""
        min_line_len = config.thresholds.min_line_length
        snap_tol = config.thresholds.snap_tolerance

        # 1. Extract horizontal ruling lines
        drawings = page.get_drawings()
        h_lines = []
        for d in drawings:
            rect = d["rect"]
            if rect.width >= min_line_len and rect.height <= 4.0:
                h_lines.append(rect)

        # 2. Extract words
        raw_words = page.get_text("words")
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

        if not words:
            return []

        # If horizontal lines exist, use them to form vertical bands
        if len(h_lines) >= 2:
            raw_y = sorted({rect.y0 for rect in h_lines} | {rect.y1 for rect in h_lines})
            clustered_y: List[float] = []
            for y in raw_y:
                snapped = snap_coordinate(y, clustered_y, tolerance=snap_tol)
                if snapped == y:
                    clustered_y.append(y)
            clustered_y.sort()
            band_intervals = [(clustered_y[i], clustered_y[i + 1]) for i in range(len(clustered_y) - 1)]
        else:
            # Fallback to clustering words into bands by baseline
            words.sort(key=lambda w: (w["y0"], w["x0"]))
            band_intervals = []
            band_starts = sorted(set(round(w["y0"] / 10.0) * 10.0 for w in words))
            for i in range(len(band_starts)):
                b_start = band_starts[i]
                b_end = band_starts[i + 1] if i + 1 < len(band_starts) else (b_start + 25.0)
                band_intervals.append((b_start, b_end))

        if not band_intervals:
            return []

        # 3. Find global column gutters from words
        all_x0 = sorted(w["x0"] for w in words)
        col_starts: List[float] = []
        for x in all_x0:
            if not col_starts or abs(x - col_starts[-1]) > config.thresholds.gutter_min_width:
                col_starts.append(x)

        if len(col_starts) < 2:
            return []

        col_intervals: List[Tuple[float, float]] = []
        for i in range(len(col_starts)):
            start = col_starts[i]
            end = col_starts[i + 1] if i + 1 < len(col_starts) else (col_starts[i] + 200.0)
            col_intervals.append((start, end))

        # 4. Populate table rows and cells
        table_rows: List[TableRow] = []
        for r_idx, (y0, y1) in enumerate(band_intervals):
            # Words inside this vertical band
            band_words = [w for w in words if y0 - snap_tol <= (w["y0"] + w["y1"]) / 2.0 <= y1 + snap_tol]
            if not band_words:
                continue

            cells: List[TableCell] = []
            for c_idx, (c_start, c_end) in enumerate(col_intervals):
                cell_words = [w for w in band_words if c_start - 3.0 <= w["x0"] < c_end - 3.0]
                cell_text = " ".join(w["text"] for w in cell_words).strip()
                cell_box = (c_start, y0, c_end, y1)

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
                    confidence=0.92 if cell_text else 1.0,
                )
                cells.append(cell)

            table_rows.append(TableRow(
                cells=cells,
                row_idx=r_idx,
                bbox=(col_intervals[0][0], y0, col_intervals[-1][1], y1),
                is_header=(r_idx == 0),
            ))

        if not table_rows:
            return []

        t_bbox = (
            min(r.bbox[0] for r in table_rows),
            min(r.bbox[1] for r in table_rows),
            max(r.bbox[2] for r in table_rows),
            max(r.bbox[3] for r in table_rows),
        )

        table = TableBlock(
            bbox=t_bbox,
            rows=table_rows,
            table_type=TableTopology.SEMI_BORDERED.value,
            has_merged_cells=False,
            page_idx=page_idx,
            engine=self.name,
            confidence=0.92,
        )
        return [table]

    def _compute_confidence(self, tables: List[TableBlock]) -> ConfidenceScore:
        """Calculate confidence score for hybrid extraction."""
        if not tables:
            return ConfidenceScore(overall=0.0)

        t = tables[0]
        col_lens = [len(r.cells) for r in t.rows]
        is_uniform = len(set(col_lens)) == 1
        col_align = 1.0 if is_uniform else 0.8

        total_cells = sum(len(r.cells) for r in t.rows)
        filled_cells = sum(1 for r in t.rows for c in r.cells if c.text.strip())
        fill_ratio = (filled_cells / total_cells) if total_cells > 0 else 0.0

        overall = round(0.4 * col_align + 0.3 * fill_ratio + 0.3 * 0.95, 4)

        return ConfidenceScore(
            overall=overall,
            column_alignment=col_align,
            row_continuity=0.95,
            type_consistency=0.92,
            header_validity=0.92,
            density_score=fill_ratio,
        )
