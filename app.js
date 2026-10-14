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

})();
