/**
 * Tour 360° com Video.js + Pannellum (compatível com Safari / iOS / Android / Desktop)
 */
(function () {
  var videoEl = document.getElementById('panorama');
  if (!videoEl || typeof videojs === 'undefined') return;

  var player = videojs('panorama', {
    loop: true,
    autoplay: false,
    preload: 'auto',
    controls: true,
    playsinline: true,
    controlBar: {
      volumePanel: { inline: false },
      fullscreenToggle: true,
      pictureInPictureToggle: false
    }
  });

  function initPannellum() {
    if (typeof pannellum === 'undefined' || videoEl.dataset.pnlmInit) return;
    videoEl.dataset.pnlmInit = 'true';

    try {
      var container = player.el();
      var pnlmContainer = document.createElement('div');
      pnlmContainer.className = 'pnlm-container';
      pnlmContainer.style.position = 'absolute';
      pnlmContainer.style.top = '0';
      pnlmContainer.style.left = '0';
      pnlmContainer.style.width = '100%';
      pnlmContainer.style.height = '100%';
      pnlmContainer.style.zIndex = '1';

      container.insertBefore(pnlmContainer, container.firstChild);

      pannellum.viewer(pnlmContainer, {
        type: 'equirectangular',
        dynamic: true,
        panorama: videoEl,
        autoLoad: true,
        loop: true,
        showControls: false,
        hfov: 100,
        minHfov: 50,
        maxHfov: 120,
        yaw: 0,
        pitch: -5
      });
    } catch (err) {
      console.warn('Pannellum WebGL fallback para player de vídeo:', err);
      var errEl = document.querySelector('.pnlm-container');
      if (errEl) errEl.remove();
    }
  }

  // Inicializa o Pannellum assim que os metadados do vídeo estiverem prontos
  if (videoEl.readyState >= 1) {
    initPannellum();
  } else {
    videoEl.addEventListener('loadedmetadata', initPannellum, { once: true });
    player.on('play', initPannellum);
  }

  player.on('ended', function () {
    player.play();
  });
})();





