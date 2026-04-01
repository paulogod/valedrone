/**
 * Tour 360° com Pannellum
 * Troque a URL do panorama pela sua imagem equirectangular (ex.: da pasta panoramas/).
 */
(function () {
  var videoEl = document.getElementById('panorama');
  if (!videoEl || typeof videojs === 'undefined') return;

  // Inicializa o vídeo 360° usando Video.js + plugin Pannellum,
  // conforme exemplo oficial: https://pannellum.org/documentation/examples/video/
  try {
    videojs('panorama', {
      plugins: {
        pannellum: {},
      },
    });
  } catch (e) {
    console.error('Erro ao inicializar o vídeo 360° com Pannellum:', e);
  }
})();
