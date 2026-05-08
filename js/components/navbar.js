/**
 * 全局导航栏组件
 * JS 动态生成 DOM，兼容 file:// 协议
 * 功能：搜索工具、主题切换、GitHub链接、最近使用历史
 */
(function() {
  // 工具列表数据（与 index.html 卡片信息保持一致）
  var toolsData = [
    { name: '数字大写转换', path: '数字大写转换.html', desc: '快速将阿拉伯数字或中文数字转换为符合财务规范的大写金额格式', icon: 'fas fa-right-left', color: '#165DFF' },
    { name: '字数统计工具', path: '字数统计.html', desc: '精准统计文本中的汉字、数字、字母等字符数量', icon: 'far fa-file-lines', color: '#36CFC9' },
    { name: '智能翻译工具', path: '实时翻译工具.html', desc: '自动识别语言类型，支持多语言互译，实时响应', icon: 'fas fa-language', color: '#8B5CF6' },
    { name: '密码生成器', path: 'password-generator.html', desc: '本地生成高强度账号密码，支持用户名+密码、密码强度可视化', icon: 'fas fa-lock', color: '#F59E0B' },
    { name: 'YAML 工具', path: 'yaml-previewer.html', desc: 'YAML 格式化验证，支持YAML⇔JSON双向转换、差异对比', icon: 'fas fa-file-lines', color: '#14B8A6' },
    { name: '剪贴板历史', path: '剪贴板历史.html', desc: '记录复制粘贴历史，一键找回之前复制的内容', icon: 'fas fa-clipboard', color: '#A855F7' },
    { name: '密钥生成器', path: 'key-generator.html', desc: '生成 API Key、UUID、Base62、Hex 等多种格式密钥', icon: 'fas fa-key', color: '#F97316' },
    { name: '在线中文输入法', path: 'vrime.html', desc: '基于RIME的网页中文输入法，支持拼音、五笔、双拼', icon: 'far fa-keyboard', color: '#06B6D4' }
  ];

  var HISTORY_KEY = 'visit_history';
  var MAX_HISTORY = 10;

  // 记录当前页面访问
  function recordVisit() {
    var currentPath = location.pathname.split('/').pop();
    var tool = toolsData.find(function(t) { return t.path === currentPath; });
    if (!tool) return;

    var history = [];
    try { history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { history = []; }

    // 移除相同路径的旧记录
    history = history.filter(function(h) { return h.path !== tool.path; });
    history.unshift({ name: tool.name, path: tool.path, time: Date.now() });
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);

    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch(e) {}
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch(e) { return []; }
  }

  function createNavbar() {
    var nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.id = 'navbar';
    nav.innerHTML =
      '<div class="navbar-container">' +
        '<div class="navbar-left">' +
          '<a href="index.html" class="navbar-logo">' +
            '<i class="fas fa-wrench"></i>' +
            '<span>实用工具集</span>' +
          '</a>' +
        '</div>' +
        '<div class="navbar-right">' +
          '<div class="search-box" style="position:relative;">' +
            '<i class="fas fa-magnifying-glass"></i>' +
            '<input type="text" id="toolSearch" placeholder="搜索工具... (Ctrl+K)" class="search-input">' +
            '<span class="search-hint">Ctrl K</span>' +
            '<div id="searchDropdown" class="search-dropdown" style="display:none;">' +
              '<div id="searchResults" class="search-results"></div>' +
            '</div>' +
          '</div>' +
          '<div class="navbar-btns" style="position:relative;">' +
            '<button id="themeToggle" class="navbar-btn" title="切换深色模式">' +
              '<i class="far fa-moon"></i>' +
            '</button>' +
            '<a href="https://github.com/yutheme/tools" target="_blank" rel="noopener noreferrer" class="navbar-btn" title="GitHub">' +
              '<i class="fab fa-github"></i>' +
            '</a>' +
            '<button id="historyBtn" class="navbar-btn" title="最近使用">' +
              '<i class="fas fa-clock-rotate-left"></i>' +
              '<div id="historyDropdown" class="history-dropdown" style="display:none;">' +
                '<div class="history-header">最近使用</div>' +
                '<div id="historyList" class="history-list"></div>' +
              '</div>' +
            '</button>' +
            '<button id="hamburgerBtn" class="navbar-btn hamburger" title="菜单">' +
              '<span></span><span></span><span></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="mobileMenu" class="mobile-menu"></div>';
    return nav;
  }

  function initSearch() {
    var searchInput = document.getElementById('toolSearch');
    var searchDropdown = document.getElementById('searchDropdown');
    var searchResults = document.getElementById('searchResults');
    if (!searchInput) return;

    // Cmd+K / Ctrl+K 快捷键
    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
      // Esc 关闭搜索
      if (e.key === 'Escape') {
        searchDropdown.style.display = 'none';
        searchInput.blur();
      }
    });

    // 搜索输入
    searchInput.addEventListener('input', function() {
      var query = this.value.toLowerCase().trim();
      if (!query) {
        searchDropdown.style.display = 'none';
        return;
      }

      var results = toolsData.filter(function(tool) {
        return tool.name.toLowerCase().indexOf(query) !== -1 ||
               tool.desc.toLowerCase().indexOf(query) !== -1;
      });

      if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--color-gray-400);font-size:0.85rem;">未找到匹配工具</div>';
      } else {
        searchResults.innerHTML = results.map(function(tool) {
          return '<a href="' + tool.path + '" class="search-item">' +
            '<div class="search-item-icon" style="background:' + tool.color + '15;color:' + tool.color + ';">' +
              '<i class="' + tool.icon + '"></i>' +
            '</div>' +
            '<div class="search-item-info">' +
              '<div class="search-title">' + tool.name + '</div>' +
              '<div class="search-desc">' + tool.desc + '</div>' +
            '</div>' +
          '</a>';
        }).join('');
      }

      searchDropdown.style.display = 'block';
    });

    // 聚焦时显示搜索结果（如果有输入）
    searchInput.addEventListener('focus', function() {
      if (this.value.trim()) {
        this.dispatchEvent(new Event('input'));
      }
    });

    // 点击外部关闭
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.search-box') && !e.target.closest('.search-dropdown')) {
        searchDropdown.style.display = 'none';
      }
    });
  }

  function initTheme() {
    var themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    // 更新图标
    function updateIcon(theme) {
      var icon = themeToggle.querySelector('i');
      if (icon) icon.className = theme === 'dark' ? 'far fa-sun' : 'far fa-moon';
    }

    // 初始化图标
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    updateIcon(current);

    // 点击切换
    themeToggle.addEventListener('click', function() {
      var next = window.Theme ? window.Theme.toggle() : 'dark';
      updateIcon(next);
      if (window.Toast) {
        Toast.success(next === 'dark' ? '已切换到深色模式' : '已切换到浅色模式');
      }
    });
  }

  function initHistory() {
    var historyBtn = document.getElementById('historyBtn');
    var historyDropdown = document.getElementById('historyDropdown');
    var historyList = document.getElementById('historyList');
    if (!historyBtn || !historyDropdown) return;

    historyBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      var isVisible = historyDropdown.style.display !== 'none';
      historyDropdown.style.display = isVisible ? 'none' : 'block';

      if (!isVisible) {
        var history = getHistory();
        if (history.length === 0) {
          historyList.innerHTML = '<div class="history-empty">暂无访问记录</div>';
        } else {
          historyList.innerHTML = history.map(function(item) {
            var date = new Date(item.time);
            var timeStr = date.toLocaleDateString();
            return '<a href="' + item.path + '" class="history-item">' +
              item.name +
              '<small>' + timeStr + '</small>' +
            '</a>';
          }).join('');
        }
      }
    });

    // 点击外部关闭
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#historyBtn') && !e.target.closest('.history-dropdown')) {
        historyDropdown.style.display = 'none';
      }
    });
  }

  function initMobileMenu() {
    var hamburger = document.getElementById('hamburgerBtn');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function() {
      this.classList.toggle('active');
      var isOpen = this.classList.contains('active');

      if (isOpen) {
        var history = getHistory();
        var menuHtml = '';

        // 主题切换
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        menuHtml += '<div class="mobile-menu-item" id="mobileThemeToggle">' +
          '<i class="' + (isDark ? 'far fa-sun' : 'far fa-moon') + '"></i>' +
          (isDark ? '浅色模式' : '深色模式') +
        '</div>';

        // GitHub
        menuHtml += '<a href="https://github.com/yutheme/tools" target="_blank" rel="noopener noreferrer" class="mobile-menu-item">' +
          '<i class="fab fa-github"></i>GitHub' +
        '</a>';

        // 最近使用
        if (history.length > 0) {
          menuHtml += '<div class="history-header" style="margin-top:0.25rem;">最近使用</div>';
          history.slice(0, 5).forEach(function(item) {
            menuHtml += '<a href="' + item.path + '" class="mobile-menu-item">' +
              '<i class="far fa-clock"></i>' + item.name +
            '</a>';
          });
        }

        mobileMenu.innerHTML = menuHtml;
        mobileMenu.classList.add('active');

        // 绑定移动端主题切换
        var mobileThemeBtn = document.getElementById('mobileThemeToggle');
        if (mobileThemeBtn) {
          mobileThemeBtn.addEventListener('click', function() {
            var next = window.Theme ? window.Theme.toggle() : 'dark';
            if (window.Toast) {
              Toast.success(next === 'dark' ? '已切换到深色模式' : '已切换到浅色模式');
            }
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
          });
        }
      } else {
        mobileMenu.classList.remove('active');
      }
    });
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', function() {
    var nav = createNavbar();
    document.body.insertBefore(nav, document.body.firstChild);

    initSearch();
    initTheme();
    initHistory();
    initMobileMenu();
    recordVisit();
  });
})();
