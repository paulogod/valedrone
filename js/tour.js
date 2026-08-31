/**
 * Tour 360° com Pannellum — 100% compatível com Safari / iOS / Android / Desktop
 */
(function () {
  var container = document.getElementById('panorama');
  if (!container || typeof pannellum === 'undefined') return;

  try {
    pannellum.viewer('panorama', {
      type: 'equirectangular',
      panorama: 'panoramas/poster.jpg',
      autoLoad: true,
      autoRotate: -1.5,
      autoRotateInactivityDelay: 2000,
      compass: false,
      showControls: true,
      mouseZoom: true,
      hfov: 100,
      minHfov: 50,
      maxHfov: 120,
      yaw: 0,
      pitch: -5,
      showFullscreenCtrl: true,
      showZoomCtrl: true
    });
  } catch (e) {
    console.warn('Erro ao inicializar o Tour 360:', e);
  }
})();




