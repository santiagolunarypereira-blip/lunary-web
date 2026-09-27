/* ==========================================================================
   Lunary — landing de evento
   1. Cuenta regresiva
   2. Tarjetas del line up: abren la ficha del artista
   3. Reproductores livianos: el embed real se carga solo al tocar
   4. Barra fija de compra (celular)
   5. Aviso de cookies
   ========================================================================== */
(function () {
  'use strict';

  // Fecha del evento: sábado 14 nov 2026, 10:00 PM hora Colombia (UTC-5)
  var START = new Date('2026-11-14T22:00:00-05:00').getTime();
  var END = START + 8 * 60 * 60 * 1000; // la fiesta se da por terminada 8 h después

  /* ------------------------------------------------------------------ 1 */
  var cells = {
    d: document.querySelector('.js-cd-d'),
    h: document.querySelector('.js-cd-h'),
    m: document.querySelector('.js-cd-m'),
    s: document.querySelector('.js-cd-s')
  };
  var cdWrap = document.querySelector('.countdown__cells');
  var cdLabel = document.querySelector('.countdown__label');
  var cdDone = document.querySelector('.countdown__done');
  var timer = 0;

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function finish(text) {
    if (cdWrap) cdWrap.hidden = true;
    if (cdLabel) cdLabel.hidden = true;
    if (cdDone) { cdDone.textContent = text; cdDone.hidden = false; }
  }

  function tick() {
    var now = Date.now();
    if (now >= END) { finish('Gracias por bailar con nosotrxs ;)'); clearInterval(timer); return; }
    if (now >= START) { finish('Estamos en la pista → te esperamos'); return; }
    var t = Math.floor((START - now) / 1000);
    var d = Math.floor(t / 86400); t -= d * 86400;
    var h = Math.floor(t / 3600); t -= h * 3600;
    var m = Math.floor(t / 60);
    var s = t - m * 60;
    if (cells.d) cells.d.textContent = pad(d);
    if (cells.h) cells.h.textContent = pad(h);
    if (cells.m) cells.m.textContent = pad(m);
    if (cells.s) cells.s.textContent = pad(s);
  }
  tick();
  timer = setInterval(tick, 1000);

  /* ------------------------------------------------------------------ 2 */
  function openArtist(id, scroll) {
    var el = document.getElementById(id);
    if (!el || el.tagName !== 'DETAILS') return;
    el.open = true;
    if (scroll) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-open]'), function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var id = a.getAttribute('data-open');
      openArtist(id, true);
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    });
  });

  // Si alguien llega con el link directo a un artista (#artista-...), se abre solo
  if (location.hash && location.hash.indexOf('#artista-') === 0) {
    openArtist(location.hash.slice(1), false);
  }

  // La barra superior es fija: los saltos dejan espacio para que no tape el título
  document.documentElement.style.scrollPaddingTop = '64px';

  /* ------------------------------------------------------------------ 3 */
  function buildSrc(kind, src) {
    if (kind === 'youtube') {
      return 'https://www.youtube-nocookie.com/embed/' + src + '?autoplay=1&rel=0&modestbranding=1';
    }
    return src;
  }

  Array.prototype.forEach.call(document.querySelectorAll('.media__item'), function (btn) {
    btn.addEventListener('click', function () {
      var kind = btn.getAttribute('data-kind');
      var frame = document.createElement('div');
      frame.className = 'media__frame media__frame--' + kind;
      var iframe = document.createElement('iframe');
      iframe.src = buildSrc(kind, btn.getAttribute('data-src'));
      iframe.title = (btn.querySelector('.media__title') || {}).textContent || 'Reproductor';
      iframe.setAttribute('allow', 'autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'lazy');
      frame.appendChild(iframe);
      btn.replaceWith(frame);
    });
  });

  /* ------------------------------------------------------------------ 4 */
  var sticky = document.querySelector('.stickybuy');
  var heroBuy = document.querySelector('.hero .js-buy');
  var closing = document.querySelector('.closing');
  if (sticky && heroBuy && 'IntersectionObserver' in window) {
    var heroVisible = true, closingVisible = false;
    var update = function () {
      var show = !heroVisible && !closingVisible;
      sticky.classList.toggle('is-visible', show);
      sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
      Array.prototype.forEach.call(sticky.querySelectorAll('a'), function (a) {
        a.tabIndex = show ? 0 : -1;
      });
    };
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting; update();
    }).observe(heroBuy);
    if (closing) {
      new IntersectionObserver(function (entries) {
        closingVisible = entries[0].isIntersecting; update();
      }).observe(closing);
    }
  }

  /* ------------------------------------------------------------------ 5 */
  var COOKIE_KEY = 'lunary_cookies_ok';
  var bar = document.querySelector('.cookie');
  if (bar) {
    var seen = false;
    try { seen = localStorage.getItem(COOKIE_KEY) === '1'; } catch (e) { /* modo privado */ }
    if (!seen) {
      bar.hidden = false;
      bar.querySelector('.cookie__ok').addEventListener('click', function () {
        try { localStorage.setItem(COOKIE_KEY, '1'); } catch (e) { /* nada */ }
        bar.hidden = true;
      });
    }
  }
})();
