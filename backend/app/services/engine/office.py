import os
import shutil
import subprocess
import uuid
import zipfile
from typing import List, Dict, Any, Optional
from app.core.errors import FileValidationError, ConversionExecutionError
from app.services.engine.base import BaseConverter, ConversionResult


def find_libreoffice_bin() -> Optional[str]:
    """Find LibreOffice executable if installed in system PATH or standard directories."""
    candidates = [
        shutil.which("soffice"),
        shutil.which("libreoffice"),
        r"C:\Program Files\LibreOffice\program\soffice.exe",
        r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        "/usr/bin/libreoffice",
        "/usr/bin/soffice",
    ]
    for c in candidates:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return None


def run_libreoffice_conversion(input_path: str, output_dir: str, target_format: str = "pdf") -> str:
    """Execute headless LibreOffice conversion."""
    soffice_bin = find_libreoffice_bin()
    if not soffice_bin:
        raise RuntimeError("LibreOffice binary not found.")

    cmd = [
        soffice_bin,
        "--headless",
        "--convert-to", target_format,
        "--outdir", output_dir,
        input_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    if res.returncode != 0:
        raise ConversionExecutionError(f"LibreOffice conversion failed: {res.stderr.decode()}")

    base_name = os.path.splitext(os.path.basename(input_path))[0]
    out_path = os.path.join(output_dir, f"{base_name}.{target_format}")
    if not os.path.exists(out_path):
        raise ConversionExecutionError("LibreOffice completed without producing expected output file.")
    return out_path


def validate_office_archive(file_path: str, required_entry: str) -> None:
    """Verify that an Office file is a valid OpenXML ZIP archive containing the required entry."""
    if not os.path.exists(file_path):
        raise FileValidationError(f"File does not exist: {file_path}")
    if not zipfile.is_zipfile(file_path):
        raise FileValidationError(f"File '{os.path.basename(file_path)}' is not a valid OpenXML document (corrupted header).")
    try:
        with zipfile.ZipFile(file_path, "r") as z:
            names = z.namelist()
            if required_entry not in names and not any(n.startswith(required_entry) for n in names):
                raise FileValidationError(f"Document archive is missing '{required_entry}' and appears damaged.")
    except Exception as e:
        raise FileValidationError(f"Failed to read Office document structure: {str(e)}")


# 1. Word to PDF Converter
class WordToPdfConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "word-to-pdf"

    @property
    def name(self) -> str:
        return "Word to PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return ["docx"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        super().validate_inputs(input_paths, options)
        validate_office_archive(input_paths[0], "word/document.xml")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]

        # Check if LibreOffice is available
        soffice = find_libreoffice_bin()
        if soffice:
            out_path = run_libreoffice_conversion(src_path, output_dir, "pdf")
        else:
            # Native Python fallback using docx + reportlab
            import docx
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors

            doc = docx.Document(src_path)
            out_filename = f"converted_{uuid.uuid4().hex[:8]}.pdf"
            out_path = os.path.join(output_dir, out_filename)

            pdf_doc = SimpleDocTemplate(out_path, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
            styles = getSampleStyleSheet()
            story = []

            # Process paragraphs
            for p in doc.paragraphs:
                text = p.text.strip()
                if not text:
                    story.append(Spacer(1, 8))
                    continue

                style_name = "Normal"
                if p.style and p.style.name.startswith("Heading 1"):
                    style_name = "Heading1"
                elif p.style and p.style.name.startswith("Heading 2"):
                    style_name = "Heading2"
                elif p.style and p.style.name.startswith("Heading 3"):
                    style_name = "Heading3"

                style = styles[style_name]
                # XML escape text for reportlab paragraph
                clean_text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                story.append(Paragraph(clean_text, style))
                story.append(Spacer(1, 6))

            # Process tables
            for table in doc.tables:
                table_data = []
                for row in table.rows:
                    row_data = []
                    for cell in row.cells:
                        cell_text = cell.text.strip().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                        row_data.append(Paragraph(cell_text, styles["Normal"]))
                    table_data.append(row_data)

                if table_data:
                    t = Table(table_data)
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                        ('TOPPADDING', (0, 0), (-1, -1), 6),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ]))
                    story.append(t)
                    story.append(Spacer(1, 12))

            if not story:
                story.append(Paragraph("Empty Document", styles["Normal"]))

            pdf_doc.build(story)

        self.validate_output(out_path)
        out_filename = os.path.basename(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path)
        )


