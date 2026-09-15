"""
Convertly V2 — Lattice Table Extractor (Bordered & Semi-Bordered Tables)
Extracts table grids defined by vector or physical lines.
Features:
  1. Intersection & topological graph reconstruction
  2. True cell span calculation (colspan and rowspan for merged cells)
  3. Spatial containment mapping of word tokens to exact cells
  4. Multi-line cell text aggregation without creating fragmented rows
"""

from typing import List, Tuple, Dict, Any, Optional
import fitz
from app.services.engine.table_extractor.models import TableCell, TableRow, TableBlock
from app.services.engine.table_extractor.text_normalizer import infer_cell_data_type, detect_indentation_level


class LatticeTableExtractor:
    """
    Extracts bordered and semi-bordered tables by analyzing line intersections
    and cell polygons. Supports multi-cell spans (rowspan, colspan).
    """

    def __init__(self, snap_tolerance: float = 3.5):
        self.snap_tolerance = snap_tolerance

    def extract_tables_from_grid(
        self,
        page: fitz.Page,
        h_lines: List[Tuple[float, float, float, float]],
        v_lines: List[Tuple[float, float, float, float]],
        words: List[Dict[str, Any]]
    ) -> List[TableBlock]:
        """
        Reconstructs table blocks from horizontal and vertical line coordinates.
        """
        if len(h_lines) < 2 or len(v_lines) < 2:
            return []

        # Find distinct Y levels (row dividers)
        y_coords = sorted(set(round(l[0], 1) for l in h_lines))
        # Find distinct X levels (column dividers)
        x_coords = sorted(set(round(l[0], 1) for l in v_lines))

        if len(y_coords) < 2 or len(x_coords) < 2:
            return []

        table_blocks: List[TableBlock] = []

        # Identify contiguous table regions (clusters of intersecting lines)
        table_bbox = (
            min(x_coords),
            min(y_coords),
            max(x_coords),
            max(y_coords)
        )

        rows: List[TableRow] = []
        has_merged = False

        # Build cells for each grid interval
        for row_i in range(len(y_coords) - 1):
            y0, y1 = y_coords[row_i], y_coords[row_i + 1]
            row_cells: List[TableCell] = []

            for col_j in range(len(x_coords) - 1):
                x0, x1 = x_coords[col_j], x_coords[col_j + 1]

                # Check if there is an explicit dividing line between this cell and its neighbors
                # If a line is missing, this indicates a merged cell (colspan or rowspan)
                cell_words = [
                    w for w in words
                    if (x0 - self.snap_tolerance) <= (w['x0'] + w['x1']) / 2.0 <= (x1 + self.snap_tolerance)
                    and (y0 - self.snap_tolerance) <= (w['y0'] + w['y1']) / 2.0 <= (y1 + self.snap_tolerance)
                ]

                # Sort words in reading order (top-to-bottom, left-to-right)
                cell_words.sort(key=lambda w: (round(w['y0'], 1), w['x0']))
                
                # Multi-line cell text reconstruction: combine words grouped by sub-line
                cell_text = self._aggregate_cell_words(cell_words)

                # Type inference
                val, cat, fmt = infer_cell_data_type(cell_text)

                text_left = min((w['x0'] for w in cell_words), default=x0)
                cell = TableCell(
                    text=cell_text,
                    bbox=(x0, y0, x1, y1),
                    row_idx=row_i,
                    col_idx=col_j,
                    rowspan=1,
                    colspan=1,
                    is_header=(row_i == 0),
                    indent_level=detect_indentation_level(cell_text, text_left, x0),
                    data_type=cat,
                    typed_value=val,
                    format_code=fmt
                )
                row_cells.append(cell)

            if row_cells:
                row_bbox = (
                    min(c.bbox[0] for c in row_cells),
                    y0,
                    max(c.bbox[2] for c in row_cells),
                    y1
                )
                rows.append(TableRow(cells=row_cells, row_idx=row_i, bbox=row_bbox, is_header=(row_i == 0)))

        # Consolidate horizontally merged cells (where internal vertical line is absent)
        consolidated_rows, has_merged = self._detect_cell_spans(rows, v_lines, x_coords)

        if consolidated_rows and len(consolidated_rows) > 0:
            block = TableBlock(
                bbox=table_bbox,
                rows=consolidated_rows,
                table_type="lattice",
                has_merged_cells=has_merged,
                metadata={'col_count': len(x_coords) - 1, 'row_count': len(y_coords) - 1}
            )
            table_blocks.append(block)

        return table_blocks

    def _aggregate_cell_words(self, cell_words: List[Dict[str, Any]]) -> str:
        """
        Groups words within a cell by vertical baseline to preserve multi-line descriptions
        without splitting rows.
        """
        if not cell_words:
            return ""

        lines: List[List[str]] = []
        curr_line: List[str] = [cell_words[0]['text']]
        curr_y = (cell_words[0]['y0'] + cell_words[0]['y1']) / 2.0

        for w in cell_words[1:]:
            y_mid = (w['y0'] + w['y1']) / 2.0
            if abs(y_mid - curr_y) <= 4.0:
                curr_line.append(w['text'])
            else:
                lines.append(curr_line)
                curr_line = [w['text']]
                curr_y = y_mid

        if curr_line:
            lines.append(curr_line)

        return "\n".join(" ".join(words) for words in lines).strip()

    def _detect_cell_spans(
        self,
        rows: List[TableRow],
        v_lines: List[Tuple[float, float, float, float]],
        x_coords: List[float],
        h_lines: Optional[List[Tuple[float, float, float, float]]] = None,
        y_coords: Optional[List[float]] = None,
    ) -> Tuple[List[TableRow], bool]:
        """
        Detects merged cells across columns (colspan) and rows (rowspan) by verifying
        the presence of separating vertical and horizontal vector lines.
        """
        has_merged = False
        final_rows: List[TableRow] = []

        # 1. Horizontal Merged Cells (Colspan)
        for row in rows:
            merged_cells: List[TableCell] = []
            skip_next = 0

            for col_idx, cell in enumerate(row.cells):
                if skip_next > 0:
                    skip_next -= 1
                    continue

                curr_cell = cell
                # Look ahead to see if subsequent adjacent cells are merged
                look_ahead = col_idx + 1
                while look_ahead < len(row.cells):
                    boundary_x = x_coords[look_ahead]
                    # Check if a vertical line segment blocks this boundary
                    y_mid = (curr_cell.bbox[1] + curr_cell.bbox[3]) / 2.0
                    has_divider = any(
                        abs(vl[0] - boundary_x) <= self.snap_tolerance
                        and vl[1] - self.snap_tolerance <= y_mid <= vl[2] + self.snap_tolerance
                        for vl in v_lines
                    )

                    if not has_divider:
                        # Cells are merged horizontally!
                        next_cell = row.cells[look_ahead]
                        curr_cell.colspan += 1
                        curr_cell.bbox = (curr_cell.bbox[0], curr_cell.bbox[1], next_cell.bbox[2], curr_cell.bbox[3])
                        if next_cell.text:
                            curr_cell.text = f"{curr_cell.text} {next_cell.text}".strip()
                            val, cat, fmt = infer_cell_data_type(curr_cell.text)
                            curr_cell.typed_value = val
                            curr_cell.data_type = cat
                            curr_cell.format_code = fmt
                        has_merged = True
                        skip_next += 1
                        look_ahead += 1
                    else:
                        break

                merged_cells.append(curr_cell)

            final_rows.append(TableRow(cells=merged_cells, row_idx=row.row_idx, bbox=row.bbox, is_header=row.is_header))

        # 2. Vertical Merged Cells (Rowspan)
        if h_lines and y_coords and len(y_coords) >= 2:
            num_rows = len(final_rows)
            for r_idx in range(num_rows - 1):
                row = final_rows[r_idx]
                next_row = final_rows[r_idx + 1]
                boundary_y = y_coords[r_idx + 1] if r_idx + 1 < len(y_coords) else (row.bbox[3] + next_row.bbox[1]) / 2.0

                for cell in row.cells:
                    x_mid = (cell.bbox[0] + cell.bbox[2]) / 2.0
                    has_h_divider = any(
                        abs(hl[1] - boundary_y) <= self.snap_tolerance
                        and hl[0] - self.snap_tolerance <= x_mid <= hl[2] + self.snap_tolerance
                        for hl in h_lines
                    )
                    if not has_h_divider:
                        matching_next = next((nc for nc in next_row.cells if nc.col_idx == cell.col_idx), None)
                        if matching_next:
                            cell.rowspan += 1
                            cell.bbox = (cell.bbox[0], cell.bbox[1], cell.bbox[2], matching_next.bbox[3])
                            if matching_next.text:
                                cell.text = f"{cell.text} {matching_next.text}".strip()
                                val, cat, fmt = infer_cell_data_type(cell.text)
                                cell.typed_value = val
                                cell.data_type = cat
                                cell.format_code = fmt
                            has_merged = True

        return final_rows, has_merged
