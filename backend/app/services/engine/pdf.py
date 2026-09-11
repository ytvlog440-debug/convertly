import os
import re
import uuid
import fitz  # PyMuPDF
from typing import List, Dict, Any, Set
from app.core.errors import FileValidationError, ConversionExecutionError
from app.services.engine.base import BaseConverter, ConversionResult


def open_and_validate_pdf(file_path: str) -> fitz.Document:
    """Safely open a PDF document and verify it is non-corrupt and decrypted."""
    if not os.path.exists(file_path):
        raise FileValidationError(f"File does not exist: {file_path}")

    try:
        doc = fitz.open(file_path)
    except Exception as e:
        raise FileValidationError(f"File is corrupted or not a valid PDF: {str(e)}")

    if doc.is_encrypted:
        # Check if the document can be unlocked with an empty password (standard permissions/empty pass)
        is_authenticated = False
        try:
            is_authenticated = bool(doc.authenticate(""))
        except Exception:
            pass
        if not is_authenticated:
            raise FileValidationError("Password-protected PDFs are not supported. Please remove the password first.")

    if doc.page_count < 1:
        doc.close()
        raise FileValidationError("PDF contains 0 pages and is invalid.")

    return doc


def parse_page_ranges(range_str: str, max_pages: int) -> List[int]:
    """
    Smartly parse page expressions into a zero-indexed sorted list of unique page integers.
    Supports:
      - Comma / space / semicolon separated: '1, 2, 3', '1 2 3', '1; 2; 3'
      - Ranges: '1-5', '1 to 5', '1 through 5', '1..5', '1 - 5'
      - Keywords: 'first 6', 'last 2', 'odd', 'even', 'all'
    """
    selected_pages: Set[int] = set()
    raw = range_str.strip().lower()

    if not raw:
        raise FileValidationError("Please specify at least one valid page number or range.")

    if raw == "all":
        return list(range(max_pages))
    elif raw == "odd":
        return [i for i in range(max_pages) if (i + 1) % 2 == 1]
    elif raw == "even":
        return [i for i in range(max_pages) if (i + 1) % 2 == 0]

    # Keyword check: e.g. "first 6", "last 3"
    m_first = re.match(r'^(?:first|initial)\s+(\d+)$', raw)
    if m_first:
        count = int(m_first.group(1))
        if count < 1:
            raise FileValidationError("Page count must be at least 1.")
        return list(range(min(count, max_pages)))

    m_last = re.match(r'^(?:last)\s+(\d+)$', raw)
    if m_last:
        count = int(m_last.group(1))
        if count < 1:
            raise FileValidationError("Page count must be at least 1.")
        start = max(0, max_pages - count)
        return list(range(start, max_pages))

    # Standardize 'to', 'through', and '..' into '-'
    normalized = re.sub(r'\s+(?:to|through)\s+', '-', raw)
    normalized = re.sub(r'\.\.+', '-', normalized)

    # Tokenize by commas, semicolons, or whitespace (ignoring spaces around hyphens)
    tokens = re.split(r'[,;\s]+', normalized)
    tokens = [t.strip() for t in tokens if t.strip()]

    for token in tokens:
        if "-" in token:
            bounds = token.split("-")
            if len(bounds) != 2:
                raise FileValidationError(f"Invalid range expression: '{token}'")
            try:
                start = int(bounds[0].strip())
                end = int(bounds[1].strip())
            except ValueError:
                raise FileValidationError(f"Non-numeric values in page range: '{token}'")

            if start < 1 or end < 1 or start > end:
                raise FileValidationError(f"Invalid range boundaries: '{token}' (start must be <= end)")
            if end > max_pages:
                raise FileValidationError(f"Page range '{token}' exceeds total document pages ({max_pages}).")

            for p in range(start - 1, end):
                selected_pages.add(p)
        else:
            try:
                page_num = int(token)
            except ValueError:
                raise FileValidationError(f"Invalid page number or token: '{token}'")

            if page_num < 1 or page_num > max_pages:
                raise FileValidationError(f"Page number {page_num} is out of bounds (1 to {max_pages}).")

            selected_pages.add(page_num - 1)

    return sorted(list(selected_pages))


