"""通用工具函数：图片编解码、文件校验"""

import io
import base64
import numpy as np
import cv2
from PIL import Image
from config import ALLOWED_EXTENSIONS, EXT_TO_MAGIC


def image_to_base64(image, format='PNG'):
    """将PIL图片或numpy数组转换为base64字符串"""
    if isinstance(image, np.ndarray):
        if len(image.shape) == 3 and image.shape[2] == 4:
            # BGRA（OpenCV）→ RGBA（Pillow），保留 alpha 通道
            b, g, r, a = cv2.split(image)
            image = cv2.merge([r, g, b, a])
            image = Image.fromarray(image)
        elif len(image.shape) == 3 and image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(image)
        else:
            image = Image.fromarray(image)

    buffered = io.BytesIO()
    image.save(buffered, format=format)
    return base64.b64encode(buffered.getvalue()).decode('utf-8')


def base64_to_image(base64_string):
    """将base64字符串转换为numpy数组(OpenCV格式)"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    image_data = base64.b64decode(base64_string)

    pil_image = Image.open(io.BytesIO(image_data))
    if pil_image.mode == 'RGBA':
        pil_image = pil_image.convert('RGB')

    np_image = np.array(pil_image)
    return cv2.cvtColor(np_image, cv2.COLOR_RGB2BGR)


def get_image_format(file_bytes):
    """通过 Magic Bytes 检测图片真实格式，返回 'png'|'jpeg'|'webp'|None"""
    if file_bytes[:8] == b'\x89PNG\r\n\x1a\n':
        return 'png'
    if file_bytes[:3] == b'\xff\xd8\xff':
        return 'jpeg'
    if file_bytes[:4] == b'RIFF' and file_bytes[8:12] == b'WEBP':
        return 'webp'
    return None


def allowed_file(filename, file_bytes=None):
    """检查文件扩展名和 Magic Bytes 是否匹配"""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False
    if file_bytes is not None:
        real_fmt = get_image_format(file_bytes)
        expected_fmt = EXT_TO_MAGIC.get(ext)
        return real_fmt == expected_fmt
    return True
