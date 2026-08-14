"""核心业务逻辑：水印检测与去除"""

import io
import base64
import numpy as np
import cv2
from PIL import Image


def inpaint(image, mask, radius=3, use_telea=True):
    """OpenCV inpainting 封装

    - TELEA：沿等值线（边缘）快速行进，保结构、锐利，适合照片保真
    - NS：Navier-Stokes 流体法，偏平滑（保留作可选项）
    """
    mask_8u = mask.astype(np.uint8)

    if np.sum(mask_8u > 0) == 0:
        return image

    flag = cv2.INPAINT_TELEA if use_telea else cv2.INPAINT_NS
    return cv2.inpaint(image, mask_8u, radius, flag)


def refine_mask(mask, dilate=2, open_iter=1):
    """精炼修复掩码，提升保真度

    - 膨胀：覆盖被画笔边缘遗漏的抗锯齿/半透明水印残留，避免"鬼影"
    - 开运算：去除孤立噪点，避免无谓地改动干净像素
    """
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    if dilate > 0:
        mask = cv2.dilate(mask, kernel, iterations=dilate)
    if open_iter > 0:
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=open_iter)
    return mask


def feather_blend(original, result, mask, feather=2):
    """在掩码边界做羽化过渡，消除修复区与原始图之间的硬接缝

    mask 经过膨胀后，边界环内 result 与原图相近，按高斯权重混合即可无缝衔接。
    """
    mask_f = mask.astype(np.float32) / 255.0
    if feather > 0:
        mask_f = cv2.GaussianBlur(mask_f, (0, 0), feather)
    mask_f = np.clip(mask_f, 0, 1)
    m = mask_f[..., None]
    return (original.astype(np.float32) * (1 - m) + result.astype(np.float32) * m).astype(np.uint8)


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

    mask = refine_mask(mask, dilate=2)
    result = inpaint(image, mask, radius=3, use_telea=True)
    result = feather_blend(image, result, mask, feather=2)
    return result, regions


def remove_background(image, mode='keep', edge_feather=2):
    """一键去背景：grabCut 自动分割 + 边缘羽化

    - 四边像素作为"确定背景"引导 grabCut，无需人工框选即可分离主体
    - 前景掩码闭运算填补内部小洞、开运算去除孤立噪点
    - alpha 高斯羽化得到平滑抠图边缘

    mode='keep'  : 保留主体，背景变透明，输出 BGRA（PNG 含 alpha）
    mode='remove': 删除主体，用周围背景内容修复，输出 BGR 不透明图
    edge_feather : alpha 边缘羽化半径（越大边缘越柔和）
    """
    h, w = image.shape[:2]
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)

    # 初始化：内部全部为"可能前景"，四边为"确定背景"
    mask = np.full((h, w), cv2.GC_PR_FGD, np.uint8)
    border = max(2, int(min(h, w) * 0.02))
    mask[:border, :] = cv2.GC_BGD
    mask[-border:, :] = cv2.GC_BGD
    mask[:, :border] = cv2.GC_BGD
    mask[:, -border:] = cv2.GC_BGD

    try:
        cv2.grabCut(image, mask, None, bgd, fgd, 5, cv2.GC_INIT_WITH_MASK)
    except Exception:
        # grabCut 失败（极端尺寸）时退化为"全部保留"
        mask = np.full((h, w), cv2.GC_PR_FGD, np.uint8)

    fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

    # 闭运算填洞 + 开运算去噪
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k, iterations=2)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, k, iterations=1)

    # 边缘羽化（高斯模糊 alpha）
    if edge_feather > 0:
        fg = cv2.GaussianBlur(fg, (0, 0), edge_feather)
    fg = np.clip(fg, 0, 255).astype(np.uint8)

    b, g, r = cv2.split(image)
    rgba = cv2.merge([b, g, r, fg])

    if mode == 'remove':
        # 删除主体：把主体区域（非前景）当作待修复洞，用 TELEA 补回背景内容
        hole = cv2.bitwise_not(fg)
        result = inpaint(image, hole, radius=3, use_telea=True)
        result = feather_blend(image, result, hole, feather=edge_feather)
        return result

    return rgba


def remove_watermark_manual(image, mask_base64):
    """手动去水印：根据用户提供的 mask 去除水印

    保真优化：
    - 掩码膨胀 + 开运算，覆盖抗锯齿/半透明水印边缘，避免残留鬼影
    - 使用 TELEA 修复（沿边缘推进，保结构、锐利）而非 NS（偏糊）
    - 边界羽化混合，消除修复区硬接缝
    """
    mask_data = base64.b64decode(mask_base64.split(',')[1] if ',' in mask_base64 else mask_base64)
    mask_pil = Image.open(io.BytesIO(mask_data)).convert('L')
    mask_pil = mask_pil.resize((image.shape[1], image.shape[0]), Image.BILINEAR)
    mask = np.array(mask_pil)

    _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)

    if np.sum(mask > 0) == 0:
        return image

    mask = refine_mask(mask, dilate=2)
    result = inpaint(image, mask, radius=3, use_telea=True)
    result = feather_blend(image, result, mask, feather=2)
    return result
