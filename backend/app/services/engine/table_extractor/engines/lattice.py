"""
Convertly V2 — Enterprise Lattice Extraction Engine
High-precision bordered grid extraction using vector drawing paths, coordinate
snapping, topological cell mesh synthesis, and text token assignment.
"""

import fitz  # PyMuPDF
from typing import List, Dict, Any, Optional, Tuple

from ..constants import (
    EngineType,
    TableTopology,
    DEFAULT_SNAP_TOLERANCE,
    MIN_LINE_LENGTH_PTS,
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
from ..utils.geometry import snap_coordinate, bbox_intersection
from ..utils.parsing import clean_text, detect_cell_data_type


from ..vector_parser import VectorPathParser
from ..lattice_extractor import LatticeTableExtractor
from ..text_normalizer import scrub_ascii_table_artifacts, sanitize_text


class LatticeExtractor(BaseExtractor):
    """
    Extracts tabular grids bounded by explicit horizontal and vertical vector rulings.
    Detects merged cells, computes span coordinates, and normalizes cell typography.
    """

    @property
    def name(self) -> str:
        return EngineType.LATTICE.value

    def extract_page(
        self,
        pdf_bytes: bytes,
        page_idx: int,
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> ExtractionCandidate:
        """Extract lattice grid tables from a single document page."""
        cfg = config or TableExtractorConfig()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        if page_idx < 0 or page_idx >= len(doc):
            doc.close()
            raise IndexError(f"Page index {page_idx} out of range (total {len(doc)} pages).")

        page = doc[page_idx]

        with stage_timer("lattice_extraction", engine_name=self.name, page_idx=page_idx) as st:
            tables = self._extract_tables_from_page(page, page_idx, cfg)
            cell_count = sum(t.row_count * t.col_count for t in tables)
            st.set_counts(tables=len(tables), cells=cell_count)

            # Compute confidence
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
        """Extract lattice tables from all pages of the document."""
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
        """Internal lattice grid extraction logic leveraging vector parsing and cell span consolidation."""
        snap_tol = config.thresholds.snap_tolerance
        min_line_len = config.thresholds.min_line_length

        vector_parser = VectorPathParser(min_line_length=min_line_len, snap_tolerance=snap_tol)
        lattice_extractor = LatticeTableExtractor(snap_tolerance=snap_tol)

        grid = vector_parser.extract_vector_grid(page)
        h_lines = grid['horizontal_lines']
        v_lines = grid['vertical_lines']

        if len(h_lines) < 2 or len(v_lines) < 2:
            return []

        raw_words = page.get_text("words")
        words = []
        for w in raw_words:
            t = scrub_ascii_table_artifacts(sanitize_text(w[4]))
            if t:
                words.append({
                    'text': t,
                    'x0': w[0],
                    'y0': w[1],
                    'x1': w[2],
                    'y1': w[3],
                    'bbox': (w[0], w[1], w[2], w[3]),
                })

        tables = lattice_extractor.extract_tables_from_grid(page, h_lines, v_lines, words)
        for t in tables:
            t.page_idx = page_idx
            t.engine = self.name
            t.confidence = 0.95
        return tables

    def _compute_confidence(self, tables: List[TableBlock]) -> ConfidenceScore:
        """Calculate multi-dimensional confidence score for lattice extraction."""
        if not tables:
            return ConfidenceScore(overall=0.0)

        t = tables[0]
        if not t.rows:
            return ConfidenceScore(overall=0.0)

        # Uniform columns check
        col_lens = [len(r.cells) for r in t.rows]
        is_uniform = len(set(col_lens)) == 1
        col_align = 1.0 if is_uniform else 0.7

        # Grid fill ratio
        total_cells = sum(len(r.cells) for r in t.rows)
        filled_cells = sum(1 for r in t.rows for c in r.cells if c.text.strip())
        fill_ratio = (filled_cells / total_cells) if total_cells > 0 else 0.0

        overall = round(0.4 * col_align + 0.3 * fill_ratio + 0.3 * 1.0, 4)

        return ConfidenceScore(
            overall=overall,
            column_alignment=col_align,
            row_continuity=1.0,
            type_consistency=0.95,
            header_validity=1.0,
            density_score=fill_ratio,
        )
