"""
Convertly V2 — Enterprise Table Extraction Data Models
Represents structural and topological table elements with coordinate geometry,
spans, and semantic typing.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Any, Tuple, Dict


@dataclass
class TableCell:
    """Represents an individual cell in an extracted table grid."""
    text: str
    bbox: Tuple[float, float, float, float]  # (x0, y0, x1, y1)
    row_idx: int
    col_idx: int
    rowspan: int = 1
    colspan: int = 1
    is_header: bool = False
    indent_level: int = 0
    data_type: str = "text"  # 'text' | 'number' | 'currency' | 'percentage' | 'date'
    typed_value: Any = None
    format_code: Optional[str] = None

    @property
    def width(self) -> float:
        return max(0.0, self.bbox[2] - self.bbox[0])

    @property
    def height(self) -> float:
        return max(0.0, self.bbox[3] - self.bbox[1])


@dataclass
class TableRow:
    """Represents a row of cells with bounding box and header flag."""
    cells: List[TableCell] = field(default_factory=list)
    row_idx: int = 0
    bbox: Tuple[float, float, float, float] = (0.0, 0.0, 0.0, 0.0)
    is_header: bool = False


@dataclass
class TableBlock:
    """Represents a structured table block on a document page."""
    bbox: Tuple[float, float, float, float]  # (x0, y0, x1, y1)
    rows: List[TableRow] = field(default_factory=list)
    table_type: str = "lattice"  # 'lattice' | 'stream' | 'key_value' | 'summary'
    has_merged_cells: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)

    @property
    def row_count(self) -> int:
        return len(self.rows)

    @property
    def col_count(self) -> int:
        if not self.rows:
            return 0
        return max(len(r.cells) for r in self.rows)


@dataclass
class KeyValueBlock:
    """Represents key-value metadata pairs (e.g. Invoice #, Bill-To, Date)."""
    items: List[Tuple[str, str]] = field(default_factory=list)
    bbox: Tuple[float, float, float, float] = (0.0, 0.0, 0.0, 0.0)
    section: str = "header"  # 'header' | 'footer' | 'notes'


@dataclass
class PageLayout:
    """Represents the complete semantic decomposition of a single document page."""
    page_idx: int
    width: float
    height: float
    is_scanned: bool = False
    tables: List[TableBlock] = field(default_factory=list)
    key_values: List[KeyValueBlock] = field(default_factory=list)
    text_lines: List[Tuple[str, Tuple[float, float, float, float]]] = field(default_factory=list)
