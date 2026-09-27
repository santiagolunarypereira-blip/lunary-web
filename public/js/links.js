/* Lunary — página de links: aviso de cookies */
(function () {
  'use strict';

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
