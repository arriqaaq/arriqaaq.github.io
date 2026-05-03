(function () {
  'use strict';

  var btn = document.getElementById('load-more');
  var nextLink = document.getElementById('next-page');
  if (!btn || !nextLink) return;

  function loadMore() {
    var url = nextLink.getAttribute('href');
    if (!url) return;
    btn.disabled = true;
    btn.textContent = '…';
    fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var feed = document.querySelector('.feed');
        var newItems = doc.querySelectorAll('.feed .feed-item');
        if (feed) newItems.forEach(function (n) { feed.appendChild(n); });
        var newNext = doc.getElementById('next-page');
        if (newNext) {
          nextLink.setAttribute('href', newNext.getAttribute('href'));
          btn.disabled = false;
          btn.textContent = 'Load more';
        } else {
          var wrap = document.querySelector('.pagination-wrap');
          if (wrap) wrap.parentNode.removeChild(wrap);
        }
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Try again';
      });
  }

  btn.addEventListener('click', function (e) { e.preventDefault(); loadMore(); });
}());
