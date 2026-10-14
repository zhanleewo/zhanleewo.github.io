// TruthPad 官网交互：语言切换（中/英）、主题切换（深/浅）。
// 纯原生 JS，无任何依赖、无外部请求；禁用 JS 时页面默认深色 + 中文，内容完整可读。
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY_LANG = 'truthpad.site.lang';
  var KEY_THEME = 'truthpad.site.theme';

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* 隐私模式下忽略 */ }
  }

  function applyLang(lang) {
    root.dataset.lang = lang;
    root.lang = lang === 'en' ? 'en' : 'zh-CN';
    write(KEY_LANG, lang);
  }

  function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'light' ? '☀' : '☾';
    write(KEY_THEME, theme);
  }

  applyLang(read(KEY_LANG) === 'en' ? 'en' : 'zh');
  applyTheme(read(KEY_THEME) === 'light' ? 'light' : 'dark');

  document.getElementById('lang-toggle').addEventListener('click', function () {
    applyLang(root.dataset.lang === 'en' ? 'zh' : 'en');
  });
  document.getElementById('theme-toggle').addEventListener('click', function () {
    applyTheme(document.body.classList.contains('light') ? 'dark' : 'light');
  });

  // ---- 点下载时弹提示（2026-10-15 用户要求：提醒两件事）----
  // 拦所有 release 资产直链：先拦下来弹提示，「继续下载」才真的去下；
  // 勾过「不再提示」（localStorage）就直接放行，不打扰回头客。
  var KEY_DL = 'truthpad.site.dlnotice';
  var dlModal = document.getElementById('dl-modal');
  var pendingHref = '';
  function hideDlModal() { if (dlModal) dlModal.hidden = true; }
  if (dlModal) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href*="/releases/download/"]') : null;
      if (!a) return;
      if (read(KEY_DL) === 'skip') return;              // 不再提示 -> 直接放行
      e.preventDefault();
      pendingHref = a.href;
      dlModal.hidden = false;
      document.getElementById('dl-modal-continue').focus();
    });
    document.getElementById('dl-modal-continue').addEventListener('click', function (e) {
      e.preventDefault();
      if (document.getElementById('dl-modal-skip').checked) write(KEY_DL, 'skip');
      hideDlModal();
      if (pendingHref) window.location.href = pendingHref;   // 真去下载
    });
    document.getElementById('dl-modal-close').addEventListener('click', function () {
      if (document.getElementById('dl-modal-skip').checked) write(KEY_DL, 'skip');
      hideDlModal();
    });
    dlModal.addEventListener('click', function (e) { if (e.target === dlModal) hideDlModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !dlModal.hidden) hideDlModal();
    });
  }

})();
