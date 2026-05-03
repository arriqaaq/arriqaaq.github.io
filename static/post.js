(function () {
  'use strict';

  // Reading progress bar
  var bar = document.getElementById('reading-progress');
  if (bar) {
    var update = function () {
      var max = document.body.scrollHeight - window.innerHeight;
      if (max <= 0) { bar.style.width = '0%'; return; }
      var pct = (window.scrollY / max) * 100;
      if (pct < 0) pct = 0; if (pct > 100) pct = 100;
      bar.style.width = pct + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // h2 fade-in on enter
  if ('IntersectionObserver' in window) {
    var heads = document.querySelectorAll('.reading-body h2');
    if (heads.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('is-visible'); });
      }, { rootMargin: '0px 0px -20% 0px', threshold: 0.1 });
      heads.forEach(function (h) { io.observe(h); });
    }
  } else {
    document.querySelectorAll('.reading-body h2').forEach(function (h) { h.classList.add('is-visible'); });
  }

  // Copy-link button
  var copyBtn = document.getElementById('copy-link');
  if (copyBtn) {
    copyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var link = copyBtn.getAttribute('data-link') || window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(function () {
          copyBtn.classList.add('is-copied');
          setTimeout(function () { copyBtn.classList.remove('is-copied'); }, 1500);
        }).catch(function () {});
      }
    });
  }
}());

// Verse-number navigator
(function () {
  var nav = document.getElementById('verse-nav');
  var list = document.getElementById('verse-nav-list');
  if (!nav || !list) return;
  var heads = Array.prototype.slice.call(document.querySelectorAll('.reading-body h2'));
  if (heads.length < 2) return;
  document.body.classList.add('show-verse-nav');
  nav.hidden = false;

  heads.forEach(function (h, i) {
    var n = (i + 1).toString().padStart(2, '0');
    if (!h.id) h.id = 'verse-' + n;
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = n;
    a.dataset.target = h.id;
    li.appendChild(a); list.appendChild(li);
  });

  var current = null;
  function setActive(id) {
    if (current === id) return;
    current = id;
    list.querySelectorAll('a').forEach(function (a) {
      a.classList.toggle('is-active', a.dataset.target === id);
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    heads.forEach(function (h) { io.observe(h); });
  }

  list.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    var t = document.getElementById(a.dataset.target);
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  var shuffle = document.getElementById('verse-nav-shuffle');
  if (shuffle) shuffle.addEventListener('click', function () {
    var h = heads[Math.floor(Math.random() * heads.length)];
    if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  var listToggle = document.getElementById('verse-nav-list-toggle');
  if (listToggle) listToggle.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}());

// Wrap tables in a horizontal-scroll container (Ghost emits bare <table> with inline min-width)
(function () {
  document.querySelectorAll('.reading-body table').forEach(function (t) {
    if (t.parentElement && t.parentElement.classList.contains('table-wrap')) return;
    var w = document.createElement('div');
    w.className = 'table-wrap';
    t.parentNode.insertBefore(w, t);
    w.appendChild(t);
  });
}());
