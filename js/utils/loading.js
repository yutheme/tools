/**
 * Loading 遮罩管理
 * 用法：Loading.show('正在处理...') / Loading.hide()
 * 支持嵌套调用（引用计数）
 */
(function() {
  var overlay = null;
  var count = 0;
  var messageEl = null;

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div><div class="loading-message"></div>';
    messageEl = overlay.querySelector('.loading-message');
    return overlay;
  }

  var Loading = {
    show: function(message) {
      count++;
      if (!overlay) {
        overlay = createOverlay();
        document.body.appendChild(overlay);
      }
      if (message) {
        messageEl.textContent = message;
        messageEl.style.display = '';
      } else {
        messageEl.style.display = 'none';
      }
      return overlay;
    },

    hide: function() {
      if (count > 0) count--;
      if (count === 0 && overlay) {
        overlay.remove();
        overlay = null;
        messageEl = null;
      }
    },

    wrap: function(promise, message) {
      this.show(message);
      return promise.finally(() => this.hide());
    }
  };

  window.Loading = Loading;
})();
