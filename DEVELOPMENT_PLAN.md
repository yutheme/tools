# 📅 工具集开发计划

**项目**: yutheme/tools  
**更新日期**: 2026-05-06  
**优先级排序**: 用户体验改进 > 性能优化 > 功能扩展

---

## 📊 整体规划时间表

| 阶段 | 周期 | 目标 | 预期完成 |
|------|------|------|--------|
| **Phase 1** | 2-3周 | 用户体验改进 | Week 1-3 |
| **Phase 2** | 2-3周 | 性能优化 & Markdown工具 | Week 4-6 |
| **Phase 3** | 2-3周 | JSON工具 & 额外功能 | Week 7-9 |

---

## 🎯 Phase 1: 用户体验改进（2-3周）

### 目标
- 优化全局交互体验
- 改进导航系统
- 完善反馈机制
- 统一设计语言

### 任务列表

#### Task 1.1: 全局Toast通知系统 ⏱️ 3天
**文件**: `js/utils/toast.js` (新建)

```javascript
// 需实现的功能
class Toast {
  static show(message, type = 'info', duration = 2000)
  static success(message, duration = 2000)
  static error(message, duration = 2000)
  static warning(message, duration = 2000)
  static loading(message)
  static hideLoading()
}

// 支持的type: success | error | warning | info | loading
// 位置: 页面右上角
// 样式: 无遮罩，自动消失
```

**实现要点**:
- 使用DOM元素创建（不依赖alert）
- 支持队列管理（多条通知）
- 动画进出效果
- 支持手动关闭

**验收标准**:
- ✅ 复制操作显示 "已复制 ✓"
- ✅ 错误操作显示错误信息
- ✅ 多条通知按队列显示
- ✅ 页面任何地方都能调用

---

#### Task 1.2: 顶部导航栏 ⏱️ 4天
**文件**: 
- `html/navbar.html` (导航栏组件)
- `css/navbar.css` (导航栏样式)
- `js/navbar.js` (导航栏逻辑)

**功能需求**:
```
┌─────────────────────────────────────────────────────┐
│ 🔗 实用工具集  [🔍 搜索...] [🌙] [⭐] [📝]       │
└─────────────────────────────────────────────────────┘
```

**子功能**:

1. **搜索工具** (Cmd+K / Ctrl+K)
   - 模糊搜索工具名称和描述
   - 快捷键提示
   - 下拉结果选择
   - 高亮匹配文本

2. **夜间模式切换** (🌙)
   - 检测系统偏好
   - 记住用户选择
   - 平滑过渡

3. **GitHub Star按钮**
   - 链接到repo
   - 显示star数

4. **最近使用工具**
   - localStorage记录访问历史
   - 快速回到最近的工具
   - 右键菜单清除历史

**实现要点**:
- 在所有工具页面和首页都展示
- 响应式设计（手机端收起为汉堡菜单）
- 固定顶部且z-index足够高
- 首页和工具页面样式统一

**验收标准**:
- ✅ 搜索功能正常
- ✅ 夜间模式切换流畅
- ✅ 所有页面都能显示
- ✅ 移动端正常显示

---

#### Task 1.3: 工具页面通用导航优化 ⏱️ 2天
**文件**: 
- `html/tool-header.html` (工具页面头部模板)
- `js/tool-common.js` (通用逻辑)

**改进内容**:
```
每个工具页面（如password-generator.html）的结构标准化：

顶部：
  ├─ 导航栏 (navbar)
  ├─ 工具标题 + 描述
  └─ 快捷键提示

底部：
  ├─ 返回首页链接（改进UI）
  ├─ 相关工具推荐
  └─ 页脚
```

**需要更新的文件**:
- `password-generator.html`
- `key-generator.html`
- `yaml-previewer.html`
- `字数统计.html`
- `数字大写转换.html`
- `实时翻译工具.html`
- `剪贴板历史.html`
- `vrime.html`

**验收标准**:
- ✅ 所有工具页面结构一致
- ✅ 返回导航清晰明显
- ✅ 相关工具推荐显示

