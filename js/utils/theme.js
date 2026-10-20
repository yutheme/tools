/**
 * 主题切换系统
 * 支持：手动切换 + 系统偏好检测 + localStorage 持久化
 * 三种模式：'light'（浅色）/ 'dark'（深色）/ 'system'（跟随系统）
 * 用法：Theme.toggle() / Theme.get() / Theme.apply('dark') / Theme.setMode('system')
 */
(function() {
  var THEME_KEY = 'theme';
  var SYSTEM_THEME_MATCHER = window.matchMedia('(prefers-color-scheme: dark)');

  function getSystemTheme() {
    return SYSTEM_THEME_MATCHER.matches ? 'dark' : 'light';
  }

  function getPreferredTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) { /* 存储被禁用：退回默认 */ }
    if (saved) return saved;
    return 'system'; // 默认跟随系统
  }

  function getEffectiveTheme() {
    var mode = getPreferredTheme();
    if (mode === 'system') return getSystemTheme();
    return mode;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    var current = getPreferredTheme();
    var next;
    if (current === 'light') next = 'dark';
    else if (current === 'dark') next = 'system';
    else next = 'light';
    
    try { localStorage.setItem(THEME_KEY, next); } catch (err) { /* 无痕模式或配额超限：静默降级 */ }
    var effective = getEffectiveTheme();
    applyTheme(effective);
    return { mode: next, effective: effective };
  }

  function setMode(mode) {
    if (mode !== 'light' && mode !== 'dark' && mode !== 'system') {
      console.warn('Invalid theme mode:', mode);
      return getEffectiveTheme();
    }
    try { localStorage.setItem(THEME_KEY, mode); } catch (err) { /* 无痕模式或配额超限：静默降级 */ }
    var effective = getEffectiveTheme();
    applyTheme(effective);
    return { mode: mode, effective: effective };
  }

  // 页面加载时立即应用（与 <head> 内联脚本配合）
  applyTheme(getEffectiveTheme());

  // 监听系统偏好变化
  SYSTEM_THEME_MATCHER.addEventListener('change', function(e) {
    var mode = getPreferredTheme();
    if (mode === 'system') {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  window.Theme = {
    get: getPreferredTheme,
    getEffective: getEffectiveTheme,
    toggle: toggleTheme,
    setMode: setMode,
    apply: applyTheme,
    getSystemTheme: getSystemTheme
  };
})();
