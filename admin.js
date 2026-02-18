// Admin-only helpers — nightbio.lol (use from admin dashboard only)

function isAdmin(uid) {
  var db = getDb();
  if (!db || !uid) return Promise.resolve(false);
  return db.ref('adminUids/' + uid).once('value').then(function(snap) {
    return snap.val() === true;
  });
}

function getAllUsers() {
  var db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  return db.ref('users').once('value').then(function(snap) {
    var val = snap.val();
    if (!val) return [];
    return Object.keys(val).map(function(uid) {
      var u = val[uid];
      return {
        uid: uid,
        username: u.username || '',
        email: u.email || '',
        displayName: u.displayName || '',
        badges: mergeBadges(u.badges),
        stats: u.stats || { views: 0 }
      };
    });
  });
}

function setUserBadge(uid, badgeId, value) {
  var db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  var key = 'badges/' + badgeId;
  return db.ref('users/' + uid + '/' + key).set(!!value);
}

function setUserBadges(uid, badges) {
  var db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  var updates = {};
  var keys = ['og', 'owner', 'staff', 'verified', 'premium'];
  for (var i = 0; i < keys.length; i++) {
    updates['badges/' + keys[i]] = !!(badges && badges[keys[i]]);
  }
  return db.ref('users/' + uid).update(updates);
}
