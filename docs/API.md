# API 文档

## WatermarkRemover 类

### 初始化

```python
from src.watermark_remover import WatermarkRemover

remover = WatermarkRemover(
    model_path=None,    # 模型路径（可选）
    device="auto"       # 设备: "cpu", "cuda", "auto"
)
```

### 方法

#### remove()

去除单张图片的水印。

```python
success = remover.remove(
    input_path="input.jpg",     # 输入图片路径
    output_path="output.jpg",   # 输出图片路径
    region=None,                # 手动指定区域 (x, y, w, h)
    auto_detect=True            # 是否启用自动检测
)
```

**参数：**
- `input_path` (str): 输入图片路径
- `output_path` (str): 输出图片路径
- `region` (tuple, optional): 手动指定水印区域 (x, y, width, height)
- `auto_detect` (bool): 是否自动检测水印区域

**返回：**
- `bool`: 处理是否成功

#### batch_remove()

批量处理文件夹中的所有图片。

```python
results = remover.batch_remove(
    input_dir="./input/",
    output_dir="./output/",
    extensions=[".jpg", ".png"],
    auto_detect=True
)
```

**参数：**
- `input_dir` (str): 输入文件夹路径
- `output_dir` (str): 输出文件夹路径
- `extensions` (list): 支持的图片格式列表
- `auto_detect` (bool): 是否自动检测水印

**返回：**
```python
{
    "success": 10,      # 成功处理的图片数
    "failed": 0,        # 失败的图片数
    "files": [          # 详细结果列表
        {"file": "photo1.jpg", "status": "success"},
        {"file": "photo2.jpg", "status": "failed"}
    ]
}
```

## 命令行工具

### 基本用法

```bash
# 单张图片（自动检测）
python src/remove_watermark.py -i input.jpg -o output.jpg

# 批量处理
python src/remove_watermark.py -i ./input/ -o ./output/ --batch

# 手动指定区域
python src/remove_watermark.py -i input.jpg -o output.jpg -r 10,10,200,50

# 显示详细日志
python src/remove_watermark.py -i input.jpg -o output.jpg -v
```

### 参数说明

| 参数 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `--input` | `-i` | 输入路径 | `-i photo.jpg` |
| `--output` | `-o` | 输出路径 | `-o result.jpg` |
| `--batch` | `-b` | 批量模式 | `--batch` |
| `--region` | `-r` | 指定区域 | `-r 10,10,200,50` |
| `--no-auto` | - | 禁用自动检测 | `--no-auto` |
| `--device` | - | 运行设备 | `--device cuda` |
| `--verbose` | `-v` | 详细日志 | `-v` |

## Web UI

启动 Gradio 界面：

```bash
python src/app.py
```

访问：http://localhost:7860

### 界面功能

1. **上传图片** - 支持拖拽或点击上传
2. **自动检测** - 勾选后自动识别水印区域
3. **手动指定** - 输入水印区域坐标
4. **开始处理** - 点击按钮执行去水印
5. **查看结果** - 实时显示处理后的图片
