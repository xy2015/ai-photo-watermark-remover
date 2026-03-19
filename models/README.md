# 模型下载说明

## 预训练模型

本项目支持以下深度学习模型（可选）：

### 1. LaMa 图像修复模型
- 用途：高质量水印区域修复
- 下载：[saic-mdal/lama](https://github.com/saic-mdal/lama)
- 放置位置：`models/lama/`

### 2. 水印检测模型
- 用途：自动识别水印区域
- 状态：开发中，当前使用启发式检测
- 放置位置：`models/detector/`

## 不使用模型

本项目**开箱即用**，无需下载任何模型：
- 水印检测：使用启发式算法（边缘检测）
- 图像修复：使用 OpenCV 传统算法（Telea/NS）

如需更高质量结果，可安装 PyTorch 并下载 LaMa 模型。

## 模型下载脚本

```bash
# 下载 LaMa 模型
mkdir -p models/lama
wget -P models/lama/ https://github.com/saic-mdal/lama/releases/download/v1.0/big-lama.pt
```
