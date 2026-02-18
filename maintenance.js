// Maintenance mode — show overlay on non-admin pages when siteConfig.maintenanceMode is true
(function() {
  function run() {
    var path = (window.location.pathname || '').toLowerCase();
    if (path.indexOf('admin') !== -1) return;
    if (typeof initFirebase === 'function') initFirebase();
    var db = typeof getDb === 'function' ? getDb() : null;
    if (!db) return;
    db.ref('siteConfig/maintenanceMode').once('value').then(function(snap) {
      if (!snap.val()) return;
      db.ref('siteConfig/maintenanceMessage').once('value').then(function(msgSnap) {
        var msg = (msgSnap.val() || 'We\'ll be back soon.').trim() || 'We\'ll be back soon.';
        var wrap = document.createElement('div');
        wrap.id = 'maintenance-overlay';
        wrap.className = 'maintenance-overlay';
        wrap.innerHTML = '<div class="maintenance-box"><h1>Under maintenance</h1><p>' + escapeHtml(msg) + '</p></div>';
        document.body.appendChild(wrap);
      });
    }).catch(function() {});
  }
  function escapeHtml(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
