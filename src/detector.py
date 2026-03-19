"""
水印检测模块 - 基于 YOLOv8 的水印区域自动检测
"""

import cv2
import numpy as np
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class WatermarkDetector:
    """水印区域检测器"""

    def __init__(self, model_path: Optional[str] = None, device: str = "cpu"):
        self.device = device
        self.model = None
        self._load_model(model_path)

    def _load_model(self, model_path: Optional[str]):
        """加载检测模型"""
        try:
            from ultralytics import YOLO
            if model_path and os.path.exists(model_path):
                self.model = YOLO(model_path)
            else:
                # 使用预训练通用模型作为基础
                logger.info("使用启发式检测方法（未找到专用模型）")
                self.model = None
        except ImportError:
            logger.warning("ultralytics 未安装，使用启发式检测方法")
            self.model = None

    def detect(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        检测图片中的水印区域

        Args:
            image: BGR 格式的图片数组

        Returns:
            水印区域列表 [(x, y, w, h), ...]
        """
        if self.model is not None:
            return self._detect_with_model(image)
        else:
            return self._detect_heuristic(image)

    def _detect_with_model(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """使用 YOLO 模型检测"""
        results = self.model(image, verbose=False)
        regions = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                regions.append((x1, y1, x2 - x1, y2 - y1))
        return regions

    def _detect_heuristic(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        启发式水印检测
        策略：检测图片边缘区域的高频文字/图案
        """
        h, w = image.shape[:2]
        regions = []

        # 转为灰度图
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 检测高对比度区域（常见水印特征）
        edges = cv2.Canny(gray, 50, 150)

        # 在常见水印位置（四角、底部）重点检测
        candidate_zones = [
            (0, 0, w // 3, h // 6),                    # 左上角
            (w * 2 // 3, 0, w // 3, h // 6),           # 右上角
            (0, h * 5 // 6, w // 3, h // 6),           # 左下角
            (w * 2 // 3, h * 5 // 6, w // 3, h // 6), # 右下角
            (w // 4, h * 5 // 6, w // 2, h // 6),      # 底部中央
        ]

        for zx, zy, zw, zh in candidate_zones:
            zone_edges = edges[zy:zy+zh, zx:zx+zw]
            edge_density = np.sum(zone_edges > 0) / (zw * zh + 1e-6)

            # 边缘密度超过阈值，认为可能有水印
            if edge_density > 0.05:
                # 进一步精确定位
                contours, _ = cv2.findContours(
                    zone_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
                )
                if contours:
                    all_points = np.vstack(contours)
                    rx, ry, rw, rh = cv2.boundingRect(all_points)
                    # 转换回全图坐标
                    regions.append((zx + rx, zy + ry, rw, rh))

        logger.info(f"启发式检测到 {len(regions)} 个候选水印区域")
        return regions
