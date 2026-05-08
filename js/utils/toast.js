/**
 * 全局Toast通知系统
 *
 * 使用示例：
 * Toast.success('已复制')
 * Toast.error('操作失败')
 * Toast.warning('请注意')
 * Toast.info('提示信息')
 * const loading = Toast.loading('正在加载...')
 * Toast.hideLoading(loading)
 *
 * 特性：
 * - 自动消失（可配置时间）
 * - 队列管理（多个Toast依次显示）
 * - 响应式设计（手机/平板/桌面都适配）
 * - 深色模式适配
 * - 流畅动画
 * - 无依赖（纯JavaScript）
 */

var Toast = (function() {
  // ==================== 配置 ====================
  var config = {
    maxToasts: 3,
    duration: 2000,
    position: 'bottom-right',
    animationDuration: 300
  };

  // ==================== 颜色映射（浅色/深色） ====================
  var typeConfig = {
    success: {
      light: {
        color: '#10b981',
        bgColor: '#ecfdf5',
        borderColor: '#a7f3d0',
        icon: '✓',
        textColor: '#047857'
      },
      dark: {
        color: '#34d399',
        bgColor: '#064e3b',
        borderColor: '#065f46',
        icon: '✓',
        textColor: '#6ee7b7'
      }
    },
    error: {
      light: {
        color: '#ef4444',
        bgColor: '#fef2f2',
        borderColor: '#fecaca',
        icon: '✕',
        textColor: '#991b1b'
      },
      dark: {
        color: '#f87171',
        bgColor: '#450a0a',
        borderColor: '#7f1d1d',
        icon: '✕',
        textColor: '#fca5a5'
      }
    },
    warning: {
      light: {
        color: '#f59e0b',
        bgColor: '#fffbeb',
        borderColor: '#fcd34d',
        icon: '⚠',
        textColor: '#92400e'
      },
      dark: {
        color: '#fbbf24',
        bgColor: '#451a03',
        borderColor: '#78350f',
        icon: '⚠',
        textColor: '#fde68a'
      }
    },
    info: {
      light: {
        color: '#3b82f6',
        bgColor: '#eff6ff',
        borderColor: '#bfdbfe',
        icon: 'ⓘ',
        textColor: '#1e40af'
      },
      dark: {
        color: '#60a5fa',
        bgColor: '#172554',
        borderColor: '#1e3a5f',
        icon: 'ⓘ',
        textColor: '#93c5fd'
      }
    },
    loading: {
      light: {
        color: '#8b5cf6',
        bgColor: '#faf5ff',
        borderColor: '#e9d5ff',
        icon: '⟳',
        textColor: '#5b21b6'
      },
      dark: {
        color: '#a78bfa',
        bgColor: '#2e1065',
        borderColor: '#4c1d95',
        icon: '⟳',
        textColor: '#c4b5fd'
      }
    }
  };

  // ==================== 检测当前主题 ====================
  function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function getColorSet(type) {
    var cfg = typeConfig[type] || typeConfig.info;
    return isDarkMode() ? cfg.dark : cfg.light;
  }

  // ==================== DOM 容器初始化 ====================
  var createContainer = function() {
    var container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');

    var positionStyles = {
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'bottom-center': 'bottom: 32px; left: 0; right: 0;'
    };

    container.style.cssText =
      'position: fixed;' +
      positionStyles[config.position] +
      'z-index: 9999;' +
      'display: flex;' +
      'flex-direction: column;' +
      'align-items: flex-end;' +
      'gap: 8px;' +
      'pointer-events: none;' +
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;';

    return container;
  };

  var container = null;
  var toastQueue = [];

  // ==================== 创建Toast元素 ====================
  var createToastElement = function(message, type, duration) {
    if (type === undefined) type = 'info';
    if (duration === undefined) duration = config.duration;

    var colorSet = getColorSet(type);

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', 'alert');

    var shadowColor = isDarkMode() ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.12)';

    toast.style.cssText =
      'background: ' + colorSet.bgColor + ';' +
      'color: ' + colorSet.textColor + ';' +
      'border: 1px solid ' + colorSet.borderColor + ';' +
      'padding: 12px 16px;' +
      'border-radius: 8px;' +
      'box-shadow: 0 4px 12px ' + shadowColor + ';' +
      'display: flex;' +
      'align-items: center;' +
      'gap: 10px;' +
      'font-size: 14px;' +
      'line-height: 1.5;' +
      'max-width: 320px;' +
      'word-break: break-word;' +
      'animation: toastFadeUp ' + config.animationDuration + 'ms cubic-bezier(0.16, 1, 0.3, 1) forwards;' +
      'pointer-events: auto;' +
      'user-select: none;' +
      'min-height: 44px;' +
      'box-sizing: border-box;' +
      'transition: all 0.2s ease;';

    // 图标
    var icon = document.createElement('span');
    var iconAnimation = type === 'loading' ? 'animation: spin 1s linear infinite;' : '';
    icon.style.cssText =
      'color: ' + colorSet.color + ';' +
      'font-size: 18px;' +
      'flex-shrink: 0;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: center;' +
      'width: 20px;' +
      'height: 20px;' +
      iconAnimation;
    icon.textContent = colorSet.icon;

    // 文本
    var text = document.createElement('span');
    text.textContent = message;
    text.style.cssText = 'flex: 1; word-break: break-word;';

    // 关闭按钮
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText =
      'background: transparent;' +
      'border: none;' +
      'color: ' + colorSet.color + ';' +
      'cursor: pointer;' +
      'font-size: 16px;' +
      'padding: 0;' +
      'width: 24px;' +
      'height: 24px;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: center;' +
      'flex-shrink: 0;' +
      'transition: all 0.2s ease;' +
      'opacity: 0.6;' +
      'border-radius: 4px;';
    closeBtn.onmouseover = function() { closeBtn.style.opacity = '1'; };
    closeBtn.onmouseout = function() { closeBtn.style.opacity = '0.6'; };
    closeBtn.onclick = function(e) {
      e.stopPropagation();
      removeToast(toast, true);
    };

    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(closeBtn);

    // 自动消失（loading不消失）
    if (duration > 0 && type !== 'loading') {
      setTimeout(function() { removeToast(toast, false); }, duration);
    }

    return toast;
  };

  // ==================== 移除Toast ====================
  var removeToast = function(toastElement, immediate) {
    toastElement.style.animation = 'toastFadeDown ' + config.animationDuration + 'ms cubic-bezier(0.7, 0, 0.84, 0) forwards';

    var delay = immediate ? 0 : config.animationDuration;
    setTimeout(function() {
      if (toastElement.parentElement) {
        toastElement.remove();
      }
      var idx = toastQueue.indexOf(toastElement);
      if (idx > -1) toastQueue.splice(idx, 1);

      // 显示下一个等待中的Toast
      if (toastQueue.length > 0 && container && container.children.length < config.maxToasts) {
        container.appendChild(toastQueue[0]);
      }
    }, delay);
  };

  // ==================== 显示Toast ====================
  var show = function(message, type, duration) {
    if (type === undefined) type = 'info';
    if (duration === undefined) duration = config.duration;

    // 初始化容器（首次调用时）
    if (!container) {
      container = createContainer();
      document.body.appendChild(container);
    }

    var toastElement = createToastElement(message, type, duration);

    // 队列管理
    if (container.children.length >= config.maxToasts) {
      toastQueue.push(toastElement);
    } else {
      container.appendChild(toastElement);
    }

    return toastElement;
  };

  // ==================== 注入CSS动画 ====================
  var injectStyles = function() {
    if (document.getElementById('toast-styles')) return;

    var style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent =
      '@keyframes toastFadeUp {' +
        'from { transform: translateY(20px); opacity: 0; }' +
        'to { transform: translateY(0); opacity: 1; }' +
      '}' +
      '@keyframes toastFadeDown {' +
        'from { transform: translateY(0); opacity: 1; }' +
        'to { transform: translateY(20px); opacity: 0; }' +
      '}' +
      '@keyframes spin {' +
        'from { transform: rotate(0deg); }' +
        'to { transform: rotate(360deg); }' +
      '}' +
      '@media (max-width: 480px) {' +
        '.toast { max-width: calc(100vw - 32px) !important; font-size: 13px; padding: 10px 12px; }' +
      '}' +
      '@media print {' +
        '#toast-container { display: none !important; }' +
      '}';
    document.head.appendChild(style);
  };

  // ==================== 初始化 ====================
  injectStyles();

  // ==================== 公开API ====================
  return {
    show: function(message, type, duration) {
      if (type === undefined) type = 'info';
      if (duration === undefined) duration = config.duration;
      return show(message, type, duration);
    },

    success: function(message, duration) {
      if (duration === undefined) duration = 2000;
      return show(message, 'success', duration);
    },

    error: function(message, duration) {
      if (duration === undefined) duration = 3000;
      return show(message, 'error', duration);
    },

    warning: function(message, duration) {
      if (duration === undefined) duration = 2500;
      return show(message, 'warning', duration);
    },

    info: function(message, duration) {
      if (duration === undefined) duration = 2000;
      return show(message, 'info', duration);
    },

    loading: function(message) {
      return show(message, 'loading', 0);
    },

    hide: function(toastElement) {
      if (toastElement && toastElement.parentElement) {
        removeToast(toastElement, true);
      }
    },

    hideLoading: function(toastElement) {
      this.hide(toastElement);
    },

    clear: function() {
      if (container) {
        while (container.firstChild) {
          container.firstChild.remove();
        }
        toastQueue.length = 0;
      }
    },

    config: function(options) {
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          config[key] = options[key];
        }
      }
    }
  };
})();

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.Toast = Toast;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Toast;
}
