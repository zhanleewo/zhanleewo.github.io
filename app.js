// TruthPad 官网交互：语言切换（中/英）、主题切换（深/浅）、构建命令复制。
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

  var copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    var original = copyBtn.innerHTML;
    var timer = null;
    var flash = function (ok) {
      copyBtn.textContent = ok ? '✓ 已复制 / Copied' : '✗ 复制失败 / Failed';
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { copyBtn.innerHTML = original; timer = null; }, 1400);
    };
    copyBtn.addEventListener('click', function () {
      var text = document.getElementById('build-cmd').textContent;
      // 先走同步路径（file:// 与普通页面都可用，且能立即给出反馈）
      if (legacyCopy(text)) { flash(true); return; }
      // 同步路径不可用时再试异步剪贴板 API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { flash(true); },
          function () { flash(false); }
        );
      } else {
        flash(false);
      }
    });
  }

  // execCommand 回退路径（同步返回是否成功）
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
})();
