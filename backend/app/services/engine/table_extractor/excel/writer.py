"""
Convertly V2 — Enterprise High-Fidelity Excel Generation Engine
Produces executive OpenXML XLSX workbooks using openpyxl with native typed values,
accounting number formats, hierarchical cell indentation, auto column widths,
and merged span synthesis.
"""

import io
import os
from typing import List, Dict, Any, Optional
import openpyxl
from openpyxl.cell.cell import ILLEGAL_CHARACTERS_RE
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

MAX_EXCEL_ROWS = 1048576
MAX_EXCEL_COLS = 16384

from ..constants import (
    MIN_COL_WIDTH_EXCEL,
    MAX_COL_WIDTH_EXCEL,
    FORMAT_CURRENCY_USD,
    FORMAT_PERCENTAGE,
    FORMAT_NUMBER_INT,
    FORMAT_NUMBER_FLOAT,
    FORMAT_DATE_ISO,
)
from ..models import (
    TableCell,
    TableRow,
    TableBlock,
)
from ..interfaces import BaseExcelWriter
from ..config import TableExtractorConfig
from ..errors import ExcelWriterError


# Executive Palette
HEADER_FILL = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")  # Dark Slate
HEADER_FONT = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
TOTAL_FILL = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")    # Soft slate gray
TOTAL_FONT = Font(name="Calibri", size=11, bold=True, color="0F172A")
REGULAR_FONT = Font(name="Calibri", size=11, color="000000")

SUBTLE_BORDER = Border(
    left=Side(style="thin", color="E2E8F0"),
    right=Side(style="thin", color="E2E8F0"),
    top=Side(style="thin", color="E2E8F0"),
    bottom=Side(style="thin", color="E2E8F0"),
)


class EnterpriseExcelWriter(BaseExcelWriter):
    """
    Serializes extracted and reconstructed TableBlocks into enterprise-grade
    OpenXML XLSX workbooks with rich styling, auto-formatting, and formula-ready numbers.
    """

    def generate(
        self,
        tables: List[TableBlock],
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> bytes:
        """
        Serialize extracted table blocks into an in-memory XLSX byte buffer.
        """
        cfg = config or TableExtractorConfig()
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Extracted Table"
        ws.views.sheetView[0].showGridLines = True

        current_row_idx = 1

        for t_idx, table in enumerate(tables):
            if not table.rows:
                continue

            # If not the first table, leave 2 empty spacer rows
            if t_idx > 0:
                current_row_idx += 2

            start_table_row = current_row_idx

            for r in table.rows:
                if current_row_idx > MAX_EXCEL_ROWS:
                    break
                for cell in r.cells:
                    c_idx = cell.col_idx + 1
                    if c_idx > MAX_EXCEL_COLS:
                        continue
                    excel_cell = ws.cell(row=current_row_idx, column=c_idx)
                    self._populate_cell(excel_cell, cell, r.is_header)

                # Row height
                ws.row_dimensions[current_row_idx].height = 20.0
                current_row_idx += 1

            # Synthesize merged cell spans
            self._apply_merged_spans(ws, table, start_table_row)

        # Calculate auto column widths
        self._auto_fit_columns(ws)

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf.getvalue()

    def write_to_path(
        self,
        tables: List[TableBlock],
        output_path: str,
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> str:
        """
        Serialize tables directly to an XLSX file on disk.
        """
        data = self.generate(tables, config, **kwargs)
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(data)
        return output_path

    def _populate_cell(self, excel_cell: Any, cell: TableCell, is_row_header: bool) -> None:
        """Sets native value, OpenXML number format, alignments, and fonts."""
        # 1. Assign Value
        if cell.typed_value is not None:
            if isinstance(cell.typed_value, str):
                excel_cell.value = ILLEGAL_CHARACTERS_RE.sub("", cell.typed_value)
            else:
                excel_cell.value = cell.typed_value
        else:
            val = str(cell.text) if cell.text is not None else ""
            excel_cell.value = ILLEGAL_CHARACTERS_RE.sub("", val)

        # 2. Assign Formatting
        if cell.format_code:
            excel_cell.number_format = cell.format_code
        elif cell.data_type == "currency":
            excel_cell.number_format = FORMAT_CURRENCY_USD
        elif cell.data_type == "percentage":
            excel_cell.number_format = FORMAT_PERCENTAGE
        elif cell.data_type == "number":
            excel_cell.number_format = FORMAT_NUMBER_FLOAT if isinstance(cell.typed_value, float) else FORMAT_NUMBER_INT
        elif cell.data_type == "date":
            excel_cell.number_format = FORMAT_DATE_ISO

        # 3. Typography & Styling
        is_header = cell.is_header or is_row_header
        is_total = "total" in str(excel_cell.value).lower()

        if is_header:
            excel_cell.fill = HEADER_FILL
            excel_cell.font = HEADER_FONT
            h_align = "right" if cell.data_type in ("number", "currency", "percentage") else "left"
        elif is_total:
            excel_cell.fill = TOTAL_FILL
            excel_cell.font = TOTAL_FONT
            h_align = "right" if cell.data_type in ("number", "currency", "percentage") else "left"
        else:
            excel_cell.font = REGULAR_FONT
            h_align = "right" if cell.data_type in ("number", "currency", "percentage") else "left"

        # Apply indentation if present
        indent_val = cell.indent_level if cell.indent_level > 0 else 0
        excel_cell.alignment = Alignment(
            horizontal=h_align,
            vertical="center",
            indent=indent_val,
            wrap_text=("\n" in str(excel_cell.value)),
        )

        excel_cell.border = SUBTLE_BORDER

    def _apply_merged_spans(self, ws: Any, table: TableBlock, start_row: int) -> None:
        """Merges rectangular cell coordinate spans with complete borders and centered text."""
        for r_offset, r in enumerate(table.rows):
            excel_r = start_row + r_offset
            for cell in r.cells:
                if cell.colspan > 1 or cell.rowspan > 1:
                    target_c = cell.col_idx + 1
                    end_r = excel_r + cell.rowspan - 1
                    end_c = target_c + cell.colspan - 1
                    is_hdr = cell.is_header or r.is_header

                    # Ensure all cells inside merged rectangle receive consistent border and fill
                    for mr in range(excel_r, end_r + 1):
                        for mc in range(target_c, end_c + 1):
                            cell_in_box = ws.cell(row=mr, column=mc)
                            cell_in_box.border = SUBTLE_BORDER
                            if is_hdr:
                                cell_in_box.fill = HEADER_FILL

                    ws.merge_cells(
                        start_row=excel_r,
                        start_column=target_c,
                        end_row=end_r,
                        end_column=end_c,
                    )
                    top_left = ws.cell(row=excel_r, column=target_c)
                    if is_hdr or end_c > target_c:
                        top_left.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)


    def _auto_fit_columns(self, ws: Any) -> None:
        """Calculates optimal column widths based on maximum cell content lengths."""
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)

            for cell in col:
                val = cell.value
                if val is not None:
                    # Take line length of longest line if multi-line text
                    lines = str(val).split("\n")
                    line_len = max(len(l) for l in lines)
                    if line_len > max_len:
                        max_len = line_len

            # Add padding factor (~1.25x)
            optimal_width = max(MIN_COL_WIDTH_EXCEL, min(MAX_COL_WIDTH_EXCEL, max_len + 3))
            ws.column_dimensions[col_letter].width = optimal_width
