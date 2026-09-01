/**
 * Menu mobile e smooth scroll
 */
(function () {
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.querySelector('.nav');
  var navLinks = document.querySelectorAll('.nav a');

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', nav.classList.contains('open'));
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
      });
    });
  }

  // Galeria de Vídeos TikTok com Carregamento sob Demanda e Tela Cheia
  var tiktokCards = document.querySelectorAll('.gallery-item[data-video-id]');
  tiktokCards.forEach(function (card) {
    var cardInner = card.querySelector('.tiktok-card-inner');
    if (!cardInner) return;

    cardInner.addEventListener('click', function () {
      var videoId = card.getAttribute('data-video-id');
      var title = card.getAttribute('data-title') || 'Vídeo Vale Drone';
      if (!videoId || card.classList.contains('is-loaded')) return;

      card.classList.add('is-loaded');

      var fullscreenBar = document.createElement('div');
      fullscreenBar.className = 'gallery-fullscreen-bar';

      var fsBtn = document.createElement('button');
      fsBtn.className = 'btn-fullscreen-toggle';
      fsBtn.innerHTML = '⛶ Tela Cheia';
      fsBtn.setAttribute('aria-label', 'Ver em tela cheia');

      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.tiktok.com/embed/v2/' + videoId;
      iframe.title = title;
      iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';

      fsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
          iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
          iframe.msRequestFullscreen();
        }
      });

      fullscreenBar.appendChild(fsBtn);
      card.appendChild(fullscreenBar);
      card.appendChild(iframe);
    });
  });
})();
