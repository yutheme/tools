/**
 * IndexedDB 存储抽象层
 * 
 * 统一管理浏览器本地存储，支持：
 * - 自动初始化和版本管理
 * - 完整的CRUD操作
 * - 事务处理
 * - 错误恢复
 * - localStorage降级方案
 * 
 * 容量：
 * - IndexedDB：50MB+ （推荐）
 * - localStorage：5-10MB （降级方案）
 * 
 * 使用示例：
 * await StorageDB.init();
 * await StorageDB.add('password_history', { password: 'test123' });
 * const all = await StorageDB.getAll('password_history');
 * await StorageDB.delete('password_history', 1);
 */

const StorageDB = (() => {
  const dbName = 'ToolsDB';
  const version = 1;
  
  // 数据存储对象定义
  const stores = {
    'password_history': {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'created', keyPath: 'created' }
      ]
    },
    'key_history': {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    },
    'clipboard_history': {
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' },
        { name: 'content', keyPath: 'content' }
      ]
    },
    'cache': {
      keyPath: 'key',
      indexes: [
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    }
  };

  let db = null;
  let useIndexedDB = true;

  // ==================== 初始化 ====================
  /**
   * 初始化数据库
   * @returns {Promise<IDBDatabase>} 数据库实例
   */
  async function init() {
    // 检查浏览器支持
    if (!('indexedDB' in window)) {
      console.warn('浏览器不支持 IndexedDB，将使用 localStorage');
      useIndexedDB = false;
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);

      request.onerror = () => {
        console.error('数据库打开失败:', request.error);
        useIndexedDB = false;
        reject(request.error);
      };

      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        // 创建所有对象存储（Object Store）
        for (const [storeName, config] of Object.entries(stores)) {
          if (!database.objectStoreNames.contains(storeName)) {
            const objectStore = database.createObjectStore(
              storeName,
              { keyPath: config.keyPath, autoIncrement: config.autoIncrement }
            );

            // 创建索引
            if (config.indexes) {
              config.indexes.forEach(index => {
                objectStore.createIndex(index.name, index.keyPath);
              });
            }
          }
        }
      };
    });
  }

  // ==================== CRUD 操作 ====================
  /**
   * 获取单条记录
   * @param {string} storeName 存储名称
   * @param {*} key 主键值
   * @returns {Promise<Object>} 记录数据
   */
  async function get(storeName, key) {
    if (!useIndexedDB || !db) {
      return localStorage.getItem(`${storeName}:${key}`);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 获取所有记录
   * @param {string} storeName 存储名称
   * @param {number} limit 限制数量（可选）
   * @returns {Promise<Array>} 记录数组
   */
  async function getAll(storeName, limit = null) {
    if (!useIndexedDB || !db) {
      const data = localStorage.getItem(storeName);
      return data ? JSON.parse(data) : [];
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = limit ? store.getAll(undefined, limit) : store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 按索引查询
   * @param {string} storeName 存储名称
   * @param {string} indexName 索引名称
   * @param {*} value 查询值
   * @returns {Promise<Array>} 匹配的记录数组
   */
  async function query(storeName, indexName, value) {
    if (!useIndexedDB || !db) {
      const all = await getAll(storeName);
      return all.filter(item => item[indexName] === value);
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 添加记录
   * @param {string} storeName 存储名称
   * @param {Object} value 记录数据
   * @returns {Promise<number>} 插入的主键值
   */
  async function add(storeName, value) {
    // 添加时间戳
    if (!value.timestamp) {
      value.timestamp = Date.now();
    }

    if (!useIndexedDB || !db) {
      const list = await getAll(storeName);
      const newId = (list[list.length - 1]?.id || 0) + 1;
      value.id = newId;
      list.push(value);
      localStorage.setItem(storeName, JSON.stringify(list));
      return newId;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 更新记录
   * @param {string} storeName 存储名称
   * @param {Object} value 记录数据（必须包含主键）
   * @returns {Promise<*>} 更新的主键值
   */
  async function put(storeName, value) {
    value.updatedAt = Date.now();

    if (!useIndexedDB || !db) {
      const list = await getAll(storeName);
      const index = list.findIndex(item => item.id === value.id);
      if (index > -1) {
        list[index] = value;
      } else {
        list.push(value);
      }
      localStorage.setItem(storeName, JSON.stringify(list));
      return value.id;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * 删除记录
   * @param {string} storeName 存储名称
   * @param {*} key 主键值
   * @returns {Promise<void>}
   */
  async function delete_(storeName, key) {
    if (!useIndexedDB || !db) {
      const list = await getAll(storeName);
      const filtered = list.filter(item => item.id !== key);
      localStorage.setItem(storeName, JSON.stringify(filtered));
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * 清空存储中的所有记录
   * @param {string} storeName 存储名称
   * @returns {Promise<void>}
   */
  async function clear(storeName) {
    if (!useIndexedDB || !db) {
      localStorage.removeItem(storeName);
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // ==================== 批量操作 ====================
  /**
   * 批量添加记录
   * @param {string} storeName 存储名称
   * @param {Array<Object>} values 记录数组
   * @returns {Promise<Array>} 插入的主键值数组
   */
  async function addBatch(storeName, values) {
    const results = [];
    for (const value of values) {
      const id = await add(storeName, value);
      results.push(id);
    }
    return results;
  }

  /**
   * 清理过期数据（基于时间戳）
   * @param {string} storeName 存储名称
   * @param {number} olderThan 清理早于此时间戳的记录（毫秒）
   * @returns {Promise<number>} 删除的记录数
   */
  async function cleanup(storeName, olderThan) {
    const all = await getAll(storeName);
    let count = 0;

    for (const item of all) {
      if (item.timestamp && item.timestamp < olderThan) {
        await delete_(storeName, item.id);
        count++;
      }
    }

    return count;
  }

  /**
   * 导出数据
   * @param {string} storeName 存储名称
   * @returns {Promise<string>} JSON字符串
   */
  async function export_(storeName) {
    const data = await getAll(storeName);
    return JSON.stringify(data, null, 2);
  }

  /**
   * 导入数据
   * @param {string} storeName 存储名称
   * @param {string} jsonStr JSON字符串
   * @returns {Promise<number>} 导入的记录数
   */
  async function import_(storeName, jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data)) {
        throw new Error('导入数据必须是数组格式');
      }

      await clear(storeName);
      const ids = await addBatch(storeName, data);
      return ids.length;
    } catch (err) {
      console.error('导入失败:', err);
      throw err;
    }
  }

  // ==================== 信息查询 ====================
  /**
   * 获取存储统计信息
   * @param {string} storeName 存储名称
   * @returns {Promise<Object>} 统计信息
   */
  async function stats(storeName) {
    const all = await getAll(storeName);
    const timestamps = all
      .filter(item => item.timestamp)
      .map(item => item.timestamp)
      .sort();

    return {
      total: all.length,
      firstEntry: timestamps[0] ? new Date(timestamps[0]) : null,
      lastEntry: timestamps[timestamps.length - 1] ? new Date(timestamps[timestamps.length - 1]) : null,
      useIndexedDB: useIndexedDB
    };
  }

  // ==================== 公开API ====================
  return {
    init,
    get,
    getAll,
    query,
    add,
    put,
    delete: delete_,
    clear,
    addBatch,
    cleanup,
    export: export_,
    import: import_,
    stats,
    
    // 状态检查
    isReady: () => db !== null || !useIndexedDB,
    isIndexedDB: () => useIndexedDB,
    getStores: () => Object.keys(stores)
  };
})();

// ==================== 导出 ====================
if (typeof window !== 'undefined') {
  window.StorageDB = StorageDB;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageDB;
}
