@echo off
chcp 65001 >nul 2>&1
title AI 去水印 - 开发服务器

echo ========================================
echo   AI 去水印 - 一键启动
echo ========================================
echo.

:: ── 检查 Python ──
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.9+
    pause
    exit /b 1
)

:: ── 检查 Node.js（可选，用于静态服务器）──
where npx >nul 2>&1
set HAS_NPX=%errorlevel%

:: ── 加载 .env ──
if exist .env (
    echo [信息] 加载 .env 配置
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

:: ── 创建虚拟环境 ──
echo [1/5] 创建虚拟环境...
cd /d "%~dp0"
if not exist .venv (
    python -m venv .venv
    if %errorlevel% neq 0 (
        echo [错误] 创建虚拟环境失败
        pause
        exit /b 1
    )
)

:: ── 激活虚拟环境 ──
call .venv\Scripts\activate.bat

:: ── 安装后端依赖 ──
echo [2/5] 安装后端依赖...
cd /d "%~dp0server"
pip install -r requirements.txt -q
if %errorlevel% neq 0 (
    echo [错误] 依赖安装失败
    echo.
    echo 常见原因：
    echo   - 缺少 C 编译器：安装 Visual Studio Build Tools
    echo   - 网络问题：换源 pip install -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt
    pause
    exit /b 1
)

:: ── 创建上传目录 ──
if not exist uploads mkdir uploads
if not exist processed mkdir processed

:: ── 启动后端 ──
echo [3/5] 启动后端服务 (Flask)...
start "后端服务" cmd /k "cd /d %~dp0 && call .venv\Scripts\activate.bat && cd server && python app.py"

:: ── 等待后端就绪 ──
echo [4/5] 等待后端就绪...
timeout /t 3 /nobreak >nul

:: ── 启动前端 ──
echo [5/5] 启动前端服务...
cd /d "%~dp0web"

if %HAS_NPX% equ 0 (
    echo [信息] 使用 serve 启动前端静态服务...
    start "前端服务" cmd /k "npx serve -l 3000 -s ."
    echo.
    echo ========================================
    echo   启动完成！
    echo   前端: http://localhost:3000
    echo   后端: http://localhost:5000
    echo   虚拟环境: %~dp0.venv
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   后端已启动！
    echo   后端: http://localhost:5000
    echo   虚拟环境: %~dp0.venv
    echo.
    echo   前端需手动启动（推荐安装 Node.js）:
    echo     cd web ^&^& npx serve -l 3000 -s .
    echo   或直接浏览器打开 web/index.html
    echo ========================================
)

echo.
echo 按任意键关闭此窗口（服务继续运行）...
pause >nul