# 1. PDF Merge Converter
class PdfMergeConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "pdf-merge"

    @property
    def name(self) -> str:
        return "Merge PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        super().validate_inputs(input_paths, options)
        if len(input_paths) < 2:
            raise FileValidationError("Merging requires at least 2 PDF documents.")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)

        add_bookmarks = options.get("add_bookmarks", True)
        duplex_mode = options.get("duplex_mode", False)

        merged_doc = fitz.open()
        total_input_pages = 0
        combined_toc = []
        doc_details = []

        for idx, path in enumerate(input_paths):
            src_doc = open_and_validate_pdf(path)
            src_page_count = src_doc.page_count
            total_input_pages += src_page_count

            # Extract clean document title for Table of Contents / bookmarking
            raw_filename = os.path.splitext(os.path.basename(path))[0]
            clean_title = re.sub(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_', '', raw_filename)
            clean_title = clean_title.replace('_', ' ').strip() or f"Document {idx + 1}"

            # Check if document has 0 text/content (e.g. blank page)
            is_blank = False
            if src_page_count == 1:
                p0 = src_doc[0]
                if len(p0.get_text().strip()) == 0 and len(p0.get_images()) == 0 and len(p0.get_drawings()) == 0:
                    is_blank = True

            doc_details.append({
                "index": idx + 1,
                "title": clean_title,
                "pages": src_page_count,
                "is_blank": is_blank
            })

            # Preserve & aggregate Table of Contents / bookmarks
            current_page_offset = merged_doc.page_count
            if add_bookmarks:
                # Add root entry for this document
                combined_toc.append([1, clean_title, current_page_offset + 1])
                # Preserve existing internal bookmarks of the document
                try:
                    src_toc = src_doc.get_toc()
                    for item in src_toc:
                        # item format: [level, title, page_number]
                        item_level = min(item[0] + 1, 6)
                        item_page = item[2] + current_page_offset
                        combined_toc.append([item_level, item[1], item_page])
                except Exception:
                    pass

            # Insert PDF pages preserving annotations, links, and form widgets
            merged_doc.insert_pdf(src_doc, links=1, annots=1, widgets=1)
            src_doc.close()

            # Duplex mode: if document ends on an odd page, insert blank page so next document starts on a new sheet
            if duplex_mode and (src_page_count % 2 == 1) and (idx < len(input_paths) - 1):
                last_page = merged_doc[-1]
                merged_doc.new_page(width=last_page.rect.width, height=last_page.rect.height)
                total_input_pages += 1

        # Apply combined table of contents if bookmarks were generated
        if add_bookmarks and combined_toc:
            try:
                merged_doc.set_toc(combined_toc)
            except Exception:
                pass

        out_filename = f"merged_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)

        merged_doc.save(out_path, garbage=3, deflate=True)
        merged_doc.close()

        self.validate_output(out_path)

        # Post-validation: ensure merged page count matches
        verified_doc = open_and_validate_pdf(out_path)
        actual_pages = verified_doc.page_count
        verified_doc.close()

        if actual_pages != total_input_pages:
            raise ConversionExecutionError("Merged PDF page count does not match total input pages.")

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={
                "page_count": actual_pages,
                "documents_merged": len(input_paths),
                "document_details": doc_details,
                "has_blank_document": any(d["is_blank"] for d in doc_details)
            }
        )


# 2. PDF Split Converter
class PdfSplitConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "pdf-split"

    @property
    def name(self) -> str:
        return "Split PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        page_range_str = options.get("range", "").strip()
        if not page_range_str:
            # Default split: first half or single page
            page_indices = [0] if src_doc.page_count == 1 else list(range(0, (src_doc.page_count + 1) // 2))
        else:
            page_indices = parse_page_ranges(page_range_str, src_doc.page_count)

        if not page_indices:
            src_doc.close()
            raise FileValidationError("No valid pages selected for split.")

        dest_doc = fitz.open()
        for idx in page_indices:
            dest_doc.insert_pdf(src_doc, from_page=idx, to_page=idx)
        src_doc.close()

        out_filename = f"split_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        dest_doc.save(out_path, garbage=3, deflate=True)
        dest_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": len(page_indices)}
        )


# 3. PDF Compress Converter
class PdfCompressConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "pdf-compress"

    @property
    def name(self) -> str:
        return "Compress PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_size = os.path.getsize(src_path)
        src_doc = open_and_validate_pdf(src_path)

        level = options.get("level", "recommended")  # "extreme", "recommended", "basic"
        
        # Determine optimization flags
        garbage_level = 4 if level in ["extreme", "recommended"] else 3
        clean_objects = True

        out_filename = f"compressed_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)

        src_doc.save(
            out_path,
            garbage=garbage_level,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
            clean=clean_objects
        )
        src_doc.close()

        self.validate_output(out_path)
        out_size = os.path.getsize(out_path)
        savings_bytes = max(0, src_size - out_size)
        savings_ratio = round((savings_bytes / src_size) * 100, 1) if src_size > 0 else 0.0

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=out_size,
            metadata={
                "original_size_bytes": src_size,
                "compressed_size_bytes": out_size,
                "savings_ratio_percent": savings_ratio
            }
        )


