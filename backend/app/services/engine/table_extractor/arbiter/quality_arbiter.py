"""
Convertly V2 — Quality Arbiter Engine
Multi-engine quality scoring and arbitration. Evaluates candidate table structures
against column uniformity, row continuity, numeric purity, header validity,
grid fill, and defect penalties (pipe artifacts, word fragmentation).
"""

from typing import List, Dict, Any, Optional
from ..constants import (
    WEIGHT_COL_UNIFORMITY,
    WEIGHT_ROW_ALIGNMENT,
    WEIGHT_NUMERIC_DENSITY,
    WEIGHT_HEADER_CONFIDENCE,
    WEIGHT_GRID_FILL,
    PENALTY_PIPE_ARTIFACTS,
    PENALTY_FRAGMENTATION,
    QUALITY_FALLBACK_THRESHOLD,
)
from ..models import (
    ExtractionCandidate,
    QualityScore,
    TableBlock,
)
from ..interfaces import BaseArbiter
from ..config import TableExtractorConfig


class QualityArbiter(BaseArbiter):
    """
    Evaluates extraction candidates from multiple engines, computes an objective
    normalized quality score (0.0 to 1.0), and arbitrates the superior candidate.
    """

    def score_candidate(
        self,
        candidate: ExtractionCandidate,
        config: Optional[TableExtractorConfig] = None
    ) -> QualityScore:
        """
        Calculates the quality score Q_total of an extraction candidate.
        """
        cfg = config or TableExtractorConfig()

        if not candidate.tables:
            return QualityScore(
                score=0.0,
                is_acceptable=False,
                violations=["No tables extracted by candidate engine."],
                penalties={},
            )

        # Evaluate across primary table
        table = candidate.tables[0]
        if not table.rows:
            return QualityScore(
                score=0.0,
                is_acceptable=False,
                violations=["Extracted table has 0 rows."],
                penalties={},
            )

        passed_checks: List[str] = []
        violations: List[str] = []
        penalties: Dict[str, float] = {}

        # 1. S_col: Column uniformity across rows
        col_lens = [len(r.cells) for r in table.rows]
        max_cols = max(col_lens) if col_lens else 0
        min_cols = min(col_lens) if col_lens else 0

        if max_cols == 0:
            s_col = 0.0
            violations.append("Zero columns in table rows.")
        elif max_cols == min_cols:
            s_col = 1.0
            passed_checks.append("Columns are completely uniform across all rows.")
        else:
            variance_ratio = min_cols / max_cols
            s_col = round(0.5 + 0.5 * variance_ratio, 3)
            violations.append(f"Column count variance detected (min={min_cols}, max={max_cols}).")

        # 2. S_row: Baseline alignment / vertical ordering
        s_row = 1.0
        row_y = [r.bbox[1] for r in table.rows]
        is_strictly_ordered = all(row_y[i] <= row_y[i + 1] + 1.0 for i in range(len(row_y) - 1))
        if is_strictly_ordered:
            passed_checks.append("Rows are strictly ordered in vertical progression.")
        else:
            s_row = 0.7
            violations.append("Row vertical ordering disorder detected.")

        # 3. S_num: Numeric & Currency column consistency
        # Evaluate on body data rows (excluding header row)
        data_rows = table.rows[1:] if len(table.rows) > 1 else table.rows
        num_consistent_cols = 0
        checked_cols = 0
        for c_idx in range(max_cols):
            col_cells = [r.cells[c_idx] for r in data_rows if c_idx < len(r.cells)]
            col_types = [c.data_type for c in col_cells if c.text.strip()]
            if not col_types:
                continue
            num_types_count = sum(1 for t in col_types if t in ("number", "currency", "percentage"))
            if num_types_count > 0:
                checked_cols += 1
                if num_types_count / len(col_types) >= 0.75:
                    num_consistent_cols += 1

        s_num = (num_consistent_cols / checked_cols) if checked_cols > 0 else 1.0
        if s_num >= 0.8:
            passed_checks.append("Column numeric and currency types are homogeneous.")

        # 4. S_head: Header validity
        first_row = table.rows[0]
        header_texts = [c.text.strip() for c in first_row.cells if c.text.strip()]
        if header_texts:
            s_head = 1.0
            passed_checks.append("Header row contains non-empty label text.")
        else:
            s_head = 0.5
            violations.append("Header row is blank or unpopulated.")

        # 5. S_fill: Grid cell fill ratio
        total_cells = sum(len(r.cells) for r in table.rows)
        filled_cells = sum(1 for r in table.rows for c in r.cells if c.text.strip())
        s_fill = (filled_cells / total_cells) if total_cells > 0 else 0.0

        if s_fill > 0.3:
            passed_checks.append(f"Grid fill ratio is healthy ({round(s_fill * 100)}%).")
        else:
            violations.append(f"Sparse grid fill ratio ({round(s_fill * 100)}%).")

        # 6. Defect Penalties
        # Pipe characters in cell content
        has_pipes = any(
            "|" in c.text or "│" in c.text
            for r in table.rows
            for c in r.cells
        )
        if has_pipes:
            penalties["pipe_artifacts"] = PENALTY_PIPE_ARTIFACTS
            violations.append("Spurious pipe (|) border artifacts present in text.")

        # Fragmentation check (hyphenated word ends)
        has_frag = any(
            c.text.strip().endswith("-") and len(c.text.strip()) > 1
            for r in table.rows
            for c in r.cells
        )
        if has_frag:
            penalties["fragmentation"] = PENALTY_FRAGMENTATION
            violations.append("Fragmented hyphenated text tokens detected.")

        # Calculate weighted quality score
        raw_weighted = (
            WEIGHT_COL_UNIFORMITY * s_col +
            WEIGHT_ROW_ALIGNMENT * s_row +
            WEIGHT_NUMERIC_DENSITY * s_num +
            WEIGHT_HEADER_CONFIDENCE * s_head +
            WEIGHT_GRID_FILL * s_fill
        )

        total_penalty = sum(penalties.values())
        final_score = round(max(0.0, min(1.0, raw_weighted - total_penalty)), 4)

        is_acceptable = final_score >= cfg.confidence.min_acceptable_quality

        return QualityScore(
            score=final_score,
            is_acceptable=is_acceptable,
            passed_checks=passed_checks,
            violations=violations,
            penalties=penalties,
        )

    def arbitrate(
        self,
        candidates: List[ExtractionCandidate],
        config: Optional[TableExtractorConfig] = None
    ) -> ExtractionCandidate:
        """
        Scores all candidate extractions and returns the optimal winner.
        """
        if not candidates:
            raise ValueError("Cannot arbitrate empty list of candidates.")

        cfg = config or TableExtractorConfig()

        scored_candidates = []
        for cand in candidates:
            q_score = self.score_candidate(cand, cfg)
            cand.quality = q_score
            scored_candidates.append(cand)

        # Sort descending by quality score
        scored_candidates.sort(key=lambda c: c.quality.score, reverse=True)
        winner = scored_candidates[0]

        return winner
