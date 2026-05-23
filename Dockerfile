FROM python:3.11-slim

LABEL maintainer="AI Watermark Remover"

# 系统依赖（OpenCV 需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装 Python 依赖
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端代码
COPY server/ .

# 创建数据目录
RUN mkdir -p uploads processed

# 复制前端静态文件
COPY web/ /app/static/

# 环境变量默认值
ENV HOST=0.0.0.0 \
    PORT=5000 \
    DEBUG=false \
    STATIC_FOLDER=/app/static \
    GUNICORN_WORKERS=4 \
    GUNICORN_TIMEOUT=120

EXPOSE 5000

# 生产环境使用 gunicorn，开发环境使用 flask
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "--access-logfile", "-", "app:create_app()"]
