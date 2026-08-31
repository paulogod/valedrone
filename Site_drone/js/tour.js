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
<<<<<<< HEAD
          showControls: true,
          hfov: 100,
          minHfov: 50,
          maxHfov: 120
=======
          showControls: true
>>>>>>> b8dd9ac5d8f282dce11b1f8cc58c518df89a6977
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

