// Site config (announcement, site name, tagline, allowSignups) — read from Realtime Database
(function() {
  function run() {
    if (typeof initFirebase === 'function') initFirebase();
    var db = window.firebaseDb || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
    if (!db) return;
    db.ref('siteConfig').once('value').then(function(snap) {
      var c = snap.val() || {};
      var config = {
        announcementEnabled: !!c.announcementEnabled,
        announcementText: (c.announcementText || '').trim(),
        siteName: (c.siteName || '').trim() || 'nightbio',
        tagline: (c.tagline || '').trim() || 'Your link in one place',
        allowSignups: c.allowSignups === false ? false : true
      };
      window._siteConfig = config;

      if (config.announcementEnabled && config.announcementText) {
        var wrap = document.createElement('div');
        wrap.className = 'site-announcement';
        wrap.setAttribute('role', 'alert');
        wrap.textContent = config.announcementText;
        var first = document.body.firstElementChild;
        if (first) document.body.insertBefore(wrap, first);
        else document.body.appendChild(wrap);
      }

      var logo = document.querySelector('.brand .logo-text');
      var taglineEl = document.querySelector('.brand .tagline');
      if (logo && config.siteName) logo.textContent = config.siteName;
      if (taglineEl && config.tagline) taglineEl.textContent = config.tagline;

      try {
        window.dispatchEvent(new CustomEvent('siteConfigReady', { detail: config }));
      } catch (e) {}
    }).catch(function() {});
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
