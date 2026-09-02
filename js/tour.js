/**
 * Tour 360° — Vale Drone
 * Dois visualizadores equirretangulares sobre o mesmo motor (Pannellum),
 * preparados para desktop, Android e iOS/iPadOS:
 *
 *   1. foto panorâmica (panoramas/poster.jpg)
 *   2. vídeo 360° interativo (panoramas/tour360.mp4), em modo `dynamic`,
 *      com o <video> entregue direto como textura WebGL
 *
 * O embed do YouTube em <iframe> não repassa o arraste do dedo para a
 * página, por isso o vídeo é servido pelo player próprio; o link para o
 * YouTube segue disponível para quem preferir o app.
 *
 * Pontos tratados aqui:
 *  - inicialização preguiçosa: cada painel só monta quando entra na tela,
 *    e tenta de novo sempre que o container ganha tamanho;
 *  - limite de textura do aparelho verificado antes de montar (o Pannellum
 *    aceita até 2x o MAX_TEXTURE_SIZE na foto, dividindo-a em metades;
 *    o vídeo, por vir sem width/height, precisa caber inteiro);
 *  - falhas (sem WebGL, arquivo fora do ar, codec recusado) caem num painel
 *    de fallback em vez do fundo quadriculado do Pannellum;
 *  - tela cheia nativa no desktop e Android, pseudo-tela-cheia no iPhone;
 *  - giroscópio com o requestPermission exigido pelo iOS 13+;
 *  - vídeo com playsinline (senão o iOS abre no player nativo e perde o 360),
 *    carregado só a partir do toque do usuário, já que são 79 MB;
 *  - render e reprodução pausados fora da tela e com a aba em segundo plano.
 */
