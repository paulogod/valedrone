/**
 * Tour 360° Interativo com Pannellum Oficial
 */
(function () {
  function initPannellum() {
    var panoramaEl = document.getElementById('panorama');
    if (!panoramaEl || typeof pannellum === 'undefined') return;

    try {
      pannellum.viewer('panorama', {
        type: 'equirectangular',
        panorama: 'panoramas/poster.jpg',
        autoLoad: true,
        autoRotate: -1.5,
        autoRotateInactivityDelay: 3000,
        compass: false,
        showControls: true,
        showFullscreenCtrl: true,
        showZoomCtrl: true,
        mouseZoom: true,
        hfov: 100,
        minHfov: 50,
        maxHfov: 120,
        yaw: 0,
        pitch: -5
      });
    } catch (e) {
      console.warn('Erro ao inicializar o tour 360:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPannellum);
  } else {
    initPannellum();
  }
})();






