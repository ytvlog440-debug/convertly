"""
Convertly V2 — Cell Reconstruction & Deterministic Repair Engine
Provides algorithmic post-extraction repair for broken rows (multi-line cell wrapping),
hyphenated split words, merged cell span discovery, ghost row pruning,
and hierarchical indentation detection.
"""

import re
from typing import List, Dict, Any, Optional, Tuple

from ..constants import (
    DEFAULT_INDENT_STEP_PTS,
    DEFAULT_SNAP_TOLERANCE,
)
from ..models import (
    TableCell,
    TableRow,
    TableBlock,
)
from ..interfaces import BaseReconstructor
from ..config import TableExtractorConfig
from ..utils.geometry import bbox_union
from ..utils.parsing import clean_text, detect_cell_data_type


# Pattern for split hyphenated words across lines
SPLIT_WORD_RE = re.compile(r"(\b[A-Za-z]+)-\s*\n\s*([A-Za-z]+\b)")


class CellReconstructor(BaseReconstructor):
    """
    Applies deterministic structural repair algorithms on extracted TableBlocks.
    Ensures that multi-line text cells are consolidated into single rows and
    broken words are reconnected.
    """

    def reconstruct(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> TableBlock:
        """
        Execute the full deterministic reconstruction pipeline on a TableBlock.
        """
        cfg = config or TableExtractorConfig()

        # Step 1: Repair split words across all cells
        t_repaired = self.repair_split_words(table, cfg)

        # Step 2: Repair broken wrapped rows
        t_repaired = self.repair_broken_rows(t_repaired, cfg)

        # Step 3: Strip completely empty ghost rows
        t_repaired = self.strip_empty_rows(t_repaired, cfg)

        # Step 4: Detect topological merged cell spans
        t_repaired = self.detect_merged_spans(t_repaired, cfg)

        # Step 5: Detect hierarchical indentation levels
        t_repaired = self.detect_indentation_levels(t_repaired, cfg)

        return t_repaired

    def repair_split_words(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> TableBlock:
        """
        Scan all cells in the table and repair hyphenated line-break tokens.
        Example: 'compen-\nsation' -> 'compensation'
        """
        repaired_rows: List[TableRow] = []

        for row in table.rows:
            repaired_cells: List[TableCell] = []
            for cell in row.cells:
                text = cell.text
                if "-" in text:
                    # Repair hyphenated word breaks
                    text = SPLIT_WORD_RE.sub(r"\1\2", text)
                    # Clean up any trailing broken hyphens at end of line
                    lines = text.splitlines()
                    cleaned_lines = []
                    for idx, line in enumerate(lines):
                        if line.endswith("-") and idx + 1 < len(lines):
                            next_line = lines[idx + 1].strip()
                            if next_line and not next_line.startswith("-"):
                                line = line[:-1] + next_line
                                lines[idx + 1] = ""  # consumed
                        cleaned_lines.append(line)
                    text = "\n".join(l for l in cleaned_lines if l.strip())

                # Re-evaluate data type after split word repair
                data_type, typed_val, fmt_code = detect_cell_data_type(text)

                cell_copy = TableCell(
                    text=text,
                    bbox=cell.bbox,
                    row_idx=cell.row_idx,
                    col_idx=cell.col_idx,
                    rowspan=cell.rowspan,
                    colspan=cell.colspan,
                    is_header=cell.is_header,
                    indent_level=cell.indent_level,
                    data_type=data_type,
                    typed_value=typed_val,
                    format_code=fmt_code,
                    confidence=cell.confidence,
                )
                repaired_cells.append(cell_copy)

            repaired_rows.append(TableRow(
                cells=repaired_cells,
                row_idx=row.row_idx,
                bbox=row.bbox,
                is_header=row.is_header,
            ))

        return TableBlock(
            bbox=table.bbox,
            rows=repaired_rows,
            table_type=table.table_type,
            has_merged_cells=table.has_merged_cells,
            page_idx=table.page_idx,
            engine=table.engine,
            confidence=table.confidence,
            metadata=dict(table.metadata),
        )

    def repair_broken_rows(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> TableBlock:
        """
        Identifies orphan rows where description columns contain text wrapped from
        the row above while numeric/key columns are empty. Merges wrapped content into
        the parent row above.
        """
        if len(table.rows) <= 1:
            return table

        cleaned_rows: List[TableRow] = []
        skip_indices = set()

        for i in range(len(table.rows)):
            if i in skip_indices:
                continue

            current_row = table.rows[i]

            # Don't merge data rows into header rows
            if current_row.is_header:
                cleaned_rows.append(current_row)
                continue

            # Check if subsequent rows are wrapped continuations of this row
            j = i + 1
            while j < len(table.rows):
                next_row = table.rows[j]
                if next_row.is_header:
                    break

                # Check if next_row is an orphan continuation:
                # 1. Vertical gap between current_row bottom and next_row top is small (<= 14 pts)
                v_gap = next_row.bbox[1] - current_row.bbox[3]
                if v_gap > 14.0 or v_gap < -2.0:
                    break

                # 2. In next_row, are numeric/currency cells empty while parent row has values?
                parent_has_numbers = any(c.data_type in ("number", "currency", "percentage") and c.text.strip() for c in current_row.cells)
                next_has_numbers = any(c.data_type in ("number", "currency", "percentage") and c.text.strip() for c in next_row.cells)

                # If parent had numbers but next row has NO numbers and has text in col 0/1
                is_continuation = parent_has_numbers and (not next_has_numbers)

                # Alternative: next row has only 1 non-empty cell while parent has multiple
                parent_filled_count = sum(1 for c in current_row.cells if c.text.strip())
                next_filled_count = sum(1 for c in next_row.cells if c.text.strip())
                if parent_filled_count >= 2 and next_filled_count == 1:
                    is_continuation = True

                if is_continuation:
                    # Merge next_row into current_row
                    for c_idx in range(min(len(current_row.cells), len(next_row.cells))):
                        add_text = next_row.cells[c_idx].text.strip()
                        if add_text:
                            orig_text = current_row.cells[c_idx].text.strip()
                            if orig_text:
                                current_row.cells[c_idx].text = f"{orig_text} {add_text}"
                            else:
                                current_row.cells[c_idx].text = add_text

                            # Union bounding box
                            current_row.cells[c_idx].bbox = bbox_union(
                                current_row.cells[c_idx].bbox,
                                next_row.cells[c_idx].bbox,
                            )

                    # Expand row bbox
                    current_row.bbox = bbox_union(current_row.bbox, next_row.bbox)
                    skip_indices.add(j)
                    j += 1
                else:
                    break

            cleaned_rows.append(current_row)

        # Re-index rows
        for new_idx, r in enumerate(cleaned_rows):
            r.row_idx = new_idx
            for c in r.cells:
                c.row_idx = new_idx

        return TableBlock(
            bbox=table.bbox,
            rows=cleaned_rows,
            table_type=table.table_type,
            has_merged_cells=table.has_merged_cells,
            page_idx=table.page_idx,
            engine=table.engine,
            confidence=table.confidence,
            metadata=dict(table.metadata),
        )

    def strip_empty_rows(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> TableBlock:
        """Remove completely empty rows from table."""
        non_empty_rows = [
            r for r in table.rows
            if any(c.text.strip() for c in r.cells)
        ]

        for new_idx, r in enumerate(non_empty_rows):
            r.row_idx = new_idx
            for c in r.cells:
                c.row_idx = new_idx

        return TableBlock(
            bbox=table.bbox,
            rows=non_empty_rows,
            table_type=table.table_type,
            has_merged_cells=table.has_merged_cells,
            page_idx=table.page_idx,
            engine=table.engine,
            confidence=table.confidence,
            metadata=dict(table.metadata),
        )

    def detect_merged_spans(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> TableBlock:
        """
        Discover merged cells (colspan and rowspan) where a cell spans across
        multiple column or row coordinate intervals.
        """
        if not table.rows:
            return table

        has_merged = False

        # Gather distinct global column boundaries across all rows
        all_col_x0 = sorted({c.bbox[0] for r in table.rows for c in r.cells})
        col_width_avg = 50.0
        if len(all_col_x0) >= 2:
            col_width_avg = (all_col_x0[-1] - all_col_x0[0]) / max(1, len(all_col_x0) - 1)

        for row in table.rows:
            for cell in row.cells:
                w = cell.width
                # If cell width is significantly wider than typical column width (>= 1.7x)
                if w >= 1.7 * col_width_avg and len(row.cells) < table.col_count:
                    est_colspan = max(1, round(w / col_width_avg))
                    if est_colspan > 1:
                        cell.colspan = est_colspan
                        has_merged = True

        table.has_merged_cells = has_merged or table.has_merged_cells
        return table

    def detect_indentation_levels(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> TableBlock:
        """
        Detect visual hierarchical indentations (e.g. Balance Sheet line items).
        Calculates indent_level in multiples of indent_step (default 8.0 pts).
        """
        cfg = config or TableExtractorConfig()
        indent_step = cfg.thresholds.indent_step

        if not table.rows:
            return table

        # Focus on column 0 (typically description/line-item label)
        col0_cells = [r.cells[0] for r in table.rows if r.cells and r.cells[0].text.strip()]
        if not col0_cells:
            return table

        base_x0 = min(c.bbox[0] for c in col0_cells)

        for r in table.rows:
            if not r.cells:
                continue
            c0 = r.cells[0]
            if not c0.text.strip():
                continue

            if c0.indent_level > 0:
                continue

            delta_x = c0.bbox[0] - base_x0
            if delta_x >= indent_step * 0.75:
                c0.indent_level = max(1, int(round(delta_x / indent_step)))
            else:
                c0.indent_level = 0

        return table
