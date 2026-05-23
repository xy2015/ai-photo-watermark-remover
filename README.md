# AI 去水印工具

一款主打「无损修复 + 智能防误删」的轻量化去水印工具，覆盖 PC 网页端。

## ✨ 特性

- 🚀 **双模式去水印**：智能快捷模式 + 手动精准模式
- 🎨 **无损修复**：使用 OpenCV 专业图像修复算法
- 🔒 **隐私安全**：所有图片处理在本地完成
- 🎯 **极简设计**：Figma 设计系统，一比一复刻
- 🧠 **智能检测**：基于 Canny 边缘检测的自动水印区域识别
- 🛡️ **安全校验**：文件 Magic Bytes 校验，防止恶意文件上传

## 📁 项目结构

```
remove-water/
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
│       ├── api-client.js     #   API 调用封装
│       ├── image-processor.js#   前端本地图像处理算法
│       ├── router.js         #   页面路由（导航）
│       ├── canvas-editor.js  #   Canvas 编辑器（画笔/缩放/历史）
│       ├── ui-controller.js  #   UI 控制器（Toast/标签/表单）
│       └── app.js            #   主应用入口（组合各模块）
├── server/                   # 后端 API 服务
│   ├── app.py                #   Flask 应用入口 + 路由
│   ├── config.py             #   配置常量
│   ├── utils.py              #   图片编解码、文件校验工具
│   ├── services.py           #   水印检测 & 去除核心算法
│   ├── requirements.txt      #   Python 依赖
│   └── test_server.py        #   单元测试
├── uploads/                  # 上传图片临时存储（自动创建）
└── processed/                # 处理后图片临时存储（自动创建）
```

## 🚀 快速开始

### 方式一：一键启动（推荐）

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

### 方式二：手动启动

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

### 方式三：Docker 部署

```bash
# 复制并编辑环境配置
cp .env.example .env

# 一键启动
docker-compose up -d

# 查看状态
docker-compose ps
```

访问 `http://localhost` 即可使用。

### 方式四：生产部署

```bash
chmod +x deploy.sh
./deploy.sh
```

交互式选择 Docker Compose 或 Gunicorn + Nginx 部署方式。

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

### 核心算法
- **TELEA 算法**：快速图像修复，适合快捷模式
- **Navier-Stokes 算法**：高质量修复，适合手动模式
- **Canny 边缘检测 + 轮廓分析**：用于自动水印区域识别
- **反距离加权插值**：前端本地降级处理的备用方案

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

#### 自动去水印
```
POST /api/process/auto
Content-Type: application/json

{
  "image": "data:image/png;base64,...",
  "region": "bottom-right"
}
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

### 运行测试
```bash
cd server
python test_server.py
```

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
