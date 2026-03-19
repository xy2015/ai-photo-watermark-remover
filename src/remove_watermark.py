"""
命令行入口 - AI 水印去除工具
"""

import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from watermark_remover import WatermarkRemover


def parse_region(region_str: str):
    """解析区域字符串 'x,y,w,h'"""
    try:
        parts = list(map(int, region_str.split(",")))
        if len(parts) != 4:
            raise ValueError
        return tuple(parts)
    except ValueError:
        raise argparse.ArgumentTypeError("区域格式错误，应为 'x,y,w,h'，例如: 10,10,200,50")


def main():
    parser = argparse.ArgumentParser(
        description="AI 智能清理照片水印",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 处理单张图片（自动检测）
  python remove_watermark.py --input photo.jpg --output result.jpg

  # 批量处理文件夹
  python remove_watermark.py --input ./photos/ --output ./results/ --batch

  # 手动指定水印区域
  python remove_watermark.py --input photo.jpg --region 10,10,200,50
        """,
    )

    parser.add_argument("--input", "-i", required=True, help="输入图片或文件夹路径")
    parser.add_argument("--output", "-o", required=True, help="输出图片或文件夹路径")
    parser.add_argument("--batch", "-b", action="store_true", help="批量处理模式")
    parser.add_argument("--region", "-r", type=parse_region, help="手动指定水印区域 (x,y,w,h)")
    parser.add_argument("--no-auto", action="store_true", help="禁用自动检测")
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"], help="运行设备")
    parser.add_argument("--verbose", "-v", action="store_true", help="显示详细日志")

    args = parser.parse_args()

    # 配置日志
    import logging
    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(level=level, format="%(asctime)s [%(levelname)s] %(message)s")

    # 初始化
    remover = WatermarkRemover(device=args.device)

    if args.batch or os.path.isdir(args.input):
        # 批量处理
        results = remover.batch_remove(
            args.input, args.output, auto_detect=not args.no_auto
        )
        print(f"\n✅ 批量处理完成:")
        print(f"   成功: {results['success']} 张")
        print(f"   失败: {results['failed']} 张")
    else:
        # 单张处理
        success = remover.remove(
            args.input,
            args.output,
            region=args.region,
            auto_detect=not args.no_auto,
        )
        if success:
            print(f"✅ 处理成功: {args.output}")
        else:
            print("❌ 处理失败")
            sys.exit(1)


if __name__ == "__main__":
    main()
