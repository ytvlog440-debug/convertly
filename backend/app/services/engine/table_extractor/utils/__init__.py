"""
Convertly V2 — Enterprise Table Extractor Shared Utilities Package
Provides geometric computations, bounding box algebra, normalization,
and type-safe parsing for currency, percentages, dates, and numbers.
"""

from .geometry import (
    bbox_intersection,
    bbox_union,
    bbox_iou,
    bbox_overlap_ratio,
    bbox_contains,
    bbox_distance,
    snap_coordinate,
    point_in_bbox,
)

from .parsing import (
    clean_text,
    clean_ocr_artifacts,
    parse_number,
    parse_currency,
    parse_percentage,
    parse_date,
    detect_cell_data_type,
)

__all__ = [
    "bbox_intersection",
    "bbox_union",
    "bbox_iou",
    "bbox_overlap_ratio",
    "bbox_contains",
    "bbox_distance",
    "snap_coordinate",
    "point_in_bbox",
    "clean_text",
    "clean_ocr_artifacts",
    "parse_number",
    "parse_currency",
    "parse_percentage",
    "parse_date",
    "detect_cell_data_type",
]
