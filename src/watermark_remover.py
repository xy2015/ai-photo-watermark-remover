"""
AI 智能水印去除核心模块
支持自动检测和手动指定水印区域
"""

import os
import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Tuple, List, Union
import logging

logger = logging.getLogger(__name__)


class WatermarkRemover:
    """AI 智能水印去除器"""

    def __init__(self, model_path: Optional[str] = None, device: str = "auto"):
        """
        初始化水印去除器

        Args:
            model_path: 模型路径，None 则自动下载
            device: 运行设备 ('cpu', 'cuda', 'auto')
        """
        self.device = self._resolve_device(device)
        self.detector = WatermarkDetector(device=self.device)
        self.inpainter = ImageInpainter(model_path=model_path, device=self.device)
        logger.info(f"WatermarkRemover 初始化完成，设备: {self.device}")

    def _resolve_device(self, device: str) -> str:
        if device == "auto":
            try:
                import torch
                return "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                return "cpu"
        return device

    def remove(
        self,
        input_path: str,
        output_path: str,
        region: Optional[Tuple[int, int, int, int]] = None,
        auto_detect: bool = True,
    ) -> bool:
        """
        去除单张图片的水印

        Args:
            input_path: 输入图片路径
            output_path: 输出图片路径
            region: 手动指定水印区域 (x, y, w, h)，None 则自动检测
            auto_detect: 是否启用自动检测

        Returns:
            bool: 处理是否成功
        """
        try:
            image = cv2.imread(input_path)
            if image is None:
                raise ValueError(f"无法读取图片: {input_path}")

            logger.info(f"处理图片: {input_path}")

            if region is not None:
                # 使用手动指定区域
                mask = self._create_mask(image.shape, [region])
            elif auto_detect:
                # 自动检测水印区域
                regions = self.detector.detect(image)
                if not regions:
                    logger.warning("未检测到水印区域，保存原图")
                    cv2.imwrite(output_path, image)
                    return True
                mask = self._create_mask(image.shape, regions)
                logger.info(f"检测到 {len(regions)} 个水印区域")
            else:
                raise ValueError("未指定水印区域且未启用自动检测")

            # 执行图像修复
            result = self.inpainter.inpaint(image, mask)

            # 保存结果
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            cv2.imwrite(output_path, result)
            logger.info(f"处理完成，已保存至: {output_path}")
            return True

        except Exception as e:
            logger.error(f"处理失败: {e}")
            return False

    def batch_remove(
        self,
        input_dir: str,
        output_dir: str,
        extensions: List[str] = None,
        auto_detect: bool = True,
    ) -> dict:
        """
        批量去除文件夹中所有图片的水印

        Args:
            input_dir: 输入文件夹路径
            output_dir: 输出文件夹路径
            extensions: 支持的图片格式，默认 ['.jpg', '.jpeg', '.png', '.webp']
            auto_detect: 是否启用自动检测

        Returns:
            dict: 处理结果统计 {'success': int, 'failed': int, 'files': list}
        """
        if extensions is None:
            extensions = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]

        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        results = {"success": 0, "failed": 0, "files": []}

        image_files = [
            f for f in input_path.rglob("*") if f.suffix.lower() in extensions
        ]

        logger.info(f"共找到 {len(image_files)} 张图片，开始批量处理...")

        for i, img_file in enumerate(image_files, 1):
            rel_path = img_file.relative_to(input_path)
            out_file = output_path / rel_path
            out_file.parent.mkdir(parents=True, exist_ok=True)

            logger.info(f"[{i}/{len(image_files)}] 处理: {img_file.name}")
            success = self.remove(str(img_file), str(out_file), auto_detect=auto_detect)

            if success:
                results["success"] += 1
                results["files"].append({"file": str(rel_path), "status": "success"})
            else:
                results["failed"] += 1
                results["files"].append({"file": str(rel_path), "status": "failed"})

        logger.info(
            f"批量处理完成: 成功 {results['success']} 张，失败 {results['failed']} 张"
        )
        return results

    def _create_mask(
        self, shape: tuple, regions: List[Tuple[int, int, int, int]]
    ) -> np.ndarray:
        """根据区域列表创建二值掩码"""
        mask = np.zeros(shape[:2], dtype=np.uint8)
        for x, y, w, h in regions:
            # 稍微扩大区域以确保完整覆盖
            padding = 5
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(shape[1], x + w + padding)
            y2 = min(shape[0], y + h + padding)
            mask[y1:y2, x1:x2] = 255
        return mask
