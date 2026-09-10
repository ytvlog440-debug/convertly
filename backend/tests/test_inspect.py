import io
import pytest
import pymupdf


def create_sample_pdf_with_metadata() -> bytes:
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Confidential Internal Report", fontsize=18)
    doc.set_metadata({
        "title": "Confidential Q3 Review",
        "author": "Alice Henderson",
        "producer": "Convertly Enterprise Suite",
        "creator": "Internal Audit Bot",
    })
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_inspect_pdf_endpoint_success(client):
    pdf_bytes = create_sample_pdf_with_metadata()
    files = {"file": ("q3_audit.pdf", io.BytesIO(pdf_bytes), "application/pdf")}

    response = client.post("/api/v1/files/inspect", files=files)
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["success"] is True

    data = json_data["data"]
    assert data["filename"] == "q3_audit.pdf"
    assert data["page_count"] == 1
    assert data["metadata"]["author"] == "Alice Henderson"
    assert data["metadata"]["producer"] == "Convertly Enterprise Suite"
    assert "privacy_score" in data
    assert 0 <= data["privacy_score"] <= 100
    assert len(data["recommendations"]) > 0

    # Ensure recommendations include metadata scrub and encryption
    tool_ids = [r["tool_id"] for r in data["recommendations"]]
    assert "pdf-scrub-metadata" in tool_ids
    assert "pdf-protect" in tool_ids


def test_inspect_non_pdf_fails(client):
    files = {"file": ("malicious.txt", io.BytesIO(b"Hello world text file"), "text/plain")}
    response = client.post("/api/v1/files/inspect", files=files)
    assert response.status_code == 422
    assert "PDF" in response.json()["detail"]
