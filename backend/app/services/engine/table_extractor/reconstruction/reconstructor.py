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
        Discover merged cells (both horizontal colspan and vertical rowspan)
        using cell bounding boxes, header spans, horizontal whitespace,
        column intervals, vertical alignment, and text block dimensions.
        """
        if not table.rows or len(table.rows) < 1:
            return table

        has_merged = False
        num_rows = len(table.rows)

        # 1. Establish canonical column intervals across the table
        max_cols = max((len(r.cells) for r in table.rows), default=0)
        if max_cols < 2:
            return table

        col_x0_map: Dict[int, List[float]] = {j: [] for j in range(max_cols)}
        col_x1_map: Dict[int, List[float]] = {j: [] for j in range(max_cols)}

        for r in table.rows:
            if len(r.cells) == max_cols:
                for j, c in enumerate(r.cells):
                    if c.width > 0:
                        col_x0_map[j].append(c.bbox[0])
                        col_x1_map[j].append(c.bbox[2])
            else:
                for c in r.cells:
                    if 0 <= c.col_idx < max_cols and c.width > 0:
                        col_x0_map[c.col_idx].append(c.bbox[0])
                        col_x1_map[c.col_idx].append(c.bbox[2])

        col_intervals: List[Tuple[float, float]] = []
        for j in range(max_cols):
            x0_list = col_x0_map[j]
            x1_list = col_x1_map[j]
            if x0_list and x1_list:
                med_x0 = sorted(x0_list)[len(x0_list) // 2]
                med_x1 = sorted(x1_list)[len(x1_list) // 2]
                col_intervals.append((med_x0, max(med_x0 + 10.0, med_x1)))
            else:
                col_intervals.append((0.0, 0.0))

        # Fill in missing intervals smoothly
        for j in range(max_cols):
            if col_intervals[j] == (0.0, 0.0):
                prev_x1 = col_intervals[j - 1][1] if j > 0 and col_intervals[j - 1] != (0.0, 0.0) else (table.bbox[0] + j * 50.0)
                col_intervals[j] = (prev_x1, prev_x1 + 50.0)

        # Midpoint dividers between adjacent columns
        col_dividers: List[float] = []
        for j in range(max_cols - 1):
            div = (col_intervals[j][1] + col_intervals[j + 1][0]) / 2.0
            col_dividers.append(div)

        # 2. Multi-Level Header & Section Partitioning
        # When Row 0/1 are header rows with granular subheaders in child rows:
        if num_rows >= 2:
            for r_idx in range(min(num_rows - 1, 2)):
                curr_r = table.rows[r_idx]
                next_r = table.rows[r_idx + 1]
                if not (curr_r.is_header or r_idx == 0):
                    continue

                curr_texts = [(c.text or "").strip() for c in curr_r.cells]
                next_texts = [(c.text or "").strip() for c in next_r.cells]

                # Identify vertical single-column headers (e.g. Day, Break)
                # where current row has text and next row is empty/same
                vertical_cols = set()
                for c in range(min(len(curr_texts), len(next_texts))):
                    t_curr = curr_texts[c]
                    t_next = next_texts[c]
                    if t_curr and (not t_next or t_curr.lower() == t_next.lower()):
                        # Check if subsequent data rows have content in this column
                        has_lower_data = any(
                            (table.rows[dr].cells[c].text or "").strip()
                            for dr in range(r_idx + 2, min(num_rows, r_idx + 4))
                            if c < len(table.rows[dr].cells)
                        ) if num_rows > r_idx + 2 else True
                        if has_lower_data:
                            vertical_cols.add(c)

                # Partition non-vertical columns into horizontal sections
                sections = []
                sec_start = None
                for c in range(max_cols):
                    if c not in vertical_cols:
                        if sec_start is None:
                            sec_start = c
                    else:
                        if sec_start is not None:
                            sections.append((sec_start, c - 1))
                            sec_start = None
                if sec_start is not None:
                    sections.append((sec_start, max_cols - 1))

                # For each horizontal section, map section headers
                for s_start, s_end in sections:
                    if s_end <= s_start:
                        continue
                    sec_span = s_end - s_start + 1
                    # Look at non-empty cells in this section in curr_r
                    active_in_sec = [
                        (c_idx, curr_r.cells[c_idx])
                        for c_idx in range(s_start, min(len(curr_r.cells), s_end + 1))
                        if (curr_r.cells[c_idx].text or "").strip()
                    ]

                    # If exactly 1 header occupies this multi-column section (e.g. "Morning", "Replica")
                    if len(active_in_sec) == 1:
                        orig_col, active_c = active_in_sec[0]
                        target_cell = curr_r.cells[s_start]
                        if orig_col != s_start:
                            target_cell.text = active_c.text
                            target_cell.typed_value = active_c.typed_value
                            target_cell.data_type = active_c.data_type
                            active_c.text = ""
                            active_c.typed_value = None

                        target_cell.colspan = sec_span
                        target_cell.bbox = (
                            col_intervals[s_start][0],
                            target_cell.bbox[1],
                            col_intervals[s_end][1],
                            target_cell.bbox[3]
                        )
                        has_merged = True

                        for clr_idx in range(s_start + 1, min(len(curr_r.cells), s_end + 1)):
                            clr_c = curr_r.cells[clr_idx]
                            if clr_idx != orig_col:
                                clr_c.text = ""
                                clr_c.typed_value = None
                            clr_c.colspan = 1

                # Apply vertical rowspans for identified vertical headers
                for v_col in vertical_cols:
                    if v_col < len(curr_r.cells):
                        v_cell = curr_r.cells[v_col]
                        v_cell.rowspan = 2
                        has_merged = True
                        if v_col < len(next_r.cells):
                            next_r.cells[v_col].text = ""
                            next_r.cells[v_col].typed_value = None

        # 3. General Horizontal & Bounding Box Spans (for data rows and standalone headers)
        for r_idx, row in enumerate(table.rows):
            row_len = len(row.cells)
            for c_idx, cell in enumerate(row.cells):
                if row_len == max_cols:
                    cell.col_idx = c_idx

            skip_until = -1
            for c_idx in range(row_len):
                if c_idx <= skip_until:
                    continue

                cell = row.cells[c_idx]
                curr_col = cell.col_idx
                txt = (cell.text or "").strip()

                if txt and cell.colspan == 1:
                    span_by_bbox = 1
                    for next_c in range(curr_col + 1, max_cols):
                        div_val = col_dividers[next_c - 1]
                        if cell.bbox[2] >= div_val + 4.0:
                            span_by_bbox = next_c - curr_col + 1
                        else:
                            break

                    span_by_whitespace = 1
                    consec_empty = 0
                    lookahead = c_idx + 1


                    while lookahead < row_len:
                        next_c = row.cells[lookahead]
                        # Stop if column is already covered by a vertical merge from above
                        is_vert_covered = any(
                            table.rows[pr].cells[next_c.col_idx].rowspan > (r_idx - pr)
                            for pr in range(r_idx)
                            if next_c.col_idx < len(table.rows[pr].cells)
                        )
                        if not (next_c.text or "").strip() and not is_vert_covered:
                            consec_empty += 1
                            lookahead += 1
                        else:
                            break

                    if consec_empty > 0:
                        # Check if other rows possess data in these columns
                        other_has_data = any(
                            all((table.rows[chk_r].cells[ch_col].text or "").strip() for ch_col in (curr_col, curr_col + 1))
                            for chk_r in range(num_rows)
                            if chk_r != r_idx and curr_col + 1 < len(table.rows[chk_r].cells)
                        )
                        if other_has_data or row.is_header:
                            span_by_whitespace = consec_empty + 1


                    final_span = max(span_by_bbox, span_by_whitespace)
                    if final_span > 1:
                        cell.colspan = final_span
                        has_merged = True
                        skip_until = c_idx + final_span - 1
                        end_col = min(max_cols - 1, curr_col + final_span - 1)
                        cell.bbox = (
                            cell.bbox[0],
                            cell.bbox[1],
                            max(cell.bbox[2], col_intervals[end_col][1]),
                            cell.bbox[3]
                        )
                        for s_idx in range(c_idx + 1, min(row_len, c_idx + final_span)):
                            spanned_c = row.cells[s_idx]
                            spanned_c.text = ""
                            spanned_c.typed_value = None
                            spanned_c.colspan = 1

        # 4. General Vertical Merge Detection (Rowspan for data rows)
        for c_idx in range(max_cols):
            r_idx = 0
            while r_idx < num_rows:
                row = table.rows[r_idx]
                cell = next((c for c in row.cells if c.col_idx == c_idx), None)
                if not cell:
                    r_idx += 1
                    continue

                txt = (cell.text or "").strip()
                if txt and cell.rowspan == 1:
                    target_rowspan = 1
                    lookahead_r = r_idx + 1

                    while lookahead_r < num_rows:
                        next_row = table.rows[lookahead_r]
                        next_cell = next((c for c in next_row.cells if c.col_idx == c_idx), None)
                        if not next_cell:
                            break

                        next_txt = (next_cell.text or "").strip()
                        if not next_txt:
                            sibling_has_data = any(
                                (sc.text or "").strip() for sc in next_row.cells
                                if sc.col_idx != c_idx
                            )
                            if sibling_has_data:
                                if cell.bbox[3] >= next_row.bbox[1] + 2.0:
                                    target_rowspan += 1
                                    lookahead_r += 1
                                    continue
                        break

                    if target_rowspan > 1:
                        cell.rowspan = target_rowspan
                        has_merged = True
                        last_r = table.rows[r_idx + target_rowspan - 1]
                        cell.bbox = (cell.bbox[0], cell.bbox[1], cell.bbox[2], max(cell.bbox[3], last_r.bbox[3]))
                        r_idx += target_rowspan
                        continue

                r_idx += 1

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
