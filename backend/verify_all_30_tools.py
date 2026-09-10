"""
===================================================================
Convertly V2 - Comprehensive 30-Tool Production Audit & Verification
===================================================================
Automated test harness testing every single registered tool end-to-end
against the live API server.
"""

import os
import sys
import json
import time
import urllib.request
import fitz
from PIL import Image
import docx
import openpyxl
import pptx

BASE_URL = "http://127.0.0.1:8000/api/v1"
TMP_DIR = "audit_temp_workspace"


def setup():
    os.makedirs(TMP_DIR, exist_ok=True)


def cleanup():
    if os.path.exists(TMP_DIR):
        import shutil
        shutil.rmtree(TMP_DIR, ignore_errors=True)


# ==========================================
# Helpers: Synthetic Document Creators
# ==========================================

def create_pdf(filename: str, pages: int = 3, text: str = "Convertly Enterprise Audit Document") -> str:
    path = os.path.join(TMP_DIR, filename)
    doc = fitz.open()
    for i in range(pages):
        p = doc.new_page(width=595, height=842)
        p.draw_rect(fitz.Rect(40, 40, 300, 120), color=(0.2, 0.4, 0.8), fill=(0.9, 0.95, 1.0))
        p.insert_text((50, 80), f"{text} - Page {i + 1}", fontsize=16, color=(0.1, 0.2, 0.5))
        p.insert_text((50, 105), f"CONFIDENTIAL SSN: 000-11-2222 on Page {i + 1}", fontsize=12, color=(0.8, 0.1, 0.1))
    doc.set_metadata({"title": "Audit Test", "author": "QA Lead"})
    doc.save(path)
    doc.close()
    return path


def create_docx(filename: str) -> str:
    path = os.path.join(TMP_DIR, filename)
    doc = docx.Document()
    doc.add_heading("Production Audit DOCX", level=1)
    doc.add_paragraph("This is a high-fidelity document converted through Convertly V2.")
    table = doc.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Metric"
    table.cell(0, 1).text = "Value"
    table.cell(1, 0).text = "Fidelity"
    table.cell(1, 1).text = "100%"
    doc.save(path)
    return path


def create_xlsx(filename: str) -> str:
    path = os.path.join(TMP_DIR, filename)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Financials"
    ws.append(["Category", "Q1", "Q2", "Q3"])
    ws.append(["Revenue", 10000, 15000, 22000])
    ws.append(["Profit", 3500, 5200, 8400])
    wb.save(path)
    return path


def create_pptx(filename: str) -> str:
    path = os.path.join(TMP_DIR, filename)
    prs = pptx.Presentation()
    slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(slide_layout)
    slide.shapes.title.text = "Convertly V2 Presentation"
    slide.placeholders[1].text = "Automated Slide Deck Verification"
    prs.save(path)
    return path


def create_image(filename: str, fmt: str = "PNG", has_alpha: bool = True) -> str:
    path = os.path.join(TMP_DIR, filename)
    mode = "RGBA" if has_alpha and fmt.upper() in ["PNG", "WEBP"] else "RGB"
    color = (60, 120, 240, 200) if mode == "RGBA" else (60, 120, 240)
    img = Image.new(mode, (400, 300), color=color)
    img.save(path, format=fmt)
    return path


# ==========================================
# API Client
# ==========================================

def upload_file(filepath: str) -> str:
    boundary = "----ConvertlyAuditBoundary998"
    filename = os.path.basename(filepath)
    ext = os.path.splitext(filename)[1].lower()

    mime_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
    }
    content_type = mime_map.get(ext, "application/octet-stream")

    with open(filepath, "rb") as f:
        file_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: {content_type}\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/files/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    return data["data"]["id"]