---

#### Task 1.4: 深色模式完整支持 ⏱️ 3天
**文件**: 
- `css/themes.css` (主题变量系统) - 重构
- `js/theme.js` (主题切换逻辑)

**需要做的**:
1. 整理所有CSS变量到 `themes.css`
   ```css
   :root {
     /* Light Mode */
     --bg-primary: #ffffff;
     --text-primary: #1f2937;
     --border-color: #e5e7eb;
     /* ... 更多变量 */
   }

   [data-theme="dark"] {
     /* Dark Mode */
     --bg-primary: #1f2937;
     --text-primary: #f3f4f6;
     --border-color: #374151;
     /* ... 对应变量 */
   }
   ```

2. 检查所有HTML文件，替换硬编码颜色为CSS变量

3. 实现主题切换逻辑
   ```javascript
   // 检测系统偏好
   const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
   
   // 用户手动切换
   function toggleTheme() { ... }
   
   // 记住选择
   localStorage.setItem('theme', 'dark');
   ```

**需要更新的文件**: 所有HTML文件

**验收标准**:
- ✅ 夜间模式下所有文字清晰可读
- ✅ 没有硬编码的颜色
- ✅ 系统偏好正确检测
- ✅ 用户选择正确保存

---

#### Task 1.5: 骨架屏加载和Loading动画 ⏱️ 2天
**文件**: 
- `css/loading.css` (加载动画)
- `js/utils/loading.js` (加载管理)

**实现内容**:
1. **骨架屏** - 页面初始加载时显示
2. **Loading微调** - 等待API响应时显示
3. **过渡动画** - 页面切换时显示

```javascript
// 使用示例
Loading.show('正在翻译...')
Loading.hide()
```

**验收标准**:
- ✅ 翻译工具调用API时显示loading
- ✅ 字数统计上传文件时显示loading
- ✅ 动画流畅不卡顿

---

### Phase 1 验收清单
- [ ] Toast系统全局可用，所有复制/错误都有提示
- [ ] 顶部导航栏正常工作（搜索、夜间模式、历史）
- [ ] 所有工具页面导航一致
- [ ] 深色模式完整支持
- [ ] Loading动画在关键位置显示
- [ ] 所有页面响应式设计完美（测试手机/平板/桌面）

---

## ⚡ Phase 2: 性能优化 & Markdown工具（2-3周）

### 目标
- 提升应用整体性能
- 新增Markdown编辑器工具
- 优化已有工具性能

### 任务列表

#### Task 2.1: Web Worker优化（字数统计）⏱️ 3天
**文件**: 
- `js/workers/wordcount-worker.js` (新建)
- 修改 `字数统计.html`

**问题分析**:
- 大文件（>10MB）处理时会阻塞主线程
- 导致页面卡顿，输入框反应迟钝

**解决方案**:
```javascript
// 主线程
const worker = new Worker('js/workers/wordcount-worker.js');

worker.postMessage({
  type: 'analyze',
  content: largeText,
  fileType: 'txt'
});

worker.onmessage = (e) => {
  updateUI(e.data.result);
};

// Worker线程
self.onmessage = (e) => {
  const result = analyzeText(e.data.content);
  self.postMessage({ result });
};
```

**优化目标**:
- 100MB文件<2秒响应
- 主线程不卡顿

**验收标准**:
- ✅ 大文件快速处理
- ✅ 页面不卡顿
- ✅ 进度提示显示

---

#### Task 2.2: localStorage → IndexedDB迁移 ⏱️ 3天
**文件**: 
- `js/utils/storage.js` (新建存储抽象层)
- 修改所有使用history的工具

**背景**:
- localStorage容量限制5-10MB
- 密码生成器、密钥生成器、剪贴板历史都需要存储
- IndexedDB可达50MB+，性能更好

