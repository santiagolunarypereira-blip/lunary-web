/* ==========================================================================
   Lunary — home
   1. Retícula: tamaño de celda exacto para la pantalla
   2. Logo: tamaño en múltiplos de celda + alineado a la retícula
   3. Intro: el logo se arma por bloques, la frase se escribe, aparece el botón
   4. Revelado de píxeles: la textura aparece en bloques bajo el cursor / al tocar
   5. Cortes en mosaico sobre la vegetación
   6. Figuras en wireframe (torus e hiperboloide) girando
   7. Reloj de Pereira, botón pixelado y aviso de cookies
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touchOnly = matchMedia('(hover: none)').matches;
  var wideLayout = matchMedia('(min-width: 900px) and (min-aspect-ratio: 5/4)');

  var stage = document.querySelector('.stage');
  var logo = document.querySelector('.logo');
  var G = { cell: 48, cols: 1, rows: 1, ox: 0, oy: 0, w: 0, h: 0 };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function randInt(a, b) { return Math.floor(rand(a, b + 1)); }

  /* ------------------------------------------------------------------ 1 */
  function computeGrid() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var target = w < 600 ? 44 : w < 1100 ? 58 : 72;
    var cols = Math.max(6, Math.round(w / target));
    var cell = Math.floor(w / cols);
    G.cell = cell;
    G.cols = cols;
    G.ox = Math.floor((w - cols * cell) / 2);
    G.oy = Math.floor((h - Math.floor(h / cell) * cell) / 2);
    G.rows = Math.ceil((h - G.oy) / cell) + 1;
    G.w = w;
    G.h = h;
    root.style.setProperty('--cell', cell + 'px');
    root.style.setProperty('--gx', G.ox + 'px');
    root.style.setProperty('--gy', G.oy + 'px');
  }

  /* ------------------------------------------------------------------ 2 */
  function sizeLogo() {
    var ratio = 600.04 / 392.84;
    var target = wideLayout.matches
      ? Math.min(G.h * 0.62, G.w * 0.42 * ratio)
      : Math.min(G.h * 0.46, G.w * 0.68 * ratio);
    var n = Math.max(3, Math.floor(target / G.cell));
    root.style.setProperty('--logo-h', n * G.cell + 'px');
  }

  function snapToGrid() {
    stage.style.transform = '';
    var r = logo.getBoundingClientRect();
    var gx = G.ox + Math.round((r.left - G.ox) / G.cell) * G.cell;
    var gy = G.oy + Math.round((r.top - G.oy) / G.cell) * G.cell;
    stage.style.transform = 'translate(' + (gx - r.left) + 'px,' + (gy - r.top) + 'px)';
  }

  /* ------------------------------------------------------------------ 3 */
  var tagText = document.querySelector('.tagline__text');
  var fullTag = tagText ? tagText.textContent : '';

  function buildLogoMask() {
    var ns = 'http://www.w3.org/2000/svg';
    var mask = document.getElementById('logo-mask');
    var paths = document.querySelector('.logo__paths');
    if (!mask || !paths) return;
    var W = 392.84, H = 600.04, cols = 12;
    var s = W / cols, rows = Math.ceil(H / s);
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('x', (c * s - 0.5).toFixed(2));
        rect.setAttribute('y', (r * s - 0.5).toFixed(2));
        rect.setAttribute('width', (s + 1).toFixed(2));
        rect.setAttribute('height', (s + 1).toFixed(2));
        rect.setAttribute('fill', '#fff');
        rect.setAttribute('class', 'logo-block');
        // de arriba hacia abajo, con desorden: se siente "armado a mano"
        var d = Math.round(r * 26 + rand(0, 260));
        rect.style.setProperty('--d', d + 'ms');
        mask.appendChild(rect);
      }
    }
    paths.setAttribute('mask', 'url(#logo-mask)');
    logo.classList.add('is-building');
    // al terminar, se quita la máscara para que el logo quede nítido
    setTimeout(function () { paths.removeAttribute('mask'); }, rows * 26 + 320);
  }

  function typeTagline(done) {
    if (!tagText) { done(); return; }
    var i = 0;
    tagText.textContent = '';
    var step = Math.max(8, Math.floor(360 / fullTag.length));
    (function tick() {
      i += 1;
      tagText.textContent = fullTag.slice(0, i);
      if (i < fullTag.length) setTimeout(tick, step);
      else done();
    })();
  }

  function runIntro() {
    if (reduceMotion) { startAmbient(); return; }
    buildLogoMask();
    requestAnimationFrame(function () { root.classList.add('intro-grid'); });
    if (tagText) tagText.textContent = '';
    setTimeout(function () {
      typeTagline(function () {
        root.classList.remove('js-intro');
        startAmbient();
        showCookieNotice();
      });
    }, 640);
  }

  /* ------------------------------------------------------------------ 4 */
  var canvas = document.querySelector('.reveal');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var R = { img: null, off: null, colors: null, dpr: 1, cells: new Map(), raf: 0, ready: false };

  function loadRevealImage() {
    var sources = ['/assets/reveal-paint-green-pink.webp', '/assets/reveal-glitch-pink-green.webp'];
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () { R.img = img; prepareReveal(); };
    img.src = sources[Math.random() < 0.6 ? 0 : 1];
  }

  function prepareReveal() {
    if (!ctx || !R.img) return;
    R.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(G.w * R.dpr);
    canvas.height = Math.round(G.h * R.dpr);

    // textura ajustada tipo "cover" al tamaño de la pantalla
    var off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    var octx = off.getContext('2d');
    var iw = R.img.naturalWidth, ih = R.img.naturalHeight;
    var scale = Math.max(off.width / iw, off.height / ih);
    var dw = iw * scale, dh = ih * scale;
    octx.drawImage(R.img, (off.width - dw) / 2, (off.height - dh) / 2, dw, dh);
    R.off = off;

    // un color promedio por celda, para el efecto "pixel" del manual
    var sm = document.createElement('canvas');
    sm.width = G.cols;
    sm.height = G.rows;
    var sctx = sm.getContext('2d');
    sctx.drawImage(off, 0, 0, G.cols, G.rows);
    try { R.colors = sctx.getImageData(0, 0, G.cols, G.rows).data; } catch (e) { R.colors = null; }

    R.ready = true;
    R.cells.clear();
    if (reduceMotion) staticMosaic();
    draw(performance.now());
  }

  function activate(c, r, opts) {
    if (c < 0 || r < 0 || c >= G.cols || r >= G.rows) return;
    var key = c + r * G.cols;
    var roll = Math.random();
    R.cells.set(key, {
      c: c,
      r: r,
      born: performance.now(),
      hold: opts.hold,
      alpha: rand(0.55, 0.72),
      mode: roll < 0.68 ? 0 : roll < 0.9 ? 1 : 2, // 0 imagen, 1 color plano, 2 bloque desplazado
      shift: Math.random() < 0.5 ? -1 : 1,
      forever: !!opts.forever
    });
    if (!R.raf) R.raf = requestAnimationFrame(draw);
  }

  function cluster(c, r, radius, prob, hold) {
    for (var dy = -radius; dy <= radius; dy++) {
      for (var dx = -radius; dx <= radius; dx++) {
        if ((dx || dy) && Math.random() > prob) continue;
        activate(c + dx, r + dy, { hold: hold + rand(-200, 300) });
      }
    }
  }

  function cellAt(x, y) {
    return { c: Math.floor((x - G.ox) / G.cell), r: Math.floor((y - G.oy) / G.cell) };
  }

  function draw(now) {
    R.raf = 0;
    if (!ctx || !R.ready) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var s = G.cell * R.dpr;
    var ox = G.ox * R.dpr, oy = G.oy * R.dpr;
    var fadeStep = 110; // se apaga en 3 escalones, sin difuminado

    R.cells.forEach(function (cell, key) {
      var a = cell.alpha;
      if (!cell.forever) {
        var age = now - cell.born - cell.hold;
        if (age > 0) {
          var stepN = Math.floor(age / fadeStep) + 1;
          if (stepN >= 4) { R.cells.delete(key); return; }
          a = cell.alpha * (1 - stepN / 4);
        }
      }
      var x = ox + cell.c * s, y = oy + cell.r * s;
      ctx.globalAlpha = a;
      if (cell.mode === 1 && R.colors) {
        var i = (cell.r * G.cols + cell.c) * 4;
        ctx.fillStyle = 'rgb(' + R.colors[i] + ',' + R.colors[i + 1] + ',' + R.colors[i + 2] + ')';
        ctx.fillRect(x, y, s, s);
      } else {
        var sx = cell.mode === 2 ? x + cell.shift * s : x;
        sx = Math.max(0, Math.min(canvas.width - s, sx));
        ctx.drawImage(R.off, sx, y, s, s, x, y, s, s);
      }
    });
    ctx.globalAlpha = 1;

    var hasLiving = false;
    R.cells.forEach(function (cell) { if (!cell.forever) hasLiving = true; });
    if (hasLiving) R.raf = requestAnimationFrame(draw);
  }

  function staticMosaic() {
    var n = Math.round(G.cols * G.rows * 0.06);
    for (var i = 0; i < n; i++) {
      activate(randInt(0, G.cols - 1), randInt(0, G.rows - 1), { forever: true, hold: 0 });
    }
  }

  // Interacción
  var lastKey = -1, lastMove = 0, ambientTimer = 0;

  function onPointerMove(e) {
    if (e.pointerType === 'touch') return;
    lastMove = performance.now();
    var p = cellAt(e.clientX, e.clientY);
    var key = p.c + p.r * G.cols;
    if (key === lastKey) return;
    lastKey = key;
    activate(p.c, p.r, { hold: 1100 });
    cluster(p.c, p.r, 1, 0.35, 900);
  }

  function onPointerDown(e) {
    if (e.target.closest('a, button')) return;
    var p = cellAt(e.clientX, e.clientY);
    cluster(p.c, p.r, 2, 0.55, 1500);
  }

  function ambientTick() {
    if (document.hidden || !R.ready) return;
    // en computador solo corre cuando el mouse está quieto
    if (!touchOnly && performance.now() - lastMove < 2500) return;
    var c = randInt(0, G.cols - 1), r = randInt(0, G.rows - 1);
    cluster(c, r, 1, touchOnly ? 0.45 : 0.3, touchOnly ? 1700 : 1400);
  }

  function startAmbient() {
    if (reduceMotion || ambientTimer) return;
    ambientTimer = setInterval(ambientTick, touchOnly ? 420 : 900);
  }

  /* ------------------------------------------------------------------ 5 */
  var cutLayer = document.querySelector('.cutters');
  var decoImgs = Array.prototype.slice.call(document.querySelectorAll('.deco img'));

  function buildCutters() {
    if (!cutLayer) return;
    cutLayer.textContent = '';
    var frag = document.createDocumentFragment();
    decoImgs.forEach(function (img) {
      if (!img.complete || !img.naturalWidth) return;
      var b = img.getBoundingClientRect();
      if (!b.width || getComputedStyle(img).display === 'none') return;
      var c0 = Math.max(0, Math.floor((b.left - G.ox) / G.cell));
      var c1 = Math.min(G.cols - 1, Math.floor((b.right - G.ox) / G.cell));
      var r0 = Math.max(0, Math.floor((b.top - G.oy) / G.cell));
      var r1 = Math.min(G.rows - 1, Math.floor((b.bottom - G.oy) / G.cell));
      for (var r = r0; r <= r1; r++) {
        for (var c = c0; c <= c1; c++) {
          // más cortes hacia los bordes internos de cada imagen
          if (Math.random() > 0.2) continue;
          var sp = document.createElement('span');
          sp.style.left = G.ox + c * G.cell + 'px';
          sp.style.top = G.oy + r * G.cell + 'px';
          sp.style.width = sp.style.height = G.cell + 1 + 'px';
          frag.appendChild(sp);
        }
      }
    });
    cutLayer.appendChild(frag);
  }

  decoImgs.forEach(function (img) {
    if (!img.complete) img.addEventListener('load', buildCutters, { once: true });
  });

  /* ------------------------------------------------------------------ 6 */
  function makeLines(kind) {
    var lines = [], i, j, u, v, line, TAU = Math.PI * 2;
    if (kind === 'torus') {
      var Rm = 1, rm = 0.42;
      for (i = 0; i < 30; i++) {
        u = i / 30 * TAU; line = [];
        for (j = 0; j <= 36; j++) {
          v = j / 36 * TAU;
          line.push([(Rm + rm * Math.cos(v)) * Math.cos(u), (Rm + rm * Math.cos(v)) * Math.sin(u), rm * Math.sin(v)]);
        }
        lines.push(line);
      }
      for (i = 0; i < 10; i++) {
        v = i / 10 * TAU; line = [];
        for (j = 0; j <= 72; j++) {
          u = j / 72 * TAU;
          line.push([(Rm + rm * Math.cos(v)) * Math.cos(u), (Rm + rm * Math.cos(v)) * Math.sin(u), rm * Math.sin(v)]);
        }
        lines.push(line);
      }
      return { lines: lines, extent: 1.5 };
    }
    // hiperboloide (reloj de arena en wireframe, del manual)
    var a = 0.42, cz = 0.62, vmax = 1.15;
    for (i = 0; i < 26; i++) {
      u = i / 26 * TAU; line = [];
      for (j = 0; j <= 24; j++) {
        v = -vmax + j / 24 * 2 * vmax;
        line.push([a * Math.cosh(v) * Math.cos(u), a * Math.cosh(v) * Math.sin(u), cz * Math.sinh(v)]);
      }
      lines.push(line);
    }
    for (i = 0; i <= 8; i++) {
      v = -vmax + i / 8 * 2 * vmax; line = [];
      for (j = 0; j <= 60; j++) {
        u = j / 60 * TAU;
        line.push([a * Math.cosh(v) * Math.cos(u), a * Math.cosh(v) * Math.sin(u), cz * Math.sinh(v)]);
      }
      lines.push(line);
    }
    return { lines: lines, extent: 0.95 };
  }

  var wires = [
    { el: document.querySelector('.wire--torus'), kind: 'torus', speed: 1, tilt: 0.55, color: '88,143,0' },
    { el: document.querySelector('.wire--hyper'), kind: 'hyper', speed: -0.7, tilt: 0.35, color: '122,122,122' }
  ].filter(function (w) { return w.el; });

  function sizeWires() {
    wires.forEach(function (w) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var b = w.el.getBoundingClientRect();
      w.el.width = Math.round(b.width * dpr);
      w.el.height = Math.round(b.height * dpr);
      w.ctx = w.el.getContext('2d');
      w.dpr = dpr;
      if (!w.geo) w.geo = makeLines(w.kind);
    });
  }

  function drawWire(w, t) {
    var ctx2 = w.ctx, W = w.el.width, H = w.el.height;
    if (!ctx2 || !W) return;
    ctx2.clearRect(0, 0, W, H);
    var ay = t * 0.00022 * w.speed, ax = w.tilt + Math.sin(t * 0.00009) * 0.25;
    var cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    var scale = Math.min(W, H) / 2 / w.geo.extent;
    ctx2.lineWidth = w.dpr;
    w.geo.lines.forEach(function (line) {
      var zsum = 0;
      ctx2.beginPath();
      for (var k = 0; k < line.length; k++) {
        var p = line[k];
        // giro en Y y luego en X, proyección ortográfica
        var x1 = p[0] * cy + p[2] * sy, z1 = -p[0] * sy + p[2] * cy;
        var y2 = p[1] * cx - z1 * sx, z2 = p[1] * sx + z1 * cx;
        zsum += z2;
        var px = W / 2 + x1 * scale, py = H / 2 + y2 * scale;
        if (k === 0) ctx2.moveTo(px, py); else ctx2.lineTo(px, py);
      }
      var depth = (zsum / line.length) / w.geo.extent; // -1..1
      ctx2.strokeStyle = 'rgba(' + w.color + ',' + (0.28 + 0.55 * (depth + 1) / 2).toFixed(3) + ')';
      ctx2.stroke();
    });
  }

  var wireLast = 0;
  function wireLoop(t) {
    if (!document.hidden && t - wireLast > 33) { // ~30 fps es suficiente
      wireLast = t;
      wires.forEach(function (w) { drawWire(w, t); });
    }
    requestAnimationFrame(wireLoop);
  }

  /* ------------------------------------------------------------------ 7 */
  var clock = document.querySelector('.js-clock');
  function tickClock() {
    if (!clock) return;
    try {
      clock.textContent = new Intl.DateTimeFormat('es-CO', {
        timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date());
    } catch (e) { clock.textContent = ''; }
  }

  function buildButtonPixels() {
    var fill = document.querySelector('.cta__fill');
    if (!fill) return;
    var cols = 16, rows = 3;
    fill.style.setProperty('--fc', cols);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < cols * rows; i++) {
      var px = document.createElement('i');
      px.style.setProperty('--d', Math.round(rand(0, 180)) + 'ms');
      frag.appendChild(px);
    }
    fill.appendChild(frag);
  }

  var COOKIE_KEY = 'lunary_cookies_ok';
  function showCookieNotice() {
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
  }

  /* ---------------------------------------------------------- arranque */
  function layout() {
    computeGrid();
    sizeLogo();
    snapToGrid();
    sizeWires();
    buildCutters();
    if (R.img) prepareReveal();
  }

  var resizeTimer = 0, lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', function () {
    // en celular la barra del navegador cambia el alto: se ignoran cambios pequeños
    var w = window.innerWidth, h = window.innerHeight;
    if (w === lastW && Math.abs(h - lastH) < 120) return;
    lastW = w; lastH = h;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && R.cells.size && !R.raf) R.raf = requestAnimationFrame(draw);
  });

  layout();
  buildButtonPixels();
  tickClock();
  setInterval(tickClock, 15000);
  loadRevealImage();

  if (!reduceMotion) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    requestAnimationFrame(wireLoop);
  } else {
    wires.forEach(function (w) { drawWire(w, 0); });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { snapToGrid(); });
  }

  runIntro();
  if (reduceMotion) showCookieNotice();
})();
