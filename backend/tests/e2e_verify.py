import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_full_pipeline():
    # 1. Upload sample1.pdf
    with open("d:/convertlytools/sample1.pdf", "rb") as f:
        res1 = requests.post(f"{BASE_URL}/files/upload", files={"file": ("sample1.pdf", f, "application/pdf")})
    assert res1.status_code == 200, res1.text
    fid1 = res1.json()["data"]["id"]

    # 2. Upload sample2.pdf
    with open("d:/convertlytools/sample2.pdf", "rb") as f:
        res2 = requests.post(f"{BASE_URL}/files/upload", files={"file": ("sample2.pdf", f, "application/pdf")})
    assert res2.status_code == 200, res2.text
    fid2 = res2.json()["data"]["id"]

    print("Files uploaded:", fid1, fid2)

    # 3. Create PDF Merge Job
    job_payload = {
        "tool_id": "pdf-merge",
        "input_file_ids": [fid1, fid2],
        "options": {}
    }
    res_job = requests.post(f"{BASE_URL}/jobs", json=job_payload)
    assert res_job.status_code == 200, res_job.text
    job_id = res_job.json()["data"]["id"]
    print("Merge job created:", job_id)

    # 4. Poll until completion
    status = "pending"
    for _ in range(20):
        time.sleep(0.3)
        poll_res = requests.get(f"{BASE_URL}/jobs/{job_id}")
        assert poll_res.status_code == 200
        data = poll_res.json()["data"]
        status = data["status"]
        if status in ["completed", "failed"]:
            print("Job finished with status:", status)
            print("Job data:", json.dumps(data, indent=2))
            assert status == "completed"
            assert data["output_file_id"] is not None
            # Download file
            download_res = requests.get(f"{BASE_URL}/files/{data['output_file_id']}/download")
            assert download_res.status_code == 200
            assert len(download_res.content) > 0
            print("Downloaded merged PDF successfully, size:", len(download_res.content), "bytes")
            return

    raise TimeoutError("Job did not complete in time")

if __name__ == "__main__":
    test_full_pipeline()