# 4. PDF Rotate Converter
class PdfRotateConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "pdf-rotate"

    @property
    def name(self) -> str:
        return "Rotate PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        angle = int(options.get("angle", 90))
        if angle not in [90, 180, 270]:
            angle = 90

        scope = options.get("scope", "all")  # "all", "odd", "even"

        for i in range(src_doc.page_count):
            page_num = i + 1
            if scope == "odd" and page_num % 2 == 0:
                continue
            if scope == "even" and page_num % 2 != 0:
                continue
            page = src_doc[i]
            page.set_rotation((page.rotation + angle) % 360)

        out_filename = f"rotated_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        src_doc.save(out_path, garbage=3, deflate=True)
        src_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"rotated_angle": angle, "scope": scope}
        )


# 5. PDF Delete Pages Converter
class PdfDeletePagesConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "pdf-delete-pages"

    @property
    def name(self) -> str:
        return "Delete Pages"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        pages_to_delete_str = options.get("pages", "").strip()
        if not pages_to_delete_str:
            src_doc.close()
            raise FileValidationError("Please specify which page(s) to delete.")

        page_indices = parse_page_ranges(pages_to_delete_str, src_doc.page_count)

        if len(page_indices) >= src_doc.page_count:
            src_doc.close()
            raise FileValidationError("Cannot delete all pages in document. At least 1 page must remain.")

        # Delete in reverse order so indices do not shift
        for idx in sorted(page_indices, reverse=True):
            src_doc.delete_page(idx)

        out_filename = f"deleted_pages_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        src_doc.save(out_path, garbage=3, deflate=True)
        actual_remaining = src_doc.page_count
        src_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={
                "deleted_count": len(page_indices),
                "deleted_pages": [p + 1 for p in sorted(page_indices)],
                "remaining_pages": actual_remaining
            }
        )


# 6. PDF Extract Pages Converter
class PdfExtractPagesConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "pdf-extract-pages"

    @property
    def name(self) -> str:
        return "Extract Pages"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        pages_str = options.get("pages", "").strip()
        if not pages_str:
            src_doc.close()
            raise FileValidationError("Please specify the page(s) you wish to extract.")

        page_indices = parse_page_ranges(pages_str, src_doc.page_count)
        if not page_indices:
            src_doc.close()
            raise FileValidationError("No valid pages selected for extraction.")

        dest_doc = fitz.open()
        for idx in page_indices:
            dest_doc.insert_pdf(src_doc, from_page=idx, to_page=idx)
        src_doc.close()

        out_filename = f"extracted_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        dest_doc.save(out_path, garbage=3, deflate=True)
        dest_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"extracted_page_count": len(page_indices)}
        )


# 7. PDF Reorder Pages Converter
class PdfReorderPagesConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "pdf-reorder-pages"

    @property
    def name(self) -> str:
        return "Reorder Pages"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        order = options.get("order", [])
        if not order or not isinstance(order, list):
            src_doc.close()
            raise FileValidationError("Options must specify a valid 'order' list of page indices.")

        # Convert to 0-based indices if passed 1-based, or validate bounds
        total = src_doc.page_count
        cleaned_order = []
        for p in order:
            val = int(p)
            idx = val - 1 if min(order) == 1 else val
            if idx < 0 or idx >= total:
                src_doc.close()
                raise FileValidationError(f"Reorder index {val} is out of bounds (1 to {total}).")
            cleaned_order.append(idx)

        dest_doc = fitz.open()
        for idx in cleaned_order:
            dest_doc.insert_pdf(src_doc, from_page=idx, to_page=idx)
        src_doc.close()

        out_filename = f"reordered_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        dest_doc.save(out_path, garbage=3, deflate=True)
        dest_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": len(cleaned_order)}
        )


