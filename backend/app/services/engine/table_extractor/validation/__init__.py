"""
Convertly V2 — Table Validation & Reconciliation Package
Reconciles column balance, arithmetic row sums, and data format consistency.
"""

from .validator import TableValidator

__all__ = [
    "TableValidator",
]
