"""
Convertly V2 — Enterprise Table Extractor Phase 1 Foundation Test Suite
Validates constants, domain models, interfaces, dependency injection container,
configuration system, structured stage logging, error hierarchy, and shared geometry/parsing utilities.
"""

import pytest
import os
from typing import List, Dict, Any

from app.services.engine.table_extractor.constants import (
    DocumentType,
    TableTopology,
    DocumentGenre,
    EngineType,
    DEFAULT_SNAP_TOLERANCE,
    MIN_LINE_LENGTH_PTS,
    CONFIDENCE_HIGH,
    QUALITY_FALLBACK_THRESHOLD,
    STREAMING_PAGE_THRESHOLD,
    CURRENCY_SYMBOLS,
)

from app.services.engine.table_extractor.models import (
    TableCell,
    TableRow,
    TableBlock,
    PageLayout,
    KeyValueBlock,
    BoundingBox,
    ConfidenceScore,
    QualityScore,
    ExtractionCandidate,
    DocumentProfile,
    RoutingDecision,
    ValidationReport,
    EngineMetrics,
    ExtractionResult,
)

from app.services.engine.table_extractor.errors import (
    TableExtractorError,
    ExtractionError,
    OCRFailure,
    ValidationError,
    RoutingError,
    RepairError,
    ExcelWriterError,
    ConfigurationError,
    QualityThresholdError,
)

from app.services.engine.table_extractor.config import (
    TableExtractorConfig,
    OCRConfig,
    ThresholdConfig,
    ConfidenceConfig,
    ProjectionConfig,
    DetectionConfig,
    MemoryConfig,
    WorkerConfig,
)

from app.services.engine.table_extractor.interfaces import (
    BaseExtractor,
    BaseClassifier,
    BaseRouter,
    BaseArbiter,
    BaseValidator,
    BaseReconstructor,
    BaseExcelWriter,
)

from app.services.engine.table_extractor.container import (
    ExtractorContainer,
    get_default_container,
    set_default_container,
)

from app.services.engine.table_extractor.logging import StageLogger, stage_timer

from app.services.engine.table_extractor.utils.geometry import (
    bbox_intersection,
    bbox_union,
    bbox_iou,
    bbox_overlap_ratio,
    bbox_contains,
    bbox_distance,
    snap_coordinate,
    point_in_bbox,
)

from app.services.engine.table_extractor.utils.parsing import (
    clean_text,
    clean_ocr_artifacts,
    parse_number,
    parse_currency,
    parse_percentage,
    parse_date,
    detect_cell_data_type,
)


# =====================================================================
# 1. Constants & Enums Tests
# =====================================================================

def test_constants_and_enums():
    assert DocumentType.NATIVE_TEXT.value == "native_text"
    assert DocumentType.SCANNED_IMAGE.value == "scanned_image"
    assert TableTopology.LATTICE.value == "lattice"
    assert TableTopology.STREAM.value == "stream"
    assert DocumentGenre.BANK_STATEMENT.value == "bank_statement"
    assert DocumentGenre.INVOICE.value == "invoice"
    assert EngineType.LATTICE.value == "lattice"
    assert EngineType.HYBRID.value == "hybrid"

    assert DEFAULT_SNAP_TOLERANCE > 0
    assert MIN_LINE_LENGTH_PTS > 0
    assert 0.0 < CONFIDENCE_HIGH <= 1.0
    assert QUALITY_FALLBACK_THRESHOLD == 0.90
    assert STREAMING_PAGE_THRESHOLD == 50
    assert "$" in CURRENCY_SYMBOLS
    assert "EUR" in CURRENCY_SYMBOLS


# =====================================================================
# 2. Domain Models Tests
# =====================================================================

def test_bounding_box_model():
    bb = BoundingBox(10.0, 20.0, 50.0, 80.0)
    assert bb.width == 40.0
    assert bb.height == 60.0
    assert bb.area == 2400.0
    assert bb.to_tuple() == (10.0, 20.0, 50.0, 80.0)

    bb2 = BoundingBox.from_tuple((0.0, 0.0, 100.0, 200.0))
    assert bb2.width == 100.0
    assert bb2.height == 200.0


