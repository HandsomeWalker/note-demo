# Note Demo

这是一个基于 React + TypeScript + Vite 的本地笔记本应用，适合用于单机环境中的笔记记录、分类管理和 Markdown 编辑。应用支持创建多个笔记本、在不同笔记本中管理多篇笔记，并在浏览器本地持久化保存数据。

## 功能概览

- 创建、重命名、删除笔记本
- 在选定笔记本内创建、编辑、删除笔记
- 记录笔记标题和正文内容
- 支持 Markdown 预览模式
- 本地持久化（基于 localStorage）
- 适合轻量级个人知识管理场景

## 技术栈

- React 19
- TypeScript
- Vite
- Markdown-it
- Tailwind CSS（样式层）
- Vitest / Testing Library（测试支持）

## 工程架构介绍

项目结构简洁，职责分层清晰，适合继续扩展为更完整的笔记系统：

```text
note-demo/
├── src/
│   ├── App.tsx                     # 应用主容器，组织侧边栏 / 笔记列表 / 编辑器布局
│   ├── main.tsx                   # 入口文件，挂载 React App
│   ├── components/
│   │   ├── NotebookSidebar.tsx     # 笔记本列表与新建/重命名/删除操作
│   │   ├── NoteList.tsx            # 当前笔记本的笔记列表
│   │   └── NoteEditor.tsx          # 笔记编辑区，支持 Markdown 预览和正文编辑
│   ├── data/
│   │   ├── storage.ts              # localStorage 读写封装
│   │   └── types.ts                # Notebook / Note 数据结构定义
│   ├── hooks/
│   │   └── useNotes.ts             # 应用核心状态管理逻辑
│   ├── utils/
│   │   └── formatDate.ts           # 时间格式化工具
│   ├── App.test.tsx               # 应用基础测试示例
│   └── test/
│       └── setup.ts                # 测试环境配置
├── index.html                     # Vite 入口 HTML
├── package.json                    # 项目脚本和依赖
├── tsconfig.json                  # TypeScript 配置
├── vite.config.ts                 # Vite 配置
├── eslint.config.mjs              # ESLint 配置
├── README.md                      # 项目说明文档
└── assets/                        # 静态资源目录
```

### 1. App 入口层

`src/App.tsx` 是整个应用的布局入口。它通过 `useNotes()` 获取统一状态和操作方法，并将状态分发到三个核心 UI 区域：

- `NotebookSidebar`：笔记本管理
- `NoteList`：当前笔记列表
- `NoteEditor`：笔记内容编辑

### 2. 状态管理层

`src/hooks/useNotes.ts` 是整个应用的核心状态管理模块。它负责：

- 维护 `notebooks` 与 `notes` 两套数据
- 跟踪当前选中的笔记本和笔记
- 提供创建、更新、删除、选择等行为方法
- 自动持久化到浏览器本地存储

这意味着前端页面无需额外的全局状态库，也能保持逻辑清晰、扩展成本低。

### 3. 数据持久化层

`src/data/storage.ts` 将数据访问抽象为 `load*` 和 `save*` 方法，统一使用 `localStorage`。这样可以在浏览器刷新后保留用户之前的笔记内容，同时让 UI 层不直接耦合浏览器本地存储细节。

### 4. 组件层

- `NotebookSidebar`：负责笔记本的新建、重命名、删除，以及切换当前选中的笔记本
- `NoteList`：根据当前选中笔记本筛选笔记，并允许新增或删除笔记
- `NoteEditor`：负责笔记标题和正文编辑，以及 Markdown 预览切换

### 5. 数据模型层

`src/data/types.ts` 定义了两大核心实体：

- `Notebook`：笔记本对象
- `Note`：笔记对象

模型设计简单稳定，支持后续扩展字段，例如标签、分类、封面、重要程度等。

## 应用使用说明

### 1. 安装依赖

在项目根目录执行：

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

启动后，默认会使用 Vite 的本地开发地址，通常可在浏览器中访问：

```text
http://localhost:5173/
```

### 3. 使用流程

#### 创建笔记本

- 在左侧边栏顶部输入框中输入笔记本名称
- 按 Enter 或点击输入框失焦，即可创建笔记本
- 创建完成后，当前笔记本会被自动选中

#### 切换笔记本

- 点击左侧边栏中的某个笔记本
- 中间的笔记列表会自动切换到该笔记本下的内容

#### 创建笔记

- 选择某个笔记本后，点击“+ 新建笔记”按钮
- 新笔记会自动生成并进入编辑状态

#### 编辑笔记

- 左侧：查看当前笔记列表
- 右侧：编辑笔记标题和正文
- 标题可直接在顶部输入框中修改
- 正文支持普通文本编辑

#### Markdown 预览

- 点击右上角的“预览”按钮，即可切换到 Markdown 预览模式
- 预览会把正文内容渲染为 HTML，适合快速检查文档排版

#### 删除内容

- 删除笔记本：点击对应笔记本右侧的删除按钮
- 删除笔记：点击笔记列表中对应条目右侧的删除按钮
- 删除前会弹出确认提示，避免误删

#### 重命名笔记本

- 点击笔记本名称旁边的编辑按钮
- 输入新名称后按 Enter 确认

### 4. 数据保存方式

应用数据默认保存在浏览器的 `localStorage` 中，因此：

- 刷新页面后仍可保留笔记内容
- 关闭浏览器后，数据仍然可从本地恢复
- 数据与后端无关，属于前端本地存储方案

> 这适合单机、轻量级、无后端需求的个人笔记场景。

## 常用脚本

项目中提供了以下脚本：

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产包
npm run preview  # 预览生产构建结果
npm run lint     # 运行 ESLint
npm run typecheck  # 运行 TypeScript 类型检查
npm run check    # 运行 ESLint + Prettier 检查
```

## 适用场景

- 个人日记记录
- 学习笔记管理
- 想法和待办整理
- 轻量 Markdown 文档编辑
- 需要本地存储且不依赖后端服务的应用原型

## 扩展建议

如果继续开发这个项目，可以考虑以下增强方向：

- 增加笔记分类和标签功能
- 支持笔记搜索和排序
- 引入文件导入/导出（Markdown 文件）
- 增加云同步或后端存储
- 增加富文本编辑器支持

## 结语

这个示例项目强调“简洁、直观、可扩展”的笔记应用设计，适合作为前端状态管理、组件拆分和本地数据持久化的学习示例。希望它能帮助你快速理解 React + TypeScript + Vite 的工程结构，并作为后续更复杂应用的基础。
