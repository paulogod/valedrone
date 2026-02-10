/**
 * Tour 360° com Pannellum
 * Troque a URL do panorama pela sua imagem equirectangular (ex.: da pasta panoramas/).
 */
(function () {
  var container = document.getElementById('panorama');
  if (!container) return;

  // Imagem de demonstração (equirectangular). Substitua por sua imagem em panoramas/nome.jpg
  var demoPanorama = 'https://pannellum.org/images/cerro-toco-0.jpg';

  // Quando você tiver suas fotos 360°, use por exemplo:
  // var minhaImagem = 'panoramas/salao.jpg';

  try {
    pannellum.viewer('panorama', {
      type: 'equirectangular',
      panorama: demoPanorama,
      autoLoad: true,
      showControls: true,
      compass: true,
      northOffset: 0,
      minHfov: 30,
      maxHfov: 90,
      hfov: 80,
      mouseZoom: true,
      draggable: true,
      disableKeyboard: false,
      showFullscreenCtrl: true,
      showZoomCtrl: true,
    });
  } catch (e) {
    container.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9aa0a8;padding:1rem;">' +
      'Adicione uma imagem 360° em <code>panoramas/</code> e configure o caminho em <code>js/tour.js</code>.' +
      '</div>';
  }
})();