def test_table_cell_and_row_models():
    cell = TableCell(
        text="Total: $1,250.00",
        bbox=(50.0, 100.0, 150.0, 120.0),
        row_idx=0,
        col_idx=1,
        is_header=False,
        data_type="currency",
        typed_value=1250.0,
        confidence=0.98,
    )
    assert cell.width == 100.0
    assert cell.height == 20.0
    assert cell.data_type == "currency"
    assert cell.confidence == 0.98

    row = TableRow(cells=[cell], row_idx=0, is_header=False)
    assert len(row.cells) == 1
    assert not row.is_header


def test_table_block_and_page_layout():
    cell1 = TableCell("Qty", (10.0, 10.0, 50.0, 30.0), 0, 0, is_header=True)
    cell2 = TableCell("Price", (50.0, 10.0, 100.0, 30.0), 0, 1, is_header=True)
    row = TableRow(cells=[cell1, cell2], row_idx=0, is_header=True)

    block = TableBlock(
        bbox=(10.0, 10.0, 100.0, 100.0),
        rows=[row],
        table_type="lattice",
        engine="lattice",
        confidence=0.95,
    )
    assert block.row_count == 1
    assert block.col_count == 2
    assert block.confidence == 0.95

    kv = KeyValueBlock(items=[("Invoice", "INV-101")], bbox=(10.0, 0.0, 200.0, 10.0))
    layout = PageLayout(page_idx=0, width=595.0, height=842.0, tables=[block], key_values=[kv])
    assert layout.page_idx == 0
    assert len(layout.tables) == 1
    assert len(layout.key_values) == 1


def test_confidence_and_quality_scores():
    conf = ConfidenceScore(
        overall=0.92,
        column_alignment=0.95,
        row_continuity=0.90,
        type_consistency=0.91,
    )
    assert conf.is_high_confidence

    low_conf = ConfidenceScore(overall=0.75)
    assert not low_conf.is_high_confidence

    qual = QualityScore(score=0.94, is_acceptable=True, passed_checks=["no_split_words"])
    assert qual.meets_fallback_threshold
    assert qual.is_acceptable


def test_document_profile_and_routing_decision():
    profile = DocumentProfile(
        total_pages=5,
        doc_type=DocumentType.NATIVE_TEXT.value,
        genre=DocumentGenre.BANK_STATEMENT.value,
        has_ruling_lines=True,
    )
    assert profile.total_pages == 5
    assert profile.has_ruling_lines

    decision = RoutingDecision(
        primary_engine=EngineType.LATTICE.value,
        fallback_engine=EngineType.STREAM.value,
        reason="Clear ruling lines detected.",
        estimated_complexity="low",
    )
    assert decision.primary_engine == "lattice"
    assert decision.fallback_engine == "stream"


def test_validation_report_and_extraction_result():
    report = ValidationReport(
        is_valid=True,
        math_checks_passed=4,
        math_checks_failed=0,
        empty_rows_stripped=2,
        split_words_repaired=1,
    )
    assert report.is_valid
    assert report.math_checks_passed == 4

    metrics = EngineMetrics(
        engine_name="lattice",
        page_idx=0,
        execution_time_ms=45.2,
        memory_delta_mb=1.5,
        cell_count=24,
        table_count=1,
        confidence=0.96,
    )
    result = ExtractionResult(
        tables=[],
        metrics=[metrics],
        validation_report=report,
        execution_time_ms=50.0,
    )
    assert len(result.metrics) == 1
    assert result.execution_time_ms == 50.0


# =====================================================================
# 3. Interfaces & Base Classes Tests
# =====================================================================

def test_interfaces_enforce_implementation():
    # Attempting to instantiate ABC directly should raise TypeError
    with pytest.raises(TypeError):
        BaseExtractor()

    with pytest.raises(TypeError):
        BaseClassifier()

    with pytest.raises(TypeError):
        BaseRouter()

    with pytest.raises(TypeError):
        BaseArbiter()

    with pytest.raises(TypeError):
        BaseValidator()

    with pytest.raises(TypeError):
        BaseReconstructor()

    with pytest.raises(TypeError):
        BaseExcelWriter()

    # Concrete implementation passes
    class DummyExtractor(BaseExtractor):
        @property
        def name(self) -> str:
            return "dummy"

        def extract_page(self, pdf_bytes, page_idx, config=None, **kwargs):
            return ExtractionCandidate(engine_type=self.name)

        def extract_document(self, pdf_bytes, config=None, **kwargs):
            return [self.extract_page(pdf_bytes, 0, config)]

    dummy = DummyExtractor()
    assert dummy.name == "dummy"
    candidate = dummy.extract_page(b"", 0)
    assert candidate.engine_type == "dummy"


