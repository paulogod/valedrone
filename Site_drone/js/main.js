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

  // Ajuste Responsivo dos Vídeos 3 e 4 (Paisagem no Desktop vs Vertical no Celular)
  function setupResponsiveLandscapeVideos() {
    var landscapeVideos = document.querySelectorAll('.responsive-landscape-video');
    if (!landscapeVideos.length) return;

    function checkOrientation() {
      var isDesktop = window.innerWidth >= 768;
      landscapeVideos.forEach(function (video) {
        var desktopSrc = video.getAttribute('data-desktop-src');
        var mobileSrc = video.getAttribute('data-mobile-src');
        var desktopPoster = video.getAttribute('data-desktop-poster');
        var mobilePoster = video.getAttribute('data-mobile-poster');
        var targetSrc = isDesktop ? desktopSrc : mobileSrc;
        var targetPoster = isDesktop ? desktopPoster : mobilePoster;
        var currentMode = video.getAttribute('data-current-mode');
        var targetMode = isDesktop ? 'desktop' : 'mobile';

        if (currentMode !== targetMode && targetSrc) {
          var wasPlaying = !video.paused;
          var curTime = video.currentTime;
          video.setAttribute('data-current-mode', targetMode);
          if (targetPoster) video.poster = targetPoster;
          video.src = targetSrc;
          if (wasPlaying) {
            video.currentTime = curTime;
            video.play().catch(function () {});
          }
        }
      });
    }

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
  }

  // Alternador de Abas do Tour 360° (Vídeo 360 YouTube vs Foto Panorâmica HD)
  function setupTourTabs() {
    var tabBtns = document.querySelectorAll('.tour-tab-btn');
    if (!tabBtns.length) return;

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetTab = btn.getAttribute('data-tab');
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tour-tab-content').forEach(function (content) {
          content.classList.remove('active');
        });

        btn.classList.add('active');
        var targetContent = document.getElementById('tab-' + targetTab);
        if (targetContent) {
          targetContent.classList.add('active');
        }

        if (targetTab === 'photo-360' && typeof initOrResizePannellum === 'function') {
          setTimeout(initOrResizePannellum, 60);
        }
      });
    });
  }

  setupTourTabs();
  setupResponsiveLandscapeVideos();
})();
