/**
 * Tour 360° com Pannellum + Video.js
 */
(function () {
  var videoEl = document.getElementById('panorama');
  if (!videoEl || typeof videojs === 'undefined') return;

  try {
    var player = videojs('panorama', {
      loop: true,
      autoplay: false,
      preload: 'metadata',
      plugins: {
        pannellum: {
          autoLoad: true,
          loop: true,
          showControls: true
        }
      }
    });

    player.on('ended', function () {
      player.play();
    });
  } catch (e) {
    console.error('Erro ao inicializar o vídeo 360° com Pannellum:', e);
  }
})();

