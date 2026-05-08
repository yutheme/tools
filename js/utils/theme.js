/**
 * 主题切换系统
 * 支持：手动切换 + 系统偏好检测 + localStorage 持久化
 * 用法：Theme.toggle() / Theme.get() / Theme.apply('dark')
 */
(function() {
  var THEME_KEY = 'theme';

  function getPreferredTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    var next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    return next;
  }

  // 页面加载时立即应用（与 <head> 内联脚本配合）
  applyTheme(getPreferredTheme());

  // 监听系统偏好变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  window.Theme = {
    get: getPreferredTheme,
    toggle: toggleTheme,
    apply: applyTheme
  };
})();