# =====================================================================
# 4. Dependency Injection Container Tests
# =====================================================================

def test_container_registration_and_resolution():
    container = ExtractorContainer()

    class TestExtractor(BaseExtractor):
        @property
        def name(self) -> str:
            return "mock_lattice"

        def extract_page(self, pdf_bytes, page_idx, config=None, **kwargs):
            return ExtractionCandidate(engine_type=self.name)

        def extract_document(self, pdf_bytes, config=None, **kwargs):
            return []

    container.register_extractor("mock_lattice", lambda: TestExtractor())
    assert "mock_lattice" in container.list_extractors()

    inst = container.get_extractor("mock_lattice")
    assert inst.name == "mock_lattice"

    # Singleton caching check
    inst2 = container.get_extractor("mock_lattice")
    assert inst is inst2

    # Unregistered engine raises ConfigurationError
    with pytest.raises(ConfigurationError):
        container.get_extractor("nonexistent_engine")


def test_default_container_access():
    c = get_default_container()
    assert isinstance(c, ExtractorContainer)

    new_c = ExtractorContainer()
    set_default_container(new_c)
    assert get_default_container() is new_c


# =====================================================================
# 5. Configuration System Tests
# =====================================================================

def test_configuration_defaults_and_overrides():
    config = TableExtractorConfig()
    assert config.ocr.dpi == 300
    assert config.thresholds.snap_tolerance == 3.0
    assert config.confidence.fallback_threshold == 0.90
    assert config.workers.max_workers == 4

    # From options
    overrides = {
        "ocr_dpi": 400,
        "snap_tolerance": 5.0,
        "fallback_threshold": 0.85,
        "max_workers": 8,
    }
    tuned = TableExtractorConfig.from_options(overrides)
    assert tuned.ocr.dpi == 400
    assert tuned.thresholds.snap_tolerance == 5.0
    assert tuned.confidence.fallback_threshold == 0.85
    assert tuned.workers.max_workers == 8

    # Dict serialization
    d = tuned.to_dict()
    assert d["ocr"]["dpi"] == 400
    assert d["workers"]["max_workers"] == 8


def test_configuration_from_env(monkeypatch):
    monkeypatch.setenv("CONVERTLY_TABLE_OCR_DPI", "600")
    monkeypatch.setenv("CONVERTLY_TABLE_SNAP_TOLERANCE", "4.5")
    monkeypatch.setenv("CONVERTLY_TABLE_MAX_WORKERS", "2")

    env_cfg = TableExtractorConfig.from_env()
    assert env_cfg.ocr.dpi == 600
    assert env_cfg.thresholds.snap_tolerance == 4.5
    assert env_cfg.workers.max_workers == 2


# =====================================================================
# 6. Structured Logging & Telemetry Tests
# =====================================================================

def test_stage_logger_and_timer():
    with stage_timer("test_stage", engine_name="unit_test", page_idx=1) as s_log:
        s_log.add_warning("Minor warning")
        s_log.set_confidence(0.94)
        s_log.set_counts(tables=2, cells=40)

    assert s_log.execution_time_ms >= 0.0
    assert s_log.confidence == 0.94
    assert s_log.table_count == 2
    assert s_log.cell_count == 40
    assert len(s_log.warnings) == 1

    metrics = s_log.to_metrics()
    assert metrics.engine_name == "unit_test"
    assert metrics.confidence == 0.94
    assert metrics.table_count == 2


# =====================================================================
# 7. Error Hierarchy Tests
# =====================================================================

def test_error_hierarchy():
    err = ExtractionError("Failed to extract page", engine="lattice", page_idx=2)
    assert isinstance(err, TableExtractorError)
    assert err.engine == "lattice"
    assert err.page_idx == 2

    d = err.to_dict()
    assert d["error"] == "ExtractionError"
    assert d["message"] == "Failed to extract page"
    assert d["details"]["engine"] == "lattice"
    assert d["details"]["page_idx"] == 2

    val_err = ValidationError("Row sum mismatch", violations=["R3 sum 10 != 12"])
    assert isinstance(val_err, TableExtractorError)
    assert len(val_err.violations) == 1

    q_err = QualityThresholdError("Score too low", quality_score=0.72, threshold=0.90)
    assert q_err.quality_score == 0.72
    assert q_err.threshold == 0.90


# =====================================================================
# 8. Shared Utilities Tests — Geometry
# =====================================================================

