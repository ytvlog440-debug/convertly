"""
Convertly V2 — Native PDF Vector Drawing & Path Analyzer
Directly extracts vector drawing paths, line segments, and rectangles from PyMuPDF
without rasterization overhead. Used as the foundation for the Lattice table extractor.
"""

from typing import List, Tuple, Dict, Any
import fitz  # PyMuPDF


class VectorPathParser:
    """
    Parses native PDF vector drawings to identify horizontal and vertical
    line grids, rectangles, and table bounding boxes.
    """

    def __init__(self, min_line_length: float = 18.0, snap_tolerance: float = 3.0):
        self.min_line_length = min_line_length
        self.snap_tolerance = snap_tolerance

    def extract_vector_grid(self, page: fitz.Page) -> Dict[str, Any]:
        """
        Extracts horizontal lines, vertical lines, and closed rectangles from page drawings.
        Returns: {
            'horizontal_lines': [(y, x0, x1, stroke_width)],
            'vertical_lines': [(x, y0, y1, stroke_width)],
            'rectangles': [(x0, y0, x1, y1, fill_color, stroke_color)],
            'table_candidates': [(x0, y0, x1, y1)]
        }
        """
        h_lines: List[Tuple[float, float, float, float]] = []
        v_lines: List[Tuple[float, float, float, float]] = []
        rects: List[Tuple[float, float, float, float, Any, Any]] = []

        try:
            drawings = page.get_drawings()
        except Exception:
            return {
                'horizontal_lines': [],
                'vertical_lines': [],
                'rectangles': [],
                'table_candidates': []
            }

        for item in drawings:
            rect = item.get("rect")
            items = item.get("items", [])
            stroke_width = item.get("width", 1.0)
            fill_color = item.get("fill")
            stroke_color = item.get("color")

            # Check if this drawing is a closed rectangle (often table cells or header fills)
            if rect:
                w = rect.x1 - rect.x0
                h = rect.y1 - rect.y0

                # Thin horizontal line represented as narrow filled rect
                if h <= 2.5 and w >= self.min_line_length:
                    y_mid = (rect.y0 + rect.y1) / 2.0
                    h_lines.append((y_mid, rect.x0, rect.x1, h))
                # Thin vertical line represented as narrow filled rect
                elif w <= 2.5 and h >= self.min_line_length:
                    x_mid = (rect.x0 + rect.x1) / 2.0
                    v_lines.append((x_mid, rect.y0, rect.y1, w))
                # Actual rectangular cell
                elif w >= 15.0 and h >= 8.0:
                    rects.append((rect.x0, rect.y0, rect.x1, rect.y1, fill_color, stroke_color))

            # Inspect line / curve drawing primitives
            for itm in items:
                cmd = itm[0]
                if cmd == "l":  # Line: ('l', Point(p1), Point(p2))
                    p1, p2 = itm[1], itm[2]
                    dx = abs(p2.x - p1.x)
                    dy = abs(p2.y - p1.y)

                    # Horizontal line
                    if dy <= self.snap_tolerance and dx >= self.min_line_length:
                        y_avg = (p1.y + p2.y) / 2.0
                        x_min = min(p1.x, p2.x)
                        x_max = max(p1.x, p2.x)
                        h_lines.append((y_avg, x_min, x_max, stroke_width))
                    # Vertical line
                    elif dx <= self.snap_tolerance and dy >= self.min_line_length:
                        x_avg = (p1.x + p2.x) / 2.0
                        y_min = min(p1.y, p2.y)
                        y_max = max(p1.y, p2.y)
                        v_lines.append((x_avg, y_min, y_max, stroke_width))

                elif cmd == "re":  # Rectangle: ('re', Rect)
                    r = itm[1]
                    w = r.x1 - r.x0
                    h = r.y1 - r.y0
                    if h <= 2.5 and w >= self.min_line_length:
                        h_lines.append(((r.y0 + r.y1) / 2.0, r.x0, r.x1, stroke_width))
                    elif w <= 2.5 and h >= self.min_line_length:
                        v_lines.append(((r.x0 + r.x1) / 2.0, r.y0, r.y1, stroke_width))
                    elif w >= 15.0 and h >= 8.0:
                        rects.append((r.x0, r.y0, r.x1, r.y1, fill_color, stroke_color))

        # Cluster collinear overlapping lines
        merged_h = self._merge_collinear_lines(h_lines, is_horizontal=True)
        merged_v = self._merge_collinear_lines(v_lines, is_horizontal=False)

        # Detect candidate table bounding regions from line clusters
        table_candidates = self._find_table_regions_from_lines(merged_h, merged_v)

        return {
            'horizontal_lines': merged_h,
            'vertical_lines': merged_v,
            'rectangles': rects,
            'table_candidates': table_candidates
        }

    def _merge_collinear_lines(
        self,
        lines: List[Tuple[float, float, float, float]],
        is_horizontal: bool
    ) -> List[Tuple[float, float, float, float]]:
        """Merges fragmented line segments that share the same axis and overlap or touch."""
        if not lines:
            return []

        # Sort by primary axis, then start coordinate
        lines_sorted = sorted(lines, key=lambda l: (round(l[0], 1), l[1]))
        merged = []

        curr_axis, curr_start, curr_end, curr_width = lines_sorted[0]

        for axis, start, end, width in lines_sorted[1:]:
            # Check if on same axis (within snap tolerance)
            if abs(axis - curr_axis) <= self.snap_tolerance:
                # Check if overlapping or touching (within 4 points)
                if start <= curr_end + 4.0:
                    curr_end = max(curr_end, end)
                    continue

            merged.append((curr_axis, curr_start, curr_end, curr_width))
            curr_axis, curr_start, curr_end, curr_width = axis, start, end, width

        merged.append((curr_axis, curr_start, curr_end, curr_width))
        return merged

    def _find_table_regions_from_lines(
        self,
        h_lines: List[Tuple[float, float, float, float]],
        v_lines: List[Tuple[float, float, float, float]]
    ) -> List[Tuple[float, float, float, float]]:
        """Finds bounding boxes of table regions formed by 2+ horizontal and vertical lines."""
        if len(h_lines) < 2:
            return []

        # Group horizontal lines by proximity to identify table bands
        regions = []
        # Sort h_lines by y
        h_sorted = sorted(h_lines, key=lambda l: l[0])
        curr_band = [h_sorted[0]]

        for line in h_sorted[1:]:
            # If gap between consecutive horizontal lines is less than 120 points (standard table row/gap)
            if line[0] - curr_band[-1][0] <= 120.0:
                curr_band.append(line)
            else:
                if len(curr_band) >= 2:
                    y0 = curr_band[0][0]
                    y1 = curr_band[-1][0]
                    x0 = min(l[1] for l in curr_band)
                    x1 = max(l[2] for l in curr_band)
                    if (y1 - y0) >= 20.0 and (x1 - x0) >= 60.0:
                        regions.append((x0, y0, x1, y1))
                curr_band = [line]

        if len(curr_band) >= 2:
            y0 = curr_band[0][0]
            y1 = curr_band[-1][0]
            x0 = min(l[1] for l in curr_band)
            x1 = max(l[2] for l in curr_band)
            if (y1 - y0) >= 20.0 and (x1 - x0) >= 60.0:
                regions.append((x0, y0, x1, y1))

        return regions