**实现**:
```javascript
// 统一的存储接口
const Storage = {
  async get(key) { ... },
  async set(key, value) { ... },
  async delete(key) { ... },
  async clear() { ... }
}

// 工具中使用
await Storage.set('password_history', passwords);
const history = await Storage.get('password_history');
```

**优化目标**:
- 支持无限量数据存储
- 性能提升（异步操作）

**验收标准**:
- ✅ 所有history正常保存
- ✅ 查询速度快
- ✅ 没有丢失数据

---

#### Task 2.3: 资源优化 ⏱️ 2天
**涉及文件**: 所有HTML

**优化内容**:
1. **图片优化**
   - 使用webp格式（已有的favicon保持）
   - 添加 `loading="lazy"` 到非关键图片
   - 压缩所有PNG/SVG

2. **CSS/JS分割**
   - 首页：只加载首页需要的CSS
   - 工具页：只加载工具需要的JS
   - 共享资源：统一管理

3. **CDN配置**
   - Font Awesome已用CDN ✓
   - 考虑jsdelivr加速其他资源

**验收标准**:
- ✅ 首屏加载<2秒
- ✅ Lighthouse性能分数>90
- ✅ 总包体积<500KB

---

#### Task 2.4: 新增Markdown编辑工具 ⏱️ 5天
**文件**: `markdown-editor.html` (新建)

**功能需求**:

```
┌─────────────────────────────────────────────────┐
│  Markdown编辑器 - 实时预览                      │
├─────────────────────────────────────────────────┤
│  编辑区                 │   预览区              │
│  • 标题                 │ ╔═════════════════╗  │
│  • 加粗                 │ ║ 实时HTML渲染    ║  │
│  • 链接                 │ ║                 ║  │
│  • 代码块               │ ║                 ║  │
│  • 表格                 │ ╚═════════════════╝  │
└─────────────────────────────────────────────────┘
```

**核心功能**:

1. **双窗格编辑**
   - 左侧：Markdown编辑框
   - 右侧：实时HTML预览
   - 滚动同步（编辑区滚动→预览区跟随）

2. **工具栏快捷操作**
   ```
   按钮: [H1] [H2] [B] [I] [Link] [Code] [Quote] [Table]
   - 快速插入对应Markdown语法
   - 选中文本时自动包装
   ```

3. **功能特性**
   - ✨ 代码块语法高亮（使用Prism.js）
   - 📊 表格支持
   - 🔗 链接预览
   - ✅ Task list支持
   - 📐 数学公式支持（可选，使用KaTeX）
   - 📝 脚注支持

4. **导出功能**
   ```
   导出为: [HTML] [PDF] [下载MD]
   ```

5. **主题支持**
   - 预设主题（GitHub、One Dark等）
   - 字体大小调整
   - 行号显示/隐藏

**使用库**:
```html
<!-- Markdown解析 -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<!-- 语法高亮 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>

<!-- PDF导出 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

<!-- （可选）数学公式 -->
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.js"></script>
```

**代码架构**:
```javascript
// js/tools/markdown-editor.js

class MarkdownEditor {
  constructor() {
    this.editor = document.getElementById('editor');
    this.preview = document.getElementById('preview');
    this.setupEventListeners();
    this.loadAutoSave();
  }

  setupEventListeners() {
    // 编辑时更新预览
    this.editor.addEventListener('input', 
      debounce(() => this.updatePreview(), 300)
    );
    
    // 滚动同步
    this.editor.addEventListener('scroll', 
      () => this.syncScroll()
    );
  }

  updatePreview() {
    const markdown = this.editor.value;
    const html = marked.parse(markdown);
    this.preview.innerHTML = html;
    this.highlightCode(); // 代码高亮
    this.saveAutoSave();  // 自动保存
  }

  highlightCode() {
    this.preview.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
  }

  syncScroll() {
    const editorScroll = this.editor.scrollTop;
    const ratio = editorScroll / this.editor.scrollHeight;
    this.preview.scrollTop = ratio * this.preview.scrollHeight;
  }

  exportHTML() { ... }
  exportPDF() { ... }
  exportMarkdown() { ... }

  saveAutoSave() { ... }
  loadAutoSave() { ... }
}
```

