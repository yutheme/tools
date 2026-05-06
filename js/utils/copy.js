/**
 * 统一的复制工具函数
 * 
 * 支持现代浏览器和旧浏览器的兼容性方案
 * - 现代浏览器：使用 Clipboard API（推荐）
 * - 旧浏览器：使用 document.execCommand（降级方案）
 * 
 * 使用示例：
 * await copyToClipboard('要复制的文本');
 * copyToClipboard('文本', { toast: true, timeout: 2000 });
 */

/**
 * 将文本复制到剪贴板
 * @param {string} text 要复制的文本
 * @param {Object} options 配置选项
 * @param {boolean} options.toast 是否显示Toast提示（需要Toast全局对象）
 * @param {boolean} options.vibrate 是否触发手机振动反馈
 * @param {string} options.successMsg 成功消息
 * @param {string} options.errorMsg 失败消息
 * @returns {Promise<boolean>} 是否复制成功
 * 
 * @example
 * // 基础用法
 * await copyToClipboard('Hello World');
 * 
 * // 带Toast提示
 * await copyToClipboard('Hello', { toast: true });
 * 
 * // 自定义消息
 * await copyToClipboard('Hello', {
 *   toast: true,
 *   successMsg: '复制成功！',
 *   errorMsg: '复制失败了'
 * });
 */
async function copyToClipboard(text, options = {}) {
  const {
    toast = true,
    vibrate = true,
    successMsg = '已复制 ✓',
    errorMsg = '复制失败，请手动复制'
  } = options;

  // 参数验证
  if (typeof text !== 'string') {
    text = String(text);
  }

  if (!text) {
    if (toast && typeof Toast !== 'undefined') {
      Toast.warning('没有内容可复制');
    }
    return false;
  }

  try {
    // 方案1：现代 Clipboard API（推荐）
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        
        // 成功反馈
        if (toast && typeof Toast !== 'undefined') {
          Toast.success(successMsg);
        }
        if (vibrate && navigator.vibrate) {
          navigator.vibrate(30);
        }
        
        return true;
      } catch (clipboardErr) {
        // Clipboard API 失败，降级到方案2
        console.warn('Clipboard API 失败，使用备选方案:', clipboardErr);
        return copyToClipboardFallback(text, options);
      }
    } else {
      // 直接使用降级方案
      return copyToClipboardFallback(text, options);
    }
  } catch (err) {
    console.error('复制失败:', err);
    if (toast && typeof Toast !== 'undefined') {
      Toast.error(errorMsg);
    }
    return false;
  }
}

/**
 * 降级方案：使用 document.execCommand
 * 用于不支持 Clipboard API 的旧浏览器
 * @private
 */
function copyToClipboardFallback(text, options = {}) {
  const {
    toast = true,
    vibrate = true,
    successMsg = '已复制 ✓',
    errorMsg = '复制失败，请手动复制'
  } = options;

  try {
    // 创建临时textarea
    const textarea = document.createElement('textarea');
    
    // 设置样式，使其不可见但可交互
    textarea.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      opacity: 0;
      pointer-events: none;
      z-index: -9999;
    `;
    
    textarea.value = text;
    document.body.appendChild(textarea);

    // 选中文本
    textarea.select();
    textarea.setSelectionRange(0, text.length);

    // 执行复制命令
    const successful = document.execCommand('copy');

    // 移除textarea
    document.body.removeChild(textarea);

    if (successful) {
      // 成功反馈
      if (toast && typeof Toast !== 'undefined') {
        Toast.success(successMsg);
      }
      if (vibrate && navigator.vibrate) {
        navigator.vibrate(30);
      }
      return true;
    } else {
      throw new Error('execCommand 返回 false');
    }
  } catch (err) {
    console.error('降级方案复制失败:', err);
    if (toast && typeof Toast !== 'undefined') {
      Toast.error(errorMsg);
    }
    return false;
  }
}

/**
 * 复制元素的文本内容
 * @param {HTMLElement|string} selector 元素或选择器
 * @param {Object} options 配置选项
 * @returns {Promise<boolean>} 是否复制成功
 * 
 * @example
 * // 复制元素内容
 * await copyElementText('#result');
 * 
 * // 复制textarea内容
 * await copyElementText(document.getElementById('output'));
 */
async function copyElementText(selector, options = {}) {
  let element;

  if (typeof selector === 'string') {
    element = document.querySelector(selector);
  } else if (selector instanceof HTMLElement) {
    element = selector;
  }

  if (!element) {
    console.warn('找不到元素:', selector);
    return false;
  }

  const text = element.value || element.textContent;
  return copyToClipboard(text, options);
}

/**
 * 复制JSON对象为字符串
 * @param {Object} obj 要复制的对象
 * @param {Object} options 配置选项
 * @returns {Promise<boolean>} 是否复制成功
 * 
 * @example
 * const data = { name: 'John', age: 30 };
 * await copyJSON(data, { toast: true });
 */
async function copyJSON(obj, options = {}) {
  const { pretty = true, ...otherOptions } = options;
  const jsonStr = pretty 
    ? JSON.stringify(obj, null, 2) 
    : JSON.stringify(obj);
  
  return copyToClipboard(jsonStr, otherOptions);
}

/**
 * 复制时添加前缀和后缀
 * @param {string} text 要复制的文本
 * @param {string} prefix 前缀
 * @param {string} suffix 后缀
 * @param {Object} options 配置选项
 * @returns {Promise<boolean>} 是否复制成功
 * 
 * @example
 * await copyWithWrap('code123', '```\n', '\n```');
 */
async function copyWithWrap(text, prefix = '', suffix = '', options = {}) {
  const wrappedText = prefix + text + suffix;
  return copyToClipboard(wrappedText, options);
}

/**
 * 复制多行文本
 * @param {Array<string>} lines 文本行数组
 * @param {Object} options 配置选项
 * @returns {Promise<boolean>} 是否复制成功
 * 
 * @example
 * await copyLines(['line1', 'line2', 'line3']);
 */
async function copyLines(lines, options = {}) {
  if (!Array.isArray(lines)) {
    lines = [lines];
  }
  
  const text = lines.join('\n');
  return copyToClipboard(text, options);
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.copyToClipboard = copyToClipboard;
  window.copyElementText = copyElementText;
  window.copyJSON = copyJSON;
  window.copyWithWrap = copyWithWrap;
  window.copyLines = copyLines;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    copyToClipboard,
    copyElementText,
    copyJSON,
    copyWithWrap,
    copyLines
  };
}
