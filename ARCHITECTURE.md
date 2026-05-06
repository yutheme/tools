# 🏗️ 项目架构重构指南

## 当前项目结构

```
tools/
├── index.html
├── password-generator.html
├── key-generator.html
├── yaml-previewer.html
├── 字数统计.html
├── 数字大写转换.html
├── 实时翻译工具.html
├── 剪贴板历史.html
├── vrime.html
├── css/
│   └── shared.css
└── icons/
    └── [各工具icon]
```

## 推荐的模块化结构

```
tools/
├── index.html                          # 首页
├── css/
│   ├── shared.css                      # ✅ 现有 - 共享样式
│   ├── themes.css                      # 🆕 主题变量系统
│   ├── components.css                  # 🆕 组件样式
│   ├── navbar.css                      # 🆕 导航栏
│   ├── loading.css                     # 🆕 加载动画
│   └── tools/                          # 🆕 各工具样式
│       ├── password.css
│       ├── markdown.css
│       ├── json.css
│       └── ...
│
├── js/
│   ├── utils/                          # 🆕 工具函数库
│   │   ├── toast.js                    # Toast通知
│   │   ├── storage.js                  # IndexedDB封装
│   │   ├── debounce.js                 # 防抖
│   │   ├── copy.js                     # 复制工具函数
│   │   ├── format.js                   # 格式化函数
│   │   └── request.js                  # API请求（带重试）
│   │
│   ├── workers/                        # 🆕 Web Worker线程
│   │   ├── wordcount-worker.js
│   │   ├── markdown-worker.js
│   │   └── json-worker.js
│   │
│   ├── tools/                          # 🆕 各工具核心逻辑
│   │   ├── password-generator.js
│   │   ├── key-generator.js
│   │   ├── yaml-tool.js
│   │   ├── wordcount-tool.js
│   │   ├── markdown-editor.js
│   │   ├── json-tool.js
│   │   ├── translator.js
│   │   ├── clipboard-history.js
│   │   ├── number-converter.js
│   │   └── ...
│   │
│   ├── components/                     # 🆕 UI组件
│   │   ├── navbar.js
│   │   ├── modal.js
│   │   └── tooltip.js
│   │
│   ├── app.js                          # 🆕 应用入口
│   ├── theme.js                        # 🆕 主题管理
│   └── init.js                         # 🆕 初始化脚本
│
├── html/                               # 🆕 HTML模板和组件
│   ├── navbar.html                     # 导航栏
│   ├── tool-header.html                # 工具页面头部
│   ├── tool-footer.html                # 工具页面底部
│   └── components/
│       ├── toast.html
│       └── loading.html
│
├── pages/                              # 🆕 工具页面重新整理
│   ├── tools/
│   │   ├── password-generator.html     # 重定位
│   │   ├── key-generator.html
│   │   ├── yaml-previewer.html
│   │   ├── markdown-editor.html        # 🆕 新工具
│   │   ├── json-tool.html              # 🆕 新工具
│   │   ├── wordcount.html
│   │   ├── number-converter.html
│   │   ├── translator.html
│   │   ├── clipboard-history.html
│   │   ├── vrime.html
│   │   ├── qrcode-tool.html            # 🆕 新工具
│   │   ├── color-tool.html             # 🆕 新工具
│   │   └── regex-tester.html           # 🆕 新工具
│   │
│   └── docs/                           # 文档页面（可选）
│       ├── guide.html
│       └── changelog.html
│
├── icons/                              # 已有
│   └── [各工具icon]
│
├── DEVELOPMENT_PLAN.md                 # 📋 开发计划
├── ARCHITECTURE.md                     # 📐 本文档
├── README.md                           # ✅ 已有
└── .gitignore
```

---

## Phase 1: 用户体验改进 - 具体实现步骤

### Step 1: 准备基础工具函数库

#### 创建 `js/utils/toast.js`
```javascript
/**
 * 全局Toast通知系统
 * 使用: Toast.success('已复制')
 */

const Toast = (() => {
  // 创建容器
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  document.body.appendChild(container);

  const toastQueue = [];
  const MAX_TOASTS = 3;

  function createToastElement(message, type, duration) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: ${getColorByType(type)};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      animation: slideIn 0.3s ease-out;
      font-size: 14px;
      max-width: 300px;
      word-break: break-word;
    `;

    const icon = getIconByType(type);
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    if (duration > 0) {
      setTimeout(() => removeToast(toast), duration);
    }

    return toast;
  }

  function removeToast(toast) {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      toast.remove();
      toastQueue.shift();
      if (toastQueue.length > 0) {
        container.appendChild(toastQueue[0]);
      }
    }, 300);
  }

  function getColorByType(type) {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
      loading: '#8b5cf6'
    };
    return colors[type] || colors.info;
  }

  function getIconByType(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ⓘ',
      loading: '⟳'
    };
    return icons[type] || '';
  }

  return {
    show(message, type = 'info', duration = 2000) {
      const toast = createToastElement(message, type, duration);
      container.appendChild(toast);
      return toast;
    },

    success(message, duration = 2000) {
      return this.show(message, 'success', duration);
    },

    error(message, duration = 3000) {
      return this.show(message, 'error', duration);
    },

    warning(message, duration = 2500) {
      return this.show(message, 'warning', duration);
    },

    info(message, duration = 2000) {
      return this.show(message, 'info', duration);
    },

    loading(message) {
      return this.show(message, 'loading', 0);
    },

    hideLoading(toast) {
      if (toast) {
        toast.remove();
      }
    }
  };
})();

// CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// 导出
window.Toast = Toast;
```

#### 创建 `js/utils/debounce.js`
```javascript
/**
 * 防抖函数
 * 在指定时间内多次调用只执行最后一次
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 导出
window.debounce = debounce;
```

#### 创建 `js/utils/copy.js`
```javascript
/**
 * 统一的复制函数
 */
async function copyToClipboard(text, showToast = true) {
  try {
    await navigator.clipboard.writeText(text);
    if (showToast) {
      Toast.success('已复制 ✓');
    }
    // 手机振动反馈
    navigator.vibrate?.(30);
    return true;
  } catch (err) {
    if (showToast) {
      Toast.error('复制失败，请手动复制');
    }
    console.error('Copy failed:', err);
    return false;
  }
}

// 导出
window.copyToClipboard = copyToClipboard;
```

#### 创建 `js/utils/storage.js`
```javascript
/**
 * IndexedDB存储抽象层
 * 统一处理历史记录、缓存等数据存储
 */
const StorageDB = (() => {
  let db;
  const dbName = 'ToolsDB';
  const version = 1;
  const stores = {
    'password_history': { keyPath: 'id', autoIncrement: true },
    'key_history': { keyPath: 'id', autoIncrement: true },
    'clipboard_history': { keyPath: 'id', autoIncrement: true },
    'cache': { keyPath: 'key' }
  };

  async function init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        for (const [storeName, options] of Object.entries(stores)) {
          if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, options);
          }
        }
      };
    });
  }

  async function get(storeName, key) {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async function getAll(storeName) {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async function add(storeName, value) {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async function put(storeName, value) {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async function delete_(storeName, key) {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async function clear(storeName) {
    if (!db) await init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  return {
    init,
    get,
    getAll,
    add,
    put,
    delete: delete_,
    clear
  };
})();

// 导出
window.StorageDB = StorageDB;
```

---

### Step 2: 创建全局导航栏

#### 创建 `html/navbar.html`
```html
<!-- 导航栏组件 - 在所有页面中include此文件 -->
<nav class="navbar" id="navbar">
  <div class="navbar-container">
    <!-- 左侧：Logo和标题 -->
    <div class="navbar-left">
      <a href="index.html" class="navbar-logo">
        <i class="fa fa-wrench"></i>
        <span>实用工具集</span>
      </a>
    </div>

    <!-- 中间：搜索框 -->
    <div class="navbar-center">
      <div class="search-box">
        <i class="fa fa-search"></i>
        <input 
          type="text" 
          id="toolSearch" 
          placeholder="搜索工具... (Cmd+K)"
          class="search-input"
        >
        <span class="search-hint">Cmd K</span>
      </div>
    </div>

    <!-- 右侧：操作按钮 -->
    <div class="navbar-right">
      <button id="themeToggle" class="navbar-btn" title="切换深色模式">
        <i class="fa fa-moon-o"></i>
      </button>
      <a href="https://github.com/yutheme/tools" target="_blank" class="navbar-btn" title="GitHub">
        <i class="fa fa-github"></i>
        <span class="star-count">⭐</span>
      </a>
      <button id="historyBtn" class="navbar-btn" title="最近使用">
        <i class="fa fa-history"></i>
      </button>
      <button id="hamburger" class="hamburger" title="菜单">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <!-- 搜索结果下拉菜单 -->
  <div id="searchDropdown" class="search-dropdown" style="display: none;">
    <div id="searchResults" class="search-results"></div>
  </div>

  <!-- 历史记录下拉菜单 -->
  <div id="historyDropdown" class="history-dropdown" style="display: none;">
    <div class="history-header">最近使用</div>
    <div id="historyList" class="history-list"></div>
  </div>
</nav>
```

#### 创建 `css/navbar.css`
```css
/* 导航栏样式 */
.navbar {
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  height: 60px;
  gap: 1rem;
}

.navbar-left {
  flex: 0 0 auto;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 1.1rem;
  transition: opacity 0.2s;
}

.navbar-logo:hover {
  opacity: 0.8;
}

.navbar-center {
  flex: 1;
  max-width: 400px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  background: var(--color-gray-50);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  transition: all 0.2s;
}

.search-box:focus-within {
  border-color: var(--color-primary);
  background: var(--color-white);
  box-shadow: 0 0 0 3px var(--color-primary-ring);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}

.search-hint {
  font-size: 0.7rem;
  color: var(--color-gray-400);
  background: var(--color-gray-100);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

.navbar-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-gray-200);
  background: var(--color-white);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 1rem;
  position: relative;
}

.navbar-btn:hover {
  background: var(--color-gray-50);
  border-color: var(--color-primary);
}

.star-count {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 0.8rem;
}

.hamburger {
  display: none;
  flex-direction: column;
  gap: 4px;
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  cursor: pointer;
}

.hamburger span {
  width: 20px;
  height: 2px;
  background: var(--color-gray-700);
  border-radius: 1px;
}

/* 搜索结果下拉菜单 */
.search-dropdown,
.history-dropdown {
  position: absolute;
  top: 60px;
  background: var(--color-white);
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
  z-index: 200;
}

.search-dropdown {
  right: 1rem;
  min-width: 300px;
}

.history-dropdown {
  right: 50px;
  width: 250px;
}

.search-results,
.history-list {
  display: flex;
  flex-direction: column;
}

.search-item,
.history-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid var(--color-gray-100);
}

.search-item:last-child,
.history-item:last-child {
  border-bottom: none;
}

.search-item:hover,
.history-item:hover {
  background: var(--color-gray-50);
}

.search-title {
  font-weight: 500;
  color: var(--color-gray-900);
  margin-bottom: 0.25rem;
}

.search-desc {
  font-size: 0.85rem;
  color: var(--color-gray-500);
}

.history-header {
  padding: 0.75rem 1rem;
  font-weight: 500;
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

/* 响应式 */
@media (max-width: 768px) {
  .navbar-container {
    height: 50px;
    padding: 0 0.75rem;
  }

  .navbar-center {
    flex: 1;
    max-width: none;
  }

  .search-hint {
    display: none;
  }

  .hamburger {
    display: flex;
  }

  .navbar-btn:not(.hamburger) {
    display: none;
  }

  .search-dropdown {
    left: 0.75rem;
    right: 0.75rem;
    min-width: auto;
  }

  .history-dropdown {
    left: 0.75rem;
    right: auto;
  }
}
```

#### 创建 `js/navbar.js`
```javascript
/**
 * 导航栏功能脚本
 */

class Navbar {
  constructor() {
    this.toolsData = null;
    this.searchInput = document.getElementById('toolSearch');
    this.searchDropdown = document.getElementById('searchDropdown');
    this.searchResults = document.getElementById('searchResults');
    this.themeToggle = document.getElementById('themeToggle');
    this.historyBtn = document.getElementById('historyBtn');
    this.historyDropdown = document.getElementById('historyDropdown');
    this.historyList = document.getElementById('historyList');
    
    this.init();
  }

  async init() {
    // 加载工具数据
    await this.loadToolsData();

    // 绑定事件
    this.setupSearchEvents();
    this.setupThemeEvents();
    this.setupHistoryEvents();
  }

  async loadToolsData() {
    // 从index.html中的data属性读取或写死
    this.toolsData = [
      {
        name: '密码生成器',
        path: 'password-generator.html',
        desc: '本地生成高强度密码和用户名'
      },
      {
        name: '密钥生成器',
        path: 'key-generator.html',
        desc: '生成多种格式的API密钥'
      },
      {
        name: 'YAML工具',
        path: 'yaml-previewer.html',
        desc: 'YAML格式化、验证和转换'
      },
      {
        name: '字数统计',
        path: '字数统计.html',
        desc: '精准统计文本字符数量'
      },
      {
        name: '数字大写转换',
        path: '数字大写转换.html',
        desc: '数字转为财务格式大写'
      },
      {
        name: '智能翻译',
        path: '实时翻译工具.html',
        desc: '多语言实时翻译工具'
      },
      {
        name: '剪贴板历史',
        path: '剪贴板历史.html',
        desc: '记录和管理复制历史'
      },
      {
        name: '中文输入法',
        path: 'vrime.html',
        desc: 'RIME网页输入法'
      },
      {
        name: 'Markdown编辑器',
        path: 'markdown-editor.html',
        desc: '实时预览Markdown编辑'
      },
      {
        name: 'JSON工具',
        path: 'json-tool.html',
        desc: 'JSON格式化和验证'
      }
    ];
  }

  setupSearchEvents() {
    // Cmd+K / Ctrl+K打开搜索
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.searchInput.focus();
        this.searchInput.select();
      }
    });

    // 搜索输入事件
    this.searchInput.addEventListener('input', debounce(() => {
      this.performSearch();
    }, 200));

    // 搜索框获得焦点时显示
    this.searchInput.addEventListener('focus', () => {
      if (this.searchInput.value.length > 0) {
        this.performSearch();
      }
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box') && !e.target.closest('.search-dropdown')) {
        this.searchDropdown.style.display = 'none';
      }
    });
  }

  performSearch() {
    const query = this.searchInput.value.toLowerCase();

    if (!query) {
      this.searchDropdown.style.display = 'none';
      return;
    }

    const results = this.toolsData.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.desc.toLowerCase().includes(query)
    );

    this.searchResults.innerHTML = results.map(tool => `
      <a href="${tool.path}" class="search-item">
        <div class="search-title">${tool.name}</div>
        <div class="search-desc">${tool.desc}</div>
      </a>
    `).join('');

    this.searchDropdown.style.display = results.length > 0 ? 'block' : 'none';
  }

  setupThemeEvents() {
    const htmlElement = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');

    // 初始化主题
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    htmlElement.setAttribute('data-theme', initialTheme);
    this.updateThemeIcon(initialTheme);

    // 主题切换
    this.themeToggle.addEventListener('click', () => {
      const currentTheme = htmlElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      this.updateThemeIcon(newTheme);

      Toast.success(`已切换到${newTheme === 'dark' ? '深色' : '浅色'}模式`);
    });
  }

  updateThemeIcon(theme) {
    const icon = this.themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fa fa-sun-o' : 'fa fa-moon-o';
  }

  setupHistoryEvents() {
    this.historyBtn.addEventListener('click', () => {
      const isVisible = this.historyDropdown.style.display !== 'none';
      this.historyDropdown.style.display = isVisible ? 'none' : 'block';
      
      if (!isVisible) {
        this.loadHistoryList();
      }
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#historyBtn') && !e.target.closest('.history-dropdown')) {
        this.historyDropdown.style.display = 'none';
      }
    });
  }

  loadHistoryList() {
    const history = JSON.parse(localStorage.getItem('visit_history') || '[]');
    
    if (history.length === 0) {
      this.historyList.innerHTML = '<div style="padding: 1rem; text-align: center; color: #999;">暂无访问记录</div>';
      return;
    }

    this.historyList.innerHTML = history.map(item => `
      <a href="${item.path}" class="history-item">
        ${item.name}
        <small style="color: #999;">${new Date(item.time).toLocaleDateString()}</small>
      </a>
    `).join('');
  }
}

