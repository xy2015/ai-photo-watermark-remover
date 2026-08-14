"""
AI 去水印工具 - 后端API服务
Flask 应用入口：路由注册 + 启动配置
"""

import os
import uuid
from datetime import datetime

import numpy as np
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS

from config import UPLOAD_FOLDER, PROCESSED_FOLDER
from config import HOST, PORT, DEBUG
from utils import allowed_file, base64_to_image, image_to_base64
from services import detect_watermark_regions, remove_watermark_manual, remove_background


def create_app(static_folder=None):
    # 静态文件目录优先级: 参数 > 环境变量 > 自动检测
    if static_folder is None:
        static_folder = os.environ.get('STATIC_FOLDER')
    if static_folder is None:
        _static = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'web')
        if os.path.isdir(_static):
            static_folder = _static

    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    CORS(app)

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(PROCESSED_FOLDER, exist_ok=True)

    # ── 前端页面路由（Docker 单容器部署用）──────────────

    @app.route('/')
    def index():
        from flask import send_from_directory
        if app.static_folder:
            return send_from_directory(app.static_folder, 'index.html')
        return jsonify({'error': '前端未配置'}), 404

    # ── API 路由 ──────────────────────────────────────

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'ok',
            'message': 'AI去水印服务运行正常',
            'timestamp': datetime.now().isoformat(),
            'opencv_version': cv2.__version__
        })

    @app.route('/api/upload', methods=['POST'])
    def upload_image():
        if 'file' not in request.files:
            return jsonify({'error': '没有上传文件'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400

        file_bytes = file.read()
        if not allowed_file(file.filename, file_bytes):
            return jsonify({'error': '不支持的文件格式或文件头校验失败'}), 400

        try:
            nparr = np.frombuffer(file_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                return jsonify({'error': '无法解析图片'}), 400

            file_id = str(uuid.uuid4())
            filename = f"{file_id}.png"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            cv2.imwrite(filepath, image)

            return jsonify({
                'success': True,
                'file_id': file_id,
                'filename': filename,
                'width': int(image.shape[1]),
                'height': int(image.shape[0]),
                'message': '图片上传成功'
            })
        except Exception as e:
            return jsonify({'error': f'图片处理失败: {str(e)}'}), 500

    @app.route('/api/process/manual', methods=['POST'])
    def process_manual():
        data = request.get_json()
        if not data or 'image' not in data or 'mask' not in data:
            return jsonify({'error': '缺少图片或mask数据'}), 400

        try:
            image = base64_to_image(data['image'])
            result = remove_watermark_manual(image, data['mask'])
            result_base64 = image_to_base64(result)

            return jsonify({
                'success': True,
                'image': f'data:image/png;base64,{result_base64}',
                'message': '水印去除成功'
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'处理失败: {str(e)}'}), 500

    @app.route('/api/detect', methods=['POST'])
    def detect_watermark():
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': '缺少图片数据'}), 400

        try:
            image = base64_to_image(data['image'])
            watermarks = detect_watermark_regions(image)

            for i, wm in enumerate(watermarks, 1):
                wm['id'] = i

            return jsonify({
                'success': True,
                'watermarks': watermarks,
                'count': len(watermarks),
                'message': f'检测到 {len(watermarks)} 处水印区域'
            })
        except Exception as e:
            return jsonify({'error': f'检测失败: {str(e)}'}), 500

    @app.route('/api/process/background', methods=['POST'])
    def process_background():
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': '缺少图片数据'}), 400

        try:
            image = base64_to_image(data['image'])
            mode = data.get('mode', 'keep')
            if mode not in ('keep', 'remove'):
                mode = 'keep'
            edge_feather = int(data.get('edge_feather', 2))
            edge_feather = max(0, min(edge_feather, 8))

            result = remove_background(image, mode=mode, edge_feather=edge_feather)
            result_base64 = image_to_base64(result)

            return jsonify({
                'success': True,
                'image': f'data:image/png;base64,{result_base64}',
                'mode': mode,
                'message': '背景去除成功' if mode == 'keep' else '主体已删除'
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'处理失败: {str(e)}'}), 500

    return app


if __name__ == '__main__':
    _app = create_app()
    print("=" * 50)
    print("AI 去水印后端服务")
    print("=" * 50)
    print(f"服务地址: http://{HOST}:{PORT}")
    print(f"OpenCV版本: {cv2.__version__}")
    print("API文档:")
    print("  - GET  /api/health        健康检查")
    print("  - POST /api/upload        上传图片")
    print("  - POST /api/process/auto  自动去水印")
    print("  - POST /api/process/manual 手动去水印")
    print("  - POST /api/detect        检测水印")
    print("=" * 50)

    _app.run(host=HOST, port=PORT, debug=DEBUG)
