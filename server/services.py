"""核心业务逻辑：水印检测与去除"""

import io
import base64
import numpy as np
import cv2
from PIL import Image


def inpaint(image, mask, radius=3, use_telea=True):
    """OpenCV inpainting 封装，使用保守参数避免污染图片"""
    mask_8u = mask.astype(np.uint8)

    if np.sum(mask_8u > 0) == 0:
        return image

    flag = cv2.INPAINT_TELEA if use_telea else cv2.INPAINT_NS
    return cv2.inpaint(image, mask_8u, radius, flag)


def detect_watermark_regions(image):
    """
    基于 Canny 边缘检测 + 轮廓分析的自动水印检测
    1. 灰度化 + 双边滤波降噪
    2. Canny 边缘检测
    3. 形态学膨胀连接邻近边缘
    4. 查找轮廓并筛选 (面积、长宽比)
    5. 合并邻近区域
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    filtered = cv2.bilateralFilter(gray, 9, 50, 50)
    edges = cv2.Canny(filtered, 30, 100)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(edges, kernel, iterations=2)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    h, w = image.shape[:2]
    total_area = h * w
    regions = []

    for cnt in contours:
        x, y, cw, ch = cv2.boundingRect(cnt)
        area = cw * ch
        if area < total_area * 0.005 or area > total_area * 0.5:
            continue
        if cw > w * 0.9 or ch > h * 0.9:
            continue
        aspect = cw / max(ch, 1)
        if aspect > 8 or aspect < 0.125:
            continue

        regions.append({
            'x': int(x),
            'y': int(y),
            'width': int(cw),
            'height': int(ch),
            'confidence': round(min(area / (total_area * 0.05), 1.0) * 100, 1)
        })

    if regions:
        regions = sorted(regions, key=lambda r: -r['confidence'])
        merged = [regions[0]]
        for r in regions[1:]:
            r2 = merged[-1]
            overlap_x = max(0, min(r['x'] + r['width'], r2['x'] + r2['width']) - max(r['x'], r2['x']))
            overlap_y = max(0, min(r['y'] + r['height'], r2['y'] + r2['height']) - max(r['y'], r2['y']))
            overlap_area = overlap_x * overlap_y
            if overlap_area > 0:
                continue
            merged.append(r)
        regions = merged

    return regions


REGION_CONFIGS = {
    'top-left': {
        'x_ratio': 0.05, 'y_ratio': 0.05,
        'w_ratio': 0.25, 'h_ratio': 0.15
    },
    'top-right': {
        'x_ratio': 0.70, 'y_ratio': 0.05,
        'w_ratio': 0.25, 'h_ratio': 0.15
    },
    'bottom-left': {
        'x_ratio': 0.05, 'y_ratio': 0.80,
        'w_ratio': 0.25, 'h_ratio': 0.15
    },
    'bottom-right': {
        'x_ratio': 0.65, 'y_ratio': 0.75,
        'w_ratio': 0.30, 'h_ratio': 0.20
    },
}


def remove_watermark_auto(image, region_type='bottom-right'):
    """自动去水印：根据预设区域位置进行处理"""
    h, w = image.shape[:2]
    regions = []

    cfg = REGION_CONFIGS.get(region_type)
    if cfg:
        regions.append({
            'x': int(w * cfg['x_ratio']),
            'y': int(h * cfg['y_ratio']),
            'width': int(w * cfg['w_ratio']),
            'height': int(h * cfg['h_ratio'])
        })

    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    for region in regions:
        x, y, rw, rh = region['x'], region['y'], region['width'], region['height']
        cv2.rectangle(mask, (x, y), (x + rw, y + rh), 255, -1)

    result = inpaint(image, mask, radius=4, use_telea=True)
    return result, regions


def remove_watermark_manual(image, mask_base64):
    """手动去水印：根据用户提供的 mask 去除水印"""
    mask_data = base64.b64decode(mask_base64.split(',')[1] if ',' in mask_base64 else mask_base64)
    mask_pil = Image.open(io.BytesIO(mask_data)).convert('L')
    mask_pil = mask_pil.resize((image.shape[1], image.shape[0]))
    mask = np.array(mask_pil)

    _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)

    if np.sum(mask > 0) == 0:
        return image

    return inpaint(image, mask, radius=5, use_telea=False)
