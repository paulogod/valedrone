/**
 * Tour 360° com Pannellum + Video.js e Fallback inteligente para iOS/Mobile
 */
(function () {
  var videoEl = document.getElementById('panorama');
  if (!videoEl || typeof videojs === 'undefined') return;

  function hasWebGLSupport() {
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!(window.WebGLRenderingContext && gl);
    } catch (e) {
      return false;
    }
  }

  var supportsWebGL = hasWebGLSupport();

  var playerOptions = {
    loop: true,
    autoplay: false,
    preload: 'auto',
    controls: true,
    playsinline: true
  };

  if (supportsWebGL && typeof pannellum !== 'undefined') {
    playerOptions.plugins = {
      pannellum: {
        autoLoad: true,
        loop: true,
        showControls: false,
        preview: 'panoramas/poster.jpg',
        hfov: 100,
        minHfov: 60,
        maxHfov: 120,
        yaw: 0,
        pitch: 0
      }
    };
  }

  try {
    var player = videojs('panorama', playerOptions);

    player.on('ended', function () {
      player.play();
    });

    player.on('error', function () {
      var pnlm = document.querySelector('.pnlm-container');
      if (pnlm) pnlm.remove();
    });
  } catch (e) {
    console.warn('Fallback para player de vídeo padrão:', e);
    try {
      videojs('panorama', {
        loop: true,
        controls: true,
        playsinline: true
      });
    } catch (err) {}
  }
})();



