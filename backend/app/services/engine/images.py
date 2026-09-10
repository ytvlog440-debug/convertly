import os
import uuid
import zipfile
from typing import List, Dict, Any, Optional
from PIL import Image, ImageOps
import fitz  # PyMuPDF
from app.core.errors import FileValidationError, ConversionExecutionError
from app.services.engine.base import BaseConverter, ConversionResult


def open_and_validate_image(file_path: str) -> Image.Image:
    """Safely open an image and verify it is non-corrupt."""
    if not os.path.exists(file_path):
        raise FileValidationError(f"File does not exist: {file_path}")
    try:
        img = Image.open(file_path)
        img.verify()  # Verify integrity
        # Re-open because verify() closes the file descriptor
        img = Image.open(file_path)
        return img
    except Exception as e:
        raise FileValidationError(f"File is corrupted or not a recognized image: {str(e)}")


def flatten_alpha_to_rgb(img: Image.Image, bg_color=(255, 255, 255)) -> Image.Image:
    """
    Composite transparent RGBA/LA image over a clean solid background matte
    to prevent the infamous black background artifact when converting to JPEG.
    """
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        alpha_img = img.convert("RGBA")
        background = Image.new("RGBA", alpha_img.size, bg_color + (255,))
        composite = Image.alpha_composite(background, alpha_img)
        return composite.convert("RGB")
    return img.convert("RGB")


# 1. JPG to PNG
class JpgToPngConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "jpg-to-png"

    @property
    def name(self) -> str:
        return "JPG to PNG"

    @property
    def supported_inputs(self) -> List[str]:
        return ["jpg", "jpeg"]

    @property
    def output_extension(self) -> str:
        return "png"

    @property
    def output_mime_type(self) -> str:
        return "image/png"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        img = open_and_validate_image(input_paths[0])

        out_filename = f"image_{uuid.uuid4().hex[:8]}.png"
        out_path = os.path.join(output_dir, out_filename)

        img.save(out_path, format="PNG", optimize=True)
        img.close()
        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path)
        )


# 2. PNG to JPG
class PngToJpgConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "png-to-jpg"

    @property
    def name(self) -> str:
        return "PNG to JPG"

    @property
    def supported_inputs(self) -> List[str]:
        return ["png"]

    @property
    def output_extension(self) -> str:
        return "jpg"

    @property
    def output_mime_type(self) -> str:
        return "image/jpeg"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        img = open_and_validate_image(input_paths[0])

        # Safely handle transparency by matting onto white
        rgb_img = flatten_alpha_to_rgb(img, bg_color=(255, 255, 255))
        img.close()

        quality = int(options.get("quality", 92))
        out_filename = f"image_{uuid.uuid4().hex[:8]}.jpg"
        out_path = os.path.join(output_dir, out_filename)

        rgb_img.save(out_path, format="JPEG", quality=quality, optimize=True)
        rgb_img.close()
        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path)
        )


# 3. Image to WEBP
class ImageToWebpConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "image-to-webp"

    @property
    def name(self) -> str:
        return "JPG / PNG to WEBP"

    @property
    def supported_inputs(self) -> List[str]:
        return ["jpg", "jpeg", "png"]

    @property
    def output_extension(self) -> str:
        return "webp"

    @property
    def output_mime_type(self) -> str:
        return "image/webp"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        img = open_and_validate_image(input_paths[0])

        quality = int(options.get("quality", 85))
        lossless = bool(options.get("lossless", False))

        out_filename = f"image_{uuid.uuid4().hex[:8]}.webp"
        out_path = os.path.join(output_dir, out_filename)

        img.save(out_path, format="WEBP", quality=quality, lossless=lossless, method=6)
        img.close()
        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path)
        )


# 4. WEBP to Image (PNG / JPG)
class WebpToImageConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "webp-to-image"

    @property
    def name(self) -> str:
        return "WEBP to JPG / PNG"

    @property
    def supported_inputs(self) -> List[str]:
        return ["webp"]

    @property
    def output_extension(self) -> str:
        return "png"

    @property
    def output_mime_type(self) -> str:
        return "image/png"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        img = open_and_validate_image(input_paths[0])

        target_fmt = options.get("format", "png").lower()
        if target_fmt in ["jpg", "jpeg"]:
            processed = flatten_alpha_to_rgb(img)
            ext = "jpg"
            mime = "image/jpeg"
            save_fmt = "JPEG"
        else:
            processed = img
            ext = "png"
            mime = "image/png"
            save_fmt = "PNG"

        out_filename = f"image_{uuid.uuid4().hex[:8]}.{ext}"
        out_path = os.path.join(output_dir, out_filename)

        processed.save(out_path, format=save_fmt)
        img.close()
        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=mime,
            size_bytes=os.path.getsize(out_path)
        )


