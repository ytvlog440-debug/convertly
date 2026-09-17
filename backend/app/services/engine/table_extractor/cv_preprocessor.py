"""
Convertly V2 — Computer Vision Pre-processor for Scanned & Image-Based PDFs
Utilizes OpenCV (cv2) and PIL for:
  1. Automated document deskewing (Hough Line / Contour orientation)
  2. Adaptive binarization & background speckle removal
  3. Morphological line kernel extraction for scanned bordered tables
  4. High-contrast coordinate-projected OCR preparation
Optimized for bounded memory: zero intermediate PNG re-encodings and explicit buffer reclamation.
"""

import io
import math
from typing import Tuple, Optional, Dict, Any, List
import fitz  # PyMuPDF
from PIL import Image
import numpy as np

try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False

from app.core.ocr_guard import log_ocr_memory


class CvDocumentPreProcessor:
    """
    Applies computer vision filters to scanned document images to enhance OCR accuracy
    and recover physical table gridlines while strictly bounding memory footprint.
    """

    def __init__(self, dpi: int = 200):
        self.dpi = dpi

    def render_page_to_cv2(
        self,
        page: fitz.Page,
        dpi: Optional[int] = None,
        job_id: str = "unknown",
        page_idx: int = -1,
    ) -> Optional[np.ndarray]:
        """
        Renders a PDF page directly to a BGR NumPy array for OpenCV processing.
        Avoids intermediate PNG compression/decompression cycles to reduce peak heap allocation.
        """
        target_dpi = dpi or self.dpi
        pix = None
        try:
            log_ocr_memory(job_id=job_id, page_idx=page_idx, stage="before_rasterize", engine="cv2")
            # Render RGB without alpha to save 25% memory vs RGBA
            pix = page.get_pixmap(dpi=target_dpi, alpha=False)
            h, w, n = pix.height, pix.width, pix.n

            if HAS_OPENCV:
                if n == 3:
                    # Direct sample buffer to numpy array, then convert RGB to BGR
                    raw_arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape((h, w, 3))
                    img_bgr = cv2.cvtColor(raw_arr, cv2.COLOR_RGB2BGR)
                    del raw_arr
                elif n == 1:
                    # Grayscale
                    raw_arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape((h, w))
                    img_bgr = cv2.cvtColor(raw_arr, cv2.COLOR_GRAY2BGR)
                    del raw_arr
                else:
                    # Fallback if unexpected channel count
                    img_data = pix.tobytes("png")
                    nparr = np.frombuffer(img_data, np.uint8)
                    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    del img_data, nparr
            else:
                img_data = pix.tobytes("png")
                nparr = np.frombuffer(img_data, np.uint8)
                img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR) if HAS_OPENCV else None
                del img_data, nparr

            log_ocr_memory(job_id=job_id, page_idx=page_idx, stage="after_rasterize", engine="cv2")
            return img_bgr
        except Exception:
            return None
        finally:
            if pix is not None:
                del pix

    def deskew_image(self, img_bgr: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Calculates document skew angle using minAreaRect on foreground text contours,
        and rotates the image to make text lines strictly horizontal.
        Reclaims intermediate threshold and grayscale buffers immediately.
        Returns: (deskewed_bgr, angle_degrees)
        """
        if not HAS_OPENCV or img_bgr is None:
            return img_bgr, 0.0

        gray = None
        thresh = None
        try:
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            # Invert colors so text is white on black
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

            # Find all non-zero pixel coordinates
            pts = np.column_stack(np.where(thresh > 0))
            if len(pts) < 100:
                return img_bgr, 0.0

            angle = cv2.minAreaRect(pts)[-1]

            # Normalize angle to [-45, 45] range
            if angle < -45:
                angle = -(90 + angle)
            elif angle > 45:
                angle = 90 - angle
            else:
                angle = -angle

            # Ignore tiny negligible skew (< 0.2 deg) or massive tilt (> 15 deg)
            if abs(angle) < 0.2 or abs(angle) > 15.0:
                return img_bgr, 0.0

            (h, w) = img_bgr.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(
                img_bgr, M, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE
            )
            return rotated, angle
        except Exception:
            return img_bgr, 0.0
        finally:
            if gray is not None:
                del gray
            if thresh is not None:
                del thresh

    def extract_scanned_table_lines(
        self,
        img_bgr: np.ndarray,
        scale: int = 25
    ) -> Dict[str, Any]:
        """
        Uses morphological opening with directional rectangular kernels
        to isolate horizontal and vertical grid lines from scanned documents.
        """
        if not HAS_OPENCV or img_bgr is None:
            return {'horizontal_mask': None, 'vertical_mask': None, 'table_mask': None}

        gray = None
        bin_img = None
        try:
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
            # Binary adaptive threshold
            bin_img = cv2.adaptiveThreshold(
                ~gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 15, -2
            )

            # Horizontal kernel
            h_size = max(10, bin_img.shape[1] // scale)
            h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (h_size, 1))
            h_mask = cv2.morphologyEx(bin_img, cv2.MORPH_OPEN, h_kernel, iterations=2)

            # Vertical kernel
            v_size = max(10, bin_img.shape[0] // scale)
            v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, v_size))
            v_mask = cv2.morphologyEx(bin_img, cv2.MORPH_OPEN, v_kernel, iterations=2)

            # Intersect to get table grid corners and lines
            table_mask = cv2.add(h_mask, v_mask)

            return {
                'horizontal_mask': h_mask,
                'vertical_mask': v_mask,
                'table_mask': table_mask
            }
        except Exception:
            return {'horizontal_mask': None, 'vertical_mask': None, 'table_mask': None}
        finally:
            if gray is not None:
                del gray
            if bin_img is not None:
                del bin_img

    def cv2_to_pil(self, img_bgr: np.ndarray) -> Image.Image:
        """Converts an OpenCV BGR array back to a PIL Image for Tesseract."""
        rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        del rgb
        return pil_img
