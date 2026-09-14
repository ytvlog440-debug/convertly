"""
Convertly V2 — Enterprise Table Extraction Interfaces & Base Classes
Defines standardized abstract contracts for extractors, classifiers, routers,
arbiters, validators, reconstructors, and excel writers.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

from .models import (
    TableBlock,
    PageLayout,
    DocumentProfile,
    RoutingDecision,
    ExtractionCandidate,
    QualityScore,
    ValidationReport,
    ExtractionResult,
)
from .config import TableExtractorConfig


class BaseExtractor(ABC):
    """Abstract base class for all table extraction engines (Lattice, Stream, Hybrid, OCR, etc.)."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique identifier of the extraction engine."""
        pass

    @abstractmethod
    def extract_page(
        self,
        pdf_bytes: bytes,
        page_idx: int,
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> ExtractionCandidate:
        """
        Extract tables from a single document page.
        Returns an ExtractionCandidate containing tables, confidence, and engine metrics.
        """
        pass

    @abstractmethod
    def extract_document(
        self,
        pdf_bytes: bytes,
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> List[ExtractionCandidate]:
        """
        Extract tables across all pages of a document.
        """
        pass


class BaseClassifier(ABC):
    """Abstract base class for document and page intelligence profiling."""

    @abstractmethod
    def profile_document(
        self,
        pdf_bytes: bytes,
        config: Optional[TableExtractorConfig] = None
    ) -> DocumentProfile:
        """
        Analyze the full document to determine document type, genre, ruling presence,
        and layout topology.
        """
        pass

    @abstractmethod
    def profile_page(
        self,
        pdf_bytes: bytes,
        page_idx: int,
        config: Optional[TableExtractorConfig] = None
    ) -> Dict[str, Any]:
        """
        Analyze an individual page to extract character density, ruling line topology,
        and scan status.
        """
        pass


class BaseRouter(ABC):
    """Abstract base class for routing engine decisions."""

    @abstractmethod
    def route(
        self,
        profile: DocumentProfile,
        config: Optional[TableExtractorConfig] = None
    ) -> RoutingDecision:
        """
        Determine the optimal primary engine and fallback engine based on the document profile.
        """
        pass


class BaseArbiter(ABC):
    """Abstract base class for multi-candidate quality evaluation and arbitration."""

    @abstractmethod
    def score_candidate(
        self,
        candidate: ExtractionCandidate,
        config: Optional[TableExtractorConfig] = None
    ) -> QualityScore:
        """
        Compute an objective quality score (0.0 - 1.0) and catalog defect penalties.
        """
        pass

    @abstractmethod
    def arbitrate(
        self,
        candidates: List[ExtractionCandidate],
        config: Optional[TableExtractorConfig] = None
    ) -> ExtractionCandidate:
        """
        Select the superior extraction candidate based on quality scoring and fallback logic.
        """
        pass


class BaseValidator(ABC):
    """Abstract base class for table validation and reconciliation."""

    @abstractmethod
    def validate(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> ValidationReport:
        """
        Validate table integrity: row/col continuity, numeric summations, and type consistency.
        """
        pass


class BaseReconstructor(ABC):
    """Abstract base class for post-extraction cell and table grid reconstruction."""

    @abstractmethod
    def reconstruct(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> TableBlock:
        """
        Perform complete deterministic repair pipeline: split words, broken rows,
        merged spans, and empty row stripping.
        """
        pass

    @abstractmethod
    def repair_broken_rows(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> TableBlock:
        """
        Detect and merge wrapped multi-line cells back into singular parent rows.
        """
        pass

    @abstractmethod
    def repair_split_words(
        self,
        table: TableBlock,
        config: Optional[TableExtractorConfig] = None
    ) -> TableBlock:
        """
        Identify hyphenated and kerning-fractured tokens and stitch them into whole words.
        """
        pass


class BaseExcelWriter(ABC):
    """Abstract base class for enterprise Excel serialization."""

    @abstractmethod
    def generate(
        self,
        tables: List[TableBlock],
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> bytes:
        """
        Serialize extracted table blocks into an OpenXML XLSX workbook byte buffer.
        """
        pass

    @abstractmethod
    def write_to_path(
        self,
        tables: List[TableBlock],
        output_path: str,
        config: Optional[TableExtractorConfig] = None,
        **kwargs: Any
    ) -> str:
        """
        Serialize extracted table blocks directly to an XLSX file on disk.
        """
        pass
