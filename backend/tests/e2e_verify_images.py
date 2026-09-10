import requests
import json
import time
from PIL import Image

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_images_e2e():
    # 1. Create a dummy PNG image
    img_path = "d:/convertlytools/sample_graphic.png"
    img = Image.new("RGBA", (300, 200), (45, 130, 240, 255))
    img.save(img_path, format="PNG")

    # 2. Upload PNG
    with open(img_path, "rb") as f:
        res_up = requests.post(f"{BASE_URL}/files/upload", files={"file": ("sample_graphic.png", f, "image/png")})
    assert res_up.status_code == 200, res_up.text
    file_id = res_up.json()["data"]["id"]
    print("Uploaded PNG file ID:", file_id)

    # 3. Submit Image to WebP Job
    job_payload = {
        "tool_id": "image-to-webp",
        "input_file_ids": [file_id],
        "options": {"quality": 85}
    }
    res_job = requests.post(f"{BASE_URL}/jobs", json=job_payload)
    assert res_job.status_code == 200, res_job.text
    job_id = res_job.json()["data"]["id"]
    print("Submitted image-to-webp Job ID:", job_id)

    # 4. Poll until completed
    for _ in range(25):
        time.sleep(0.3)
        poll_res = requests.get(f"{BASE_URL}/jobs/{job_id}")
        assert poll_res.status_code == 200
        data = poll_res.json()["data"]
        if data["status"] in ["completed", "failed"]:
            print("Job finished:", data["status"])
            assert data["status"] == "completed"
            assert data["output_file_id"] is not None

            # Download resulting WebP
            dl = requests.get(f"{BASE_URL}/files/{data['output_file_id']}/download")
            assert dl.status_code == 200
            assert len(dl.content) > 0
            print("Successfully downloaded converted WebP file, size:", len(dl.content), "bytes")
            return

    raise TimeoutError("image-to-webp conversion timed out")

if __name__ == "__main__":
    test_images_e2e()
