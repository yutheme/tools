/**
 * 防抖和节流工具
 * 
 * 防抖（Debounce）：在指定时间内多次调用只执行最后一次
 * 应用场景：搜索输入、窗口大小改变、自动保存
 * 
 * 节流（Throttle）：在指定时间内最多执行一次
 * 应用场景：页面滚动、鼠标移动、频繁点击
 * 
 * 使用示例：
 * const debouncedSearch = debounce(searchFunc, 300);
 * input.addEventListener('input', debouncedSearch);
 * 
 * const throttledScroll = throttle(scrollFunc, 1000);
 * window.addEventListener('scroll', throttledScroll);
 */

/**
 * 防抖函数
 * @param {Function} func 要执行的函数
 * @param {number} wait 等待时间（毫秒）
 * @param {Object} options 配置选项
 * @param {boolean} options.leading 是否在延迟前立即执行
 * @param {boolean} options.trailing 是否在延迟后执行
 * @param {number} options.maxWait 最大等待时间
 * @returns {Function} 防抖后的函数
 * 
 * @example
 * const debouncedFunc = debounce(myFunc, 300);
 * debouncedFunc(); // 300ms后执行一次
 */
function debounce(func, wait = 300, options = {}) {
  let timeout;
  let maxTimeout;
  let lastArgs;
  let lastThis;
  let result;
  const leading = options.leading ?? false;
  const trailing = options.trailing ?? true;
  const maxWait = options.maxWait ?? null;

  function invoke() {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = lastThis = undefined;
    result = func.apply(thisArg, args);
    return result;
  }

  function clearTimers() {
    if (timeout !== undefined) {
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (maxTimeout !== undefined) {
      clearTimeout(maxTimeout);
      maxTimeout = undefined;
    }
  }

  function trailingEdge() {
    timeout = undefined;
    if (trailing && lastArgs) {
      const value = invoke();
      if (maxTimeout !== undefined) {
        clearTimeout(maxTimeout);
        maxTimeout = undefined;
      }
      return value;
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function debounced(...args) {
    const shouldCallLeading = leading && timeout === undefined;

    lastArgs = args;
    lastThis = this;

    if (timeout !== undefined) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(trailingEdge, wait);

    if (maxWait && maxTimeout === undefined) {
      maxTimeout = setTimeout(() => {
        clearTimers();
        if (lastArgs) {
          invoke();
        }
      }, maxWait);
    }

    if (shouldCallLeading) {
      return invoke();
    }

    return result;
  }

  debounced.cancel = () => {
    clearTimers();
    lastArgs = lastThis = undefined;
  };

  debounced.flush = () => {
    if (timeout === undefined) {
      return result;
    }
    clearTimers();
    return lastArgs ? invoke() : result;
  };

  return debounced;
}

/**
 * 节流函数
 * @param {Function} func 要执行的函数
 * @param {number} wait 间隔时间（毫秒）
 * @param {Object} options 配置选项
 * @param {boolean} options.leading 是否在开始立即执行
 * @param {boolean} options.trailing 是否在结束时执行
 * @returns {Function} 节流后的函数
 * 
 * @example
 * const throttledFunc = throttle(myFunc, 1000);
 * window.addEventListener('scroll', throttledFunc);
 */
function throttle(func, wait = 1000, options = {}) {
  let timeout;
  let previous = 0;
  let leading = options.leading ?? true;
  let trailing = options.trailing ?? true;

  function throttled(...args) {
    const now = Date.now();

    if (!previous && !leading) {
      previous = now;
    }

    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timeout = undefined;
        func.apply(this, args);
      }, remaining);
    }
  }

  throttled.cancel = () => {
    clearTimeout(timeout);
    previous = 0;
    timeout = undefined;
  };

  return throttled;
}

/**
 * 立即执行防抖（leading edge）
 * 点击时立即执行，之后300ms内不会再次执行
 * @param {Function} func 要执行的函数
 * @param {number} wait 等待时间
 * @returns {Function} 防抖后的函数
 */
function debounceImmediate(func, wait = 300) {
  return debounce(func, wait, { leading: true, trailing: false });
}

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.debounce = debounce;
  window.throttle = throttle;
  window.debounceImmediate = debounceImmediate;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debounce, throttle, debounceImmediate };
}
