/**
 * Tour 360° com Pannellum
 * Troque a URL do panorama pela sua imagem equirectangular (ex.: da pasta panoramas/).
 */
(function () {
  var container = document.getElementById('panorama');
  if (!container) return;

  // Imagem 360° de fazenda (equirectangular). Baixe o arquivo escolhido
  // e salve em panoramas/fazenda-360.jpg para usá-lo aqui.
  // Exemplo de fonte gratuita: 
  // https://www.vecteezy.com/photo/17619873-full-seamless-hdri-360-panorama-among-farming-field-with-cut-grass-and-clouds-in-overcast-sky-in-equirectangular-spherical-projection-ready-for-use-as-sky-replacement-in-drone-panoramas-or-vr-content
  var demoPanorama = 'panoramas/fazenda-360.jpg';

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