# 5. PDF to Images
class PdfToImagesConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "pdf-to-images"

    @property
    def name(self) -> str:
        return "PDF to Images"

    @property
    def supported_inputs(self) -> List[str]:
        return ["pdf"]

    @property
    def output_extension(self) -> str:
        return "zip"

    @property
    def output_mime_type(self) -> str:
        return "application/zip"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        doc = fitz.open(input_paths[0])

        if doc.page_count < 1:
            doc.close()
            raise FileValidationError("PDF document contains no pages.")

        dpi = int(options.get("dpi", 150))
        img_fmt = options.get("format", "png").lower()  # png or jpg
        matrix = fitz.Matrix(dpi / 72.0, dpi / 72.0)

        # If single page, output direct image; if multi-page, create ZIP package
        if doc.page_count == 1:
            page = doc[0]
            pix = page.get_pixmap(matrix=matrix)
            ext = "png" if img_fmt == "png" else "jpg"
            out_filename = f"page_1_{uuid.uuid4().hex[:8]}.{ext}"
            out_path = os.path.join(output_dir, out_filename)
            pix.save(out_path)
            doc.close()
            self.validate_output(out_path)
            mime = "image/png" if ext == "png" else "image/jpeg"
            return ConversionResult(
                output_path=out_path,
                output_filename=out_filename,
                mime_type=mime,
                size_bytes=os.path.getsize(out_path),
                metadata={"page_count": 1}
            )
        else:
            out_filename = f"pdf_images_{uuid.uuid4().hex[:8]}.zip"
            out_path = os.path.join(output_dir, out_filename)

            with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
                for i in range(doc.page_count):
                    page = doc[i]
                    pix = page.get_pixmap(matrix=matrix)
                    ext = "png" if img_fmt == "png" else "jpg"
                    img_data = pix.tobytes(ext)
                    z.writestr(f"page_{i + 1:03d}.{ext}", img_data)

            total_pages = doc.page_count
            doc.close()
            self.validate_output(out_path)
            return ConversionResult(
                output_path=out_path,
                output_filename=out_filename,
                mime_type="application/zip",
                size_bytes=os.path.getsize(out_path),
                metadata={"page_count": total_pages}
            )


# 6. Images to PDF
class ImagesToPdfConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "images-to-pdf"

    @property
    def name(self) -> str:
        return "Images to PDF"

    @property
    def supported_inputs(self) -> List[str]:
        return ["jpg", "jpeg", "png", "webp"]

    @property
    def output_extension(self) -> str:
        return "pdf"

    @property
    def output_mime_type(self) -> str:
        return "application/pdf"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)

        doc = fitz.open()
        for path in input_paths:
            img = open_and_validate_image(path)
            width, height = img.size
            img.close()

            # Create PDF page with image dimensions (72 DPI points)
            rect = fitz.Rect(0, 0, width, height)
            page = doc.new_page(width=width, height=height)
            page.insert_image(rect, filename=path)

        out_filename = f"converted_{uuid.uuid4().hex[:8]}.pdf"
        out_path = os.path.join(output_dir, out_filename)
        doc.save(out_path, garbage=3, deflate=True)
        total_pages = doc.page_count
        doc.close()

        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=self.output_mime_type,
            size_bytes=os.path.getsize(out_path),
            metadata={"page_count": total_pages}
        )


# 7. Resize Image
class ImageResizeConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "image-resize"

    @property
    def name(self) -> str:
        return "Resize Image"

    @property
    def supported_inputs(self) -> List[str]:
        return ["jpg", "jpeg", "png", "webp"]

    @property
    def output_extension(self) -> str:
        return "png"

    @property
    def output_mime_type(self) -> str:
        return "image/png"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        img = open_and_validate_image(input_paths[0])
        orig_w, orig_h = img.size

        target_w = options.get("width")
        target_h = options.get("height")
        keep_ratio = bool(options.get("keep_ratio", True))

        if not target_w and not target_h:
            target_w = orig_w // 2
            target_h = orig_h // 2
        elif target_w and not target_h:
            target_w = int(target_w)
            target_h = int(orig_h * (target_w / orig_w)) if keep_ratio else orig_h
        elif target_h and not target_w:
            target_h = int(target_h)
            target_w = int(orig_w * (target_h / orig_h)) if keep_ratio else orig_w
        else:
            target_w = int(target_w)
            target_h = int(target_h)
            if keep_ratio:
                ratio = min(target_w / orig_w, target_h / orig_h)
                target_w = int(orig_w * ratio)
                target_h = int(orig_h * ratio)

        resized = img.resize((max(1, target_w), max(1, target_h)), resample=Image.Resampling.LANCZOS)

        ext = input_paths[0].split(".")[-1].lower()
        if ext in ["jpg", "jpeg"]:
            fmt = "JPEG"
            mime = "image/jpeg"
            save_img = flatten_alpha_to_rgb(resized)
        elif ext == "webp":
            fmt = "WEBP"
            mime = "image/webp"
            save_img = resized
        else:
            fmt = "PNG"
            mime = "image/png"
            save_img = resized

        out_filename = f"resized_{uuid.uuid4().hex[:8]}.{ext}"
        out_path = os.path.join(output_dir, out_filename)
        save_img.save(out_path, format=fmt)
        img.close()
        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=mime,
            size_bytes=os.path.getsize(out_path),
            metadata={"new_width": target_w, "new_height": target_h}
        )


