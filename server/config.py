"""配置常量 — 支持环境变量覆盖"""

import os

# 服务配置
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', '5000'))
DEBUG = os.getenv('DEBUG', 'true').lower() == 'true'
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-me')

# 文件路径
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
PROCESSED_FOLDER = os.getenv('PROCESSED_FOLDER', 'processed')

# 文件校验
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

EXT_TO_MAGIC = {
    'png': 'png',
    'jpg': 'jpeg',
    'jpeg': 'jpeg',
    'webp': 'webp',
}

# Gunicorn 配置（仅生产使用）
GUNICORN_WORKERS = int(os.getenv('GUNICORN_WORKERS', '4'))
GUNICORN_TIMEOUT = int(os.getenv('GUNICORN_TIMEOUT', '120'))
