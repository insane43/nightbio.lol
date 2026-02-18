// Admin dashboard entry: IP check + auto sign-in — nightbio.lol
(function() {
  var ALLOWED_ADMIN_IP = '172.56.25.44';
  var ADMIN_EMAIL = 'admin@nightbio.lol';
  var ADMIN_PASSWORD = '9916202374Aa';

  function checkIp() {
    return fetch('https://api.ipify.org?format=json')
      .then(function(r) { return r.json(); })
      .then(function(d) { return d.ip; })
      .catch(function() { return ''; });
  }

  function handleAdminEntry() {
    var btn = document.getElementById('adminDashboardBtn');
    if (btn) btn.disabled = true;
    checkIp().then(function(ip) {
      if (ip !== ALLOWED_ADMIN_IP) {
        alert('Admin dashboard is restricted to authorized IPs.');
        if (btn) btn.disabled = false;
        return;
      }
      if (typeof initFirebase === 'function') initFirebase();
      var auth = getAuth();
      if (!auth) {
        alert('Unable to load auth.');
        if (btn) btn.disabled = false;
        return;
      }
      auth.signInWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
        .then(function() {
          window.location.href = '/admin';
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
    }).catch(function() {
      alert('Could not verify IP.');
      if (btn) btn.disabled = false;
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('adminDashboardBtn');
    if (btn) btn.addEventListener('click', handleAdminEntry);
  });
})();
