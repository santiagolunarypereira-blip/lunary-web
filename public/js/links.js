/* Lunary — página de links: reproductor liviano del podcast y aviso de cookies */
(function () {
  'use strict';

  // El reproductor de SoundCloud solo se carga cuando la persona toca play
  Array.prototype.forEach.call(document.querySelectorAll('.media__item'), function (btn) {
    btn.addEventListener('click', function () {
      var frame = document.createElement('div');
      frame.className = 'media__frame';
      var iframe = document.createElement('iframe');
      iframe.src = btn.getAttribute('data-src');
      iframe.title = 'Roots Podcast Series — SoundCloud';
      iframe.setAttribute('allow', 'autoplay; encrypted-media');
      frame.appendChild(iframe);
      btn.replaceWith(frame);
    });
  });

  var COOKIE_KEY = 'lunary_cookies_ok';
  var bar = document.querySelector('.cookie');
  if (!bar) return;
  var seen = false;
  try { seen = localStorage.getItem(COOKIE_KEY) === '1'; } catch (e) { /* modo privado */ }
  if (seen) return;
  bar.hidden = false;
  bar.querySelector('.cookie__ok').addEventListener('click', function () {
    try { localStorage.setItem(COOKIE_KEY, '1'); } catch (e) { /* nada */ }
    bar.hidden = true;
  });
})();
