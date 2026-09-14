from typing import Dict, List, Optional, Any
from app.services.engine.base import BaseConverter
from app.core.errors import UnsupportedFormatError


class ConverterRegistry:
    """Central registry for all active, verified converters."""

    def __init__(self):
        self._converters: Dict[str, BaseConverter] = {}

    def register(self, converter: BaseConverter) -> None:
        self._converters[converter.tool_id] = converter

    def get(self, tool_id: str) -> BaseConverter:
        converter = self._converters.get(tool_id)
        if not converter:
            raise UnsupportedFormatError(f"No converter found for tool ID '{tool_id}'")
        return converter

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "tool_id": c.tool_id,
                "name": c.name,
                "supported_inputs": c.supported_inputs,
                "output_extension": c.output_extension,
                "output_mime_type": c.output_mime_type
            }
            for c in self._converters.values()
        ]


converter_registry = ConverterRegistry()

# Register Production PDF Tools
from app.services.engine.pdf import (
    PdfMergeConverter,
    PdfSplitConverter,
    PdfCompressConverter,
    PdfRotateConverter,
    PdfDeletePagesConverter,
    PdfExtractPagesConverter,
    PdfReorderPagesConverter,
    PdfProtectConverter,
    PdfUnlockConverter,
    PdfWatermarkConverter,
    PdfPageNumbersConverter,
    PdfRedactConverter,
    PdfFlattenConverter,
    PdfScrubMetadataConverter,
    PdfToTxtConverter,
    PdfGrayscaleConverter
)

converter_registry.register(PdfMergeConverter())
converter_registry.register(PdfSplitConverter())
converter_registry.register(PdfCompressConverter())
converter_registry.register(PdfRotateConverter())
converter_registry.register(PdfDeletePagesConverter())
converter_registry.register(PdfExtractPagesConverter())
converter_registry.register(PdfReorderPagesConverter())
converter_registry.register(PdfProtectConverter())
converter_registry.register(PdfUnlockConverter())
converter_registry.register(PdfWatermarkConverter())
converter_registry.register(PdfPageNumbersConverter())
converter_registry.register(PdfRedactConverter())
converter_registry.register(PdfFlattenConverter())
converter_registry.register(PdfScrubMetadataConverter())
converter_registry.register(PdfToTxtConverter())
converter_registry.register(PdfGrayscaleConverter())

# Register Production Office Tools
from app.services.engine.office import (
    WordToPdfConverter,
    PdfToWordConverter,
    ExcelToPdfConverter,
    PptToPdfConverter
)

converter_registry.register(WordToPdfConverter())
converter_registry.register(PdfToWordConverter())
converter_registry.register(ExcelToPdfConverter())
converter_registry.register(PptToPdfConverter())

# Register Production PDF-to-Excel Tool
from app.services.engine.pdf_to_excel import PdfToExcelConverter
converter_registry.register(PdfToExcelConverter())

# Register Production Image Tools
from app.services.engine.images import (
    JpgToPngConverter,
    PngToJpgConverter,
    ImageToWebpConverter,
    WebpToImageConverter,
    PdfToImagesConverter,
    ImagesToPdfConverter,
    ImageResizeConverter,
    ImageCompressConverter,
    ImageCropConverter,
    ImageRotateConverter
)

converter_registry.register(JpgToPngConverter())
converter_registry.register(PngToJpgConverter())
converter_registry.register(ImageToWebpConverter())
converter_registry.register(WebpToImageConverter())
converter_registry.register(PdfToImagesConverter())
converter_registry.register(ImagesToPdfConverter())
converter_registry.register(ImageResizeConverter())
converter_registry.register(ImageCompressConverter())
converter_registry.register(ImageCropConverter())
converter_registry.register(ImageRotateConverter())
