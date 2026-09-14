"""
Convertly V2 — Enterprise Table Extractor Geometry Utilities
Robust 2D bounding box spatial operations, intersection, IoU, containment,
distance, coordinate snapping, and geometric alignment helpers.
"""

import math
from typing import Tuple, Union, Optional
from ..models import BoundingBox

BBoxType = Union[Tuple[float, float, float, float], BoundingBox]


def _to_coords(b: BBoxType) -> Tuple[float, float, float, float]:
    """Coerce BoundingBox or 4-tuple to tuple of floats (x0, y0, x1, y1)."""
    if isinstance(b, BoundingBox):
        return (float(b.x0), float(b.y0), float(b.x1), float(b.y1))
    return (float(b[0]), float(b[1]), float(b[2]), float(b[3]))


def bbox_intersection(b1: BBoxType, b2: BBoxType) -> Optional[Tuple[float, float, float, float]]:
    """
    Compute intersection rectangle of two bounding boxes.
    Returns (x0, y0, x1, y1) or None if no intersection exists.
    """
    x0_1, y0_1, x1_1, y1_1 = _to_coords(b1)
    x0_2, y0_2, x1_2, y1_2 = _to_coords(b2)

    ix0 = max(x0_1, x0_2)
    iy0 = max(y0_1, y0_2)
    ix1 = min(x1_1, x1_2)
    iy1 = min(y1_1, y1_2)

    if ix0 < ix1 and iy0 < iy1:
        return (ix0, iy0, ix1, iy1)
    return None


def bbox_union(b1: BBoxType, b2: BBoxType) -> Tuple[float, float, float, float]:
    """Compute the minimum bounding rectangle enclosing both boxes."""
    x0_1, y0_1, x1_1, y1_1 = _to_coords(b1)
    x0_2, y0_2, x1_2, y1_2 = _to_coords(b2)
    return (min(x0_1, x0_2), min(y0_1, y0_2), max(x1_1, x1_2), max(y1_1, y1_2))


def bbox_area(b: BBoxType) -> float:
    """Calculate the area of a bounding box."""
    x0, y0, x1, y1 = _to_coords(b)
    w = max(0.0, x1 - x0)
    h = max(0.0, y1 - y0)
    return w * h


def bbox_iou(b1: BBoxType, b2: BBoxType) -> float:
    """
    Compute Intersection over Union (IoU) between two bounding boxes.
    Returns a float in [0.0, 1.0].
    """
    inter = bbox_intersection(b1, b2)
    if not inter:
        return 0.0

    inter_area = bbox_area(inter)
    a1 = bbox_area(b1)
    a2 = bbox_area(b2)
    union_area = a1 + a2 - inter_area

    if union_area <= 0.0:
        return 0.0
    return min(1.0, max(0.0, inter_area / union_area))


def bbox_overlap_ratio(inner: BBoxType, target: BBoxType) -> float:
    """
    Compute what fraction of `inner` lies within `target`.
    Returns a float in [0.0, 1.0].
    """
    inter = bbox_intersection(inner, target)
    if not inter:
        return 0.0
    inner_area = bbox_area(inner)
    if inner_area <= 0.0:
        return 0.0
    return min(1.0, max(0.0, bbox_area(inter) / inner_area))


def bbox_contains(outer: BBoxType, inner: BBoxType, tolerance: float = 1.0) -> bool:
    """
    Check if outer bounding box contains inner bounding box within a tolerance.
    """
    ox0, oy0, ox1, oy1 = _to_coords(outer)
    ix0, iy0, ix1, iy1 = _to_coords(inner)

    return (
        ox0 - tolerance <= ix0 and
        oy0 - tolerance <= iy0 and
        ix1 <= ox1 + tolerance and
        iy1 <= oy1 + tolerance
    )


def bbox_distance(b1: BBoxType, b2: BBoxType) -> float:
    """
    Calculate Euclidean distance between bounding box centers.
    """
    x0_1, y0_1, x1_1, y1_1 = _to_coords(b1)
    x0_2, y0_2, x1_2, y1_2 = _to_coords(b2)

    cx1 = (x0_1 + x1_1) / 2.0
    cy1 = (y0_1 + y1_1) / 2.0
    cx2 = (x0_2 + x1_2) / 2.0
    cy2 = (y0_2 + y1_2) / 2.0

    return math.hypot(cx1 - cx2, cy1 - cy2)


def point_in_bbox(point: Tuple[float, float], bbox: BBoxType) -> bool:
    """Check if point (px, py) is contained within bbox."""
    px, py = point
    x0, y0, x1, y1 = _to_coords(bbox)
    return x0 <= px <= x1 and y0 <= py <= y1


def snap_coordinate(value: float, targets: list, tolerance: float = 2.0) -> float:
    """
    Snap a coordinate to the closest target value within tolerance.
    If no target is within tolerance, returns the original value.
    """
    if not targets:
        return value

    closest = min(targets, key=lambda t: abs(t - value))
    if abs(closest - value) <= tolerance:
        return closest
    return value
