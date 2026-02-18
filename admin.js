// Admin panel — nightbio.lol (use from admin only)

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

function getSiteConfig() {
  var db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  return db.ref('siteConfig').once('value').then(function(snap) {
    var v = snap.val();
    return {
      maintenanceMode: !!(v && v.maintenanceMode),
      maintenanceMessage: (v && v.maintenanceMessage) || 'We\'ll be back soon.'
    };
  });
}

function setMaintenanceMode(on, message) {
  var db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  var updates = {
    maintenanceMode: !!on,
    maintenanceMessage: String(message || '').trim().slice(0, 500) || 'We\'ll be back soon.',
    maintenanceUpdatedAt: firebase.database.ServerValue.TIMESTAMP
  };
  return db.ref('siteConfig').update(updates);
}

function getBannedUids() {
  var db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  return db.ref('bannedUids').once('value').then(function(snap) {
    var val = snap.val();
    if (!val || typeof val !== 'object') return {};
    return val;
  });
}

function banUser(uid) {
  var db = getDb();
  if (!db || !uid) return Promise.reject(new Error('Invalid'));
  return db.ref('bannedUids/' + uid).set(true);
}

function unbanUser(uid) {
  var db = getDb();
  if (!db || !uid) return Promise.reject(new Error('Invalid'));
  return db.ref('bannedUids/' + uid).remove();
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
  var keys = ['community', 'og', 'owner', 'staff', 'verified', 'premium'];
  for (var i = 0; i < keys.length; i++) {
    updates['badges/' + keys[i]] = !!(badges && badges[keys[i]]);
  }
  return db.ref('users/' + uid).update(updates);
}

function adminUpdateUserProfile(uid, data) {
  var db = getDb();
  if (!db || !uid) return Promise.reject(new Error('Database not ready'));
  var updates = {
    displayName: String(data.displayName || '').trim().slice(0, 80),
    bio: String(data.bio || '').trim().slice(0, 500),
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };
  if (data.badges && typeof data.badges === 'object') {
    var keys = ['community', 'og', 'owner', 'staff', 'verified', 'premium'];
    for (var i = 0; i < keys.length; i++) {
      updates['badges/' + keys[i]] = !!data.badges[keys[i]];
    }
  }
  if (Array.isArray(data.links)) {
    updates.links = data.links.slice(0, 20).map(function(l) {
      return {
        label: String(l.label || '').trim().slice(0, 50),
        url: String(l.url || '').trim().slice(0, 500),
        icon: String(l.icon || '').trim().slice(0, 30),
        iconURL: String(l.iconURL || '').trim().slice(0, 500)
      };
    });
  }
  return db.ref('users/' + uid).update(updates);
}