# 8. Compress Image
class ImageCompressConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "image-compress"

    @property
    def name(self) -> str:
        return "Compress Image"

    @property
    def supported_inputs(self) -> List[str]:
        return ["jpg", "jpeg", "png", "webp"]

    @property
    def output_extension(self) -> str:
        return "jpg"

    @property
    def output_mime_type(self) -> str:
        return "image/jpeg"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        src_path = input_paths[0]
        src_size = os.path.getsize(src_path)
        img = open_and_validate_image(src_path)

        level = options.get("level", "recommended")
        quality = 80 if level == "recommended" else (60 if level == "extreme" else 90)

        ext = src_path.split(".")[-1].lower()
        out_filename = f"compressed_{uuid.uuid4().hex[:8]}.{ext}"
        out_path = os.path.join(output_dir, out_filename)

        if ext in ["jpg", "jpeg"]:
            save_img = flatten_alpha_to_rgb(img)
            save_img.save(out_path, format="JPEG", quality=quality, optimize=True)
            mime = "image/jpeg"
        elif ext == "webp":
            img.save(out_path, format="WEBP", quality=quality, method=6)
            mime = "image/webp"
        else:
            # PNG compression
            img.save(out_path, format="PNG", optimize=True)
            mime = "image/png"

        img.close()
        self.validate_output(out_path)
        out_size = os.path.getsize(out_path)
        savings_ratio = round(max(0, src_size - out_size) / src_size * 100, 1) if src_size > 0 else 0.0

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=mime,
            size_bytes=out_size,
            metadata={
                "original_size_bytes": src_size,
                "compressed_size_bytes": out_size,
                "savings_ratio_percent": savings_ratio
            }
        )


# 9. Crop Image
class ImageCropConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "image-crop"

    @property
    def name(self) -> str:
        return "Crop Image"

    @property
    def supported_inputs(self) -> List[str]:
        return ["jpg", "jpeg", "png", "webp"]

    @property
    def output_extension(self) -> str:
        return "png"

    @property
    def output_mime_type(self) -> str:
        return "image/png"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        img = open_and_validate_image(input_paths[0])
        w, h = img.size

        # Default: centered 80% crop if box not given
        x = int(options.get("x", w * 0.1))
        y = int(options.get("y", h * 0.1))
        box_w = int(options.get("width", w * 0.8))
        box_h = int(options.get("height", h * 0.8))

        # Clamp bounds
        left = max(0, x)
        top = max(0, y)
        right = min(w, left + box_w)
        bottom = min(h, top + box_h)

        if right <= left or bottom <= top:
            img.close()
            raise FileValidationError("Invalid crop boundaries specified.")

        cropped = img.crop((left, top, right, bottom))
        ext = input_paths[0].split(".")[-1].lower()
        out_filename = f"cropped_{uuid.uuid4().hex[:8]}.{ext}"
        out_path = os.path.join(output_dir, out_filename)

        if ext in ["jpg", "jpeg"]:
            save_img = flatten_alpha_to_rgb(cropped)
            save_img.save(out_path, format="JPEG", quality=95)
            mime = "image/jpeg"
        else:
            cropped.save(out_path)
            mime = "image/png"

        img.close()
        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=mime,
            size_bytes=os.path.getsize(out_path),
            metadata={"width": right - left, "height": bottom - top}
        )


# 10. Rotate Image
class ImageRotateConverter(BaseConverter):
    @property
    def tool_id(self) -> str:
        return "image-rotate"

    @property
    def name(self) -> str:
        return "Rotate Image"

    @property
    def supported_inputs(self) -> List[str]:
        return ["jpg", "jpeg", "png", "webp"]

    @property
    def output_extension(self) -> str:
        return "png"

    @property
    def output_mime_type(self) -> str:
        return "image/png"

    async def convert(self, input_paths: List[str], output_dir: str, options: Dict[str, Any]) -> ConversionResult:
        self.validate_inputs(input_paths, options)
        img = open_and_validate_image(input_paths[0])

        angle = int(options.get("angle", 90))
        flip = options.get("flip")  # "horizontal", "vertical"

        # PIL rotates counter-clockwise by default, negative rotates clockwise
        rotated = img.rotate(-angle, expand=True, resample=Image.Resampling.BICUBIC)

        if flip == "horizontal":
            rotated = ImageOps.mirror(rotated)
        elif flip == "vertical":
            rotated = ImageOps.flip(rotated)

        ext = input_paths[0].split(".")[-1].lower()
        out_filename = f"rotated_{uuid.uuid4().hex[:8]}.{ext}"
        out_path = os.path.join(output_dir, out_filename)

        if ext in ["jpg", "jpeg"]:
            save_img = flatten_alpha_to_rgb(rotated)
            save_img.save(out_path, format="JPEG", quality=95)
            mime = "image/jpeg"
        else:
            rotated.save(out_path)
            mime = "image/png"

        img.close()
        self.validate_output(out_path)

        return ConversionResult(
            output_path=out_path,
            output_filename=out_filename,
            mime_type=mime,
            size_bytes=os.path.getsize(out_path),
            metadata={"angle": angle}
        )
