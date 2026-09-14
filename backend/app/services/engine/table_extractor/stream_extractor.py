"""
Convertly V2 — Stream Table Extractor (Borderless & Sparse Tables)
Uses 2D Projection Profiling (Horizontal Projection Profile + Vertical Projection Profile)
to detect rows and column gutters without relying on vertical lines.
Features:
  1. Gutter channel identification across all rows (VPP)
  2. Sparse matrix projection (guarantees empty cells do not cause column left-drift)
  3. Row baseline alignment (HPP) preventing fragmented rows on multi-line text
  4. Header auto-detection and financial hierarchy preservation
"""

from typing import List, Tuple, Dict, Any, Optional
import re
from app.services.engine.table_extractor.models import TableCell, TableRow, TableBlock
from app.services.engine.table_extractor.text_normalizer import infer_cell_data_type, detect_indentation_level


def _cluster_words_in_row(row_words: List[Dict[str, Any]], gap_thresh: float = 12.0) -> List[Tuple[float, float]]:
    """Groups words in a single row into horizontal text clusters separated by gaps."""
    if not row_words:
        return []
    sorted_w = sorted(row_words, key=lambda w: w['x0'])
    clusters = []
    c_x0, c_x1 = sorted_w[0]['x0'], sorted_w[0]['x1']
    for w in sorted_w[1:]:
        if w['x0'] - c_x1 > gap_thresh:
            clusters.append((c_x0, c_x1))
            c_x0 = w['x0']
            c_x1 = w['x1']
        else:
            c_x1 = max(c_x1, w['x1'])
    clusters.append((c_x0, c_x1))
    return clusters


