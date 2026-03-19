# 🖼️ AI 智能清理照片水印

> 基于深度学习的图片水印自动检测与去除工具，支持文字水印、图片水印、半透明水印等多种类型。

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/xy2015/ai-photo-watermark-remover)](https://github.com/xy2015/ai-photo-watermark-remover)

## ✨ 功能特性

- 🔍 **智能检测** — 自动识别图片中的水印区域（文字/图标/半透明）
- 🧹 **深度修复** — 基于 LaMa（Large Mask inpainting）模型进行无痕修复
- 🚀 **批量处理** — 支持文件夹批量去水印，效率提升 10x
- 🎯 **精准定位** — 支持手动框选水印区域，精度更高
- 🌐 **Web 界面** — 内置 Gradio Web UI，无需命令行即可使用
- 📦 **开箱即用** — 提供预训练模型，无需自行训练

## 🖥️ 效果预览

```
原图 (含水印)          →          处理后 (水印已去除)
┌─────────────────┐              ┌─────────────────┐
│  🌅 美丽风景    │              │  🌅 美丽风景    │
│  © 版权水印     │    AI处理    │                 │
│  watermark.com  │   ────────►  │                 │
└─────────────────┘              └─────────────────┘
```

## 🚀 快速开始

### 安装依赖

```bash
git clone https://github.com/xy2015/ai-photo-watermark-remover.git
cd ai-photo-watermark-remover
pip install -r requirements.txt
```

### 命令行使用

```bash
# 处理单张图片
python src/remove_watermark.py --input photo.jpg --output result.jpg

# 批量处理文件夹
python src/remove_watermark.py --input ./photos/ --output ./results/ --batch

# 指定水印区域（x,y,w,h）
python src/remove_watermark.py --input photo.jpg --region 10,10,200,50
```

### Web 界面

```bash
python src/app.py
# 打开浏览器访问 http://localhost:7860
```

### Python API

```python
from src.watermark_remover import WatermarkRemover

remover = WatermarkRemover()

# 自动检测并去除水印
result = remover.remove("input.jpg", "output.jpg")

# 批量处理
remover.batch_remove("./input_folder/", "./output_folder/")
```

## 🏗️ 项目结构

```
ai-photo-watermark-remover/
├── src/
│   ├── watermark_remover.py    # 核心去水印逻辑
│   ├── detector.py             # 水印检测模块
│   ├── inpainter.py            # 图像修复模块
│   ├── app.py                  # Gradio Web UI
│   └── utils.py                # 工具函数
├── models/
│   └── README.md               # 模型下载说明
├── tests/
│   └── test_remover.py         # 单元测试
├── docs/
│   └── API.md                  # API 文档
├── examples/
│   └── demo.py                 # 示例代码
├── requirements.txt
└── README.md
```

## 🧠 技术原理

1. **水印检测** — 使用 YOLOv8 目标检测模型定位水印区域
2. **掩码生成** — 将检测区域转换为二值掩码
3. **图像修复** — 使用 LaMa 模型对掩码区域进行深度修复
4. **后处理** — 色彩校正与边缘平滑，确保自然过渡

## 📋 支持的水印类型

| 类型 | 支持 | 说明 |
|------|------|------|
| 文字水印 | ✅ | 版权文字、网址等 |
| 图标水印 | ✅ | Logo、图章等 |
| 半透明水印 | ✅ | 叠加在图片上的半透明内容 |
| 全图水印 | ⚠️ | 部分支持，效果因图而异 |
| 暗水印 | ❌ | 隐写术水印暂不支持 |

## ⚙️ 系统要求

- Python 3.8+
- CUDA 11.0+（GPU 加速，可选）
- 内存 ≥ 4GB（推荐 8GB+）

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源，仅供学习研究使用。

> ⚠️ **免责声明**：请勿将本工具用于侵犯他人版权的行为。使用者需自行承担法律责任。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

⭐ 如果这个项目对你有帮助，请给个 Star！

## 🎯 Roadmap
- [ ] 支持视频水印去除
- [ ] 训练专用水印检测模型
