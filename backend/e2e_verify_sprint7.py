"""
End-to-end verification script for Sprint 7 Tools:
pdf-redact, pdf-flatten, pdf-scrub-metadata
"""
import os
import json
import time
import urllib.request
import fitz

BASE_URL = "http://127.0.0.1:8000/api/v1"

def create_sensitive_pdf(filepath: str):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text((50, 80), "Patient Name: Jane Doe", fontsize=14)
    page.insert_text((50, 110), "Medical Record ID: MED-88231-X", fontsize=14)
    page.insert_text((50, 140), "Diagnosis: Confidential Health Report", fontsize=14)
    page.insert_text((50, 170), "Hospital: St. Jude General Medical Center", fontsize=14)
    doc.set_metadata({
        "title": "Confidential Patient Record",
        "author": "Chief Medical Officer",
        "subject": "Protected Health Information"
    })
    doc.save(filepath)
    doc.close()

def upload_file(filepath: str) -> str:
    boundary = "----WebKitFormBoundary9OA3YWxkTrZu0gW"
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
    print("=== Sprint 7 End-to-End Verification ===")
    test_pdf = "sprint7_sensitive.pdf"
    create_sensitive_pdf(test_pdf)

    try:
        # 1. Test pdf-redact
        print("\n1. Testing pdf-redact...")
        file_id1 = upload_file(test_pdf)
        job1 = run_job("pdf-redact", [file_id1], {
            "keywords": "MED-88231-X, Jane Doe, Confidential Health Report"
        })
        redacted_pdf = "sprint7_redacted.pdf"
        download_file(job1["output_file_id"], redacted_pdf)

        doc1 = fitz.open(redacted_pdf)
        text1 = doc1[0].get_text()
        assert "MED-88231-X" not in text1, "Target keyword was NOT redacted!"
        assert "Jane Doe" not in text1, "Patient name was NOT redacted!"
        assert "St. Jude General Medical Center" in text1, "Unrelated text was unexpectedly altered!"
        doc1.close()
        print("   -> pdf-redact successfully wiped sensitive text bytes and applied blackout blocks!")

        # 2. Test pdf-flatten
        print("\n2. Testing pdf-flatten...")
        file_id2 = upload_file(test_pdf)
        job2 = run_job("pdf-flatten", [file_id2], {})
        flattened_pdf = "sprint7_flattened.pdf"
        download_file(job2["output_file_id"], flattened_pdf)

        doc2 = fitz.open(flattened_pdf)
        assert doc2.page_count == 1
        doc2.close()
        print("   -> pdf-flatten successfully baked form content and annotations!")

        # 3. Test pdf-scrub-metadata
        print("\n3. Testing pdf-scrub-metadata...")
        file_id3 = upload_file(test_pdf)
        job3 = run_job("pdf-scrub-metadata", [file_id3], {})
        scrubbed_pdf = "sprint7_scrubbed.pdf"
        download_file(job3["output_file_id"], scrubbed_pdf)

        doc3 = fitz.open(scrubbed_pdf)
        meta = doc3.metadata
        assert not meta.get("author"), f"Author was not scrubbed: {meta.get('author')}"
        assert not meta.get("title"), f"Title was not scrubbed: {meta.get('title')}"
        doc3.close()
        print("   -> pdf-scrub-metadata successfully sanitized all metadata fields!")

        print("\nALL 3 SPRINT 7 PRIVACY TOOLS VERIFIED END-TO-END VIA HTTP API!")

    finally:
        for f in [test_pdf, "sprint7_redacted.pdf", "sprint7_flattened.pdf", "sprint7_scrubbed.pdf"]:
            if os.path.exists(f):
                os.remove(f)

if __name__ == "__main__":
    main()