(function () {
  'use strict';

  var PANO_SOURCES = ['panoramas/poster.jpg', '/panoramas/poster.jpg'];
  var VIDEO_SOURCES = ['panoramas/tour360.mp4', '/panoramas/tour360.mp4'];
  var YOUTUBE_URL = 'https://www.youtube.com/watch?v=DlHx9jSH0Io';
  var AUTOROTATE_SPEED = -1.5;
  var VIDEO_WIDTH = 3840;
  var HARD_CAP = 4096;

  /* ------------------------------------------------------------------ */
  /* Utilidades compartilhadas                                           */
  /* ------------------------------------------------------------------ */

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

  function openTab(name) {
    var btn = document.querySelector('.tour-tab-btn[data-tab="' + name + '"]');
    if (btn) btn.click();
  }

  /* ------------------------------------------------------------------ */
  /* Camada de mensagens (por painel)                                    */
  /* ------------------------------------------------------------------ */

  function overlayOf(box) {
    if (!box) return null;
    var el = box.querySelector('.pano-overlay');
    if (!el) {
      el = document.createElement('div');
      el.className = 'pano-overlay';
      box.appendChild(el);
    }
    return el;
  }

  function hideOverlay(box) {
    var el = box && box.querySelector('.pano-overlay');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function showLoading(box, msg) {
    var el = overlayOf(box);
    if (!el) return;
    el.className = 'pano-overlay is-loading';
    el.innerHTML = '<span class="pano-spinner" aria-hidden="true"></span>' +
      '<p class="pano-overlay-msg"></p>';
    el.querySelector('.pano-overlay-msg').textContent = msg;
  }

  function showFallback(box, msg, alternativa) {
    if (!box) return;
    var el = overlayOf(box);
    el.className = 'pano-overlay is-error';
    el.innerHTML =
      '<p class="pano-overlay-title">Não foi possível abrir o tour interativo</p>' +
      '<p class="pano-overlay-msg"></p>' +
      '<div class="pano-overlay-actions">' +
        '<button type="button" class="pano-btn-primary"></button>' +
        '<a class="pano-btn-ghost" href="' + YOUTUBE_URL + '" target="_blank" rel="noopener">Abrir no YouTube ↗</a>' +
      '</div>';
    el.querySelector('.pano-overlay-msg').textContent = msg;
    var btn = el.querySelector('.pano-btn-primary');
    btn.textContent = alternativa.rotulo;
    btn.addEventListener('click', alternativa.acao);
  }

  function toast(box, msg) {
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
  /* Controles (por painel)                                              */
  /* ------------------------------------------------------------------ */

  function controlBar(box) {
    var bar = box.querySelector('.pano-controls');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'pano-controls';
      box.appendChild(bar);
    }
    return bar;
  }

  function addControl(box, action, label, glyph, handler) {
    var bar = controlBar(box);
    if (bar.querySelector('[data-pano-action="' + action + '"]')) return null;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pano-ctrl';
    btn.setAttribute('data-pano-action', action);
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML = '<span aria-hidden="true">' + glyph + '</span>';
    btn.addEventListener('click', handler);
    bar.appendChild(btn);
    return btn;
  }

  function ctrl(box, action) {
    return box ? box.querySelector('[data-pano-action="' + action + '"]') : null;
  }

  function setGlyph(btn, glyph, label) {
    if (!btn) return;
    btn.innerHTML = '<span aria-hidden="true">' + glyph + '</span>';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  /* ------------------------------------------------------------------ */
  /* Tela cheia                                                          */
  /* ------------------------------------------------------------------ */

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

  function syncFullscreenButton(box) {
    var btn = ctrl(box, 'fullscreen');
    if (!btn) return;
    var on = fsElement() === box || box.classList.contains('is-pseudo-fullscreen');
    setGlyph(btn, on ? '✕' : '⛶', on ? 'Sair da tela cheia' : 'Tela cheia');
  }

  function setPseudoFullscreen(box, on) {
    if (on) {
      box.classList.add('is-pseudo-fullscreen');
      document.body.classList.add('pano-fs-lock');
    } else {
      box.classList.remove('is-pseudo-fullscreen');
      document.body.classList.remove('pano-fs-lock');
    }
    syncFullscreenButton(box);
    resizeAll();
  }

  function toggleFullscreen(box) {
    if (fsElement()) {
      var exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exit) { try { exit.call(document); } catch (e) {} }
      return;
    }
    if (box.classList.contains('is-pseudo-fullscreen')) {
      setPseudoFullscreen(box, false);
      return;
    }
    if (canNativeFullscreen(box)) {
      var req = box.requestFullscreen || box.webkitRequestFullscreen || box.msRequestFullscreen;
      try {
        var r = req.call(box);
        if (r && typeof r['catch'] === 'function') {
          r['catch'](function () { setPseudoFullscreen(box, true); });
        }
      } catch (e) {
        setPseudoFullscreen(box, true);
      }
    } else {
      setPseudoFullscreen(box, true);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Giroscópio                                                          */
  /* ------------------------------------------------------------------ */

  function toggleOrientation(painel) {
    var viewer = painel.viewer;
    if (!viewer) return;
    var btn = ctrl(painel.box, 'orientation');

    var ativo = false;
    try { ativo = viewer.isOrientationActive(); } catch (e) {}
    if (ativo) {
      try { viewer.stopOrientation(); } catch (e) {}
      if (btn) { btn.classList.remove('is-active'); btn.setAttribute('aria-pressed', 'false'); }
      return;
    }

    function liga() {
      try { viewer.startOrientation(); } catch (e) { return; }
      if (btn) { btn.classList.add('is-active'); btn.setAttribute('aria-pressed', 'true'); }
    }

    var DOE = window.DeviceOrientationEvent;
    // iOS 13+ exige permissão explícita, sempre a partir de um toque.
    if (DOE && typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then(function (estado) {
        if (estado === 'granted') liga();
        else toast(painel.box, 'Permissão de movimento negada. Libere em Ajustes › Apps › Safari › Movimento e orientação.');
      })['catch'](function () {
        toast(painel.box, 'Não foi possível ativar o giroscópio neste aparelho.');
      });
      return;
    }
    liga();
  }

  function addSharedControls(painel) {
    addControl(painel.box, 'fullscreen', 'Tela cheia', '⛶', function () {
      toggleFullscreen(painel.box);
    });
    if (window.DeviceOrientationEvent && isTouch()) {
      var g = addControl(painel.box, 'orientation', 'Usar o giroscópio', '🧭', function () {
        toggleOrientation(painel);
      });
      if (g) g.setAttribute('aria-pressed', 'false');
    }
    syncFullscreenButton(painel.box);
  }

  /* ------------------------------------------------------------------ */
  /* Download e preparo da foto                                          */
  /* ------------------------------------------------------------------ */

  function fetchFirst(sources, index, done, fail) {
    if (index >= sources.length) { fail(); return; }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', sources[index], true);
    xhr.responseType = 'blob';
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) done(xhr.response, sources[index]);
      else fetchFirst(sources, index + 1, done, fail);
    };
    xhr.onerror = function () { fetchFirst(sources, index + 1, done, fail); };
    try { xhr.send(); } catch (e) { fetchFirst(sources, index + 1, done, fail); }
  }

  /* Reduz pela metade em etapas: uma passada só gera muito serrilhado. */
  function downscale(img, maxSize) {
    var src = img, cw = img.width, ch = img.height;
    var targetW = maxSize;
    var targetH = Math.round(img.height * (maxSize / img.width));
    var ctx;
    while (cw / 2 > targetW) {
      cw = Math.round(cw / 2); ch = Math.round(ch / 2);
      var step = document.createElement('canvas');
      step.width = cw; step.height = ch;
      ctx = step.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(src, 0, 0, cw, ch);
      src = step;
    }
    var canvas = document.createElement('canvas');
    canvas.width = targetW; canvas.height = targetH;
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
        done(srcUrl);
      }
    };
    img.onerror = function () { URL.revokeObjectURL(srcUrl); done(null); };
    img.src = srcUrl;
  }

  /* ------------------------------------------------------------------ */
  /* Painel 1 — foto panorâmica                                          */
  /* ------------------------------------------------------------------ */

  var foto = {
    nome: 'foto',
    box: null,
    hostId: 'panorama',
    viewer: null,
    booting: false,
    loaded: false,
    dead: false,
    visible: false,
    posterUrl: PANO_SOURCES[0]
  };

  function bootFoto() {
    if (foto.booting || foto.loaded || foto.dead) return;
    var host = document.getElementById(foto.hostId);
    if (!host) return;

    if (typeof pannellum === 'undefined') {
      showFallback(foto.box, 'A biblioteca do visualizador 360° não pôde ser carregada.', alternativaVideo());
      foto.dead = true;
      return;
    }
    if (!host.clientWidth || !host.clientHeight) return;

    var limites = webglLimits();
    if (!limites) {
      showFallback(foto.box, 'Seu navegador está sem aceleração WebGL, necessária para o panorama interativo.', alternativaVideo());
      foto.dead = true;
      return;
    }

    foto.booting = true;
    showLoading(foto.box, 'Carregando o panorama 360°…');

    // O Pannellum divide a imagem em duas metades quando ela passa do
    // limite de textura, então aguenta até 2x o MAX_TEXTURE_SIZE.
    var permitido = Math.min(2 * limites.maxTextureSize, HARD_CAP);

    fetchFirst(PANO_SOURCES, 0, function (blob, url) {
      foto.posterUrl = url;
      toTexture(blob, permitido, function (textureUrl) {
        if (!textureUrl) {
          foto.booting = false; foto.dead = true;
          showFallback(foto.box, 'A imagem do panorama não pôde ser decodificada.', alternativaVideo());
          return;
        }
        criaFoto(textureUrl);
      });
    }, function () {
      foto.booting = false; foto.dead = true;
      showFallback(foto.box, 'A imagem do panorama não pôde ser baixada. Verifique sua conexão.', alternativaVideo());
    });
  }

  function criaFoto(textureUrl) {
    try {
      foto.viewer = pannellum.viewer(foto.hostId, {
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
        hfov: 100, minHfov: 50, maxHfov: 120,
        yaw: 0, pitch: -5,
        orientationOnByDefault: false
      });
    } catch (e) {
      foto.booting = false; foto.dead = true;
      showFallback(foto.box, 'Falha ao iniciar o visualizador 360° neste navegador.', alternativaVideo());
      return;
    }

    window.valedronePannellumViewer = foto.viewer;

    foto.viewer.on('load', function () {
      foto.booting = false;
      foto.loaded = true;
      hideOverlay(foto.box);
      addSharedControls(foto);
      aplicaVisibilidade();
      resizeAll();
    });

    foto.viewer.on('error', function (msg) {
      try { foto.viewer.destroy(); } catch (e) {}
      foto.viewer = null;
      window.valedronePannellumViewer = null;
      foto.booting = false; foto.dead = true;
      showFallback(foto.box, msg || 'O panorama não pôde ser exibido neste aparelho.', alternativaVideo());
    });
  }

  /* ------------------------------------------------------------------ */
  /* Painel 2 — vídeo 360° interativo                                    */
  /* ------------------------------------------------------------------ */

  var video = {
    nome: 'video',
    box: null,
    hostId: 'panorama-video',
    viewer: null,
    el: null,
    booting: false,
    loaded: false,
    dead: false,
    visible: false,
    pedido: false
  };

  function alternativaFoto() {
    return { rotulo: 'Ver a foto panorâmica 360°', acao: function () { openTab('photo-360'); } };
  }

  function alternativaVideo() {
    return { rotulo: 'Ver o tour em vídeo 360°', acao: function () { openTab('video-360'); } };
  }

  function mostraCapaVideo() {
    if (!video.box) return;
    video.box.style.backgroundImage = 'url("' + foto.posterUrl + '")';
    var el = overlayOf(video.box);
    el.className = 'pano-overlay is-poster';
    el.innerHTML =
      '<button type="button" class="pano-play" aria-label="Reproduzir o tour em vídeo 360°">' +
        '<span aria-hidden="true">▶</span>' +
      '</button>' +
      '<p class="pano-overlay-msg">Tour em vídeo 360° · 1min57 · arraste para olhar em volta</p>';
    el.querySelector('.pano-play').addEventListener('click', function () {
      video.pedido = true;
      bootVideo();
    });
  }

  function bootVideo() {
    if (video.booting || video.loaded || video.dead || !video.pedido) return;
    var host = document.getElementById(video.hostId);
    if (!host) return;

    if (typeof pannellum === 'undefined') {
      video.dead = true;
      showFallback(video.box, 'A biblioteca do visualizador 360° não pôde ser carregada.', alternativaFoto());
      return;
    }
    if (!host.clientWidth || !host.clientHeight) return;

    var limites = webglLimits();
    if (!limites) {
      video.dead = true;
      showFallback(video.box, 'Seu navegador está sem aceleração WebGL, necessária para o vídeo 360° interativo.', alternativaFoto());
      return;
    }
    // O <video> chega ao Pannellum sem width/height, então não há como
    // dividi-lo em metades: a textura precisa caber inteira na GPU.
    if (limites.maxTextureSize < VIDEO_WIDTH) {
      video.dead = true;
      showFallback(video.box,
        'Este aparelho suporta texturas de até ' + limites.maxTextureSize + 'px, e o vídeo 360° tem ' + VIDEO_WIDTH + 'px de largura.',
        alternativaFoto());
      return;
    }

    video.booting = true;
    showLoading(video.box, 'Carregando o vídeo 360°…');

    var v = document.createElement('video');
    v.className = 'pano-video-source';
    // playsinline é obrigatório: sem ele o iOS abre o player nativo em tela
    // cheia e o vídeo deixa de alimentar a textura WebGL.
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.playsInline = true;
    v.loop = true;
    v.preload = 'auto';
    v.src = VIDEO_SOURCES[0];
    video.el = v;
    video.box.appendChild(v);

    var caminho = 0;
    v.addEventListener('error', function () {
      caminho += 1;
      if (caminho < VIDEO_SOURCES.length) {
        v.src = VIDEO_SOURCES[caminho];
        v.load();
        return;
      }
      video.booting = false; video.dead = true;
      showFallback(video.box, 'O vídeo 360° não pôde ser carregado. Verifique sua conexão.', alternativaFoto());
    });

    var montado = false;
    v.addEventListener('loadeddata', function () {
      if (montado) return;
      montado = true;
      criaVideo(v);
    });

    v.load();
    tocaVideo(v);
  }

  function tocaVideo(v) {
    var p;
    try { p = v.play(); } catch (e) { p = null; }
    if (p && typeof p['catch'] === 'function') {
      p['catch'](function () {
        // Som bloqueado: repete no mudo, que é sempre permitido.
        v.muted = true;
        var q;
        try { q = v.play(); } catch (e) { q = null; }
        if (q && typeof q['catch'] === 'function') { q['catch'](function () {}); }
        sincronizaBotoes();
        toast(video.box, 'O navegador bloqueou o som. Toque no alto-falante para ativar.');
      });
    }
  }

  function criaVideo(v) {
    try {
      video.viewer = pannellum.viewer(video.hostId, {
        type: 'equirectangular',
        panorama: v,
        // dynamic sozinho nao basta: o Pannellum so inicia o render quando
        // dynamicUpdate tambem vem true (b.dynamic && Ma && (P=..., pa())).
        dynamic: true,
        dynamicUpdate: true,
        autoLoad: true,
        compass: false,
        showControls: true,
        showZoomCtrl: true,
        showFullscreenCtrl: false,
        keyboardZoom: true,
        mouseZoom: true,
        draggable: true,
        friction: 0.15,
        touchPanSpeedCoeffFactor: 1,
        hfov: 100, minHfov: 50, maxHfov: 120,
        yaw: 0, pitch: 0,
        autoRotate: 0,
        orientationOnByDefault: false
      });
    } catch (e) {
      video.booting = false; video.dead = true;
      showFallback(video.box, 'Falha ao iniciar o vídeo 360° neste navegador.', alternativaFoto());
      return;
    }

    window.valedroneVideoViewer = video.viewer;

    // No modo dinâmico o Pannellum entra pelo atalho `b.dynamic && Ma` e
    // nunca dispara o evento 'load'. Ficamos de olho no isLoaded(): sem
    // isso o overlay de carregamento nunca sai e, por cobrir o painel,
    // engole o arraste do dedo.
    video.viewer.on('load', finalizaVideo);
    esperaVideoPronto(40);

    video.viewer.on('error', function (msg) {
      try { video.viewer.destroy(); } catch (e) {}
      video.viewer = null;
      window.valedroneVideoViewer = null;
      video.booting = false; video.dead = true;
      showFallback(video.box, msg || 'O vídeo 360° não pôde ser exibido neste aparelho.', alternativaFoto());
    });
  }

  function esperaVideoPronto(tentativas) {
    if (video.loaded || video.dead || !video.viewer) return;
    var pronto = false;
    try { pronto = video.viewer.isLoaded(); } catch (e) {}
    if (pronto) { finalizaVideo(); return; }
    if (tentativas <= 0) {
      video.booting = false;
      video.dead = true;
      showFallback(video.box, 'O vídeo 360° não pôde ser preparado para exibição neste navegador.', alternativaFoto());
      return;
    }
    setTimeout(function () { esperaVideoPronto(tentativas - 1); }, 150);
  }

  function finalizaVideo() {
    if (video.loaded || video.dead || !video.viewer) return;
    video.booting = false;
    video.loaded = true;
    hideOverlay(video.box);
    // Reenvia a textura a cada quadro; é o que faz o vídeo andar.
    try { video.viewer.setUpdate(true); } catch (e) {}
    montaControlesVideo();
    aplicaVisibilidade();
    resizeAll();
  }

  function sincronizaBotoes() {
    var v = video.el;
    if (!v) return;
    setGlyph(ctrl(video.box, 'play'), v.paused ? '▶' : '❚❚', v.paused ? 'Reproduzir' : 'Pausar');
    setGlyph(ctrl(video.box, 'mute'), v.muted ? '🔇' : '🔊', v.muted ? 'Ativar o som' : 'Silenciar');
  }

  function montaControlesVideo() {
    addControl(video.box, 'play', 'Pausar', '❚❚', function () {
      var v = video.el;
      if (!v) return;
      if (v.paused) { tocaVideo(v); } else { v.pause(); }
      sincronizaBotoes();
      aplicaVisibilidade();
    });
    addControl(video.box, 'mute', 'Silenciar', '🔊', function () {
      var v = video.el;
      if (!v) return;
      v.muted = !v.muted;
      if (!v.muted && v.paused) tocaVideo(v);
      sincronizaBotoes();
    });
    addSharedControls(video);
    sincronizaBotoes();

    var v = video.el;
    v.addEventListener('play', sincronizaBotoes);
    v.addEventListener('pause', sincronizaBotoes);
    v.addEventListener('volumechange', sincronizaBotoes);
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida comum                                                 */
  /* ------------------------------------------------------------------ */

  function aplicaVisibilidade() {
    var ativo = !document.hidden;

    if (foto.viewer && foto.loaded) {
      try {
        if (ativo && foto.visible && !prefersReducedMotion()) foto.viewer.startAutoRotate(AUTOROTATE_SPEED);
        else foto.viewer.stopAutoRotate();
      } catch (e) {}
    }

    if (video.viewer && video.loaded && video.el) {
      var rodando = ativo && video.visible;
      try { video.viewer.setUpdate(rodando && !video.el.paused); } catch (e) {}
      if (!rodando && !video.el.paused) { video.el.pause(); sincronizaBotoes(); }
    }
  }

  var resizeTimer = null;
  function resizeAll() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = null;
      if (foto.viewer) { try { foto.viewer.resize(); } catch (e) {} } else bootFoto();
      if (video.viewer) { try { video.viewer.resize(); } catch (e) {} } else bootVideo();
    }, 120);
  }

  function observa(painel, aoAparecer) {
    if (!painel.box) return;
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          painel.visible = entries[i].isIntersecting;
          if (painel.visible && aoAparecer) aoAparecer();
          aplicaVisibilidade();
        }
      }, { rootMargin: '250px 0px' });
      io.observe(painel.box);
    } else {
      painel.visible = true;
      if (aoAparecer) aoAparecer();
    }
    if (window.ResizeObserver) {
      new ResizeObserver(function () { resizeAll(); }).observe(painel.box);
    }
  }

  function start() {
    var hostFoto = document.getElementById(foto.hostId);
    var hostVideo = document.getElementById(video.hostId);
    foto.box = hostFoto ? hostFoto.parentNode : null;
    video.box = hostVideo ? hostVideo.parentNode : null;

    if (foto.box) observa(foto, bootFoto);
    if (video.box) { mostraCapaVideo(); observa(video, bootVideo); }

    window.addEventListener('resize', resizeAll);
    window.addEventListener('orientationchange', function () { setTimeout(resizeAll, 300); });
    document.addEventListener('visibilitychange', aplicaVisibilidade);

    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(function (evt) {
      document.addEventListener(evt, function () {
        if (foto.box) syncFullscreenButton(foto.box);
        if (video.box) syncFullscreenButton(video.box);
        resizeAll();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.keyCode !== 27) return;
      [foto.box, video.box].forEach(function (b) {
        if (b && b.classList.contains('is-pseudo-fullscreen')) setPseudoFullscreen(b, false);
      });
    });

    // O alternador de abas vive em js/main.js; aqui só reagimos ao clique.
    var tabs = document.querySelectorAll('.tour-tab-btn');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () { setTimeout(resizeAll, 80); });
    }
  }

  /* Mantido para o alternador de abas em js/main.js. */
  window.initOrResizePannellum = function () {
    foto.visible = true;
    resizeAll();
  };

  window.valedronePannellumViewer = null;
  window.valedroneVideoViewer = null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
