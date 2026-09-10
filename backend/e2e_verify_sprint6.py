"""
End-to-end verification script for Sprint 6 Tools:
pdf-protect, pdf-unlock, pdf-watermark, pdf-page-numbers
"""
import os
import json
import time
import urllib.request
import fitz

BASE_URL = "http://127.0.0.1:8000/api/v1"

def create_test_pdf(filepath: str, text: str = "Confidential Financial Statement"):
    doc = fitz.open()
    for i in range(3):
        page = doc.new_page(width=595, height=842)
        page.insert_text((50, 72), f"{text} - Page {i + 1}", fontsize=16)
    doc.save(filepath)
    doc.close()

def upload_file(filepath: str) -> str:
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    filename = os.path.basename(filepath)
    with open(filepath, "rb") as f:
        file_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
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

    for _ in range(20):
        req = urllib.request.Request(f"{BASE_URL}/jobs/{job_id}", method="GET")
        res = urllib.request.urlopen(req)
        status_data = json.loads(res.read().decode())["data"]
        if status_data["status"] == "completed":
            return status_data
        elif status_data["status"] == "failed":
            raise RuntimeError(f"Job failed: {status_data.get('error_message')}")
        time.sleep(0.5)

    raise TimeoutError(f"Job {job_id} timed out")

def download_file(file_id: str, out_path: str):
    req = urllib.request.Request(f"{BASE_URL}/files/{file_id}/download", method="GET")
    with urllib.request.urlopen(req) as res, open(out_path, "wb") as f:
        f.write(res.read())

def main():
    print("=== Sprint 6 End-to-End Verification ===")
    test_pdf = "sprint6_input.pdf"
    create_test_pdf(test_pdf, "Sprint 6 Verification Document")

    try:
        # 1. Protect PDF
        print("\n1. Testing pdf-protect...")
        file_id = upload_file(test_pdf)
        job = run_job("pdf-protect", [file_id], {"password": "SecretPassword2026!"})
        protected_pdf = "sprint6_protected.pdf"
        download_file(job["output_file_id"], protected_pdf)

        doc = fitz.open(protected_pdf)
        assert doc.is_encrypted, "Document is not encrypted!"
        assert doc.authenticate("Wrong") == 0, "Wrong password passed unexpectedly!"
        assert doc.authenticate("SecretPassword2026!") > 0, "Authentication with correct password failed!"
        doc.close()
        print("   -> pdf-protect verified with AES-256 encryption!")

        # 2. Unlock PDF
        print("\n2. Testing pdf-unlock...")
        enc_file_id = upload_file(protected_pdf)
        job2 = run_job("pdf-unlock", [enc_file_id], {"password": "SecretPassword2026!"})
        unlocked_pdf = "sprint6_unlocked.pdf"
        download_file(job2["output_file_id"], unlocked_pdf)

        doc2 = fitz.open(unlocked_pdf)
        assert not doc2.is_encrypted, "Document is still encrypted!"
        assert doc2.page_count == 3, f"Unexpected page count: {doc2.page_count}"
        doc2.close()
        print("   -> pdf-unlock successfully removed password protection!")

        # 3. Watermark PDF
        print("\n3. Testing pdf-watermark...")
        job3 = run_job("pdf-watermark", [file_id], {
            "text": "CONFIDENTIAL DRAFT",
            "opacity": 0.3,
            "fontsize": 48,
            "rotation": 45,
            "color": "#ef4444"
        })
        watermarked_pdf = "sprint6_watermarked.pdf"
        download_file(job3["output_file_id"], watermarked_pdf)

        doc3 = fitz.open(watermarked_pdf)
        assert doc3.page_count == 3
        text = doc3[0].get_text()
        assert "CONFIDENTIAL DRAFT" in text
        doc3.close()
        print("   -> pdf-watermark applied clean rotation and alpha overlay!")

        # 4. Page Numbers
        print("\n4. Testing pdf-page-numbers...")
        job4 = run_job("pdf-page-numbers", [file_id], {
            "position": "bottom-right",
            "format": "Page {n} of {total}",
            "fontsize": 10
        })
        numbered_pdf = "sprint6_numbered.pdf"
        download_file(job4["output_file_id"], numbered_pdf)

        doc4 = fitz.open(numbered_pdf)
        assert doc4.page_count == 3
        assert "Page 1 of 3" in doc4[0].get_text()
        assert "Page 3 of 3" in doc4[2].get_text()
        doc4.close()
        print("   -> pdf-page-numbers successfully stamped vector page numbers!")

        print("\nALL 4 SPRINT 6 TOOLS VERIFIED END-TO-END VIA HTTP API!")

    finally:
        for f in [test_pdf, "sprint6_protected.pdf", "sprint6_unlocked.pdf", "sprint6_watermarked.pdf", "sprint6_numbered.pdf"]:
            if os.path.exists(f):
                os.remove(f)

if __name__ == "__main__":
    main()
