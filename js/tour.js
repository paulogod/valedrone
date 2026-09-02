/**
 * Tour 360° Interativo com Pannellum Oficial
 */
window.valedronePannellumViewer = null;

function initOrResizePannellum() {
  var panoramaEl = document.getElementById('panorama');
  if (!panoramaEl || typeof pannellum === 'undefined') return;

  // Se o container estiver oculto (clientWidth == 0), não inicializa com 0x0
  if (panoramaEl.clientWidth === 0 || panoramaEl.clientHeight === 0) {
    return;
  }

  if (!window.valedronePannellumViewer) {
    try {
      window.valedronePannellumViewer = pannellum.viewer('panorama', {
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
        draggable: true,
        friction: 0.15,
        touchPanSpeedCoeffFactor: 1,
        hfov: 100,
        minHfov: 50,
        maxHfov: 120,
        yaw: 0,
        pitch: -5
      });
    } catch (e) {
      console.warn('Erro ao inicializar o tour 360:', e);
    }
  } else {
    try {
      if (typeof window.valedronePannellumViewer.resize === 'function') {
        window.valedronePannellumViewer.resize();
      }
    } catch (e) {}
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOrResizePannellum);
} else {
  initOrResizePannellum();
}






