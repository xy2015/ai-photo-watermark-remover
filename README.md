# AI 去水印工具

一款主打「无损修复 + 智能防误删」的轻量化去水印工具，覆盖 PC 网页端与 iOS 移动端。

## ✨ 特性

- 🚀 **双模式去水印**：智能快捷模式 + 手动精准模式
- 🎨 **无损修复**：使用 OpenCV 专业图像修复算法
- 🔒 **隐私安全**：所有图片处理在本地完成
- 📱 **多端支持**：PC 网页端 + iOS 移动端
- 🎯 **极简设计**：Figma 设计系统，一比一复刻

## 📁 项目结构

```
remove-water/
├── web/              # PC 网页端
│   ├── index.html    # 主页面
│   ├── css/          # 样式文件
│   ├── js/           # JavaScript 逻辑
│   └── demo/         # Figma 设计参考
├── server/           # 后端 API 服务
│   ├── app.py        # Flask 主应用
│   └── requirements.txt  # Python 依赖
└── ios/              # iOS 移动端
    ├── ClearWaterApp.swift
    ├── ContentView.swift
    └── Info.plist
```

## 🚀 快速开始

### PC 网页端

1. **启动后端服务**
```bash
cd server
pip install -r requirements.txt
python app.py
```

2. **启动前端服务**
```bash
cd web
python -m http.server 3000
```

3. **访问应用**
打开浏览器访问 `http://localhost:3000`

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
- HTML5 / CSS3 / JavaScript
- Canvas 图像处理
- Figma 设计系统

### 后端
- Python 3.x
- Flask Web 框架
- OpenCV (cv2) 图像处理
- NumPy 数值计算

### iOS
- Swift / SwiftUI

## 📋 功能特性

### 已实现
- ✅ 图片上传和拖拽支持
- ✅ 快捷去水印（4个预设位置）
- ✅ 手动去水印（画笔标记）
- ✅ 原图/处理后图片对比
- ✅ 撤销/重做功能
- ✅ 图片导出
- ✅ 缩放控制
- ✅ 问题反馈页面
- ✅ 隐私政策页面

### 核心算法
- **TELEA 算法**：快速图像修复，适合快捷模式
- **Navier-Stokes 算法**：高质量修复，适合手动模式
- **Canny 边缘检测**：用于水印区域识别

## 📝 开发指南

### 后端 API

#### 健康检查
```
GET /api/health
```

#### 自动去水印
```
POST /api/process/auto
Content-Type: application/json

{
  "image": "base64_image_data",
  "region": "bottom-right"
}
```

#### 手动去水印
```
POST /api/process/manual
Content-Type: application/json

{
  "image": "base64_image_data",
  "mask": "base64_mask_data"
}
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

## 📄 许可证

Copyright © 2024 AI 去水印工具

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系方式

如有问题或建议，请通过问题反馈页面联系我们。
