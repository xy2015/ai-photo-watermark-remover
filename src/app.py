"""
Gradio Web UI - AI 水印去除工具
运行: python src/app.py
访问: http://localhost:7860
"""

import gradio as gr
import cv2
import numpy as np
import tempfile
import os
from watermark_remover import WatermarkRemover


remover = WatermarkRemover()


def process_image(
    input_image,
    auto_detect: bool,
    region_x: int,
    region_y: int,
    region_w: int,
    region_h: int,
):
    """处理单张图片"""
    if input_image is None:
        return None, "请上传图片"

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
        cv2.imwrite(tmp_in.name, cv2.cvtColor(input_image, cv2.COLOR_RGB2BGR))
        input_path = tmp_in.name

    output_path = input_path.replace(".png", "_result.png")

    region = None
    if not auto_detect and region_w > 0 and region_h > 0:
        region = (region_x, region_y, region_w, region_h)

    success = remover.remove(
        input_path, output_path, region=region, auto_detect=auto_detect
    )

    if success and os.path.exists(output_path):
        result = cv2.imread(output_path)
        result_rgb = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
        os.unlink(input_path)
        os.unlink(output_path)
        return result_rgb, "✅ 水印去除成功！"
    else:
        return None, "❌ 处理失败，请检查图片格式"


# 构建 Gradio 界面
with gr.Blocks(title="AI 智能水印去除", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # 🖼️ AI 智能清理照片水印
    > 基于深度学习的图片水印自动检测与去除工具
    """)

    with gr.Row():
        with gr.Column():
            input_img = gr.Image(label="上传图片", type="numpy")
            auto_detect = gr.Checkbox(label="自动检测水印区域", value=True)

            with gr.Group(visible=False) as manual_region:
                gr.Markdown("**手动指定水印区域**")
                with gr.Row():
                    rx = gr.Number(label="X 坐标", value=0)
                    ry = gr.Number(label="Y 坐标", value=0)
                with gr.Row():
                    rw = gr.Number(label="宽度", value=0)
                    rh = gr.Number(label="高度", value=0)

            auto_detect.change(
                lambda x: gr.update(visible=not x),
                inputs=auto_detect,
                outputs=manual_region,
            )

            process_btn = gr.Button("🚀 开始去除水印", variant="primary")

        with gr.Column():
            output_img = gr.Image(label="处理结果", type="numpy")
            status_text = gr.Textbox(label="状态", interactive=False)

    process_btn.click(
        fn=process_image,
        inputs=[input_img, auto_detect, rx, ry, rw, rh],
        outputs=[output_img, status_text],
    )

    gr.Examples(
        examples=[],
        inputs=input_img,
        label="示例图片",
    )

    gr.Markdown("""
    ---
    💡 **使用提示：**
    - 自动检测模式适合常见位置的水印（角落、底部）
    - 手动模式可精确指定水印坐标，效果更好
    - 支持 JPG、PNG、WebP 等常见格式
    """)


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860, share=False)
