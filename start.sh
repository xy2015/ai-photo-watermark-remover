#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[信息]${NC} $1"; }
warn()  { echo -e "${YELLOW}[警告]${NC} $1"; }
error() { echo -e "${RED}[错误]${NC} $1"; exit 1; }

echo "========================================"
echo "  AI 去水印 - 一键启动"
echo "========================================"
echo ""

# ── 检查 Python ──
command -v python3 &>/dev/null || command -v python &>/dev/null || error "未找到 Python，请先安装 Python 3.9+"
PYTHON="${PYTHON:-$(command -v python3 2>/dev/null || command -v python)}"

# ── 加载 .env ──
if [ -f .env ]; then
    info "加载 .env 配置"
    set -a
    source .env
    set +a
fi

# ── 创建虚拟环境 ──
info "[1/5] 创建虚拟环境..."
if [ ! -d .venv ]; then
    $PYTHON -m venv .venv || error "创建虚拟环境失败"
fi

# ── 激活虚拟环境 ──
source .venv/bin/activate

# ── 安装后端依赖 ──
info "[2/5] 安装后端依赖..."
cd "$SCRIPT_DIR/server"
pip install -r requirements.txt -q || {
    echo -e "${RED}[错误]${NC} 依赖安装失败"
    echo "  换源重试: pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt"
    exit 1
}

# ── 创建上传目录 ──
mkdir -p uploads processed

# ── 启动后端 ──
info "[3/5] 启动后端服务 (Flask)..."
$PYTHON app.py &
BACKEND_PID=$!

# ── 等待后端就绪 ──
info "[4/5] 等待后端就绪..."
sleep 3

# ── 启动前端 ──
info "[5/5] 启动前端服务..."
cd "$SCRIPT_DIR/web"

if command -v npx &>/dev/null; then
    npx serve -l 3000 -s . &
    FRONTEND_PID=$!
    echo ""
    echo "========================================"
    echo -e "  ${GREEN}启动完成！${NC}"
    echo "  前端: http://localhost:3000"
    echo "  后端: http://localhost:5000"
    echo "  虚拟环境: $SCRIPT_DIR/.venv"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "  后端已启动！"
    echo "  后端: http://localhost:5000"
    echo "  虚拟环境: $SCRIPT_DIR/.venv"
    echo ""
    echo "  前端需手动启动（推荐安装 Node.js）:"
    echo "    cd web && npx serve -l 3000 -s ."
    echo "  或直接浏览器打开 web/index.html"
    echo "========================================"
fi

echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获退出信号，清理子进程
cleanup() {
    echo ""
    info "正在停止服务..."
    [ -n "${BACKEND_PID:-}" ]  && kill "$BACKEND_PID"  2>/dev/null
    [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null
    info "已停止"
    exit 0
}
trap cleanup SIGINT SIGTERM

# 等待后端进程
wait "$BACKEND_PID" 2>/dev/null || true
