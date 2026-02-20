// Admin dashboard entry: IP check + auto sign-in — nightbio.lol
(function() {
  var ALLOWED_ADMIN_IP = '172.56.60.194';
  var ADMIN_EMAIL = 'admin@nightbio.lol';
  var ADMIN_PASSWORD = '9916202374Aa';

  function fetchIp(url, parse) {
    return fetch(url, { mode: 'cors' })
      .then(function(r) { return r.text(); })
      .then(function(text) { return parse(text); })
      .catch(function() { return null; });
  }

  function checkIp() {
    return fetchIp('https://api.ipify.org?format=json', function(text) {
      try {
        var d = JSON.parse(text);
        return (d && d.ip) ? d.ip : null;
      } catch (e) { return null; }
    }).then(function(ip) {
      if (ip) return ip;
      return fetchIp('https://api64.ipify.org?format=json', function(text) {
        try {
          var d = JSON.parse(text);
          return (d && d.ip) ? d.ip : null;
        } catch (e) { return null; }
      });
    }).then(function(ip) {
      if (ip) return ip;
      return fetchIp('https://ifconfig.me/ip', function(text) {
        var t = (text && text.trim()) || '';
        return t.length > 0 && t.length < 50 ? t : null;
      });
    }).then(function(ip) {
      return ip || '';
    });
  }

  function handleAdminEntry() {
    var btn = document.getElementById('adminDashboardBtn');
    if (btn) btn.disabled = true;
    checkIp().then(function(ip) {
      if (!ip) {
        alert('Could not verify IP. Check your connection, disable ad/tracking blockers for this site, and try again.');
        if (btn) btn.disabled = false;
        return;
      }
      if (ip !== ALLOWED_ADMIN_IP) {
        alert('Admin dashboard is restricted to authorized IPs. Your IP: ' + ip);
        if (btn) btn.disabled = false;
        return;
      }
      try {
        if (typeof initFirebase === 'function') initFirebase();
        var auth = getAuth();
        if (!auth) {
          alert('Unable to load auth.');
          if (btn) btn.disabled = false;
          return;
        }
        auth.signInWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
          .then(function() {
            window.location.href = 'admin';
          })
          .catch(function(err) {
            var code = (err && err.code) || '';
            if (code === 'auth/invalid-login-credentials' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
              alert(
                'Admin account not set up.\n\n' +
                '1. In Firebase Console → Authentication → Add user:\n' +
                '   Email: ' + ADMIN_EMAIL + '\n' +
                '   Password: ' + ADMIN_PASSWORD + '\n\n' +
                '2. In Realtime Database, set:\n' +
                '   adminUids/<that-user-uid> = true\n\n' +
                'Replace <that-user-uid> with the UID of the user you just created.'
              );
            } else {
              alert(err.message || 'Admin sign-in failed.');
            }
            if (btn) btn.disabled = false;
          });
      } catch (e) {
        alert(e && e.message ? e.message : 'Something went wrong. Try again.');
        if (btn) btn.disabled = false;
      }
    }).catch(function() {
      alert('Could not verify IP. Check your connection and try again.');
      if (btn) btn.disabled = false;
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('adminDashboardBtn');
    if (btn) btn.addEventListener('click', handleAdminEntry);
  });
})();
