#细纲节拍助手

> 一款基于 Tauri + React 的桌面端写作工具，为长篇创作提供大纲管理、角色管理、剧情看板与 AI 辅助。

> 

## ✨ 功能特性

- **大纲树视图** —— 以树形结构组织章节与段落，方便整体把控结构
- **剧情看板** —— 以看板（beats）形式梳理情节节奏
- **角色管理** —— 集中管理人物设定
- **资料引用** —— 管理写作所需的参考资料
- **AI 辅助** —— 接入大模型辅助创作（需自行填入 API Key）
- **深色主题** —— 深蓝 + 玫红点缀的暗色界面
- **本地存储** —— 数据保存在本地 SQLite 数据库，离线可用



## 🛠 技术栈

- **前端**：React + TypeScript + Vite
- **桌面框架**：Tauri（Rust 后端）
- **路由**：react-router-dom
- **本地数据库**：@tauri-apps/plugin-sql

## 🚀 开发与运行

### 环境要求

- [Node.js](https://nodejs.org/)（建议 18 或更高版本）
- [Rust](https://www.rust-lang.org/tools/install) 工具链（Tauri 编译后端需要）

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 启动开发模式（会弹出程序窗口，首次编译 Rust 较慢）
npm run tauri:dev
```

### 打包成安装程序

```bash
npm run tauri:build
```

打包产物在 `src-tauri/target/release/` 目录下。

### 类型检查

```bash
npx tsc --noEmit
```

## ⚙️ 配置

应用内提供 API Key 输入框，用于接入 AI 服务。**请勿把任何 API Key 写进代码或提交到 GitHub**，在程序界面里填写即可。

## 📁 项目结构

```
src/
├── components/        # 通用组件
├── views/             # 页面视图
├── features/
│   ├── outline/       # 大纲树
│   ├── characters/    # 角色管理
│   ├── beats/         # 剧情看板
│   ├── references/    # 资料引用
│   └── ai/            # AI 辅助
├── lib/               # 工具函数
└── store/             # 状态管理
src-tauri/             # Tauri / Rust 后端
```

## 

## 📝 说明

本项目使用 AI 编程助手辅助开发，仍在持续完善中。
