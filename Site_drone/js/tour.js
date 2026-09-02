/**
 * Tour 360° — Vale Drone
 * Player de vídeo 360° equirretangular sobre o Pannellum, preparado para
 * desktop, Android e iOS/iPadOS.
 *
 * O <iframe> do YouTube não repassa o arraste do dedo para a página, por
 * isso o vídeo é servido pelo player próprio; o link para o YouTube segue
 * disponível para quem preferir o app.
 *
 * Escolha da fonte (ver escolheFontes): o arquivo 4K é o padrão, porque a
 * conta de nitidez dá ~1:1 num painel de desktop e de celular moderno.
 * A versão leve entra quando a GPU não segura a textura de 3840px, quando
 * o usuário pediu economia de dados, ou quando a tela não tem pixels para
 * mostrar mais que isso. Se o arquivo escolhido não existir, o outro
 * assume — então o site continua funcionando enquanto a versão leve não
 * for gerada.
 *
 * Pontos tratados aqui:
 *  - inicialização preguiçosa e nova tentativa quando o painel ganha tamanho;
 *  - `dynamic` sozinho não inicia o render: o Pannellum só prossegue quando
 *    `dynamicUpdate` também vem true;
 *  - no modo dinâmico o evento 'load' nunca dispara, então a prontidão é
 *    detectada por sondagem de isLoaded();
 *  - playsinline obrigatório, senão o iOS abre o player nativo e o vídeo
 *    deixa de alimentar a textura WebGL;
 *  - os megabytes só são baixados depois do toque do usuário;
 *  - tela cheia nativa no desktop e Android, pseudo-tela-cheia no iPhone;
 *  - giroscópio com o requestPermission exigido pelo iOS 13+;
 *  - reprodução e render desligados fora da tela e com a aba em segundo plano.
 */