class PdfProtectConverter(BaseConverter):
    """Encrypts a PDF with AES-256 password protection and permissions."""

    @property
    def tool_id(self) -> str:
        return "pdf-protect"

    @property
    def name(self) -> str:
        return "Protect PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return [".pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        super().validate_inputs(input_paths, options)
        password = str(options.get("password", "")).strip()
        if not password:
            raise FileValidationError("Please enter a password to protect your PDF document.")

    def validate_output(self, output_path: str, password: str = "") -> None:
        if not os.path.exists(output_path):
            raise ConversionExecutionError("Protected output file was not created.")
        if os.path.getsize(output_path) == 0:
            raise ConversionExecutionError("Protected output file is 0 bytes.")
        try:
            doc = fitz.open(output_path)
            if not doc.is_encrypted:
                doc.close()
                raise ConversionExecutionError("Output file failed to apply encryption.")
            if password:
                auth = doc.authenticate(password)
                if auth == 0:
                    doc.close()
                    raise ConversionExecutionError("Verification failed: password does not unlock output.")
            doc.close()
        except Exception as e:
            raise ConversionExecutionError(f"Verification of protected PDF failed: {str(e)}")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        password = str(options.get("password", "")).strip()
        owner_pw = str(options.get("owner_password", "")).strip() or password

        perm = fitz.PDF_PERM_ACCESSIBILITY | fitz.PDF_PERM_PRINT | fitz.PDF_PERM_COPY
        out_filename = f"protected_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        total = src_doc.page_count

        src_doc.save(
            out_path,
            encryption=fitz.PDF_ENCRYPT_AES_256,
            user_pw=password,
            owner_pw=owner_pw,
            permissions=perm,
            garbage=3,
            deflate=True
        )
        src_doc.close()

        self.validate_output(out_path, password=password)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total, "encrypted": True}
        )


class PdfUnlockConverter(BaseConverter):
    """Removes password protection from an authenticated PDF."""

    @property
    def tool_id(self) -> str:
        return "pdf-unlock"

    @property
    def name(self) -> str:
        return "Unlock PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return [".pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        super().validate_inputs(input_paths, options)
        password = str(options.get("password", "")).strip()
        if not password:
            raise FileValidationError("Please enter the document password to unlock this PDF.")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        if not os.path.exists(src_path):
            raise FileValidationError(f"File does not exist: {src_path}")

        try:
            src_doc = fitz.open(src_path)
        except Exception as e:
            raise FileValidationError(f"Invalid PDF file: {str(e)}")

        password = str(options.get("password", "")).strip()
        if src_doc.is_encrypted:
            auth = src_doc.authenticate(password)
            if auth == 0:
                src_doc.close()
                raise FileValidationError("Incorrect password. Unable to unlock this PDF.")

        out_filename = f"unlocked_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        total = src_doc.page_count
        src_doc.save(out_path, encryption=fitz.PDF_ENCRYPT_NONE, garbage=3, deflate=True)
        src_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total, "unlocked": True}
        )


