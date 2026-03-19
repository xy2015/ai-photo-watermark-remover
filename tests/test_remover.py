"""
单元测试 - AI 水印去除工具
"""

import unittest
import numpy as np
import cv2
import tempfile
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


class TestWatermarkRemover(unittest.TestCase):
    """水印去除器测试"""

    def setUp(self):
        """创建测试图片"""
        # 创建一张带有模拟水印的测试图片
        self.test_image = np.ones((300, 400, 3), dtype=np.uint8) * 128
        # 添加模拟水印文字区域
        cv2.putText(
            self.test_image, "WATERMARK",
            (10, 280), cv2.FONT_HERSHEY_SIMPLEX, 1, (200, 200, 200), 2
        )

        # 保存临时文件
        self.tmp_dir = tempfile.mkdtemp()
        self.input_path = os.path.join(self.tmp_dir, "test_input.jpg")
        self.output_path = os.path.join(self.tmp_dir, "test_output.jpg")
        cv2.imwrite(self.input_path, self.test_image)

    def test_remove_with_manual_region(self):
        """测试手动指定区域去水印"""
        from watermark_remover import WatermarkRemover
        remover = WatermarkRemover()
        success = remover.remove(
            self.input_path,
            self.output_path,
            region=(10, 260, 200, 30),
            auto_detect=False,
        )
        self.assertTrue(success)
        self.assertTrue(os.path.exists(self.output_path))

    def test_output_image_valid(self):
        """测试输出图片有效"""
        from watermark_remover import WatermarkRemover
        remover = WatermarkRemover()
        remover.remove(self.input_path, self.output_path, region=(10, 260, 200, 30))
        result = cv2.imread(self.output_path)
        self.assertIsNotNone(result)
        self.assertEqual(result.shape, self.test_image.shape)

    def test_invalid_input(self):
        """测试无效输入处理"""
        from watermark_remover import WatermarkRemover
        remover = WatermarkRemover()
        success = remover.remove(
            "/nonexistent/path.jpg", self.output_path
        )
        self.assertFalse(success)

    def tearDown(self):
        """清理临时文件"""
        import shutil
        shutil.rmtree(self.tmp_dir, ignore_errors=True)


class TestWatermarkDetector(unittest.TestCase):
    """水印检测器测试"""

    def test_detect_returns_list(self):
        """测试检测结果为列表"""
        from detector import WatermarkDetector
        detector = WatermarkDetector()
        image = np.ones((300, 400, 3), dtype=np.uint8) * 128
        result = detector.detect(image)
        self.assertIsInstance(result, list)

    def test_detect_with_watermark(self):
        """测试含水印图片的检测"""
        from detector import WatermarkDetector
        detector = WatermarkDetector()
        image = np.ones((300, 400, 3), dtype=np.uint8) * 128
        # 在右下角添加高对比度水印
        cv2.putText(
            image, "© 2024 watermark.com",
            (250, 290), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1
        )
        result = detector.detect(image)
        self.assertIsInstance(result, list)


class TestUtils(unittest.TestCase):
    """工具函数测试"""

    def test_resize_if_needed(self):
        """测试图片缩放"""
        from utils import resize_if_needed
        large_image = np.ones((3000, 4000, 3), dtype=np.uint8)
        resized, scale = resize_if_needed(large_image, max_size=2048)
        self.assertLessEqual(max(resized.shape[:2]), 2048)
        self.assertLess(scale, 1.0)

    def test_no_resize_needed(self):
        """测试不需要缩放的情况"""
        from utils import resize_if_needed
        small_image = np.ones((300, 400, 3), dtype=np.uint8)
        resized, scale = resize_if_needed(small_image, max_size=2048)
        self.assertEqual(scale, 1.0)
        self.assertEqual(resized.shape, small_image.shape)

    def test_is_supported_format(self):
        """测试格式检查"""
        from utils import is_supported_format
        self.assertTrue(is_supported_format("photo.jpg"))
        self.assertTrue(is_supported_format("photo.PNG"))
        self.assertFalse(is_supported_format("document.pdf"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
