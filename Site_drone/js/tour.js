/**
 * Tour 360° com Video.js + Plugin Pannellum Oficial
 */
(function () {
  var videoEl = document.getElementById('panorama');
  if (!videoEl || typeof videojs === 'undefined') return;

  try {
    var player = videojs('panorama', {
      loop: true,
      autoplay: false,
      preload: 'auto',
      controls: true,
      playsinline: true,
      plugins: {
        pannellum: {
          showControls: false,
          autoRotate: -1.5,
          autoRotateInactivityDelay: 3000,
          hfov: 100,
          minHfov: 50,
          maxHfov: 120,
          yaw: 0,
          pitch: -5
        }
      }
    });

    player.on('ended', function () {
      player.play();
    });
  } catch (e) {
    console.warn('Erro ao inicializar o player 360:', e);
  }
})();






