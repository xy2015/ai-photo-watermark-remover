"""
使用示例 - AI 水印去除工具
"""

from src.watermark_remover import WatermarkRemover


def example_single_image():
    """示例1: 处理单张图片"""
    remover = WatermarkRemover()
    
    # 自动检测水印并去除
    remover.remove(
        input_path="input.jpg",
        output_path="output.jpg",
        auto_detect=True
    )
    
    # 手动指定水印区域 (x, y, width, height)
    remover.remove(
        input_path="input.jpg",
        output_path="output_manual.jpg",
        region=(10, 10, 200, 50),
        auto_detect=False
    )


def example_batch_processing():
    """示例2: 批量处理文件夹"""
    remover = WatermarkRemover()
    
    results = remover.batch_remove(
        input_dir="./photos/",
        output_dir="./results/",
        auto_detect=True
    )
    
    print(f"成功: {results['success']} 张")
    print(f"失败: {results['failed']} 张")


def example_with_gpu():
    """示例3: 使用 GPU 加速"""
    remover = WatermarkRemover(device="cuda")
    remover.remove("input.jpg", "output.jpg")


if __name__ == "__main__":
    # 运行示例
    print("运行示例1: 单张图片处理")
    # example_single_image()
    
    print("运行示例2: 批量处理")
    # example_batch_processing()
    
    print("运行示例3: GPU 加速")
    # example_with_gpu()
    
    print("示例代码已就绪，取消注释即可运行")
