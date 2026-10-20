// TruthPad 官网交互：语言切换（中/英）、主题切换（深/浅）、下载提示、截图查看器。
// 纯原生 JS，无依赖、无外部请求；禁用 JS 时页面默认深色 + 中文，内容完整可读。
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
    document.title = lang === 'en' ? 'TruthPad — the AI-native editor' : 'TruthPad — 会动手的 AI 编辑器';
    write(KEY_LANG, lang);
  }

  function applyTheme(theme) {
    document.body.classList.toggle('light', theme === 'light');
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'light' ? '☀' : '☾';
    write(KEY_THEME, theme);
  }

  // ?lang=en|zh & ?theme=light|dark 可分享/可截图（优先级高于 localStorage）
  var params = null;
  try { params = new URLSearchParams(window.location.search); } catch (e) { params = null; }
  var paramLang = params ? params.get('lang') : null;
  var paramTheme = params ? params.get('theme') : null;
  applyLang(paramLang === 'en' || paramLang === 'zh' ? paramLang : (read(KEY_LANG) === 'en' ? 'en' : 'zh'));
  applyTheme(paramTheme === 'light' || paramTheme === 'dark' ? paramTheme : (read(KEY_THEME) === 'light' ? 'light' : 'dark'));

  // 用户点过切换后把状态写回 URL：带 ?lang=&theme= 打开的分享链接，刷新后不会又被旧参数覆盖
  function syncUrl() {
    try {
      var u = new URL(window.location.href);
      u.searchParams.set('lang', root.dataset.lang);
      u.searchParams.set('theme', document.body.classList.contains('light') ? 'light' : 'dark');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* 老浏览器忽略 */ }
  }

  document.getElementById('lang-toggle').addEventListener('click', function () {
    applyLang(root.dataset.lang === 'en' ? 'zh' : 'en');
    syncUrl();
  });
  document.getElementById('theme-toggle').addEventListener('click', function () {
    applyTheme(document.body.classList.contains('light') ? 'dark' : 'light');
    syncUrl();
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

  // ---------------------------------------------------------------- Agent 横向画廊
  // 原生滚动 + scroll-snap；左右按钮按"一张卡片 + 间距"滚动，底部细进度条反映位置。
  (function () {
    var gallery = document.getElementById('agent-gallery');
    if (!gallery) return;
    var prev = document.getElementById('agent-gallery-prev');
    var next = document.getElementById('agent-gallery-next');
    var progress = document.getElementById('agent-gallery-progress');

    function gap() {
      var style = window.getComputedStyle(gallery);
      var value = parseFloat(style.columnGap || style.gap);
      return isNaN(value) ? 18 : value;
    }
    function step() {
      var slide = gallery.querySelector('.agent-slide');
      return slide ? slide.getBoundingClientRect().width + gap() : gallery.clientWidth * 0.8;
    }
    function maxScroll() {
      return Math.max(0, gallery.scrollWidth - gallery.clientWidth);
    }
    function update() {
      var max = maxScroll();
      if (prev) prev.disabled = gallery.scrollLeft <= 2;
      if (next) next.disabled = gallery.scrollLeft >= max - 2;
      if (progress) progress.style.width = (max > 0 ? (gallery.scrollLeft / max) * 100 : 100) + '%';
    }
    function go(direction) {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gallery.scrollBy({ left: direction * step(), behavior: reduce ? 'auto' : 'smooth' });
    }

    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    gallery.addEventListener('scroll', update, { passive: true });
    gallery.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      go(e.key === 'ArrowRight' ? 1 : -1);
    });
    window.addEventListener('resize', update);
    requestAnimationFrame(update);
  })();

  // ---------------------------------------------------------------- 截图查看器
  // 点页面上的 .shot 打开；滚轮以光标为中心缩放，按住拖动平移，双击复位。
  // 原图是 2800×1760（2× DPI 截图），这里只在显示时缩放，不另存缩略图。
  var lb = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightbox-img');
  var lbZoom = document.getElementById('lightbox-zoom');
  var lbCloseBtn = document.getElementById('lightbox-close');
  var lbResetBtn = document.getElementById('lightbox-reset');
  if (!lb || !lbImg) return;

  var scale = 1, tx = 0, ty = 0;
  var dragging = false, dragX = 0, dragY = 0, startX = 0, startY = 0;
  var TOP = 58;

  function applyTransform() {
    lbImg.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    if (lbZoom) lbZoom.textContent = Math.round(scale * 100) + '%';
  }

  function clamp() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var iw = (lbImg.naturalWidth || 2800) * scale;
    var ih = (lbImg.naturalHeight || 1760) * scale;
    var m = 60;
    if (iw <= vw - 2 * m) { tx = (vw - iw) / 2; }
    else { tx = Math.max(vw - m - iw, Math.min(m, tx)); }
    if (ih <= vh - TOP - 2 * m) { ty = TOP + (vh - TOP - ih) / 2; }
    else { ty = Math.max(vh - m - ih, Math.min(TOP + m, ty)); }
  }

  function fit() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var iw = lbImg.naturalWidth || 2800;
    var ih = lbImg.naturalHeight || 1760;
    var pad = 28;
    var s = Math.min((vw - pad * 2) / iw, (vh - TOP - pad - 16) / ih);
    scale = Math.max(0.02, Math.min(1, s));
    tx = (vw - iw * scale) / 2;
    ty = TOP + Math.max(0, (vh - TOP - ih * scale) / 2);
    applyTransform();
  }

  function open(src, alt) {
    lb.hidden = false;
    document.body.classList.add('lb-open');
    lbImg.alt = alt || '';
    lbImg.src = src;
    if (lbZoom) lbZoom.textContent = '100%';
    if (lbImg.complete && lbImg.naturalWidth) {
      requestAnimationFrame(fit);
    } else {
      fit();                       // 先用 2800×1760 兜底，load 后再校正
    }
  }

  function close() {
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    lbImg.classList.remove('dragging');
    lbImg.removeAttribute('src');
    dragging = false;
  }

  lbImg.addEventListener('load', function () { if (!lb.hidden) requestAnimationFrame(fit); });
  lbImg.addEventListener('dragstart', function (e) { e.preventDefault(); });

  // 点截图打开（事件委托；.shot 也可能是懒加载后才可见的那一张）
  document.addEventListener('click', function (e) {
    var img = e.target.closest ? e.target.closest('img.shot') : null;
    if (!img) return;
    e.preventDefault();
    open(img.currentSrc || img.src, img.alt);
  });

  lbCloseBtn.addEventListener('click', close);
  lbResetBtn.addEventListener('click', function (e) { e.stopPropagation(); fit(); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

  // 滚轮：以光标为锚点缩放（屏幕坐标 -> 图片坐标 -> 新平移量）
  lb.addEventListener('wheel', function (e) {
    if (lb.hidden) return;
    e.preventDefault();
    var delta = e.deltaY;
    if (e.deltaMode === 1) delta *= 16;
    else if (e.deltaMode === 2) delta *= 100;
    var factor = Math.exp(-delta * 0.0015);
    var next = Math.max(0.08, Math.min(10, scale * factor));
    if (next === scale) return;
    var px = e.clientX - tx;
    var py = e.clientY - ty;
    tx = e.clientX - px * (next / scale);
    ty = e.clientY - py * (next / scale);
    scale = next;
    clamp();
    applyTransform();
  }, { passive: false });

  lbImg.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    dragging = true;
    dragX = e.clientX; dragY = e.clientY;
    startX = tx; startY = ty;
    lbImg.classList.add('dragging');
    try { lbImg.setPointerCapture(e.pointerId); } catch (err) { /* 老浏览器 */ }
  });

  lbImg.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    tx = startX + (e.clientX - dragX);
    ty = startY + (e.clientY - dragY);
    clamp();
    applyTransform();
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    lbImg.classList.remove('dragging');
    try { lbImg.releasePointerCapture(e.pointerId); } catch (err) { /* 已释放 */ }
  }
  lbImg.addEventListener('pointerup', endDrag);
  lbImg.addEventListener('pointercancel', endDrag);
  lbImg.addEventListener('dblclick', function (e) { e.preventDefault(); fit(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lb.hidden) close();
  });

  window.addEventListener('resize', function () { if (!lb.hidden) fit(); });

})();
