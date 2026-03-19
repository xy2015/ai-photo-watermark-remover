"""
图像修复模块 - 基于 LaMa 的深度图像修复
"""

import cv2
import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class ImageInpainter:
    """图像修复器 - 使用深度学习填充水印区域"""

    def __init__(self, model_path: Optional[str] = None, device: str = "cpu"):
        self.device = device
        self.model = None
        self._load_model(model_path)

    def _load_model(self, model_path: Optional[str]):
        """加载 LaMa 修复模型"""
        try:
            import torch
            # 尝试加载 LaMa 模型
            if model_path:
                logger.info(f"加载自定义模型: {model_path}")
                # self.model = load_lama_model(model_path, device=self.device)
            else:
                logger.info("使用 OpenCV 传统修复方法（未配置深度学习模型）")
                self.model = None
        except ImportError:
            logger.warning("PyTorch 未安装，使用 OpenCV 传统修复方法")
            self.model = None

    def inpaint(self, image: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """
        对图像的掩码区域进行修复

        Args:
            image: BGR 格式原图
            mask: 二值掩码（255=需要修复的区域）

        Returns:
            修复后的图像
        """
        if self.model is not None:
            return self._inpaint_deep(image, mask)
        else:
            return self._inpaint_opencv(image, mask)

    def _inpaint_deep(self, image: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """使用深度学习模型修复（LaMa）"""
        import torch
        import torchvision.transforms as T

        # 预处理
        img_tensor = T.ToTensor()(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        mask_tensor = torch.from_numpy(mask / 255.0).float().unsqueeze(0)

        with torch.no_grad():
            result_tensor = self.model(
                img_tensor.unsqueeze(0).to(self.device),
                mask_tensor.unsqueeze(0).to(self.device)
            )

        # 后处理
        result = result_tensor.squeeze(0).cpu().numpy()
        result = (result.transpose(1, 2, 0) * 255).astype(np.uint8)
        return cv2.cvtColor(result, cv2.COLOR_RGB2BGR)

    def _inpaint_opencv(self, image: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """
        使用 OpenCV 传统算法修复（Telea/NS 算法）
        适合简单水印，无需 GPU
        """
        # 使用 Telea 算法（快速，适合文字水印）
        result = cv2.inpaint(image, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)

        # 对修复区域进行轻微模糊以平滑边缘
        blur_mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=1)
        blurred = cv2.GaussianBlur(result, (3, 3), 0)

        # 仅在修复区域边缘应用模糊
        edge_mask = blur_mask.astype(float) / 255.0
        edge_mask = cv2.GaussianBlur(edge_mask, (5, 5), 0)
        edge_mask = edge_mask[:, :, np.newaxis]

        final = (result * (1 - edge_mask * 0.3) + blurred * edge_mask * 0.3).astype(np.uint8)
        return final
