# 轻量静态工具集架构指南

> 本项目的核心定位：**可直接下载使用的轻量级静态工具集合**。
>
> 所有工具应尽量保持“打开 HTML 即可使用”的体验。优化可以做，但不要把项目改成必须依赖构建工具、后端服务或重型框架才能运行的应用。

---

## 一、架构原则

### 1. 静态优先

项目应保持纯前端静态形态：

- `index.html` 可直接打开。
- 每个工具页面可直接打开。
- JS/CSS 使用相对路径引用。
- 不依赖后端服务。
- 不要求用户执行 `npm install`、`npm run build` 才能使用。

### 2. 轻量增强

允许做体验和性能优化，但优先选择低成本方案：

- 原生 HTML / CSS / JavaScript。
- 少量共享工具函数。
- 少量共享样式变量。
- 必要时使用 CDN，但关键功能不应完全依赖联网。

不建议：

- 引入 React / Vue / Angular 等框架。
- 引入复杂构建链。
- 大规模迁移目录结构。
- 把简单工具拆成过多模块。

### 3. 工具独立可用

每个工具页面都应尽量独立：

- 直接打开页面即可使用主要功能。
- 引用的共享资源路径清晰。
- 不因首页、路由或模板系统缺失而无法运行。
- 用户下载单个页面及必要资源后，也能理解和迁移。

### 4. 小步演进

升级应按“先抽共性、再逐个接入”的方式推进：

1. 先完善共享工具函数。
2. 再挑一个简单工具页试点。
3. 验证无问题后，再推广到其他页面。
4. 每次改动保持可回滚。

---

## 二、当前项目结构

```text
tools/
├── index.html                         # 首页
├── password-generator.html            # 密码生成器
├── key-generator.html                 # 密钥生成器
├── yaml-previewer.html                # YAML 工具
├── word-count.html                    # 字数统计
├── number-converter.html              # 数字大写转换
├── translator.html                    # 翻译工具
├── clipboard-history.html             # 剪贴板历史
├── vrime.html                         # 中文输入法
├── docker-converter.html              # Docker 转换器
├── css/
│   ├── shared.css                     # 通用基础样式
│   ├── themes.css                     # 深色模式主题变量
│   ├── navbar.css                     # 导航栏样式
│   └── loading.css                    # Loading 动画样式
├── js/
│   ├── components/
│   │   └── navbar.js                  # 导航栏组件
│   ├── utils/
│   │   ├── debounce.js                # 防抖/节流
│   │   ├── copy.js                    # 复制能力
│   │   ├── toast.js                   # 轻量通知
│   │   ├── storage.js                 # 本地存储封装
│   │   ├── loading.js                 # 轻量 Loading
│   │   └── theme.js                   # 主题切换
│   └── tools/
│       └── docker-converter.js        # Docker 转换器核心引擎
├── icons/                             # 工具图标（SVG + PNG）
├── README.md
├── ARCHITECTURE.md
├── DEVELOPMENT_PLAN.md
└── WEEKLY_TASKS.md
```

这个结构整体适合当前项目，不需要为了“架构升级”而大幅迁移。

---

## 三、推荐目标结构

目标结构应保持简单：

```text
tools/
├── index.html                         # 首页
├── password-generator.html            # 工具页：密码生成器
├── key-generator.html                 # 工具页：密钥生成器
├── yaml-previewer.html                # 工具页：YAML 工具
├── word-count.html                        # 工具页：字数统计
├── number-converter.html                  # 工具页：数字大写转换
├── translator.html                        # 工具页：翻译工具
├── clipboard-history.html                 # 工具页：剪贴板历史
├── vrime.html                         # 工具页：中文输入法
├── css/
│   ├── shared.css                     # 通用基础样式
│   └── themes.css                     # 可选：主题变量
├── js/
│   ├── utils/
│   │   ├── debounce.js                # 防抖/节流
│   │   ├── copy.js                    # 复制能力
│   │   ├── toast.js                   # 轻量通知
│   │   ├── storage.js                 # 本地存储封装
│   │   └── loading.js                 # 可选：轻量 Loading
│   └── tools/                         # 可选：仅当某个页面脚本过长时再拆出
│       └── xxx.js
├── icons/
└── docs 或 *.md                        # 项目说明和升级计划
```

