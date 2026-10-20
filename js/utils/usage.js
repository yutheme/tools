/**
 * 工具用量记录 —— 全站唯一的用量数据源
 *
 * 设计要点：
 * 1. 单一 key（tool_usage）：此前 visit_history（navbar）与 tool_clicks（首页排序）
 *    各存一份、语义不同、互不相通；现在统一为一个带版本号的结构，最近使用与
 *    常用排序都由它派生。
 * 2. 读取全程防御：数据损坏、被篡改、存储被禁用（隐私模式）都不会抛错；
 *    解析失败时回退为空表并重建，避免像旧 ClickTracker 那样把整个页面渲染打断。
 * 3. 存储不可用时退化为内存存储：当前会话内功能照常，同时可通过 isAvailable()
 *    告知用户"记录无法保存"。
 * 4. 一次性迁移旧数据（visit_history + tool_clicks），老用户的历史不会丢；
 *    迁移成功后删除旧键。
 *
 * 数据结构：
 *   { v: 2, tools: { 'number-converter.html': { open: 3, use: 2, last: 1792... } } }
 *   open = 打开次数（页面加载），use = 实际使用次数（产生结果的操作）
 */
(function(global) {
  'use strict';

  var STORAGE_KEY = 'tool_usage';
  var VERSION = 2;
  var MAX_TOOLS = 50;          // 只保留最近 50 个工具，防止无限增长

  var memory = null;           // 惰性缓存；存储不可用时即唯一数据源
  var available = null;        // 存储可用性探测结果（惰性）
  var listeners = [];

  function isAvailable() {
    if (available !== null) return available;
    try {
      var probe = '__usage_probe__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      available = true;
    } catch (e) {
      available = false;
    }
    return available;
  }

  function emptyData() {
    return { v: VERSION, tools: {} };
  }

  function readRaw() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function parseJSON(text, fallback) {
    if (!text) return fallback;
    try {
      return JSON.parse(text);
    } catch (e) {
      return fallback;
    }
  }

  // 校验并清洗结构；不合格返回 null（视同无数据）
  function normalize(data) {
    if (!data || typeof data !== 'object' || data.v !== VERSION) return null;
    if (!data.tools || typeof data.tools !== 'object') return null;

    var tools = {};
    Object.keys(data.tools).forEach(function(path) {
      if (!path) return;
      var item = data.tools[path];
      if (!item || typeof item !== 'object') return;
      var open = Number(item.open) || 0;
      var use = Number(item.use) || 0;
      var last = Number(item.last) || 0;
      if (open <= 0 && use <= 0 && !last) return;
      tools[path] = { open: open, use: use, last: last };
    });
    return { v: VERSION, tools: tools };
  }

  // 旧数据迁移：visit_history（最近使用） + tool_clicks（首页点击量）
  function migrate() {
    var data = emptyData();
    var touched = false;

    var old = parseJSON(readRawSafe('visit_history'), []);
    if (Array.isArray(old)) {
      old.forEach(function(item) {
        if (!item || typeof item.path !== 'string' || !item.path) return;
        var target = data.tools[item.path] || { open: 0, use: 0, last: 0 };
        target.open += 1;
        target.last = Math.max(target.last, Number(item.time) || 0);
        data.tools[item.path] = target;
        touched = true;
      });
    }

    var clicks = parseJSON(readRawSafe('tool_clicks'), null);
    if (clicks && typeof clicks === 'object') {
      Object.keys(clicks).forEach(function(path) {
        var count = Number(clicks[path]) || 0;
        if (!path || count <= 0) return;
        var target = data.tools[path] || { open: 0, use: 0, last: 0 };
        target.use += count;
        data.tools[path] = target;
        touched = true;
      });
    }

    return { data: data, touched: touched };
  }

  function readRawSafe(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  // 迁移成功后清理旧键，避免留下无法维护的脏数据
  function cleanupLegacy() {
    if (!isAvailable()) return;
    ['visit_history', 'tool_clicks'].forEach(function(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        /* 清理失败无影响：下次读取仍以 tool_usage 为准 */
      }
    });
  }

  function write(data) {
    memory = data;
    if (!isAvailable()) return false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      // 配额超限等：降级为仅内存，不影响当前会话
      available = false;
      return false;
    }
  }

  function prune(data) {
    var paths = Object.keys(data.tools);
    if (paths.length <= MAX_TOOLS) return data;

    paths.sort(function(a, b) {
      return (data.tools[b].last || 0) - (data.tools[a].last || 0);
    });
    var tools = {};
    paths.slice(0, MAX_TOOLS).forEach(function(p) {
      tools[p] = data.tools[p];
    });
    return { v: VERSION, tools: tools };
  }

  function read() {
    if (memory) return memory;

    var data = normalize(parseJSON(readRaw(), null));
    if (!data) {
      var result = migrate();
      data = result.data;
      if (result.touched) {
        // 迁移结果立即落盘；写失败也不影响，memory 已持有
        write(prune(data));
        cleanupLegacy();
        return memory;
      }
    }
    memory = data;
    return data;
  }

  function notify() {
    listeners.forEach(function(fn) {
      try {
        fn();
      } catch (e) {
        /* 单个订阅者出错不影响其他订阅者 */
      }
    });
  }

  /**
   * 记录一次用量
   * @param {string} path 工具页面路径，如 'number-converter.html'
   * @param {string} kind 'open' = 打开页面；'use' = 真正使用（产生了结果）
   */
  function track(path, kind) {
    if (!path || typeof path !== 'string') return false;

    var data = read();
    var item = data.tools[path] || { open: 0, use: 0, last: 0 };
    item[kind === 'use' ? 'use' : 'open'] += 1;
    item.last = Date.now();
    data.tools[path] = item;

    write(prune(data));
    notify();
    return true;
  }

  function rank(scoreFn, limit, filterFn) {
    var tools = read().tools;
    var list = Object.keys(tools)
      .map(function(path) {
        var item = tools[path];
        return {
          path: path,
          open: item.open,
          use: item.use,
          last: item.last,
          score: scoreFn(item)
        };
      })
      .sort(function(a, b) {
        return b.score - a.score || b.last - a.last;
      });

    if (filterFn) list = list.filter(filterFn);

    var n = (limit === undefined || limit === null) ? 5 : limit;
    return list.slice(0, n);
  }

  /**
   * 最近使用：只取真正访问过的（有 last）。
   * 从旧 tool_clicks 迁移来的条目只有点击次数、没有时间戳，
   * 它们属于「常用」而非「最近」，否则会显示成 1970 年。
   */
  function recent(limit) {
    return rank(function(item) {
      return item.last || 0;
    }, limit, function(item) {
      return item.last > 0;
    });
  }

  // 常用：使用权重高于打开，次数相同按最近时间排
  function frequent(limit) {
    return rank(function(item) {
      return (item.use || 0) * 2 + (item.open || 0);
    }, limit);
  }

  function get(path) {
    var item = read().tools[path];
    return item ? { path: path, open: item.open, use: item.use, last: item.last } : null;
  }

  function clear() {
    write(emptyData());
    notify();
  }

  function subscribe(fn) {
    if (typeof fn === 'function') listeners.push(fn);
  }

  // 其他标签页改动后失效缓存并通知订阅者
  if (global.addEventListener) {
    global.addEventListener('storage', function(e) {
      if (!e || e.key !== STORAGE_KEY) return;
      memory = null;
      notify();
    });
  }

  global.Usage = {
    STORAGE_KEY: STORAGE_KEY,
    isAvailable: isAvailable,
    track: track,
    recent: recent,
    frequent: frequent,
    get: get,
    clear: clear,
    subscribe: subscribe
  };
})(window);