**样式架构**:
```css
/* 双列布局 */
.editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: 100%;
}

/* 编辑区 */
.editor-area textarea {
  font-family: 'Monaco', 'Menlo', monospace;
  line-height: 1.6;
  resize: none;
}

/* 预览区 */
.preview-area {
  overflow-y: auto;
  padding: 1rem;
  background: var(--color-gray-50);
  border-radius: var(--radius-lg);
}

/* Markdown渲染样式 */
.preview-area h1 { ... }
.preview-area h2 { ... }
.preview-area code { ... }
.preview-area table { ... }

/* 响应式：手机端上下布局 */
@media (max-width: 768px) {
  .editor-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
}
```

**更新首页**:
```html
<!-- 在index.html的tools-grid中添加 -->
<div class="tool-card tool-markdown">
  <a href="markdown-editor.html" class="card-link">
    <div class="tool-card-content">
      <div class="tool-icon">
        <i class="fa fa-file-text"></i>
      </div>
      <h2>Markdown编辑器</h2>
      <div class="tool-description">
        实时预览、双窗格编辑、支持导出HTML/PDF、代码高亮、表格支持。
      </div>
      <div class="tool-action-container">
        <div class="tool-action">立即使用<i class="fa fa-arrow-right"></i></div>
      </div>
    </div>
    <div class="tool-card-footer">
      <i class="fa fa-check-circle"></i>
      实时预览 · 丰富功能
    </div>
  </a>
</div>
```

**验收标准**:
- ✅ 编辑和预览实时同步
- ✅ 滚动同步正常
- ✅ 代码块语法高亮
- ✅ 表格正确渲染
- ✅ 导出HTML/PDF/MD正常
- ✅ 自动保存功能正常
- ✅ 手机端上下布局正常

---

### Phase 2 验收清单
- [ ] Web Worker集成，大文件处理无卡顿
- [ ] IndexedDB迁移完成，历史记录无丢失
- [ ] 资源优化完成，Lighthouse>90
- [ ] Markdown编辑工具完整可用
- [ ] 所有工具集成了新的Toast和Loading系统
- [ ] 性能测试通过（Lighthouse报告）

---

## 🎁 Phase 3: JSON工具 & 额外功能（2-3周）

### 目标
- 新增JSON/XML工具
- 新增其他高价值工具
- 进一步优化体验

### 任务列表

#### Task 3.1: JSON格式化验证工具 ⏱️ 4天
**文件**: `json-tool.html` (新建)

**功能需求**:
```
┌──────────────────────────────────────┐
│  JSON工具                            │
├──────────────────────────────────────┤
│  功能: [格式化] [压缩] [验证] [转CSV] │
├──────────────────────────────────────┤
│  输入JSON                 │  输出结果  │
│  ┌────────────────────┐   │  ┌──────┐ │
│  │                    │   │  │      │ │
│  │ 粘贴JSON文本       │   │  │      │ │
│  │ 或上传文件         │   │  │      │ │
│  └────────────────────┘   │  └──────┘ │
└──────────────────────────────────────┘
```

**核心功能**:

1. **格式化** - 美化并缩进
2. **压缩** - 移除所有空格和换行
3. **验证** - 检查JSON语法，显示错误位置
4. **查看树形结构** - 展开/折叠JSON树
5. **JSON ↔ CSV转换**
6. **查找路径** - 输入路径快速定位值
7. **排序键值** - 按字母排序
8. **移除注释** - 将JSON5转换为JSON

**验收标准**:
- ✅ 大JSON文件快速处理
- ✅ 错误提示精确到行列
- ✅ 树形结构交互流畅

---

#### Task 3.2: 二维码工具 ⏱️ 3天
**文件**: `qrcode-tool.html` (新建)

**功能**:
- 生成二维码（文本/URL）
- 解析二维码
- 自定义大小/纠错等级
- 下载为PNG/SVG

