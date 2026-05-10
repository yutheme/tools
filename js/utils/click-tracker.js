/**
 * 工具点击追踪器
 * 记录并管理工具卡片的点击次数（仅用于排序，不显示）
 */
const ClickTracker = (() => {
  const STORAGE_KEY = 'tool_clicks';
  
  // 获取所有点击记录
  function getAll() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  }
  
  // 获取单个工具的点击量
  function get(toolUrl) {
    const all = getAll();
    return all[toolUrl] || 0;
  }
  
  // 增加点击量并返回新值
  function increment(toolUrl) {
    const all = getAll();
    all[toolUrl] = (all[toolUrl] || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return all[toolUrl];
  }
  
  // 按点击量排序工具列表（降序）
  function sortByClicks(tools) {
    return [...tools].sort((a, b) => {
      const clicksA = get(a.url);
      const clicksB = get(b.url);
      return clicksB - clicksA; // 降序
    });
  }
  
  // 重置所有点击数据（用于调试）
  function reset() {
    localStorage.removeItem(STORAGE_KEY);
  }
  
  return {
    get,
    increment,
    getAll,
    sortByClicks,
    reset
  };
})();

// 导出到全局
if (typeof window !== 'undefined') {
  window.ClickTracker = ClickTracker;
}