def test_geometry_utilities():
    b1 = (0.0, 0.0, 10.0, 10.0)
    b2 = (5.0, 5.0, 15.0, 15.0)

    # Intersection
    inter = bbox_intersection(b1, b2)
    assert inter == (5.0, 5.0, 10.0, 10.0)

    # Disjoint intersection
    b3 = (20.0, 20.0, 30.0, 30.0)
    assert bbox_intersection(b1, b3) is None

    # Union
    union = bbox_union(b1, b2)
    assert union == (0.0, 0.0, 15.0, 15.0)

    # IoU
    iou = bbox_iou(b1, b2)
    assert 0.14 < iou < 0.15  # 25 / (100 + 100 - 25) = 25 / 175 = 0.142857

    # Identical IoU
    assert bbox_iou(b1, b1) == 1.0

    # Overlap ratio
    assert bbox_overlap_ratio((5.0, 5.0, 10.0, 10.0), b1) == 1.0

    # Containment
    assert bbox_contains((0.0, 0.0, 50.0, 50.0), (10.0, 10.0, 20.0, 20.0))
    assert not bbox_contains((10.0, 10.0, 20.0, 20.0), (0.0, 0.0, 50.0, 50.0))

    # Point in bbox
    assert point_in_bbox((5.0, 5.0), b1)
    assert not point_in_bbox((15.0, 5.0), b1)

    # Snapping
    targets = [0.0, 50.0, 100.0]
    assert snap_coordinate(51.2, targets, tolerance=2.0) == 50.0
    assert snap_coordinate(54.0, targets, tolerance=2.0) == 54.0


# =====================================================================
# 9. Shared Utilities Tests — Parsing & Normalization
# =====================================================================

def test_clean_text_and_ocr_artifacts():
    raw = "The  ﬁnance    report   for   ‘Q3’—approved\u200b."
    cleaned = clean_text(raw)
    assert "finance" in cleaned  # ligature expanded
    assert "'Q3'" in cleaned  # smart quotes replaced
    assert "-" in cleaned  # em dash replaced
    assert "\u200b" not in cleaned  # zero-width space removed

    pipe_raw = "|  Item Description  | \n |  $100.00  | "
    clean_pipe = clean_ocr_artifacts(pipe_raw)
    assert not clean_pipe.startswith("|")
    assert not clean_pipe.endswith("|")


def test_parse_number():
    assert parse_number("42") == (42, "#,##0")
    assert parse_number("1,234.56") == (1234.56, "#,##0.00")
    assert parse_number("(500.00)") == (-500.0, "#,##0.00")
    assert parse_number("-125") == (-125, "#,##0")
    assert parse_number("Not a number") is None


def test_parse_currency():
    curr1 = parse_currency("$1,234.56")
    assert curr1 is not None
    assert curr1[0] == 1234.56
    assert curr1[1] == "$"

    curr2 = parse_currency("€ 2.500,00")
    assert curr2 is not None
    assert curr2[0] == 2500.0
    assert curr2[1] == "€"

    curr3 = parse_currency("£750")
    assert curr3 is not None
    assert curr3[0] == 750
    assert curr3[1] == "£"

    curr4 = parse_currency("( $45.50 )")
    assert curr4 is not None
    assert curr4[0] == -45.50

    assert parse_currency("Just regular text") is None


def test_parse_percentage():
    pct1 = parse_percentage("12.5%")
    assert pct1 == (0.125, "0.0%")

    pct2 = parse_percentage("15 %")
    assert pct2 == (0.15, "0%")

    pct3 = parse_percentage("-5.25%")
    assert pct3 == (-0.0525, "0.00%")

    assert parse_percentage("100 dollars") is None


def test_parse_date():
    dt1 = parse_date("2024-05-18")
    assert dt1 is not None
    assert dt1[0] == "2024-05-18"

    dt2 = parse_date("18-May-2024")
    assert dt2 is not None
    assert dt2[0] == "2024-05-18"

    assert parse_date("not-a-date") is None


def test_detect_cell_data_type():
    assert detect_cell_data_type("$99.99")[0] == "currency"
    assert detect_cell_data_type("25.0%")[0] == "percentage"
    assert detect_cell_data_type("2024-12-31")[0] == "date"
    assert detect_cell_data_type("1,450.00")[0] == "number"
    assert detect_cell_data_type("Account Balance Summary")[0] == "text"
