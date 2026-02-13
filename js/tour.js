/**
 * Tour 360° com Pannellum
 * Troque a URL do panorama pela sua imagem equirectangular (ex.: da pasta panoramas/).
 */
(function () {
  var container = document.getElementById('panorama');
  if (!container) return;

  // Imagem 360° de fazenda (equirectangular) via link externo
  // Exemplo de fonte gratuita (CC0): Poly Haven — Farm Field
  // https://polyhaven.com/a/farm_field
  //
  // Recomenda-se baixar e hospedar a imagem no seu próprio servidor para produção,
  // mas para testes você pode usar um link direto/otimizado aqui.
  //
  // Substitua abaixo pela URL direta da imagem JPG 360° que você escolher:
  var demoPanorama = 'https://pannellum.org/images/cerro-toco-0.jpg'; // TODO: trocar por link 360° de fazenda

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