# 2. PDF to Word Converter
class PdfToWordConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "pdf-to-word"

    @property
    def name(self) -> str:
        return "PDF to Word"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "docx"

    @property
    def output_mime_type(self) -> str:
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]

        from pdf2docx import Converter
        out_filename = f"converted_{uuid.uuid4().hex[:8]}.docx"
        out_path = os.path.join(output_dir, out_filename)

        cv = Converter(src_path)
        # Parse layout, tables, formatting and write to DOCX
        cv.convert(out_path)
        cv.close()

        self.validate_output(out_path)
        validate_office_archive(out_path, "word/document.xml")

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path)
        )


# 3. Excel to PDF Converter
class ExcelToPdfConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "excel-to-pdf"

    @property
    def name(self) -> str:
        return "Excel to PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return ["xlsx"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        super().validate_inputs(input_paths, options)
        validate_office_archive(input_paths[0], "xl/workbook.xml")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]

        soffice = find_libreoffice_bin()
        if soffice:
            out_path = run_libreoffice_conversion(src_path, output_dir, "pdf")
        else:
            # Native Python using openpyxl + reportlab
            import openpyxl
            from reportlab.lib.pagesizes import letter, landscape
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet
            from reportlab.lib import colors

            wb = openpyxl.load_workbook(src_path, data_only=True)
            out_filename = f"spreadsheet_{uuid.uuid4().hex[:8]}.pdf"
            out_path = os.path.join(output_dir, out_filename)

            orientation = options.get("orientation", "landscape")
            pagesize = landscape(letter) if orientation == "landscape" else letter
            pdf_doc = SimpleDocTemplate(out_path, pagesize=pagesize, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
            styles = getSampleStyleSheet()
            story = []

            for sheet_name in wb.sheetnames:
                sheet = wb[sheet_name]
                story.append(Paragraph(f"<b>Sheet: {sheet_name}</b>", styles["Heading2"]))
                story.append(Spacer(1, 10))

                table_data = []
                for row in sheet.iter_rows(values_only=True):
                    # Check if row has any non-empty cell
                    if not any(cell is not None for cell in row):
                        continue
                    row_cells = []
                    for cell in row:
                        val = str(cell) if cell is not None else ""
                        clean = val.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                        row_cells.append(Paragraph(clean[:60], styles["Normal"]))
                    table_data.append(row_cells)

                if table_data:
                    t = Table(table_data)
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTSIZE', (0, 0), (-1, -1), 8),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                        ('TOPPADDING', (0, 0), (-1, -1), 4),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#94a3b8")),
                    ]))
                    story.append(t)
                else:
                    story.append(Paragraph("<i>(Empty sheet)</i>", styles["Normal"]))

                story.append(Spacer(1, 20))

            pdf_doc.build(story)

        self.validate_output(out_path)
        out_filename = os.path.basename(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path)
        )


# 4. PowerPoint to PDF Converter
class PptToPdfConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "ppt-to-pdf"

    @property
    def name(self) -> str:
        return "PowerPoint to PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pptx"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    def validate_inputs(self, input_paths: List[str], options: Dict[str, Any]) -> None:
        super().validate_inputs(input_paths, options)
        validate_office_archive(input_paths[0], "ppt/presentation.xml")

    async def convert(
        self,
        input_paths: List[str],
        output_dir: str,
        options: Dict[str, Any]
    ) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]

        soffice = find_libreoffice_bin()
        if soffice:
            out_path = run_libreoffice_conversion(src_path, output_dir, "pdf")
        else:
            # Native Python using pptx + reportlab
            from pptx import Presentation
            from reportlab.lib.pagesizes import landscape, letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
            from reportlab.lib.styles import getSampleStyleSheet

            prs = Presentation(src_path)
            out_filename = f"presentation_{uuid.uuid4().hex[:8]}.pdf"
            out_path = os.path.join(output_dir, out_filename)

            pdf_doc = SimpleDocTemplate(out_path, pagesize=landscape(letter), rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
            styles = getSampleStyleSheet()
            story = []

            for i, slide in enumerate(prs.slides):
                story.append(Paragraph(f"<b>Slide {i + 1}</b>", styles["Heading1"]))
                story.append(Spacer(1, 14))

                for shape in slide.shapes:
                    if shape.has_text_frame:
                        for p in shape.text_frame.paragraphs:
                            text = p.text.strip()
                            if text:
                                clean = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                                story.append(Paragraph(clean, styles["Normal"]))
                                story.append(Spacer(1, 6))

                if i < len(prs.slides) - 1:
                    story.append(PageBreak())

            if not story:
                story.append(Paragraph("Empty Presentation", styles["Normal"]))

            pdf_doc.build(story)

        self.validate_output(out_path)
        out_filename = os.path.basename(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path)
        )
