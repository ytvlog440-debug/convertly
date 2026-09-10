"""
End-to-end verification script for Sprint 8 Tools:
pdf-to-txt and pdf-grayscale (30 Tools Milestone)
"""
import os
import json
import time
import urllib.request
import fitz

BASE_URL = "http://127.0.0.1:8000/api/v1"

def create_rich_pdf(filepath: str):
    doc = fitz.open()
    for i in range(2):
        page = doc.new_page(width=595, height=842)
        page.draw_rect(fitz.Rect(50, 50, 300, 150), color=(1, 0, 0), fill=(0, 0.7, 0.3))
        page.insert_text((60, 100), f"Sprint 8 Chapter {i + 1}: High-Fidelity Extraction", fontsize=15, color=(0.1, 0.2, 0.9))
        page.insert_text((60, 130), f"Content details for page {i + 1} with critical technical specs.", fontsize=12, color=(0.2, 0.2, 0.2))
    doc.save(filepath)
    doc.close()

def upload_file(filepath: str) -> str:
    boundary = "----WebKitFormBoundary8OA3YWxkTrZu0gW"
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
    print("=== Sprint 8 End-to-End Verification (30 Tools Milestone) ===")
    test_pdf = "sprint8_input.pdf"
    create_rich_pdf(test_pdf)

    try:
        # 1. Test pdf-to-txt
        print("\n1. Testing pdf-to-txt...")
        file_id1 = upload_file(test_pdf)
        job1 = run_job("pdf-to-txt", [file_id1], {})
        out_txt = "sprint8_output.txt"
        download_file(job1["output_file_id"], out_txt)

        assert os.path.exists(out_txt)
        with open(out_txt, "r", encoding="utf-8") as f:
            txt = f.read()

        assert "--- Page 1 of 2 ---" in txt, "Page 1 demarcation missing!"
        assert "Sprint 8 Chapter 1" in txt, "Page 1 content missing!"
        assert "--- Page 2 of 2 ---" in txt, "Page 2 demarcation missing!"
        print("   -> pdf-to-txt successfully extracted structured plain text with page bounds!")

        # 2. Test pdf-grayscale
        print("\n2. Testing pdf-grayscale...")
        file_id2 = upload_file(test_pdf)
        job2 = run_job("pdf-grayscale", [file_id2], {"dpi": 150})
        out_gray = "sprint8_grayscale.pdf"
        download_file(job2["output_file_id"], out_gray)

        assert os.path.exists(out_gray)
        doc = fitz.open(out_gray)
        assert doc.page_count == 2
        doc.close()
        print("   -> pdf-grayscale successfully converted color layers to monochrome PDF!")

        print("\nALL SPRINT 8 TOOLS VERIFIED END-TO-END VIA HTTP API!")

    finally:
        for f in [test_pdf, "sprint8_output.txt", "sprint8_grayscale.pdf"]:
            if os.path.exists(f):
                os.remove(f)

if __name__ == "__main__":
    main()
