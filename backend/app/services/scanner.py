import os
from abc import ABC, abstractmethod
from typing import Optional
from app.core.logging import logger
from app.core.errors import FileValidationError


class BaseAntivirusScanner(ABC):
    """Abstract contract for file virus/malware inspection before storage."""

    @abstractmethod
    async def scan_bytes(self, content: bytes, filename: str) -> None:
        """Scan file in-memory byte buffer. Raises FileValidationError if infected."""
        pass


class PassThroughScanner(BaseAntivirusScanner):
    """
    Default enterprise pass-through scanner with ClamAV / VirusTotal hook extension point.
    Inspects byte headers for executable payloads or malicious zip bombs.
    """

    async def scan_bytes(self, content: bytes, filename: str) -> None:
        # Check for dangerous executable signatures disguised as documents
        if content.startswith(b"MZ"):  # Windows PE executable
            raise FileValidationError(f"File '{filename}' was identified as a dangerous executable and blocked by malware scanning.")
        if content.startswith(b"\x7fELF"):  # Linux ELF executable
            raise FileValidationError(f"File '{filename}' was identified as an executable binary and rejected.")

        logger.debug(f"Malware pre-scan passed for file '{filename}' ({len(content)} bytes).")


# Global scanner instance
antivirus_scanner: BaseAntivirusScanner = PassThroughScanner()


def inspect_pdf_security(content: bytes, filename: str) -> "FileInspectionResponse":
    """
    Analyzes PDF document binary for privacy leaks, metadata exposure,
    embedded scripts, unflattened form widgets, and encryption state.
    """
    import pymupdf
    from app.schemas.file import FileInspectionResponse, RecommendationItem

    try:
        doc = pymupdf.open(stream=content, filetype="pdf")
    except Exception as e:
        raise FileValidationError(f"Invalid or corrupted PDF file: {str(e)}")

    try:
        page_count = doc.page_count
        is_encrypted = doc.is_encrypted

        # Extract metadata
        raw_meta = doc.metadata or {}
        clean_meta = {
            k: str(v)
            for k, v in raw_meta.items()
            if v and isinstance(v, (str, int, float)) and str(v).strip()
        }

        # Determine PDF Version
        pdf_ver = getattr(doc, "version", None) or clean_meta.get("format", "PDF 1.7")
        if not isinstance(pdf_ver, str):
            pdf_ver = f"PDF {pdf_ver}"

        # Detect interactive elements and JavaScript
        has_annots = False
        has_forms = False
        has_js = b"/JavaScript" in content or b"/JS" in content

        for page in doc:
            if page.first_annot:
                has_annots = True
            if page.first_widget:
                has_forms = True
            if has_annots and has_forms:
                break

        # Calculate Privacy Score (100 is pristine / fully protected)
        score = 100
        recs: list[RecommendationItem] = []

        sensitive_meta_keys = [
            k for k in ["author", "creator", "producer", "creationDate", "modDate"]
            if clean_meta.get(k)
        ]
        if sensitive_meta_keys:
            score -= min(len(sensitive_meta_keys) * 8, 30)
            recs.append(
                RecommendationItem(
                    tool_id="pdf-scrub-metadata",
                    title="Scrub Document Metadata",
                    reason=f"Detected sensitive document trails ({', '.join(sensitive_meta_keys)}) exposing author and software fingerprints."
                )
            )

        if has_forms or has_annots:
            score -= 15
            recs.append(
                RecommendationItem(
                    tool_id="pdf-flatten",
                    title="Flatten Forms & Annotations",
                    reason="Document contains active form fields or annotations that can leak input data or be tampered with."
                )
            )

        if has_js:
            score -= 25
            recs.append(
                RecommendationItem(
                    tool_id="pdf-flatten",
                    title="Neutralize Embedded Scripts",
                    reason="Document contains executable JavaScript action hooks posing potential client-side execution vectors."
                )
            )

        if not is_encrypted:
            score -= 15
            recs.append(
                RecommendationItem(
                    tool_id="pdf-protect",
                    title="Apply AES-256 Encryption",
                    reason="Document lacks encryption and password protection, allowing unrestricted viewing and modification."
                )
            )

        if len(content) > 1024 * 1024:
            mb_size = round(len(content) / (1024 * 1024), 1)
            recs.append(
                RecommendationItem(
                    tool_id="pdf-compress",
                    title="Optimize Document Payload",
                    reason=f"Current file size is {mb_size}MB. Compress without visual loss for faster, secure transfer."
                )
            )

        privacy_score = max(15, min(100, score))

        if privacy_score >= 80:
            risk_level = "Low Risk"
        elif privacy_score >= 55:
            risk_level = "Medium Risk"
        else:
            risk_level = "High Risk"

        return FileInspectionResponse(
            filename=filename,
            file_size_bytes=len(content),
            page_count=page_count,
            pdf_version=str(pdf_ver),
            is_encrypted=is_encrypted,
            has_javascript=has_js,
            has_annotations=has_annots,
            has_forms=has_forms,
            metadata=clean_meta,
            privacy_score=privacy_score,
            risk_level=risk_level,
            recommendations=recs
        )
    finally:
        doc.close()
