import os
import shutil
import pytest
import zipfile
from PIL import Image
import fitz  # PyMuPDF
from app.services.engine.images import (
    JpgToPngConverter,
    PngToJpgConverter,
    ImageToWebpConverter,
    WebpToImageConverter,
    PdfToImagesConverter,
    ImagesToPdfConverter,
    ImageResizeConverter,
    ImageCompressConverter,
    ImageCropConverter,
    ImageRotateConverter
)
from app.core.errors import FileValidationError

TEST_TMP_DIR = "./temp_image_tests"


@pytest.fixture(autouse=True)
def setup_teardown():
    os.makedirs(TEST_TMP_DIR, exist_ok=True)
    yield
    if os.path.exists(TEST_TMP_DIR):
        shutil.rmtree(TEST_TMP_DIR, ignore_errors=True)


def create_dummy_image(filename: str, mode: str = "RGB", size=(200, 150), color=(60, 120, 200)) -> str:
    path = os.path.join(TEST_TMP_DIR, filename)
    img = Image.new(mode, size, color)
    fmt = "JPEG" if filename.endswith(".jpg") else ("PNG" if filename.endswith(".png") else "WEBP")
    img.save(path, format=fmt)
    img.close()
    return path


def create_dummy_pdf(filename: str, page_count: int = 2) -> str:
    path = os.path.join(TEST_TMP_DIR, filename)
    doc = fitz.open()
    for i in range(page_count):
        page = doc.new_page()
        page.insert_text((72, 100), f"PDF Page {i+1} for Image Extraction", fontsize=20)
    doc.save(path)
    doc.close()
    return path


@pytest.mark.asyncio
async def test_jpg_to_png():
    jpg_path = create_dummy_image("photo.jpg", mode="RGB")
    converter = JpgToPngConverter()
    result = await converter.convert([jpg_path], TEST_TMP_DIR, {})

    assert os.path.exists(result.output_path)
    assert result.mime_type == "image/png"
    img = Image.open(result.output_path)
    assert img.format == "PNG"
    img.close()


@pytest.mark.asyncio
async def test_png_to_jpg_with_transparency():
    # RGBA image with transparent alpha channel
    png_path = create_dummy_image("transparent.png", mode="RGBA", color=(100, 200, 100, 128))
    converter = PngToJpgConverter()
    result = await converter.convert([png_path], TEST_TMP_DIR, {"quality": 90})

    assert os.path.exists(result.output_path)
    assert result.mime_type == "image/jpeg"
    img = Image.open(result.output_path)
    assert img.format == "JPEG"
    assert img.mode == "RGB"
    img.close()


@pytest.mark.asyncio
async def test_image_to_webp_and_back():
    png_path = create_dummy_image("graphic.png", mode="RGB")
    converter_to_webp = ImageToWebpConverter()
    res_webp = await converter_to_webp.convert([png_path], TEST_TMP_DIR, {"quality": 85})

    assert os.path.exists(res_webp.output_path)
    assert res_webp.mime_type == "image/webp"

    # Convert WEBP back to PNG
    converter_back = WebpToImageConverter()
    res_png = await converter_back.convert([res_webp.output_path], TEST_TMP_DIR, {"format": "png"})
    assert os.path.exists(res_png.output_path)
    assert res_png.mime_type == "image/png"


@pytest.mark.asyncio
async def test_pdf_to_images_single_and_multi():
    # Single page PDF
    single_pdf = create_dummy_pdf("single.pdf", page_count=1)
    converter = PdfToImagesConverter()
    res_single = await converter.convert([single_pdf], TEST_TMP_DIR, {"dpi": 100})
    assert os.path.exists(res_single.output_path)
    assert res_single.mime_type == "image/png"

    # Multi page PDF -> ZIP
    multi_pdf = create_dummy_pdf("multi.pdf", page_count=3)
    res_multi = await converter.convert([multi_pdf], TEST_TMP_DIR, {"dpi": 100})
    assert os.path.exists(res_multi.output_path)
    assert res_multi.mime_type == "application/zip"
    assert zipfile.is_zipfile(res_multi.output_path)
    with zipfile.ZipFile(res_multi.output_path, "r") as z:
        assert len(z.namelist()) == 3


@pytest.mark.asyncio
async def test_images_to_pdf():
    img1 = create_dummy_image("img1.jpg", size=(300, 400))
    img2 = create_dummy_image("img2.png", size=(400, 300))

    converter = ImagesToPdfConverter()
    result = await converter.convert([img1, img2], TEST_TMP_DIR, {})

    assert os.path.exists(result.output_path)
    assert result.mime_type == "application/pdf"
    doc = fitz.open(result.output_path)
    assert doc.page_count == 2
    doc.close()


@pytest.mark.asyncio
async def test_image_resize():
    img_path = create_dummy_image("original.png", size=(800, 600))
    converter = ImageResizeConverter()
    result = await converter.convert([img_path], TEST_TMP_DIR, {"width": 400, "height": 300, "keep_ratio": True})

    assert os.path.exists(result.output_path)
    img = Image.open(result.output_path)
    assert img.size == (400, 300)
    img.close()


@pytest.mark.asyncio
async def test_image_compress():
    img_path = create_dummy_image("to_compress.jpg", size=(500, 500))
    converter = ImageCompressConverter()
    result = await converter.convert([img_path], TEST_TMP_DIR, {"level": "extreme"})

    assert os.path.exists(result.output_path)
    assert result.size_bytes > 0
    assert "savings_ratio_percent" in result.metadata


@pytest.mark.asyncio
async def test_image_crop():
    img_path = create_dummy_image("to_crop.png", size=(400, 400))
    converter = ImageCropConverter()
    result = await converter.convert([img_path], TEST_TMP_DIR, {"x": 50, "y": 50, "width": 100, "height": 100})

    assert os.path.exists(result.output_path)
    img = Image.open(result.output_path)
    assert img.size == (100, 100)
    img.close()


@pytest.mark.asyncio
async def test_image_rotate():
    img_path = create_dummy_image("to_rotate.png", size=(200, 100))
    converter = ImageRotateConverter()
    result = await converter.convert([img_path], TEST_TMP_DIR, {"angle": 90})

    assert os.path.exists(result.output_path)
    img = Image.open(result.output_path)
    # A 200x100 image rotated 90 degrees becomes 100x200
    assert img.size == (100, 200)
    img.close()


@pytest.mark.asyncio
async def test_corrupted_image_rejection():
    corrupt_path = os.path.join(TEST_TMP_DIR, "fake_image.png")
    with open(corrupt_path, "wb") as f:
        f.write(b"NOT_AN_IMAGE_FILE_AT_ALL_1234")

    converter = JpgToPngConverter()
    with pytest.raises(FileValidationError, match="corrupted or not a recognized image"):
        await converter.convert([corrupt_path], TEST_TMP_DIR, {})
