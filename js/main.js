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

  // Galeria de Vídeos Nativos com Controle de Play/Pause, Loop e Tela Cheia
  var nativeWrappers = document.querySelectorAll('.native-video-wrapper');
  nativeWrappers.forEach(function (wrapper) {
    var video = wrapper.querySelector('video');
    var fsBtn = wrapper.querySelector('.btn-native-fs');
    if (!video) return;

    // Pausa outros vídeos quando um iniciar a reprodução
    video.addEventListener('play', function () {
      nativeWrappers.forEach(function (otherWrapper) {
        var otherVideo = otherWrapper.querySelector('video');
        if (otherVideo && otherVideo !== video && !otherVideo.paused) {
          otherVideo.pause();
          otherWrapper.classList.remove('is-playing');
        }
      });
      wrapper.classList.add('is-playing');
    });

    video.addEventListener('pause', function () {
      wrapper.classList.remove('is-playing');
    });

    // Clique no card para alternar Play / Pause
    wrapper.addEventListener('click', function (e) {
      if (e.target.closest('.btn-native-fs') || e.target.closest('.video-tiktok-btn')) {
        return;
      }
      if (video.paused) {
        video.play().catch(function () {});
      } else {
        video.pause();
      }
    });

    // Botão de Tela Cheia Real
    if (fsBtn) {
      fsBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (video.requestFullscreen) {
          video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
          video.webkitRequestFullscreen();
        } else if (video.webkitEnterFullscreen) { // iOS Safari
          video.webkitEnterFullscreen();
        } else if (video.msRequestFullscreen) {
          video.msRequestFullscreen();
        }
      });
    }
  });
})();