class StreamTableExtractor:
    """
    Extracts borderless tables using 2D Projection Profiling.
    Decomposes pages into horizontal row bands (HPP) and vertical column gutters (VPP),
    mapping words into strict matrix slots to prevent column drift on sparse data.
    """

    def __init__(
        self,
        min_rows: int = 2,
        min_cols: int = 2,
        gutter_min_width: float = 10.0,
        row_merge_y_tolerance: float = 4.0
    ):
        self.min_rows = min_rows
        self.min_cols = min_cols
        self.gutter_min_width = gutter_min_width
        self.row_merge_y_tolerance = row_merge_y_tolerance

    def extract_borderless_table(
        self,
        words: List[Dict[str, Any]],
        table_bbox: Optional[Tuple[float, float, float, float]] = None
    ) -> Optional[TableBlock]:
        """
        Extracts a borderless table from a collection of words within an optional bounding box.
        """
        if not words or len(words) < 4:
            return None

        # Filter words within table_bbox if specified
        if table_bbox:
            x0, y0, x1, y1 = table_bbox
            table_words = [
                w for w in words
                if x0 - 2 <= (w['x0'] + w['x1']) / 2.0 <= x1 + 2
                and y0 - 2 <= (w['y0'] + w['y1']) / 2.0 <= y1 + 2
            ]
        else:
            table_words = words

        if len(table_words) < 4:
            return None

        # 1. Step 1: Segment into logical rows using Horizontal Projection Profile (HPP)
        logical_rows_words = self._segment_rows_hpp(table_words)
        if len(logical_rows_words) < self.min_rows:
            return None

        # Identify multi-column candidate rows
        multi_col_indices = [
            i for i, r in enumerate(logical_rows_words)
            if len(_cluster_words_in_row(r, self.gutter_min_width)) >= 2
        ]
        if len(multi_col_indices) < max(1, self.min_rows - 1):
            return None

        # Filter out standalone title rows above the table
        first_multi = multi_col_indices[0]
        last_multi = multi_col_indices[-1]
        active_rows_words = logical_rows_words[first_multi:last_multi + 1]

        words_in_active = [w for r in active_rows_words for w in r]

        # 2. Step 2: Detect vertical column gutters using consensus gap profiling
        column_boundaries = self._detect_column_gutters(words_in_active, active_rows_words)
        if len(column_boundaries) < self.min_cols + 1:
            return None

        # 3. Step 3: Project words in each row into column slots (guaranteeing zero column drift)
        rows: List[TableRow] = []
        table_x0 = column_boundaries[0]
        table_x1 = column_boundaries[-1]
        table_y0 = min(w['y0'] for w in words_in_active)
        table_y1 = max(w['y1'] for w in words_in_active)

        for row_idx, row_words in enumerate(active_rows_words):
            row_y0 = min(w['y0'] for w in row_words)
            row_y1 = max(w['y1'] for w in row_words)

            cells: List[TableCell] = []
            num_cols = len(column_boundaries) - 1

            for col_idx in range(num_cols):
                col_left = column_boundaries[col_idx]
                col_right = column_boundaries[col_idx + 1]

                # Find all words that fall into this column slot
                slot_words = [
                    w for w in row_words
                    if col_left - 1.5 <= (w['x0'] + w['x1']) / 2.0 < col_right + 1.5
                ]

                # Sort by reading order inside slot
                slot_words.sort(key=lambda w: (round(w['y0'], 1), w['x0']))
                cell_text = " ".join(w['text'] for w in slot_words).strip()

                val, cat, fmt = infer_cell_data_type(cell_text)

                cell = TableCell(
                    text=cell_text,
                    bbox=(col_left, row_y0, col_right, row_y1),
                    row_idx=row_idx,
                    col_idx=col_idx,
                    rowspan=1,
                    colspan=1,
                    is_header=(row_idx == 0),
                    indent_level=detect_indentation_level(cell_text, col_left, table_x0),
                    data_type=cat,
                    typed_value=val,
                    format_code=fmt
                )
                cells.append(cell)

            # Check that this row isn't completely blank
            if any(c.text for c in cells):
                row_bbox = (table_x0, row_y0, table_x1, row_y1)
                rows.append(TableRow(cells=cells, row_idx=row_idx, bbox=row_bbox, is_header=(row_idx == 0)))

        if len(rows) < self.min_rows:
            return None

        # Build table block
        return TableBlock(
            bbox=(table_x0, table_y0, table_x1, table_y1),
            rows=rows,
            table_type="stream",
            has_merged_cells=False,
            metadata={'col_count': len(column_boundaries) - 1, 'row_count': len(rows)}
        )

    def _segment_rows_hpp(self, words: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Segments words into rows by grouping words sharing similar y-baselines
        within font-height tolerance.
        """
        # Sort words by vertical coordinate
        sorted_by_y = sorted(words, key=lambda w: (round(w['y0'], 1), w['x0']))

        rows: List[List[Dict[str, Any]]] = []
        curr_row: List[Dict[str, Any]] = [sorted_by_y[0]]
        curr_y_mid = (sorted_by_y[0]['y0'] + sorted_by_y[0]['y1']) / 2.0
        avg_h = max(8.0, sorted_by_y[0]['y1'] - sorted_by_y[0]['y0'])

        for w in sorted_by_y[1:]:
            w_mid = (w['y0'] + w['y1']) / 2.0
            h = max(8.0, w['y1'] - w['y0'])
            tolerance = min(avg_h, h) * 0.55

            if abs(w_mid - curr_y_mid) <= tolerance:
                curr_row.append(w)
            else:
                # Sort row words by horizontal x
                curr_row.sort(key=lambda item: item['x0'])
                rows.append(curr_row)
                curr_row = [w]
                curr_y_mid = w_mid
                avg_h = (avg_h + h) / 2.0

        if curr_row:
            curr_row.sort(key=lambda item: item['x0'])
            rows.append(curr_row)

        return rows

    def _detect_column_gutters(
        self,
        all_words: List[Dict[str, Any]],
        rows: List[List[Dict[str, Any]]]
    ) -> List[float]:
        """
        Detects vertical column gutter boundaries across multi-column rows.
        A column gutter is a vertical strip where no words reside across table rows.
        """
        multi_rows = [r for r in rows if len(_cluster_words_in_row(r, self.gutter_min_width)) >= 2]
        if not multi_rows:
            multi_rows = rows

        words_in_multi = [w for r in multi_rows for w in r]
        min_x = min(w['x0'] for w in words_in_multi)
        max_x = max(w['x1'] for w in words_in_multi)

        x_span = int(max_x - min_x) + 2
        if x_span <= 20:
            return [min_x, max_x]

        occupancy = [0] * x_span
        for w in words_in_multi:
            start_i = max(0, int(w['x0'] - min_x))
            end_i = min(x_span - 1, int(w['x1'] - min_x))
            for i in range(start_i, end_i + 1):
                occupancy[i] += 1

        gutters = []
        in_trough = False
        trough_start = 0
        for i, count in enumerate(occupancy):
            if count == 0:
                if not in_trough:
                    in_trough = True
                    trough_start = i
            else:
                if in_trough:
                    w_len = i - trough_start
                    if w_len >= self.gutter_min_width:
                        gutters.append(min_x + trough_start + (w_len / 2.0))
                    in_trough = False

        if in_trough:
            w_len = len(occupancy) - trough_start
            if w_len >= self.gutter_min_width:
                gutters.append(min_x + trough_start + (w_len / 2.0))

        valid_gutters = [g for g in gutters if min_x + 10.0 <= g <= max_x - 10.0]
        boundaries = [min_x - 2.0] + sorted(valid_gutters) + [max_x + 2.0]
        cleaned_boundaries = [boundaries[0]]
        for b in boundaries[1:]:
            if b - cleaned_boundaries[-1] >= 15.0:
                cleaned_boundaries.append(b)

        if cleaned_boundaries[-1] != boundaries[-1]:
            cleaned_boundaries.append(boundaries[-1])

        return cleaned_boundaries
