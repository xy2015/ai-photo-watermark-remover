"""
工具函数模块
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)

SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}


def load_image(path: str) -> Optional[np.ndarray]:
    """加载图片，返回 BGR 格式"""
    img = cv2.imread(path)
    if img is None:
        logger.error(f"无法加载图片: {path}")
    return img


def save_image(image: np.ndarray, path: str, quality: int = 95) -> bool:
    """保存图片"""
    try:
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        ext = Path(path).suffix.lower()
        params = []
        if ext in (".jpg", ".jpeg"):
            params = [cv2.IMWRITE_JPEG_QUALITY, quality]
        elif ext == ".png":
            params = [cv2.IMWRITE_PNG_COMPRESSION, max(0, min(9, (100 - quality) // 10))]
        cv2.imwrite(path, image, params)
        return True
    except Exception as e:
        logger.error(f"保存图片失败: {e}")
        return False


def is_supported_format(path: str) -> bool:
    """检查文件格式是否支持"""
    return Path(path).suffix.lower() in SUPPORTED_FORMATS


def resize_if_needed(
    image: np.ndarray, max_size: int = 2048
) -> Tuple[np.ndarray, float]:
    """
    如果图片过大则缩放，返回 (缩放后图片, 缩放比例)
    """
    h, w = image.shape[:2]
    scale = 1.0
    if max(h, w) > max_size:
        scale = max_size / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        logger.info(f"图片已缩放: {w}x{h} → {new_w}x{new_h}")
    return image, scale


def scale_region(
    region: Tuple[int, int, int, int], scale: float
) -> Tuple[int, int, int, int]:
    """按比例缩放区域坐标"""
    x, y, w, h = region
    return (int(x * scale), int(y * scale), int(w * scale), int(h * scale))


def visualize_regions(
    image: np.ndarray,
    regions: list,
    color: Tuple[int, int, int] = (0, 0, 255),
    thickness: int = 2,
) -> np.ndarray:
    """在图片上可视化水印检测区域（用于调试）"""
    vis = image.copy()
    for x, y, w, h in regions:
        cv2.rectangle(vis, (x, y), (x + w, y + h), color, thickness)
        cv2.putText(
            vis, "watermark", (x, y - 5),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1
        )
    return vis