**使用库**:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.5/qrcode.min.js"></script>
```

**验收标准**:
- ✅ 生成的二维码能被标准扫描器识别
- ✅ 解析功能正常

---

#### Task 3.3: 颜色工具 ⏱️ 3天
**文件**: `color-tool.html` (新建)

**功能**:
- HEX/RGB/HSL互转
- 调色板生成
- 配色方案推荐
- 颜色空间转换

**验收标准**:
- ✅ 颜色转换准确
- ✅ 配色方案合理

---

#### Task 3.4: 正则表达式测试工具 ⏱️ 4天
**文件**: `regex-tester.html` (新建)

**功能**:
- 实时正则测试
- 常用正则库
- 正则生成说明
- 匹配/替换预览

**验收标准**:
- ✅ 测试结果准确
- ✅ 常用库齐全

---

### Phase 3 验收清单
- [ ] JSON工具完整功能可用
- [ ] 二维码工具正常
- [ ] 颜色工具正常
- [ ] 正则表达式工具正常
- [ ] 首页显示所有新工具
- [ ] 所有新工具集成导航系统

---

## 📋 技术债务清单

在开发过程中需要解决的技术问题：

- [ ] 提取公共CSS变量到 `css/shared.css`
- [ ] 统一所有工具的代码风格
- [ ] 添加JSDoc注释到关键函数
- [ ] 创建 `js/utils/debounce.js` 防抖工具
- [ ] 创建 `js/utils/copy.js` 统一复制函数
- [ ] 添加错误日志收集（可选：Sentry）

---

## 🧪 测试计划

### 跨浏览器测试
- [ ] Chrome (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (最新版)
- [ ] Edge (最新版)
- [ ] 移动浏览器（iPhone Safari, Android Chrome）

### 响应式测试
- [ ] 手机 (320px ~ 480px)
- [ ] 平板 (768px ~ 1024px)
- [ ] 桌面 (1200px+)

### 性能测试
- [ ] Lighthouse评分 >90
- [ ] 首屏加载 <2秒
- [ ] 交互延迟 <100ms

### 功能测试
- [ ] 所有工具基本功能正常
- [ ] 所有导航链接可用
- [ ] 所有导出功能正常
- [ ] 夜间模式完全正常
- [ ] 历史记录保存正常

---

## 📈 成功指标

完成本开发计划后的预期改进：

| 指标 | 当前 | 目标 | 改进 |
|------|------|------|------|
| 用户体验评分 | 7/10 | 9/10 | +28% |
| 页面加载速度 | 3.5s | <2s | -43% |
| Lighthouse性能 | 75 | >90 | +20% |
| 工具数量 | 8 | 12+ | +50% |
| 代码可维护性 | 中 | 高 | ++ |

---

## 👥 开发资源

### 需要的库和工具
- **Markdown**: marked.js
- **代码高亮**: highlight.js
- **PDF导出**: html2pdf.js
- **QR码**: qrcode.min.js
- **其他**: 已有的Font Awesome + Bootstrap等

### 开发工具（可选）
- VSCode + Live Server
- Chrome DevTools
- Lighthouse CI
- Git版本控制

---

## 📞 沟通与反馈

- 每周一回顾进度
- 每个Task完成后测试验收
- 用户测试反馈后优化
- 文档同步更新

---

## 附录：快速参考

### Git分支策略
```bash
# 新功能
git checkout -b feature/toast-system
git commit -m "feat: add global toast notification system"

# Bug修复
git checkout -b fix/navbar-responsive
git commit -m "fix: fix navbar responsive issue on mobile"

# 性能优化
git checkout -b perf/wordcount-worker
git commit -m "perf: use web worker for large file processing"
```

### 提交规范
```
feat: 新功能
fix: Bug修复
perf: 性能优化
style: 样式调整
refactor: 代码重构
docs: 文档更新
chore: 其他改动
```

---

**Last Updated**: 2026-05-06  
**Status**: 📋 Planning  
**Next Review**: Week 1 End