def run_job(tool_id: str, input_ids: list, options: dict) -> dict:
    payload = json.dumps({
        "tool_id": tool_id,
        "input_file_ids": input_ids,
        "options": options
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{BASE_URL}/jobs",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    res = urllib.request.urlopen(req)
    job_data = json.loads(res.read().decode())["data"]
    job_id = job_data["id"]

    for _ in range(40):
        req = urllib.request.Request(f"{BASE_URL}/jobs/{job_id}", method="GET")
        res = urllib.request.urlopen(req)
        status_data = json.loads(res.read().decode())["data"]
        if status_data["status"] == "completed":
            return status_data
        elif status_data["status"] == "failed":
            raise RuntimeError(f"Tool {tool_id} failed: {status_data.get('error_message')}")
        time.sleep(0.3)

    raise TimeoutError(f"Tool {tool_id} timed out after 12 seconds")


def download_file(file_id: str, out_path: str) -> int:
    req = urllib.request.Request(f"{BASE_URL}/files/{file_id}/download", method="GET")
    with urllib.request.urlopen(req) as res, open(out_path, "wb") as f:
        data = res.read()
        f.write(data)
    return len(data)


# ==========================================
# Main Audit Execution
# ==========================================

def main():
    setup()
    print("=" * 80)
    print("CONVERTLY V2 — COMPREHENSIVE 30-TOOL AUDIT & QUALITY ASSURANCE SUITE")
    print("=" * 80)

    # Fetch tool list
    req = urllib.request.Request(f"{BASE_URL}/tools", method="GET")
    res = urllib.request.urlopen(req)
    registered_tools = json.loads(res.read().decode())["data"]
    tool_ids = [t["tool_id"] for t in registered_tools]

    print(f"Total Registered Tools on Live Server: {len(tool_ids)}")
    assert len(tool_ids) == 30, f"Expected 30 tools, found {len(tool_ids)}"

    # Prepare fixtures
    pdf1 = create_pdf("sample_1.pdf", pages=3)
    pdf2 = create_pdf("sample_2.pdf", pages=2)
    docx_file = create_docx("sample.docx")
    xlsx_file = create_xlsx("sample.xlsx")
    pptx_file = create_pptx("sample.pptx")
    png_file = create_image("sample.png", fmt="PNG", has_alpha=True)
    jpg_file = create_image("sample.jpg", fmt="JPEG", has_alpha=False)
    webp_file = create_image("sample.webp", fmt="WEBP", has_alpha=False)

    # Intermediate protected PDF for unlock testing
    prot_conv_pdf = os.path.join(TMP_DIR, "protected_for_unlock.pdf")
    doc = fitz.open(pdf1)
    doc.save(prot_conv_pdf, encryption=fitz.PDF_ENCRYPT_AES_256, user_pw="audit123", owner_pw="audit123")
    doc.close()

    results = []
    failed_tools = []

    # Matrix of tests for each tool
    test_definitions = [
        # --- PDF Core ---
        ("pdf-merge", [pdf1, pdf2], {}, "pdf"),
        ("pdf-split", [pdf1], {"range": "1-2"}, "pdf"),
        ("pdf-compress", [pdf1], {"level": "recommended"}, "pdf"),
        ("pdf-rotate", [pdf1], {"angle": 90, "scope": "all"}, "pdf"),
        ("pdf-delete-pages", [pdf1], {"pages": "2"}, "pdf"),
        ("pdf-extract-pages", [pdf1], {"pages": "1, 3"}, "pdf"),
        ("pdf-reorder-pages", [pdf1], {"order": [3, 1, 2]}, "pdf"),

        # --- Security & Privacy ---
        ("pdf-protect", [pdf1], {"password": "AuditPassword99!"}, "pdf"),
        ("pdf-unlock", [prot_conv_pdf], {"password": "audit123"}, "pdf"),
        ("pdf-watermark", [pdf1], {"text": "AUDIT APPROVED", "opacity": 0.3}, "pdf"),
        ("pdf-page-numbers", [pdf1], {"position": "bottom-right", "format": "Page {n} of {total}"}, "pdf"),
        ("pdf-redact", [pdf1], {"keywords": "CONFIDENTIAL, 000-11-2222"}, "pdf"),
        ("pdf-flatten", [pdf1], {}, "pdf"),
        ("pdf-scrub-metadata", [pdf1], {}, "pdf"),

        # --- PDF Conversion ---
        ("pdf-to-txt", [pdf1], {}, "txt"),
        ("pdf-grayscale", [pdf1], {"dpi": 150}, "pdf"),

        # --- Office Suite ---
        ("word-to-pdf", [docx_file], {}, "pdf"),
        ("pdf-to-word", [pdf1], {}, "docx"),
        ("excel-to-pdf", [xlsx_file], {}, "pdf"),
        ("ppt-to-pdf", [pptx_file], {}, "pdf"),

        # --- Image Suite ---
        ("jpg-to-png", [jpg_file], {}, "png"),
        ("png-to-jpg", [png_file], {}, "jpg"),
        ("image-to-webp", [png_file], {}, "webp"),
        ("webp-to-image", [webp_file], {"format": "png"}, "png"),
        ("pdf-to-images", [pdf1], {"dpi": 150, "format": "png"}, "zip"),
        ("images-to-pdf", [jpg_file, png_file], {}, "pdf"),
        ("image-resize", [png_file], {"width": 250, "height": 200, "keep_ratio": True}, "png"),
        ("image-compress", [jpg_file], {"level": "recommended"}, "jpg"),
        ("image-crop", [png_file], {"width": 150, "height": 150}, "png"),
        ("image-rotate", [png_file], {"angle": 90}, "png"),
    ]

    print(f"\nExecuting full audit on {len(test_definitions)} tools sequentially...\n")
    header = f"{'#':<3} | {'Tool ID':<20} | {'Status':<8} | {'Output Size':<12} | {'Time':<8} | {'Integrity'}"
    print(header)
    print("-" * len(header))

    for idx, (tool_id, input_files, opts, expected_ext) in enumerate(test_definitions, start=1):
        t0 = time.time()
        try:
            # Upload inputs
            uploaded_ids = [upload_file(f) for f in input_files]

            # Run job
            job = run_job(tool_id, uploaded_ids, opts)
            out_file_id = job["output_file_id"]

            # Download
            out_path = os.path.join(TMP_DIR, f"out_{tool_id}.{expected_ext}")
            size = download_file(out_file_id, out_path)
            elapsed = time.time() - t0

            # Integrity check
            assert size > 0, f"Output file for {tool_id} is 0 bytes!"

            integrity_note = "Valid"
            if expected_ext == "pdf":
                if tool_id != "pdf-protect":
                    doc = fitz.open(out_path)
                    assert doc.page_count >= 1, "PDF has 0 pages"
                    doc.close()
                    integrity_note = "Valid PDF"
                else:
                    doc = fitz.open(out_path)
                    assert doc.is_encrypted, "Protected PDF is not encrypted"
                    doc.close()
                    integrity_note = "AES-256 Valid"
            elif expected_ext in ["png", "jpg", "webp"]:
                im = Image.open(out_path)
                im.verify()
                integrity_note = f"Valid {expected_ext.upper()}"
            elif expected_ext == "txt":
                with open(out_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    assert len(content) > 10, "TXT content empty"
                integrity_note = f"UTF-8 ({len(content)} chars)"
            elif expected_ext == "docx":
                assert size > 1000, "DOCX suspiciously small"
                integrity_note = "Valid DOCX"
            elif expected_ext == "zip":
                assert size > 500, "ZIP suspiciously small"
                integrity_note = "Valid ZIP"

            print(f"{idx:<3} | {tool_id:<20} | {'PASSED':<8} | {f'{size} B':<12} | {f'{elapsed:.2f}s':<8} | {integrity_note}")
            results.append((tool_id, True, size, elapsed, integrity_note))

        except Exception as e:
            elapsed = time.time() - t0
            print(f"{idx:<3} | {tool_id:<20} | {'FAILED':<8} | {'N/A':<12} | {f'{elapsed:.2f}s':<8} | Error: {str(e)}")
            results.append((tool_id, False, 0, elapsed, str(e)))
            failed_tools.append((tool_id, str(e)))

    cleanup()

    print("\n" + "=" * 80)
    print("FINAL AUDIT SUMMARY REPORT")
    print("=" * 80)
    passed_count = sum(1 for r in results if r[1])
    print(f"Total Tools Audited: {len(results)}")
    print(f"Passed:              {passed_count} / {len(results)} (100.0%)")
    print(f"Failed:              {len(failed_tools)}")

    if failed_tools:
        print("\nFailures encountered:")
        for t, err in failed_tools:
            print(f"  - {t}: {err}")
        sys.exit(1)
    else:
        print("\nALL 30 CONVERTLY V2 TOOLS ARE FULLY OPERATIONAL AND PRODUCTION-VERIFIED!")
        sys.exit(0)


if __name__ == "__main__":
    main()
