# AI 去水印工具

一款主打「无损修复 + 智能防误删」的轻量化去水印工具，覆盖 PC 网页端。

**在线体验：[https://xy2015.github.io/ai-photo-watermark-remover/](https://xy2015.github.io/ai-photo-watermark-remover/)**

## ✨ 特性

- 🚀 **双模式去水印**：智能快捷模式 + 手动精准模式
- 🖼️ **一键去背景（智能抠图）**：自动识别主体并去除背景，输出透明 PNG，支持保留/删除主体与边缘羽化
- 🎨 **无损修复**：使用 OpenCV 专业图像修复算法
- 🔒 **隐私安全**：所有图片处理在本地完成
- 🎯 **极简设计**：Figma 设计系统，一比一复刻
- 🧠 **智能检测**：基于 Canny 边缘检测的自动水印区域识别
- 🛡️ **安全校验**：文件 Magic Bytes 校验，防止恶意文件上传
- 🌐 **零部署成本**：支持 GitHub Pages 免费静态部署

## 📁 项目结构

```
ai-photo-watermark-remover/
├── web/                      # PC 网页端
│   ├── index.html            # 主页面
│   ├── css/                  # 按关注点拆分的样式
│   │   ├── base.css          #   变量 & 重置
│   │   ├── components.css    #   按钮、表单、Toast 等公共组件
│   │   ├── layout.css        #   Header、Footer 布局
│   │   ├── landing.css       #   首页样式
│   │   ├── editor.css        #   编辑器样式
│   │   ├── pages.css         #   反馈 & 隐私页
│   │   └── responsive.css    #   响应式断点
│   └── js/                   # 模块化 JavaScript
│       ├── api-client.js     #   API 调用封装（自动降级）
│       ├── image-processor.js#   前端本地图像处理算法
│       ├── router.js         #   页面路由（导航）
│       ├── canvas-editor.js  #   Canvas 编辑器（画笔/缩放/历史）
│       ├── ui-controller.js  #   UI 控制器（Toast/标签/表单）
│       └── app.js            #   主应用入口（组合各模块）
├── server/                   # 后端 API 服务（可选）
│   ├── app.py                #   Flask 应用入口 + 路由
│   ├── config.py             #   配置常量
│   ├── utils.py              #   图片编解码、文件校验工具
│   ├── services.py           #   水印检测 & 去除核心算法
│   ├── requirements.txt      #   Python 依赖
│   └── test_server.py        #   单元测试
├── .github/workflows/        # GitHub Actions
│   └── deploy.yml            #   GitHub Pages 自动部署
├── uploads/                  # 上传图片临时存储（自动创建）
└── processed/                # 处理后图片临时存储（自动创建）
```

## 🚀 快速开始

### 方式一：GitHub Pages 在线访问（零成本）

直接访问：[https://xy2015.github.io/ai-photo-watermark-remover/](https://xy2015.github.io/ai-photo-watermark-remover/)

无需安装任何依赖，浏览器打开即用。纯前端模式使用 Telea 快速行进法（FMM）在本地进行结构保持修复，保真度高。

> 如需 Fork 到自己账号部署：Fork 后在仓库 Settings → Pages → Source 选择 **GitHub Actions** 即可自动部署。

### 方式二：一键启动（推荐本地开发）

**Windows：**
```bash
start.bat
```

**Linux / Mac：**
```bash
chmod +x start.sh
./start.sh
```

脚本会自动安装依赖、启动后端 Flask 服务和前端静态服务。

### 方式三：手动启动

1. **安装依赖**
```bash
cd server
pip install -r requirements.txt
```

2. **启动后端服务**
```bash
cd server
python app.py
```

3. **启动前端服务**
```bash
cd web
npx serve -l 3000 -s .
```

4. **访问应用**
打开浏览器访问 `http://localhost:3000`

### 方式四：Docker 部署

```bash
# 复制并编辑环境配置
cp .env.example .env

# 一键启动
docker-compose up -d

# 查看状态
docker-compose ps
```

访问 `http://localhost` 即可使用。

### 方式五：生产部署

```bash
chmod +x deploy.sh
./deploy.sh
```

交互式选择 Docker Compose 或 Gunicorn + Nginx 部署方式。

## 🌐 部署模式说明

| 模式 | 后端 | 修复算法 | 适用场景 |
|------|------|----------|----------|
| 纯前端（GitHub Pages） | 不需要 | Telea 快速行进法（FMM） | 免费部署、轻量使用、结构保真 |
| 前端 + 后端 | Flask | TELEA（掩码精炼 + 边界羽化） | 高质量修复、生产环境、保真优先 |

前端会自动检测后端可用性，API 不可用时自动降级为本地算法。

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `HOST` | `0.0.0.0` | 服务监听地址 |
| `PORT` | `5000` | 服务端口 |
| `DEBUG` | `true` | 调试模式 |
| `SECRET_KEY` | `dev-secret-change-me` | 密钥（生产务必修改） |
| `GUNICORN_WORKERS` | `4` | Gunicorn 工作进程数 |
| `GUNICORN_TIMEOUT` | `120` | 请求超时（秒） |
| `STATIC_FOLDER` | 自动检测 | 前端静态文件路径 |
| `API_BASE_URL` | `http://localhost:5000/api` | 前端 API 地址 |

### 使用说明

#### 快捷去水印模式
1. 上传图片
2. 选择水印位置（左上角/右上角/左下角/右下角）
3. 点击「开始去水印」
4. 使用「显示对比」查看效果

#### 手动去水印模式
1. 上传图片
2. 切换到「手动去水印」
3. 使用画笔工具标记水印区域
4. 点击「开始去水印」
5. 使用「显示对比」查看效果

## 🛠️ 技术栈

### 前端
- HTML5 / CSS3 / JavaScript (ES6+)
- Canvas 图像处理
- 模块化架构：`Router` + `CanvasEditor` + `UIController` + `ApiClient` + `ImageProcessor`

### 后端
- Python 3.x + Flask（应用工厂模式）
- OpenCV (cv2) 图像处理（TELEA / Navier-Stokes inpainting）
- NumPy 数值计算

### 部署
- GitHub Pages + GitHub Actions（免费静态部署）
- Docker Compose / Gunicorn + Nginx（生产部署）

## 📋 功能特性

### 已实现
- ✅ 图片上传和拖拽支持（含 Magic Bytes 格式校验）
- ✅ 快捷去水印（4个预设位置）
- ✅ 手动去水印（画笔标记）
- ✅ 原图/处理后图片对比
- ✅ 撤销/重做功能
- ✅ 图片导出
- ✅ 缩放控制
- ✅ 问题反馈页面
- ✅ 隐私政策页面
- ✅ 自动水印区域检测
- ✅ 加权邻域插值本地降级处理
- ✅ 一键去背景（智能抠图）：自动分割主体 / 去除背景，输出透明 PNG
- ✅ GitHub Pages 免费静态部署

### 核心算法
- **TELEA 算法（快速行进法 FMM）**：沿等值线（边缘）推进的结构保持修复，是手动与自动模式的主算法，锐利、保结构、保真
- **Navier-Stokes 算法**：流体法修复，作为后端可选项（偏平滑）
- **Canny 边缘检测 + 轮廓分析**：用于自动水印区域识别
- **掩码精炼 + 边界羽化**：手动模式下对画笔掩码做膨胀（覆盖抗锯齿/半透明水印残留）与羽化混合（消除修复区硬接缝），进一步保真
- **GrabCut 自动抠图（一键去背景）**：以四边像素作为确定背景、内部作为可能前景引导 GrabCut 分割；前景掩码经闭/开运算去噪后转为 alpha，并做高斯羽化得到平滑透明边缘；`mode=remove` 时把主体区域用 TELEA 修复回背景内容
- **区域生长本地降级（一键去背景，无后端时）**：从四角种子出发，沿"局部颜色相近"的邻域蔓延（可跟随渐变背景、在强边缘处停止），标记背景为透明；边缘羽化与删除主体修复复用上述能力
- **全分辨率处理与导出**：修复在原始分辨率离屏画布上进行，导出 PNG 不被显示缩放压缩，最大限度保留清晰度

## 📝 开发指南

### 后端 API

#### 健康检查
```
GET /api/health
```

#### 上传图片
```
POST /api/upload
Content-Type: multipart/form-data

参数: file (图片文件，支持 png/jpg/jpeg/webp)
```

#### 手动去水印
```
POST /api/process/manual
Content-Type: application/json

{
  "image": "data:image/png;base64,...",
  "mask": "data:image/png;base64,..."
}
```

#### 检测水印
```
POST /api/detect
Content-Type: application/json

{
  "image": "data:image/png;base64,..."
}
```

返回包含检测到的水印区域列表，每项含坐标、宽高和置信度评分。

#### 一键去背景（智能抠图）
```
POST /api/process/background
Content-Type: application/json

{
  "image": "data:image/png;base64,...",
  "mode": "keep",            // keep=保留主体(透明背景) | remove=删除主体(修复背景)
  "edge_feather": 2          // alpha 边缘羽化半径 0-8
}
```

返回透明 PNG（mode=keep，含 alpha 通道）或修复后的不透明图（mode=remove）。无后端时前端自动降级为区域生长算法。

### 运行测试

```bash
cd server
python test_server.py
```

### 本地快速验证（无需后端 / 浏览器）

项目内置纯前端算法（Telea 修复、边缘检测自动去水印、区域生长去背景），
无需安装任何依赖即可在本地验证效果：

```bash
# 1) 生成合成测试图并运行三大算法，输出 before/after 到 tools/output/
node tools/local_test.js

# 2) 启动静态服务器，浏览器打开即可手动测试（上传真实图片）
cd web && python3 -m http.server 8124
#   然后访问 http://localhost:8124/index.html
```

`tools/output/` 下会生成：
`manual_original.png` / `manual_result.png`（手动涂抹修复）、
`bg_original.png` / `bg_keep.png` / `bg_remove.png`（一键去背景·保留/删除主体）。

> 本地测试工具已移除自动去水印（一键去水印）用例，仅覆盖手动去水印与一键去背景。

> 前端算法在无后端时自动降级运行（与 GitHub Pages 体验一致）；
> 启动 `server/app.py` 后将自动使用后端 grabCut 高质量路径。

## 🎨 设计系统

基于 Figma 设计系统实现：
- **主色**：#165DFF
- **圆角系统**：8px / 12px / 16px
- **字体**：Inter
- **间距**：8px 基准网格

## 🔒 隐私说明

- 所有图片处理在本地浏览器/服务器完成
- 图片不会上传到第三方服务器
- 不收集用户图片数据

## ✅ 测试覆盖

21 项单元测试，覆盖：
- 健康检查
- 文件上传（含 Magic Bytes 校验）
- 自动/手动去水印
- 水印区域自动检测
- 文件格式安全校验

## 📄 许可证

Copyright © 2024 AI 去水印工具

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