class PdfWatermarkConverter(BaseConverter):
    """Stamps custom text watermarks across PDF pages with rotation and opacity controls."""

    @property
    def tool_id(self) -> str:
        return "pdf-watermark"

    @property
    def name(self) -> str:
        return "Add Watermark to PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return [".pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        super().validate_inputs(input_paths, options)
        text = str(options.get("text", "")).strip()
        if not text:
            raise FileValidationError("Please specify the watermark text to apply.")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        text = str(options.get("text", "CONFIDENTIAL")).strip()
        try:
            opacity = float(options.get("opacity", 0.3))
        except (ValueError, TypeError):
            opacity = 0.3
        opacity = max(0.05, min(1.0, opacity))

        try:
            fontsize = int(options.get("fontsize", 48))
        except (ValueError, TypeError):
            fontsize = 48
        fontsize = max(12, min(120, fontsize))

        try:
            rotation = int(options.get("rotation", 45)) % 360
        except (ValueError, TypeError):
            rotation = 45

        color_hex = str(options.get("color", "#64748b")).lstrip("#")
        try:
            if len(color_hex) == 6:
                r = int(color_hex[0:2], 16) / 255.0
                g = int(color_hex[2:4], 16) / 255.0
                b = int(color_hex[4:6], 16) / 255.0
                color = (r, g, b)
            else:
                color = (0.5, 0.5, 0.5)
        except Exception:
            color = (0.5, 0.5, 0.5)

        total = src_doc.page_count
        for page in src_doc:
            rect = page.rect
            text_width = fitz.get_text_length(text, fontname="helv", fontsize=fontsize)
            origin_x = (rect.width - text_width) / 2
            origin_y = (rect.height + (fontsize / 2)) / 2
            center_point = fitz.Point(rect.width / 2, rect.height / 2)
            matrix = fitz.Matrix(rotation)

            page.insert_text(
                fitz.Point(origin_x, origin_y),
                text,
                fontsize=fontsize,
                fontname="helv",
                color=color,
                morph=(center_point, matrix),
                fill_opacity=opacity
            )

        out_filename = f"watermarked_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        src_doc.save(out_path, garbage=3, deflate=True)
        src_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total, "watermark": text}
        )


class PdfPageNumbersConverter(BaseConverter):
    """Stamps page numbers onto PDF pages with configurable placement and format."""

    @property
    def tool_id(self) -> str:
        return "pdf-page-numbers"

    @property
    def name(self) -> str:
        return "Add Page Numbers to PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return [".pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        total = src_doc.page_count
        position = str(options.get("position", "bottom-center"))
        format_pattern = str(options.get("format", "Page {n} of {total}"))

        try:
            start_num = int(options.get("start_number", 1))
        except (ValueError, TypeError):
            start_num = 1

        try:
            fontsize = int(options.get("fontsize", 10))
        except (ValueError, TypeError):
            fontsize = 10
        fontsize = max(8, min(24, fontsize))

        color = (0.25, 0.25, 0.25)
        margin = 32

        for i, page in enumerate(src_doc):
            current_num = start_num + i
            if "{total}" in format_pattern:
                label = format_pattern.replace("{n}", str(current_num)).replace("{total}", str(total + start_num - 1))
            else:
                label = format_pattern.replace("{n}", str(current_num))

            rect = page.rect
            text_width = fitz.get_text_length(label, fontname="helv", fontsize=fontsize)

            if position == "bottom-center":
                point = fitz.Point((rect.width - text_width) / 2, rect.height - margin)
            elif position == "bottom-right":
                point = fitz.Point(rect.width - text_width - margin, rect.height - margin)
            elif position == "bottom-left":
                point = fitz.Point(margin, rect.height - margin)
            elif position == "top-right":
                point = fitz.Point(rect.width - text_width - margin, margin + fontsize)
            elif position == "top-center":
                point = fitz.Point((rect.width - text_width) / 2, margin + fontsize)
            else:
                point = fitz.Point((rect.width - text_width) / 2, rect.height - margin)

            page.insert_text(point, label, fontsize=fontsize, fontname="helv", color=color)

        out_filename = f"numbered_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        src_doc.save(out_path, garbage=3, deflate=True)
        src_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total, "position": position}
        )


class PdfRedactConverter(BaseConverter):
    """Permanently redacts specified keywords or phrases with blackout blocks."""

    @property
    def tool_id(self) -> str:
        return "pdf-redact"

    @property
    def name(self) -> str:
        return "Redact PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return [".pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        super().validate_inputs(input_paths, options)
        keywords = options.get("keywords")
        if not keywords:
            raise FileValidationError("Please enter at least one keyword or phrase to redact.")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        raw_keywords = options.get("keywords", "")
        if isinstance(raw_keywords, str):
            keywords_list = [k.strip() for k in raw_keywords.split(",") if k.strip()]
        elif isinstance(raw_keywords, list):
            keywords_list = [str(k).strip() for k in raw_keywords if str(k).strip()]
        else:
            keywords_list = []

        if not keywords_list:
            src_doc.close()
            raise FileValidationError("Please specify valid keywords to redact.")

        redact_color = (0, 0, 0)
        total_redactions = 0

        for page in src_doc:
            for kw in keywords_list:
                quads_or_rects = page.search_for(kw)
                for rect in quads_or_rects:
                    page.add_redact_annot(rect, fill=redact_color)
                    total_redactions += 1
            page.apply_redactions()

        out_filename = f"redacted_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        total_pages = src_doc.page_count
        src_doc.save(out_path, garbage=3, deflate=True)
        src_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total_pages, "redactions_applied": total_redactions}
        )


