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
      preload: 'auto',
      controls: true,
      plugins: {
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
      }
    });

    player.on('ended', function () {
      player.play();
    });
  } catch (e) {
    console.error('Erro ao inicializar o vídeo 360° com Pannellum:', e);
  }
})();