// 初始化导航栏
document.addEventListener('DOMContentLoaded', () => {
  new Navbar();
});
```

---

### Step 3: 更新首页和工具页面

#### 修改首页 `index.html`
在 `<head>` 中添加：
```html
<!-- 导航栏样式 -->
<link rel="stylesheet" href="css/navbar.css">

<!-- Toast样式（内联或引入） -->
```

在 `<body>` 开头添加：
```html
<div id="navbar-container"></div>
<script>
  // 动态加载导航栏
  fetch('html/navbar.html')
    .then(r => r.text())
    .then(html => {
      document.getElementById('navbar-container').innerHTML = html;
      // 加载导航栏脚本
      const script = document.createElement('script');
      script.src = 'js/navbar.js';
      document.body.appendChild(script);
    });
</script>
```

---

## 完整导入顺序（推荐）

在所有HTML页面的 `<head>` 末尾和 `<body>` 开始处按此顺序导入脚本：

```html
<head>
  <!-- ... 其他meta和link ... -->
  
  <!-- 1. 主题系统 -->
  <link rel="stylesheet" href="css/themes.css">
  
  <!-- 2. 组件样式 -->
  <link rel="stylesheet" href="css/navbar.css">
  <link rel="stylesheet" href="css/loading.css">
  <link rel="stylesheet" href="css/components.css">
  
  <!-- 3. 工具特定样式 -->
  <link rel="stylesheet" href="css/tools/[tool-name].css">
</head>

<body>
  <!-- 1. 全局通知系统 -->
  <script src="js/utils/toast.js"></script>
  
  <!-- 2. 工具函数库 -->
  <script src="js/utils/debounce.js"></script>
  <script src="js/utils/copy.js"></script>
  <script src="js/utils/storage.js"></script>
  
  <!-- 3. 主题管理 -->
  <script src="js/theme.js"></script>
  
  <!-- 4. 导航栏 -->
  <div id="navbar-container"></div>
  <script src="js/navbar.js"></script>
  
  <!-- 5. 工具特定脚本 -->
  <script src="js/tools/[tool-name].js"></script>
</body>
```

---

继续看下一部分的具体实现...