说明：

- 不强制创建 `pages/` 目录。
- 不强制创建 `html/` 模板目录。
- 只有当某个 HTML 文件已经明显过长、维护困难时，才把 JS 拆到 `js/tools/`。
- 共享能力只放确实被多个工具使用的代码。

---

## 四、共享模块边界

### 1. 可以共享的能力

适合放到 `js/utils/`：

- Toast 通知：复制成功、错误提示、操作完成提示。
- Copy 工具：统一处理剪贴板 API 与降级方案。
- Debounce / throttle：输入实时计算、搜索、翻译请求防抖。
- Storage：localStorage / IndexedDB 的轻量封装。
- Loading：异步请求或大文件处理时显示加载状态。

### 2. 不必共享的能力

以下代码可以保留在各自 HTML 内：

- 只被单个工具使用的业务逻辑。
- 很短的页面初始化代码。
- 与页面 DOM 强绑定的交互逻辑。
- 临时性、低复用的样式。

### 3. 拆分判断标准

当满足以下任一条件时，再考虑拆出独立 JS：

- 单个 HTML 文件过长，阅读困难。
- 同一段逻辑在 2 个以上工具中重复出现。
- 某段逻辑需要单独测试或复用。
- 某段逻辑会明显影响页面性能，需要 Worker 或异步处理。

---

## 五、样式策略

### 1. 保留 `css/shared.css`

`shared.css` 继续作为基础样式入口，用于：

- 基础布局。
- 通用按钮。
- 表单控件。
- 卡片样式。
- 响应式规则。

### 2. 可新增 `css/themes.css`

如果需要深色模式，可以新增 `themes.css` 管理变量：

```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #1f2937;
  --border-color: #e5e7eb;
  --accent-color: #2563eb;
}

[data-theme="dark"] {
  --bg-primary: #111827;
  --text-primary: #f9fafb;
  --border-color: #374151;
  --accent-color: #60a5fa;
}
```

原则：

- 不一次性重写所有样式。
- 先在一个工具页试点。
- 确认可读性和兼容性后再推广。

---

## 六、性能策略

### 1. 优先做低风险优化

- 输入事件增加 debounce。
- 大量 DOM 更新合并处理。
- 大文件处理显示 Loading。
- 避免无意义的全量重绘。
- 图片资源压缩。

### 2. 谨慎使用 Web Worker

Web Worker 只适合明显会阻塞主线程的场景，例如：

- 大文本字数统计。
- 大文件解析。
- 大 JSON / YAML 格式化。

不要为了架构完整性而给所有工具都加 Worker。

### 3. 本地存储策略

优先级：

1. 少量设置：`localStorage`。
2. 较多历史记录：IndexedDB。
3. 敏感数据：默认不保存，必须由用户明确开启。

---

## 七、页面升级标准

升级某个工具页时，按以下顺序处理：

1. 保持原功能不变。
2. 接入必要的共享工具函数。
3. 替换 `alert` 为 Toast。
4. 替换重复的复制逻辑为 `copyToClipboard`。
5. 增加必要的 Loading 或错误提示。
6. 检查移动端显示。
7. 检查本地直接打开是否可用。

---

## 八、验收清单

每次改动后至少检查：

- [ ] 首页可以直接打开。
- [ ] 被修改的工具页可以直接打开。
- [ ] 主要功能正常。
- [ ] 控制台无明显错误。
- [ ] 移动端布局可用。
- [ ] 不需要构建步骤。
- [ ] 不需要后端服务。
- [ ] 相对路径正确。
- [ ] 隐私数据仍在本地处理。

---

## 九、总结

本项目不是大型 Web App，而是轻量静态工具集。

最适合的升级方式是：

- 保持简单结构。
- 保持工具独立。
- 抽取真正复用的能力。
- 逐个工具小步增强。
- 始终保证下载后可直接使用。