class PdfFlattenConverter(BaseConverter):
    """Flattens interactive form fields, checkboxes, and annotations into static vectors."""

    @property
    def tool_id(self) -> str:
        return "pdf-flatten"

    @property
    def name(self) -> str:
        return "Flatten PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return [".pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        # Bake annotations and form fields into page contents
        src_doc.bake()

        out_filename = f"flattened_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        total_pages = src_doc.page_count
        src_doc.save(out_path, garbage=3, deflate=True)
        src_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total_pages, "flattened": True}
        )


class PdfScrubMetadataConverter(BaseConverter):
    """Deep scrubs all hidden document metadata, author tags, and XMP payloads."""

    @property
    def tool_id(self) -> str:
        return "pdf-scrub-metadata"

    @property
    def name(self) -> str:
        return "Scrub PDF Metadata"

    @property
    def supported_inputs(self) -> List[str]:
        return [".pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        # Completely clear standard metadata
        src_doc.set_metadata({})
        # PyMuPDF scrub removes hidden XML streams, embedded thumbnails, and signatures
        src_doc.scrub()

        out_filename = f"scrubbed_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        total_pages = src_doc.page_count
        src_doc.save(out_path, garbage=4, deflate=True)
        src_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total_pages, "metadata_scrubbed": True}
        )


class PdfToTxtConverter(BaseConverter):
    """Extracts all text content from a PDF document into a clean, formatted .txt file."""

    @property
    def tool_id(self) -> str:
        return "pdf-to-txt"

    @property
    def name(self) -> str:
        return "PDF to Text"

    @property
    def supported_inputs(self) -> List[str]:
        return [".pdf"]

    @property
    def output_extension(self) -> str:
        return "txt"

    @property
    def output_mime_type(self) -> str:
        return "text/plain; charset=utf-8"

    def validate_output(self, output_path: str) -> None:
        if not os.path.exists(output_path):
            raise ConversionExecutionError("Output text file was not generated.")
        if os.path.getsize(output_path) == 0:
            raise ConversionExecutionError("Output text file is empty (0 bytes).")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        total_pages = src_doc.page_count
        sections: List[str] = []

        for idx, page in enumerate(src_doc):
            page_text = page.get_text().strip()
            sections.append(f"--- Page {idx + 1} of {total_pages} ---\n\n{page_text}")
        src_doc.close()

        combined_text = "\n\n" + ("\n\n".join(sections)) + "\n"
        out_filename = f"extracted_{uuid.uuid4().hex[:8]}.txt"
        out_path = os.path.join(output_dir, out_filename)

        with open(out_path, "w", encoding="utf-8") as f:
            f.write(combined_text)

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total_pages, "characters": len(combined_text)}
        )


class PdfGrayscaleConverter(BaseConverter):
    """Transforms a full-color PDF into a print-optimized monochrome grayscale PDF."""

    @property
    def tool_id(self) -> str:
        return "pdf-grayscale"

    @property
    def name(self) -> str:
        return "PDF to Grayscale"

    @property
    def supported_inputs(self) -> List[str]:
        return [".pdf"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_doc = open_and_validate_pdf(src_path)

        out_doc = fitz.open()
        try:
            dpi = int(options.get("dpi", 200))
        except (ValueError, TypeError):
            dpi = 200
        dpi = max(100, min(300, dpi))
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)

        total_pages = src_doc.page_count
        for page in src_doc:
            pix = page.get_pixmap(matrix=mat, colorspace=fitz.csGRAY)
            new_page = out_doc.new_page(width=page.rect.width, height=page.rect.height)
            new_page.insert_image(new_page.rect, pixmap=pix)

        src_doc.close()

        out_filename = f"grayscale_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        out_doc.save(out_path, garbage=3, deflate=True)
        out_doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total_pages, "grayscale": True}
        )



