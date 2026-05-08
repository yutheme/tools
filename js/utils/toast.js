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
 * - 流畅动画
 * - 无依赖（纯JavaScript）
 */

const Toast = (() => {
  // ==================== 配置 ====================
  const config = {
    maxToasts: 3,           // 最多显示3条通知
    duration: 2000,         // 默认显示时间
    position: 'top-right',  // 位置：top-right/top-left/bottom-right/bottom-left
    animationDuration: 300  // 动画时长
  };

  // ==================== 颜色和图标映射 ====================
  const typeConfig = {
    success: {
      color: '#10b981',
      bgColor: '#ecfdf5',
      borderColor: '#a7f3d0',
      icon: '✓',
      textColor: '#047857'
    },
    error: {
      color: '#ef4444',
      bgColor: '#fef2f2',
      borderColor: '#fecaca',
      icon: '✕',
      textColor: '#991b1b'
    },
    warning: {
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#fcd34d',
      icon: '⚠',
      textColor: '#92400e'
    },
    info: {
      color: '#3b82f6',
      bgColor: '#eff6ff',
      borderColor: '#bfdbfe',
      icon: 'ⓘ',
      textColor: '#1e40af'
    },
    loading: {
      color: '#8b5cf6',
      bgColor: '#faf5ff',
      borderColor: '#e9d5ff',
      icon: '⟳',
      textColor: '#5b21b6'
    }
  };

  // ==================== DOM 容器初始化 ====================
  const createContainer = () => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    
    // 定位样式
    const positionStyles = {
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;',
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;'
    };

    container.style.cssText = `
      position: fixed;
      ${positionStyles[config.position]}
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;
    
    return container;
  };

  let container = null;
  const toastQueue = [];

  // ==================== 创建Toast元素 ====================
  const createToastElement = (message, type = 'info', duration = config.duration) => {
    const config_type = typeConfig[type] || typeConfig.info;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    
    // 样式
    toast.style.cssText = `
      background: ${config_type.bgColor};
      color: ${config_type.textColor};
      border: 1px solid ${config_type.borderColor};
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      line-height: 1.5;
      max-width: 320px;
      word-break: break-word;
      animation: toastSlideIn ${config.animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      pointer-events: auto;
      user-select: none;
      min-height: 44px;
      box-sizing: border-box;
      transition: all 0.2s ease;
    `;

    // 创建图标
    const icon = document.createElement('span');
    icon.style.cssText = `
      color: ${config_type.color};
      font-size: 18px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      ${type === 'loading' ? 'animation: spin 1s linear infinite;' : ''}
    `;
    icon.textContent = config_type.icon;

    // 创建文本
    const text = document.createElement('span');
    text.textContent = message;
    text.style.cssText = `
      flex: 1;
      word-break: break-word;
    `;

    // 创建关闭按钮（可选）
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: ${config_type.color};
      cursor: pointer;
      font-size: 16px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
      opacity: 0.6;
      border-radius: 4px;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '0.6';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      removeToast(toast, true);
    };

    toast.appendChild(icon);
    toast.appendChild(text);
    toast.appendChild(closeBtn);

    // 自动消失（loading类型不消失）
    if (duration > 0 && type !== 'loading') {
      setTimeout(() => removeToast(toast, false), duration);
    }

    return toast;
  };

  // ==================== 移除Toast ====================
  const removeToast = (toastElement, immediate = false) => {
    toastElement.style.animation = `toastSlideOut ${config.animationDuration}ms cubic-bezier(0.7, 0, 0.84, 0) forwards`;
    
    setTimeout(() => {
      toastElement.remove();
      toastQueue.shift();
      
      // 显示下一个等待中的Toast
      if (toastQueue.length > 0) {
        container.appendChild(toastQueue[0]);
      }
    }, immediate ? 0 : config.animationDuration);
  };

  // ==================== 显示Toast ====================
  const show = (message, type = 'info', duration = config.duration) => {
    // 初始化容器（首次调用时）
    if (!container) {
      container = createContainer();
      document.body.appendChild(container);
    }

    const toastElement = createToastElement(message, type, duration);

    // 队列管理
    if (container.children.length >= config.maxToasts) {
      toastQueue.push(toastElement);
    } else {
      container.appendChild(toastElement);
    }

    return toastElement;
  };

  // ==================== 注入CSS动画 ====================
  const injectStyles = () => {
    if (document.getElementById('toast-styles')) return; // 避免重复

    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toastSlideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes toastSlideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* 响应式调整 */
      @media (max-width: 480px) {
        #toast-container {
          left: 12px !important;
          right: 12px !important;
          max-width: none !important;
        }
        
        .toast {
          max-width: none !important;
          font-size: 13px;
          padding: 10px 12px;
        }
      }

      /* 深色模式适配 */
      @media (prefers-color-scheme: dark) {
        .toast {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
      }

      /* 打印时隐藏 */
      @media print {
        #toast-container {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  // ==================== 初始化 ====================
  injectStyles();

  // ==================== 公开API ====================
  return {
    /**
     * 显示通用Toast
     * @param {string} message 消息文本
     * @param {string} type 类型：success|error|warning|info|loading
     * @param {number} duration 显示时长（毫秒），0表示不自动关闭
     * @returns {HTMLElement} Toast元素
     */
    show(message, type = 'info', duration = config.duration) {
      return show(message, type, duration);
    },

    /**
     * 成功提示
     * @param {string} message 消息文本
     * @param {number} duration 显示时长（默认2000ms）
     */
    success(message, duration = 2000) {
      return this.show(message, 'success', duration);
    },

    /**
     * 错误提示
     * @param {string} message 消息文本
     * @param {number} duration 显示时长（默认3000ms）
     */
    error(message, duration = 3000) {
      return this.show(message, 'error', duration);
    },

    /**
     * 警告提示
     * @param {string} message 消息文本
     * @param {number} duration 显示时长（默认2500ms）
     */
    warning(message, duration = 2500) {
      return this.show(message, 'warning', duration);
    },

    /**
     * 信息提示
     * @param {string} message 消息文本
     * @param {number} duration 显示时长（默认2000ms）
     */
    info(message, duration = 2000) {
      return this.show(message, 'info', duration);
    },

    /**
     * 加载提示
     * @param {string} message 消息文本
     * @returns {HTMLElement} Toast元素（用于后续关闭）
     */
    loading(message) {
      return this.show(message, 'loading', 0);
    },

    /**
     * 关闭指定的Toast或Loading
     * @param {HTMLElement} toastElement Toast元素
     */
    hide(toastElement) {
      if (toastElement && toastElement.parentElement) {
        removeToast(toastElement, true);
      }
    },

    /**
     * 关闭Loading（别名）
     * @param {HTMLElement} toastElement Loading元素
     */
    hideLoading(toastElement) {
      this.hide(toastElement);
    },

    /**
     * 清空所有Toast
     */
    clear() {
      if (container) {
        while (container.firstChild) {
          container.firstChild.remove();
        }
        toastQueue.length = 0;
      }
    },

    /**
     * 配置Toast系统
     * @param {Object} options 配置选项
     */
    config(options) {
      Object.assign(config, options);
    }
  };
})();

// ==================== 导出 ====================
// 浏览器全局对象
if (typeof window !== 'undefined') {
  window.Toast = Toast;
}

// CommonJS/Node.js导出（如果需要）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Toast;
}
