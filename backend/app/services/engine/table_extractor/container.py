"""
Convertly V2 — Enterprise Table Extraction Dependency Injection Container
Provides a decoupled service registry for extractors, classifiers, routers,
arbiters, validators, reconstructors, and excel writers.
"""

from typing import Dict, Any, Callable, Type, Optional, TypeVar
from .interfaces import (
    BaseExtractor,
    BaseClassifier,
    BaseRouter,
    BaseArbiter,
    BaseValidator,
    BaseReconstructor,
    BaseExcelWriter,
)
from .errors import ConfigurationError

T = TypeVar("T")


class ExtractorContainer:
    """
    Decoupled Dependency Injection registry.
    Manages registration and lifecycle resolution for all extraction subsystems.
    """

    def __init__(self, register_defaults: bool = True) -> None:
        self._extractors: Dict[str, Callable[[], BaseExtractor]] = {}
        self._classifier_factory: Optional[Callable[[], BaseClassifier]] = None
        self._router_factory: Optional[Callable[[], BaseRouter]] = None
        self._arbiter_factory: Optional[Callable[[], BaseArbiter]] = None
        self._validator_factory: Optional[Callable[[], BaseValidator]] = None
        self._reconstructor_factory: Optional[Callable[[], BaseReconstructor]] = None
        self._excel_writer_factory: Optional[Callable[[], BaseExcelWriter]] = None
        self._instances: Dict[str, Any] = {}

        if register_defaults:
            self._register_standard_defaults()

    def _register_standard_defaults(self) -> None:
        try:
            from .intelligence.classifier import DocumentClassifier
            from .intelligence.router import EngineRouter
            from .engines.lattice import LatticeExtractor
            from .engines.stream import StreamExtractor
            from .engines.ocr import OCRExtractor
            from .engines.hybrid import HybridExtractor
            from .arbiter.quality_arbiter import QualityArbiter
            from .reconstruction.reconstructor import CellReconstructor
            from .validation.validator import TableValidator
            from .excel.writer import EnterpriseExcelWriter

            self.register_classifier(lambda: DocumentClassifier())
            self.register_router(lambda: EngineRouter())
            self.register_arbiter(lambda: QualityArbiter())
            self.register_reconstructor(lambda: CellReconstructor())
            self.register_validator(lambda: TableValidator())
            self.register_excel_writer(lambda: EnterpriseExcelWriter())

            self.register_extractor("lattice", lambda: LatticeExtractor())
            self.register_extractor("stream", lambda: StreamExtractor())
            self.register_extractor("ocr_tsv", lambda: OCRExtractor())
            self.register_extractor("hybrid", lambda: HybridExtractor())
        except (ImportError, AttributeError):
            pass

    def register_extractor(self, name: str, factory: Callable[[], BaseExtractor]) -> None:
        """Register an extraction engine factory by engine name."""
        self._extractors[name.lower()] = factory

    def get_extractor(self, name: str) -> BaseExtractor:
        """Resolve an extraction engine by name."""
        key = f"extractor_{name.lower()}"
        if key not in self._instances:
            factory = self._extractors.get(name.lower())
            if not factory:
                available = list(self._extractors.keys())
                raise ConfigurationError(
                    f"Extraction engine '{name}' is not registered. Available: {available}"
                )
            self._instances[key] = factory()
        return self._instances[key]

    def list_extractors(self) -> list:
        """Return names of all registered extraction engines."""
        return list(self._extractors.keys())

    # Classifier
    def register_classifier(self, factory: Callable[[], BaseClassifier]) -> None:
        self._classifier_factory = factory

    def get_classifier(self) -> BaseClassifier:
        if "classifier" not in self._instances:
            if not self._classifier_factory:
                raise ConfigurationError("Document classifier has not been registered in container.")
            self._instances["classifier"] = self._classifier_factory()
        return self._instances["classifier"]

    # Router
    def register_router(self, factory: Callable[[], BaseRouter]) -> None:
        self._router_factory = factory

    def get_router(self) -> BaseRouter:
        if "router" not in self._instances:
            if not self._router_factory:
                raise ConfigurationError("Engine router has not been registered in container.")
            self._instances["router"] = self._router_factory()
        return self._instances["router"]

    # Arbiter
    def register_arbiter(self, factory: Callable[[], BaseArbiter]) -> None:
        self._arbiter_factory = factory

    def get_arbiter(self) -> BaseArbiter:
        if "arbiter" not in self._instances:
            if not self._arbiter_factory:
                raise ConfigurationError("Quality arbiter has not been registered in container.")
            self._instances["arbiter"] = self._arbiter_factory()
        return self._instances["arbiter"]

    # Validator
    def register_validator(self, factory: Callable[[], BaseValidator]) -> None:
        self._validator_factory = factory

    def get_validator(self) -> BaseValidator:
        if "validator" not in self._instances:
            if not self._validator_factory:
                raise ConfigurationError("Table validator has not been registered in container.")
            self._instances["validator"] = self._validator_factory()
        return self._instances["validator"]

    # Reconstructor
    def register_reconstructor(self, factory: Callable[[], BaseReconstructor]) -> None:
        self._reconstructor_factory = factory

    def get_reconstructor(self) -> BaseReconstructor:
        if "reconstructor" not in self._instances:
            if not self._reconstructor_factory:
                raise ConfigurationError("Table reconstructor has not been registered in container.")
            self._instances["reconstructor"] = self._reconstructor_factory()
        return self._instances["reconstructor"]

    # Excel Writer
    def register_excel_writer(self, factory: Callable[[], BaseExcelWriter]) -> None:
        self._excel_writer_factory = factory

    def get_excel_writer(self) -> BaseExcelWriter:
        if "excel_writer" not in self._instances:
            if not self._excel_writer_factory:
                raise ConfigurationError("Excel writer has not been registered in container.")
            self._instances["excel_writer"] = self._excel_writer_factory()
        return self._instances["excel_writer"]

    def reset(self) -> None:
        """Clear cached singleton instances (useful during testing)."""
        self._instances.clear()

    @classmethod
    def create_default(cls) -> "ExtractorContainer":
        """Create container with standard default components pre-registered."""
        from .intelligence.classifier import DocumentClassifier
        from .intelligence.router import EngineRouter

        container = cls()
        container.register_classifier(lambda: DocumentClassifier())
        container.register_router(lambda: EngineRouter())
        return container


# Global default container instance
_default_container: Optional[ExtractorContainer] = None


def get_default_container() -> ExtractorContainer:
    """Retrieve the global default container, creating one if not initialized."""
    global _default_container
    if _default_container is None:
        _default_container = ExtractorContainer.create_default()
    return _default_container


def set_default_container(container: ExtractorContainer) -> None:
    """Override the global default container."""
    global _default_container
    _default_container = container
