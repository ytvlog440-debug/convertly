"""
Convertly V2 — Table Validation & Reconciliation Engine
Audits extracted table structures, validates column continuity,
verifies numeric and currency types, and reconciles arithmetic sums.
"""

from typing import List, Dict, Any, Optional
import math

from ..models import (
    TableBlock,
    ValidationReport,
)
from ..interfaces import BaseValidator
from ..config import TableExtractorConfig


TOTAL_KEYWORDS = ("total", "subtotal", "sum", "amount due", "net total", "gross total")


class TableValidator(BaseValidator):
    """
    Validates structural symmetry and arithmetic consistency of extracted tables.
    Verifies that total rows equal the sum of constituent line items.
    """

    def validate(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> ValidationReport:
        """
        Runs comprehensive validation checks on an extracted TableBlock.
        """
        cfg = config or TableExtractorConfig()

        if not table.rows:
            return ValidationReport(
                is_valid=False,
                violations=[{"type": "empty_table", "message": "Table contains zero rows."}]
            )

        violations: List[Dict[str, Any]] = []
        math_passed = 0
        math_failed = 0

        # 1. Structural column check
        col_lens = [len(r.cells) for r in table.rows]
        max_cols = max(col_lens)
        min_cols = min(col_lens)

        if max_cols == 0:
            violations.append({"type": "structural", "message": "Table has zero columns."})
        elif max_cols != min_cols:
            violations.append({
                "type": "column_variance",
                "message": f"Inconsistent column count across rows (min={min_cols}, max={max_cols})."
            })

        # 2. Arithmetic Reconciliation
        # Search for total/subtotal rows
        for r_idx, row in enumerate(table.rows):
            if not row.cells:
                continue

            first_text = row.cells[0].text.strip().lower()
            is_total_row = any(kw in first_text for kw in TOTAL_KEYWORDS)

            if is_total_row and r_idx > 0:
                # For each numeric column in this total row, check if sum of preceding rows matches
                for c_idx in range(len(row.cells)):
                    cell = row.cells[c_idx]
                    total_val = cell.typed_value

                    if isinstance(total_val, (int, float)) and cell.data_type in ("number", "currency"):
                        # Calculate sum of rows above until previous total row or header
                        computed_sum = 0.0
                        has_summable_items = False

                        for k in range(r_idx - 1, -1, -1):
                            prev_row = table.rows[k]
                            if prev_row.is_header:
                                break
                            prev_first = prev_row.cells[0].text.strip().lower() if prev_row.cells else ""
                            if any(kw in prev_first for kw in TOTAL_KEYWORDS):
                                break  # Don't cross previous subtotal boundary

                            if c_idx < len(prev_row.cells):
                                prev_cell = prev_row.cells[c_idx]
                                if isinstance(prev_cell.typed_value, (int, float)):
                                    computed_sum += float(prev_cell.typed_value)
                                    has_summable_items = True

                        if has_summable_items:
                            # Compare with 0.05 rounding tolerance
                            if math.isclose(computed_sum, float(total_val), abs_tol=0.05):
                                math_passed += 1
                            else:
                                math_failed += 1
                                violations.append({
                                    "type": "math_mismatch",
                                    "row_idx": r_idx,
                                    "col_idx": c_idx,
                                    "reported": float(total_val),
                                    "computed": round(computed_sum, 2),
                                    "message": f"Arithmetic sum mismatch at row {r_idx} col {c_idx}: reported {total_val} != computed {round(computed_sum, 2)}"
                                })

        is_valid = len(violations) == 0 and math_failed == 0

        return ValidationReport(
            is_valid=is_valid,
            math_checks_passed=math_passed,
            math_checks_failed=math_failed,
            empty_rows_stripped=0,
            split_words_repaired=0,
            violations=violations,
        )
