(function () {
  'use strict';

  // Tag drawer toggle (mobile / tablet)
  var toggle = document.querySelector('.topbar-tag-toggle');
  var panel = document.querySelector('.tag-panel');
  var backdrop = document.querySelector('.tag-panel-backdrop');

  function openDrawer() {
    if (!panel) return;
    panel.classList.add('tag-panel--drawer', 'is-open');
    if (backdrop) backdrop.classList.add('is-open');
  }
  function closeDrawer() {
    if (!panel) return;
    panel.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-open');
  }
  if (toggle) toggle.addEventListener('click', function (e) {
    e.preventDefault();
    if (panel && panel.classList.contains('is-open')) closeDrawer();
    else openDrawer();
  });
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

  // Active rail item based on pathname
  document.addEventListener('DOMContentLoaded', function () {
    var path = window.location.pathname;
    var btns = document.querySelectorAll('.rail-btn[href]');
    btns.forEach(function (btn) {
      var href = btn.getAttribute('href') || '';
      var u;
      try { u = new URL(href, window.location.origin); } catch (err) { return; }
      var p = u.pathname;
      if (p === '/' && path === '/') btn.classList.add('active');
      else if (p !== '/' && (path === p || path.indexOf(p) === 0)) btn.classList.add('active');
    });
  });

  // Cmd/Ctrl + K triggers Ghost search
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      var t = document.querySelector('[data-ghost-search]');
      if (t) t.click();
    }
  });
}());

// Desktop tag-panel — hover-driven open/close, click pins
(function () {
  var app = document.querySelector('.app');
  var btn = document.querySelector('.topbar-panel-toggle');
  var rail = document.querySelector('.rail');
  var panel = document.querySelector('.tag-panel');
  if (!app) return;

  var CLOSE_DELAY = 200;
  var closeTimer = null;
  var pinnedOpen = false;

  function isMobile() { return window.matchMedia('(max-width: 900px)').matches; }
  function clearTimer() { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } }
  function expand() {
    clearTimer();
    app.classList.remove('panel-collapsed');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }
  function collapse() {
    if (pinnedOpen) return;
    app.classList.add('panel-collapsed');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }
  function scheduleCollapse() {
    clearTimer();
    closeTimer = setTimeout(collapse, CLOSE_DELAY);
  }

  // Hover handlers — rail and panel both keep it open; leaving either schedules a close
  function onEnter() { if (isMobile() || pinnedOpen) return; expand(); }
  function onLeave() { if (isMobile() || pinnedOpen) return; scheduleCollapse(); }
  if (rail) { rail.addEventListener('mouseenter', onEnter); rail.addEventListener('mouseleave', onLeave); }
  if (panel) { panel.addEventListener('mouseenter', onEnter); panel.addEventListener('mouseleave', onLeave); }

  // Click pins/unpins (does not persist across loads)
  if (btn) btn.addEventListener('click', function (e) {
    e.preventDefault();
    pinnedOpen = !pinnedOpen;
    if (pinnedOpen) expand();
    else scheduleCollapse();
  });

  // [ keyboard shortcut behaves like the click toggle
  document.addEventListener('keydown', function (e) {
    if (e.key !== '[') return;
    var t = e.target;
    var inField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (inField) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault();
    if (btn) btn.click();
  });
}());
