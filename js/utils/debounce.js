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
  let lastArgs;
  let lastThis;
  let result;
  let lastCallTime;
  let lastInvokeTime = 0;
  let leading = options.leading ?? false;
  let maxWait = options.maxWait ?? null;
  let trailing = options.trailing ?? true;

  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    lastInvokeTime = time;
    timeout = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function shouldInvoke(time) {
    const timeSinceLastCall = time - (lastCallTime ?? 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeout = setTimeout(timerExpired, Math.max(0, wait - (time - lastCallTime)));
  }

  function trailingEdge(time) {
    timeout = undefined;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeout = undefined;
  }

  function flush() {
    return timeout === undefined ? result : trailingEdge(Date.now());
  }

  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeout === undefined && leading) {
        return leadingEdge(time);
      }
      if (maxWait) {
        timeout = setTimeout(timerExpired, wait);
      }
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
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
