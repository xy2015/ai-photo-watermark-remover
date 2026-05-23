#!/usr/bin/env bash
# ── AI 去水印 生产部署脚本 ──
# 用法: bash deploy.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[信息]${NC} $1"; }
warn()  { echo -e "${YELLOW}[警告]${NC} $1"; }
error() { echo -e "${RED}[错误]${NC} $1"; exit 1; }

# ── 检查 .env ──
if [ ! -f .env ]; then
    warn "未找到 .env，从模板创建"
    cp .env.example .env
    warn "请编辑 .env 修改生产配置（尤其是 SECRET_KEY）"
fi

set -a
source .env
set +a

# ── 选择部署方式 ──
echo "========================================"
echo "  AI 去水印 - 生产部署"
echo "========================================"
echo ""
echo "请选择部署方式:"
echo "  1) Docker Compose（推荐）"
echo "  2) 直接部署（Gunicorn + Nginx）"
echo ""
read -rp "输入选择 [1/2]: " choice

case "$choice" in
    1)
        # ── Docker Compose 部署 ──
        command -v docker &>/dev/null || error "未找到 Docker"
        command -v docker-compose &>/dev/null || command -v docker compose &>/dev/null || error "未找到 docker-compose"

        info "构建 Docker 镜像..."
        docker-compose build

        info "启动服务..."
        docker-compose up -d

        info "服务已启动！"
        docker-compose ps
        echo ""
        info "访问地址: http://localhost:${PORT:-80}"
        info "查看日志: docker-compose logs -f"
        info "停止服务: docker-compose down"
        ;;
    2)
        # ── 直接部署 ──
        PYTHON="${PYTHON:-$(command -v python3 2>/dev/null || command -v python)}"

        info "[1/4] 安装后端依赖..."
        cd "$SCRIPT_DIR/server"
        $PYTHON -m pip install -r requirements.txt -q

        info "[2/4] 创建数据目录..."
        mkdir -p uploads processed

        info "[3/4] 启动 Gunicorn..."
        export HOST PORT DEBUG SECRET_KEY GUNICORN_WORKERS GUNICORN_TIMEOUT
        nohup gunicorn \
            --bind "${HOST:-0.0.0.0}:${PORT:-5000}" \
            --workers "${GUNICORN_WORKERS:-4}" \
            --timeout "${GUNICORN_TIMEOUT:-120}" \
            --access-logfile - \
            --daemon \
            --pid gunicorn.pid \
            "app:create_app()" || error "Gunicorn 启动失败"

        info "[4/4] 检查 Nginx 配置..."
        if [ -f /etc/nginx/sites-available/ ]; then
            warn "请将 nginx.conf 复制到 Nginx 配置目录:"
            warn "  sudo cp nginx.conf /etc/nginx/sites-available/watermark"
            warn "  sudo ln -s /etc/nginx/sites-available/watermark /etc/nginx/sites-enabled/"
            warn "  sudo nginx -t && sudo systemctl reload nginx"
        else
            info "Nginx 未安装，前端通过 Gunicorn 直接提供: http://localhost:${PORT:-5000}"
        fi

        info "服务已启动！"
        info "  PID: $(cat gunicorn.pid)"
        info "  停止: kill \$(cat gunicorn.pid)"
        ;;
    *)
        error "无效选择"
        ;;
esac
