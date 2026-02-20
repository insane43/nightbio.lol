// Landing page: scroll reveal, hero reveal, phone parallax (same as card modal)
(function() {
  function run() {
    var reveals = document.querySelectorAll('.landing-reveal');
    if (!reveals.length) return;

    var hero = document.querySelector('.landing-hero');
    if (hero) {
      var heroReveals = hero.querySelectorAll('.landing-reveal');
      heroReveals.forEach(function(el, i) {
        el.style.transitionDelay = (i * 0.1) + 's';
        el.classList.add('revealed');
      });
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) entry.target.classList.add('revealed');
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    reveals.forEach(function(el) {
      if (el.closest('.landing-hero')) return;
      observer.observe(el);
    });

    // Phone: 3D tilt parallax (same as bio card modal)
    var wrap = document.getElementById('landingDeviceWrap');
    var device = document.getElementById('landingDevice');
    if (wrap && device) {
      var maxDeg = 6;
      function setTilt(rotY, rotX) {
        device.style.setProperty('--landing-tilt-y', rotY + 'deg');
        device.style.setProperty('--landing-tilt-x', rotX + 'deg');
      }
      function onMove(ev) {
        var r = device.getBoundingClientRect();
        var cx = ev.clientX - r.left;
        var cy = ev.clientY - r.top;
        var x = (cx / Math.max(1, r.width)) * 2 - 1;
        var y = (cy / Math.max(1, r.height)) * 2 - 1;
        setTilt((x * maxDeg).toFixed(2), ((-y) * maxDeg).toFixed(2));
      }
      function onEnter() {
        wrap.addEventListener('mousemove', onMove, { passive: true });
      }
      function onLeave() {
        wrap.removeEventListener('mousemove', onMove);
        setTilt(0, 0);
      }
      wrap.addEventListener('mouseenter', onEnter);
      wrap.addEventListener('mouseleave', onLeave);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
