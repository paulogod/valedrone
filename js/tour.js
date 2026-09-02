/**
 * Tour 360° — Vale Drone
 * Visualizador panorâmico equirretangular (Pannellum) preparado para
 * desktop, Android e iOS/iPadOS.
 *
 * O que este arquivo resolve:
 *  - inicialização preguiçosa: o panorama só é montado quando a seção entra
 *    na tela, e volta a tentar sempre que o container ganha tamanho (antes,
 *    se o container estivesse com 0px o tour morria de vez);
 *  - download único da imagem e redimensionamento automático quando ela
 *    ultrapassa o MAX_TEXTURE_SIZE do aparelho — causa clássica da tela
 *    quadriculada/cinza em celulares mais simples;
 *  - ausência de WebGL, falha de rede ou erro do visualizador tratados com
 *    um painel de fallback em vez do fundo quadriculado do Pannellum;
 *  - tela cheia nativa no desktop e no Android, e pseudo-tela-cheia no
 *    iPhone (o Safari do iOS não expõe a Fullscreen API para elementos);
 *  - giroscópio com o pedido de permissão exigido pelo iOS 13+;
 *  - rotação automática pausada fora da tela e com a aba em segundo plano,
 *    para não travar/esquentar o aparelho.
 */
(function () {
  'use strict';

  var PANO_SOURCES = ['panoramas/poster.jpg', '/panoramas/poster.jpg'];
  var YOUTUBE_URL = 'https://www.youtube.com/watch?v=DlHx9jSH0Io';
  var AUTOROTATE_SPEED = -1.5;
  var TEXTURE_HARD_CAP = 4096;

  var viewer = null;
  var booting = false;
  var loaded = false;
  var dead = false;
  var visible = false;
  var resizeTimer = null;
  var posterUrl = PANO_SOURCES[0];

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */

  function host() {
    return document.getElementById('panorama');
  }

  function frame() {
    var el = host();
    while (el && el !== document.body) {
      if (el.classList && el.classList.contains('panorama-container')) return el;
      el = el.parentNode;
    }
    return null;
  }

  function isTouch() {
    return ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Sonda de WebGL: devolve os limites do aparelho ou null se não houver. */
  function webglLimits() {
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;
      var max = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return { maxTextureSize: max };
    } catch (e) {
      return null;
    }
  }

  function openVideoTab() {
    var btn = document.querySelector('.tour-tab-btn[data-tab="video-360"]');
    if (btn) btn.click();
  }

  /* ------------------------------------------------------------------ */
  /* Camada de mensagens (carregando / erro / avisos)                    */
  /* ------------------------------------------------------------------ */

  function overlay() {
    var box = frame();
    if (!box) return null;
    var el = box.querySelector('.pano-overlay');
    if (!el) {
      el = document.createElement('div');
      el.className = 'pano-overlay';
      box.appendChild(el);
    }
    return el;
  }

  function hideOverlay() {
    var box = frame();
    var el = box && box.querySelector('.pano-overlay');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function showLoading() {
    var el = overlay();
    if (!el) return;
    el.className = 'pano-overlay is-loading';
    el.innerHTML =
      '<span class="pano-spinner" aria-hidden="true"></span>' +
      '<p class="pano-overlay-msg">Carregando o panorama 360°…</p>';
  }

  function showFallback(msg) {
    dead = true;
    booting = false;
    var box = frame();
    if (box) box.style.backgroundImage = 'url("' + posterUrl + '")';

    var el = overlay();
    if (!el) return;
    el.className = 'pano-overlay is-error';
    el.innerHTML =
      '<p class="pano-overlay-title">Não foi possível abrir o panorama interativo</p>' +
      '<p class="pano-overlay-msg"></p>' +
      '<div class="pano-overlay-actions">' +
        '<button type="button" class="pano-btn-primary" data-pano-action="video">Ver o tour em vídeo 360°</button>' +
        '<a class="pano-btn-ghost" href="' + YOUTUBE_URL + '" target="_blank" rel="noopener">Abrir no YouTube ↗</a>' +
      '</div>';
    el.querySelector('.pano-overlay-msg').textContent = msg;
    el.querySelector('[data-pano-action="video"]').addEventListener('click', openVideoTab);
  }

  function toast(msg) {
    var box = frame();
    if (!box) return;
    var el = box.querySelector('.pano-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'pano-toast';
      box.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('is-visible');
    if (el.hideTimer) clearTimeout(el.hideTimer);
    el.hideTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 5000);
  }

  /* ------------------------------------------------------------------ */
  /* Controles próprios (tela cheia e giroscópio)                        */
  /* ------------------------------------------------------------------ */

  function makeButton(action, label, glyph) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pano-ctrl';
    btn.setAttribute('data-pano-action', action);
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML = '<span aria-hidden="true">' + glyph + '</span>';
    return btn;
  }

  function buildControls() {
    var box = frame();
    if (!box || box.querySelector('.pano-controls')) return;

    var bar = document.createElement('div');
    bar.className = 'pano-controls';

    var fs = makeButton('fullscreen', 'Tela cheia', '⛶');
    fs.addEventListener('click', toggleFullscreen);
    bar.appendChild(fs);

    if (window.DeviceOrientationEvent && isTouch()) {
      var gy = makeButton('orientation', 'Usar o giroscópio', '🧭');
      gy.setAttribute('aria-pressed', 'false');
      gy.addEventListener('click', toggleOrientation);
      bar.appendChild(gy);
    }

    box.appendChild(bar);
  }

  function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement ||
      document.msFullscreenElement || null;
  }

  function canNativeFullscreen(el) {
    var req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (!req) return false;
    // iPhone: a Fullscreen API existe só para <video>, e o flag vem falso.
    if (document.fullscreenEnabled === false) return false;
    if (document.webkitFullscreenEnabled === false) return false;
    return true;
  }

  function setPseudoFullscreen(on) {
    var box = frame();
    if (!box) return;
    if (on) {
      box.classList.add('is-pseudo-fullscreen');
      document.body.classList.add('pano-fs-lock');
    } else {
      box.classList.remove('is-pseudo-fullscreen');
      document.body.classList.remove('pano-fs-lock');
    }
    syncFullscreenButton();
    scheduleResize();
  }

  function syncFullscreenButton() {
    var box = frame();
    var btn = box && box.querySelector('[data-pano-action="fullscreen"]');
    if (!btn) return;
    var on = !!fsElement() || box.classList.contains('is-pseudo-fullscreen');
    var label = on ? 'Sair da tela cheia' : 'Tela cheia';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML = '<span aria-hidden="true">' + (on ? '✕' : '⛶') + '</span>';
  }

  function toggleFullscreen() {
    var box = frame();
    if (!box) return;

    if (fsElement()) {
      var exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exit) { try { exit.call(document); } catch (e) {} }
      return;
    }

    if (box.classList.contains('is-pseudo-fullscreen')) {
      setPseudoFullscreen(false);
      return;
    }

    if (canNativeFullscreen(box)) {
      var req = box.requestFullscreen || box.webkitRequestFullscreen || box.msRequestFullscreen;
      try {
        var result = req.call(box);
        if (result && typeof result['catch'] === 'function') {
          result['catch'](function () { setPseudoFullscreen(true); });
        }
      } catch (e) {
        setPseudoFullscreen(true);
      }
    } else {
      setPseudoFullscreen(true);
    }
  }

  function setGyroState(on) {
    var box = frame();
    var btn = box && box.querySelector('[data-pano-action="orientation"]');
    if (!btn) return;
    if (on) btn.classList.add('is-active');
    else btn.classList.remove('is-active');
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function toggleOrientation() {
    if (!viewer) return;

    var active = false;
    try { active = viewer.isOrientationActive(); } catch (e) {}
    if (active) {
      try { viewer.stopOrientation(); } catch (e) {}
      setGyroState(false);
      return;
    }

    var DOE = window.DeviceOrientationEvent;
    // iOS 13+ exige permissão explícita, sempre a partir de um toque do usuário.
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(function (state) {
        if (state === 'granted') {
          try { viewer.startOrientation(); } catch (e) {}
          setGyroState(true);
        } else {
          toast('Permissão de movimento negada. Libere em Ajustes › Apps › Safari › Movimento e orientação.');
        }
      })['catch'](function () {
        toast('Não foi possível ativar o giroscópio neste aparelho.');
      });
      return;
    }

    try {
      viewer.startOrientation();
      setGyroState(true);
    } catch (e) {
      toast('Este aparelho não expõe o sensor de orientação ao navegador.');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Download e preparo da textura                                       */
  /* ------------------------------------------------------------------ */

  function fetchPanorama(index, done, fail) {
    if (index >= PANO_SOURCES.length) { fail(); return; }
    var url = PANO_SOURCES[index];
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) done(xhr.response, url);
      else fetchPanorama(index + 1, done, fail);
    };
    xhr.onerror = function () { fetchPanorama(index + 1, done, fail); };
    try {
      xhr.send();
    } catch (e) {
      fetchPanorama(index + 1, done, fail);
    }
  }

  /* Reduz pela metade em etapas: uma única passada gera muito serrilhado. */
  function downscale(img, maxSize) {
    var src = img;
    var cw = img.width;
    var ch = img.height;
    var targetW = maxSize;
    var targetH = Math.round(img.height * (maxSize / img.width));
    var ctx;

    while (cw / 2 > targetW) {
      cw = Math.round(cw / 2);
      ch = Math.round(ch / 2);
      var step = document.createElement('canvas');
      step.width = cw;
      step.height = ch;
      ctx = step.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(src, 0, 0, cw, ch);
      src = step;
    }

    var canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(src, 0, 0, targetW, targetH);
    return canvas;
  }

  function canvasToUrl(canvas, done) {
    if (canvas.toBlob) {
      canvas.toBlob(function (blob) {
        done(blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/jpeg', 0.86));
      }, 'image/jpeg', 0.86);
    } else {
      done(canvas.toDataURL('image/jpeg', 0.86));
    }
  }

  function toTexture(blob, maxSize, done) {
    var srcUrl = URL.createObjectURL(blob);
    var img = new Image();

    img.onload = function () {
      if (img.width <= maxSize) { done(srcUrl); return; }
      try {
        var canvas = downscale(img, maxSize);
        URL.revokeObjectURL(srcUrl);
        canvasToUrl(canvas, done);
      } catch (e) {
        // Sem canvas utilizável, entrega o original e deixa o Pannellum decidir.
        done(srcUrl);
      }
    };

    img.onerror = function () {
      URL.revokeObjectURL(srcUrl);
      done(null);
    };

    img.src = srcUrl;
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida do visualizador                                       */
  /* ------------------------------------------------------------------ */

  function create(textureUrl) {
    try {
      viewer = pannellum.viewer('panorama', {
        type: 'equirectangular',
        panorama: textureUrl,
        autoLoad: true,
        autoRotate: prefersReducedMotion() ? 0 : AUTOROTATE_SPEED,
        autoRotateInactivityDelay: 3000,
        compass: false,
        showControls: true,
        showZoomCtrl: true,
        showFullscreenCtrl: false,
        keyboardZoom: true,
        mouseZoom: true,
        draggable: true,
        friction: 0.15,
        touchPanSpeedCoeffFactor: 1,
        hfov: 100,
        minHfov: 50,
        maxHfov: 120,
        yaw: 0,
        pitch: -5,
        orientationOnByDefault: false
      });
    } catch (e) {
      showFallback('Falha ao iniciar o visualizador 360° neste navegador.');
      return;
    }

    window.valedronePannellumViewer = viewer;

    viewer.on('load', function () {
      booting = false;
      loaded = true;
      hideOverlay();
      buildControls();
      syncFullscreenButton();
      applyVisibility();
      scheduleResize();
    });

    viewer.on('error', function (msg) {
      try { viewer.destroy(); } catch (e) {}
      viewer = null;
      window.valedronePannellumViewer = null;
      showFallback(msg || 'O panorama não pôde ser exibido neste aparelho.');
    });
  }

  function boot() {
    if (booting || loaded || dead) return;

    var el = host();
    if (!el) return;

    if (typeof pannellum === 'undefined') {
      showFallback('A biblioteca do visualizador 360° não pôde ser carregada.');
      return;
    }

    // Container ainda oculto ou sem altura: sai sem marcar erro, os
    // observadores chamam boot() de novo quando ele ganhar tamanho.
    if (!el.clientWidth || !el.clientHeight) return;

    var limits = webglLimits();
    if (!limits) {
      showFallback('Seu navegador está sem aceleração WebGL, necessária para o panorama interativo.');
      return;
    }

    booting = true;
    showLoading();

    var cap = Math.max(1024, Math.min(limits.maxTextureSize, TEXTURE_HARD_CAP));

    fetchPanorama(0, function (blob, usedUrl) {
      posterUrl = usedUrl;
      toTexture(blob, cap, function (textureUrl) {
        if (!textureUrl) {
          showFallback('A imagem do panorama não pôde ser decodificada.');
          return;
        }
        create(textureUrl);
      });
    }, function () {
      showFallback('A imagem do panorama não pôde ser baixada. Verifique sua conexão.');
    });
  }

  function applyVisibility() {
    if (!viewer || !loaded) return;
    try {
      if (visible && !document.hidden && !prefersReducedMotion()) {
        viewer.startAutoRotate(AUTOROTATE_SPEED);
      } else {
        viewer.stopAutoRotate();
      }
    } catch (e) {}
  }

  function scheduleResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = null;
      if (viewer) {
        try { viewer.resize(); } catch (e) {}
      } else {
        boot();
      }
    }, 120);
  }

  /* ------------------------------------------------------------------ */
  /* Observadores e eventos globais                                      */
  /* ------------------------------------------------------------------ */

  function watch() {
    var box = frame();
    if (!box) return;

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          visible = entries[i].isIntersecting;
          if (visible) boot();
          applyVisibility();
        }
      }, { rootMargin: '250px 0px' });
      io.observe(box);
    } else {
      visible = true;
      boot();
    }

    if (window.ResizeObserver) {
      new ResizeObserver(function () { scheduleResize(); }).observe(box);
    }

    window.addEventListener('resize', scheduleResize);
    window.addEventListener('orientationchange', function () {
      setTimeout(scheduleResize, 300);
    });
    document.addEventListener('visibilitychange', applyVisibility);

    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(function (evt) {
      document.addEventListener(evt, function () {
        syncFullscreenButton();
        scheduleResize();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.keyCode !== 27) return;
      var b = frame();
      if (b && b.classList.contains('is-pseudo-fullscreen')) setPseudoFullscreen(false);
    });
  }

  /* Mantido para o alternador de abas em js/main.js. */
  window.initOrResizePannellum = function () {
    visible = true;
    if (viewer) scheduleResize();
    else boot();
  };

  window.valedronePannellumViewer = null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch);
  } else {
    watch();
  }
})();