(function () {
  'use strict';

  var POSTER_SOURCES = ['panoramas/poster.jpg', '/panoramas/poster.jpg'];
  var YOUTUBE_URL = 'https://www.youtube.com/watch?v=DlHx9jSH0Io';

  var FONTE_4K = { largura: 3840, arquivos: ['panoramas/tour360.mp4', '/panoramas/tour360.mp4'] };
  var FONTE_LEVE = { largura: 1920, arquivos: ['panoramas/tour360-leve.mp4', '/panoramas/tour360-leve.mp4'] };

  var HFOV_INICIAL = 100;

  var box = null;
  var viewer = null;
  var videoEl = null;
  var fontes = [];
  var fonteAtual = 0;
  var posterUrl = POSTER_SOURCES[0];

  var pedido = false;
  var booting = false;
  var loaded = false;
  var dead = false;
  var visible = false;
  var resizeTimer = null;

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */

  function host() {
    return document.getElementById('panorama-video');
  }

  function isTouch() {
    return ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

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

  function querEconomia() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return false;
    if (c.saveData === true) return true;
    return /^(slow-2g|2g|3g)$/.test(c.effectiveType || '');
  }

  /**
   * Quantos pixels de largura o panorama precisa ter para chegar a 1:1 na
   * tela. Só o trecho `hfov/360` da imagem entra em cena, então a conta é
   * (pixels reais da tela) x 360 / hfov. Usa a tela inteira, e não só o
   * painel, porque o usuário pode abrir em tela cheia.
   */
  function larguraNecessaria() {
    var lado = Math.max(
      screen.width || window.innerWidth,
      screen.height || window.innerHeight
    );
    return lado * (window.devicePixelRatio || 1) * 360 / HFOV_INICIAL;
  }

  function escolheFontes(maxTextureSize) {
    // O <video> chega ao Pannellum sem width/height, então não dá para
    // dividi-lo em metades como ele faz com a imagem: a textura precisa
    // caber inteira na GPU.
    var cabe4K = maxTextureSize >= FONTE_4K.largura;
    var precisa = larguraNecessaria();
    var economia = querEconomia();
    var prefereLeve = !cabe4K || economia || precisa <= FONTE_LEVE.largura;

    var motivo;
    if (!cabe4K) motivo = 'GPU limitada a ' + maxTextureSize + 'px';
    else if (economia) motivo = 'modo de economia de dados';
    else if (precisa <= FONTE_LEVE.largura) motivo = 'tela nao aproveita mais que ' + FONTE_LEVE.largura + 'px';
    else motivo = 'tela pede ' + Math.round(precisa) + 'px';

    var lista;
    if (prefereLeve) {
      lista = FONTE_LEVE.arquivos.slice();
      // Se o arquivo leve ainda não existir, o 4K assume — mas só quando
      // a GPU aguenta.
      if (cabe4K) lista = lista.concat(FONTE_4K.arquivos);
    } else {
      lista = FONTE_4K.arquivos.concat(FONTE_LEVE.arquivos);
    }

    window.valedroneTourFonte = { escolha: prefereLeve ? 'leve' : '4K', motivo: motivo, candidatos: lista };
    return lista;
  }

  /* Confirma qual candidato existe antes de comprometer o <video>. */
  function primeiroQueExiste(lista, indice, done) {
    if (indice >= lista.length) { done(null); return; }
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', lista[indice], true);
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) done(indice);
      else primeiroQueExiste(lista, indice + 1, done);
    };
    xhr.onerror = function () { primeiroQueExiste(lista, indice + 1, done); };
    try { xhr.send(); } catch (e) { primeiroQueExiste(lista, indice + 1, done); }
  }

  /* ------------------------------------------------------------------ */
  /* Camada de mensagens                                                 */
  /* ------------------------------------------------------------------ */

  function overlay() {
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
    var el = box && box.querySelector('.pano-overlay');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function showLoading(msg) {
    var el = overlay();
    if (!el) return;
    el.className = 'pano-overlay is-loading';
    el.innerHTML = '<span class="pano-spinner" aria-hidden="true"></span><p class="pano-overlay-msg"></p>';
    el.querySelector('.pano-overlay-msg').textContent = msg;
  }

  function showFallback(msg) {
    dead = true;
    booting = false;
    var el = overlay();
    if (!el) return;
    el.className = 'pano-overlay is-error';
    el.innerHTML =
      '<p class="pano-overlay-title">Não foi possível abrir o tour 360° interativo</p>' +
      '<p class="pano-overlay-msg"></p>' +
      '<div class="pano-overlay-actions">' +
        '<button type="button" class="pano-btn-primary">Tentar de novo</button>' +
        '<a class="pano-btn-ghost" href="' + YOUTUBE_URL + '" target="_blank" rel="noopener">Abrir no YouTube ↗</a>' +
      '</div>';
    el.querySelector('.pano-overlay-msg').textContent = msg;
    el.querySelector('.pano-btn-primary').addEventListener('click', function () {
      dead = false;
      loaded = false;
      pedido = true;
      if (videoEl && videoEl.parentNode) videoEl.parentNode.removeChild(videoEl);
      videoEl = null;
      boot();
    });
  }

  function toast(msg) {
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
  /* Controles                                                           */
  /* ------------------------------------------------------------------ */

  function ctrl(action) {
    return box ? box.querySelector('[data-pano-action="' + action + '"]') : null;
  }

  function setGlyph(btn, glyph, label) {
    if (!btn) return;
    btn.innerHTML = '<span aria-hidden="true">' + glyph + '</span>';
    btn.setAttribute('aria-label', label);
    btn.title = label;
  }

  function addControl(action, label, glyph, handler) {
    var bar = box.querySelector('.pano-controls');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'pano-controls';
      box.appendChild(bar);
    }
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

  function syncFullscreenButton() {
    var btn = ctrl('fullscreen');
    if (!btn || !box) return;
    var on = fsElement() === box || box.classList.contains('is-pseudo-fullscreen');
    setGlyph(btn, on ? '✕' : '⛶', on ? 'Sair da tela cheia' : 'Tela cheia');
  }

  function setPseudoFullscreen(on) {
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

  function toggleFullscreen() {
    if (!box) return;
    if (fsElement()) {
      var exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exit) { try { exit.call(document); } catch (e) {} }
      return;
    }
    if (box.classList.contains('is-pseudo-fullscreen')) { setPseudoFullscreen(false); return; }
    if (canNativeFullscreen(box)) {
      var req = box.requestFullscreen || box.webkitRequestFullscreen || box.msRequestFullscreen;
      try {
        var r = req.call(box);
        if (r && typeof r['catch'] === 'function') r['catch'](function () { setPseudoFullscreen(true); });
      } catch (e) {
        setPseudoFullscreen(true);
      }
    } else {
      setPseudoFullscreen(true);
    }
  }

  function toggleOrientation() {
    if (!viewer) return;
    var btn = ctrl('orientation');
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
        else toast('Permissão de movimento negada. Libere em Ajustes › Apps › Safari › Movimento e orientação.');
      })['catch'](function () {
        toast('Não foi possível ativar o giroscópio neste aparelho.');
      });
      return;
    }
    liga();
  }

  function sincronizaBotoes() {
    if (!videoEl) return;
    setGlyph(ctrl('play'), videoEl.paused ? '▶' : '❚❚', videoEl.paused ? 'Reproduzir' : 'Pausar');
    setGlyph(ctrl('mute'), videoEl.muted ? '🔇' : '🔊', videoEl.muted ? 'Ativar o som' : 'Silenciar');
  }

  function montaControles() {
    addControl('play', 'Pausar', '❚❚', function () {
      if (!videoEl) return;
      if (videoEl.paused) toca(); else videoEl.pause();
      sincronizaBotoes();
      aplicaVisibilidade();
    });
    addControl('mute', 'Silenciar', '🔊', function () {
      if (!videoEl) return;
      videoEl.muted = !videoEl.muted;
      if (!videoEl.muted && videoEl.paused) toca();
      sincronizaBotoes();
    });
    addControl('fullscreen', 'Tela cheia', '⛶', toggleFullscreen);
    if (window.DeviceOrientationEvent && isTouch()) {
      var g = addControl('orientation', 'Usar o giroscópio', '🧭', toggleOrientation);
      if (g) g.setAttribute('aria-pressed', 'false');
    }
    syncFullscreenButton();
    sincronizaBotoes();
    videoEl.addEventListener('play', sincronizaBotoes);
    videoEl.addEventListener('pause', sincronizaBotoes);
    videoEl.addEventListener('volumechange', sincronizaBotoes);
  }

  /* ------------------------------------------------------------------ */
  /* Capa                                                                */
  /* ------------------------------------------------------------------ */

  function resolvePoster() {
    var i = 0;
    function tenta() {
      if (i >= POSTER_SOURCES.length) return;
      var img = new Image();
      img.onload = function () {
        posterUrl = POSTER_SOURCES[i];
        if (box && !loaded) box.style.backgroundImage = 'url("' + posterUrl + '")';
      };
      img.onerror = function () { i += 1; tenta(); };
      img.src = POSTER_SOURCES[i];
    }
    tenta();
  }

  function mostraCapa() {
    if (!box) return;
    var el = overlay();
    el.className = 'pano-overlay is-poster';
    el.innerHTML =
      '<button type="button" class="pano-play" aria-label="Reproduzir o tour em vídeo 360°">' +
        '<span aria-hidden="true">▶</span>' +
      '</button>' +
      '<p class="pano-overlay-msg">Tour em vídeo 360° · 1min57 · arraste para olhar em volta durante o voo</p>';
    el.querySelector('.pano-play').addEventListener('click', function () {
      pedido = true;
      boot();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Ciclo de vida                                                       */
  /* ------------------------------------------------------------------ */

  function toca() {
    if (!videoEl) return;
    var p;
    try { p = videoEl.play(); } catch (e) { p = null; }
    if (p && typeof p['catch'] === 'function') {
      p['catch'](function () {
        // Som bloqueado pela política de autoplay: repete no mudo.
        videoEl.muted = true;
        var q;
        try { q = videoEl.play(); } catch (e) { q = null; }
        if (q && typeof q['catch'] === 'function') q['catch'](function () {});
        sincronizaBotoes();
        toast('O navegador bloqueou o som. Toque no alto-falante para ativar.');
      });
    }
  }

  function boot() {
    if (booting || loaded || dead || !pedido) return;
    var el = host();
    if (!el || !box) return;

    if (typeof pannellum === 'undefined') {
      showFallback('A biblioteca do visualizador 360° não pôde ser carregada.');
      return;
    }
    if (!el.clientWidth || !el.clientHeight) return;

    var limites = webglLimits();
    if (!limites) {
      showFallback('Seu navegador está sem aceleração WebGL, necessária para o tour 360° interativo.');
      return;
    }

    booting = true;
    showLoading('Procurando a melhor versão do vídeo…');

    fontes = escolheFontes(limites.maxTextureSize);
    primeiroQueExiste(fontes, 0, function (indice) {
      if (indice === null) {
        showFallback('O vídeo do tour 360° não foi encontrado no servidor.');
        return;
      }
      fonteAtual = indice;
      criaVideo(fontes[indice]);
    });
  }

  function criaVideo(url) {
    showLoading('Carregando o tour 360°…');

    var v = document.createElement('video');
    v.className = 'pano-video-source';
    // playsinline é obrigatório: sem ele o iOS abre o player nativo em tela
    // cheia e o vídeo deixa de alimentar a textura WebGL.
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.playsInline = true;
    v.loop = true;
    v.preload = 'auto';
    v.src = url;
    videoEl = v;
    box.appendChild(v);
    if (window.valedroneTourFonte) window.valedroneTourFonte.usada = url;

    var montado = false;

    v.addEventListener('error', function () {
      // Um erro depois do vídeo já ter carregado (rede oscilando, por
      // exemplo) não pode rebaixar a fonte: só trocamos antes do primeiro
      // quadro chegar.
      if (montado) return;
      fonteAtual += 1;
      if (fonteAtual < fontes.length) {
        v.src = fontes[fonteAtual];
        if (window.valedroneTourFonte) window.valedroneTourFonte.usada = fontes[fonteAtual];
        v.load();
        toca();
        return;
      }
      showFallback('O vídeo do tour 360° não pôde ser carregado. Verifique sua conexão.');
    });

    v.addEventListener('loadeddata', function () {
      if (montado) return;
      montado = true;
      montaViewer(v);
    });

    v.load();
    toca();
  }

  function montaViewer(v) {
    try {
      viewer = pannellum.viewer('panorama-video', {
        type: 'equirectangular',
        panorama: v,
        // dynamic sozinho não basta: o Pannellum só inicia o render quando
        // dynamicUpdate também vem true.
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
        hfov: HFOV_INICIAL, minHfov: 50, maxHfov: 120,
        yaw: 0, pitch: 0,
        autoRotate: 0,
        orientationOnByDefault: false
      });
    } catch (e) {
      showFallback('Falha ao iniciar o tour 360° neste navegador.');
      return;
    }

    window.valedroneVideoViewer = viewer;

    // No modo dinâmico o Pannellum entra por um atalho e nunca dispara o
    // evento 'load'. Sem detectar a prontidão, o overlay de carregamento
    // fica por cima do painel e engole o arraste do dedo.
    viewer.on('load', finaliza);
    esperaPronto(40);

    viewer.on('error', function (msg) {
      try { viewer.destroy(); } catch (e) {}
      viewer = null;
      window.valedroneVideoViewer = null;
      showFallback(msg || 'O tour 360° não pôde ser exibido neste aparelho.');
    });
  }

  function esperaPronto(tentativas) {
    if (loaded || dead || !viewer) return;
    var pronto = false;
    try { pronto = viewer.isLoaded(); } catch (e) {}
    if (pronto) { finaliza(); return; }
    if (tentativas <= 0) {
      showFallback('O vídeo não pôde ser preparado para exibição neste navegador.');
      return;
    }
    setTimeout(function () { esperaPronto(tentativas - 1); }, 150);
  }

  function finaliza() {
    if (loaded || dead || !viewer) return;
    booting = false;
    loaded = true;
    hideOverlay();
    if (box) box.style.backgroundImage = '';
    // Reenvia a textura a cada quadro; é o que faz o vídeo andar.
    try { viewer.setUpdate(true); } catch (e) {}
    montaControles();
    aplicaVisibilidade();
    scheduleResize();
  }

  function aplicaVisibilidade() {
    if (!viewer || !loaded || !videoEl) return;
    var rodando = visible && !document.hidden;
    try { viewer.setUpdate(rodando && !videoEl.paused); } catch (e) {}
    if (!rodando && !videoEl.paused) { videoEl.pause(); sincronizaBotoes(); }
  }

  function scheduleResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resizeTimer = null;
      if (viewer) { try { viewer.resize(); } catch (e) {} }
      else boot();
    }, 120);
  }

  function start() {
    var el = host();
    if (!el) return;
    box = el.parentNode;

    mostraCapa();
    resolvePoster();

    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          visible = entries[i].isIntersecting;
          if (visible) boot();
          aplicaVisibilidade();
        }
      }, { rootMargin: '250px 0px' });
      io.observe(box);
    } else {
      visible = true;
    }

    if (window.ResizeObserver) {
      new ResizeObserver(function () { scheduleResize(); }).observe(box);
    }

    window.addEventListener('resize', scheduleResize);
    window.addEventListener('orientationchange', function () { setTimeout(scheduleResize, 300); });
    document.addEventListener('visibilitychange', aplicaVisibilidade);

    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(function (evt) {
      document.addEventListener(evt, function () { syncFullscreenButton(); scheduleResize(); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.keyCode !== 27) return;
      if (box && box.classList.contains('is-pseudo-fullscreen')) setPseudoFullscreen(false);
    });
  }

  window.valedroneVideoViewer = null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
