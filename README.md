# Derr1ck 阅读器

一个纯本地的 Web 电子书阅读器：打开浏览器就能读自己导入的书，无需注册、无需上传。

## 快速开始

```bash
npm install
npm run dev      # 本地开发
npm run build    # 构建到 dist/
```

## 项目结构

```
├── demo/                  # 界面流程 Demo（单文件 HTML，设计验证用）
├── docs/                  # 文档
│   └── 产品设计文档.md     # MVP 产品设计文档（必读）
├── src/
│   ├── pages/             # 页面：LibraryPage（书库）/ ReaderPage（阅读）
│   ├── App.jsx            # 路由与全局主题
│   └── main.jsx
├── index.html
└── package.json
```

## 技术栈

React + Vite · epub.js（EPUB 解析）· Dexie.js（IndexedDB）· GitHub Pages 部署

## 里程碑

- [x] M1 骨架：项目搭建、路由、主题切换
- [ ] M2 导入与书库
- [ ] M3 阅读器
- [ ] M4 进度与打磨、上线

详见 [产品设计文档](docs/产品设计文档.md)。
