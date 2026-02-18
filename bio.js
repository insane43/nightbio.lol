// Bio link data and storage — nightbio.lol

// Badges: community = everyone, toggleable; others = admin-granted only
window.BIO_BADGES = {
  community: { id: 'community', label: 'Community', desc: 'Default badge for everyone. Show you\'re part of nightbio.', userCanToggle: true },
  og: { id: 'og', label: 'OG', desc: 'Be an early supporter of nightbio.lol. Granted by admin.', userCanToggle: false },
  owner: { id: 'owner', label: 'Owner', desc: 'Site owner. Granted by admin.', userCanToggle: false },
  staff: { id: 'staff', label: 'Staff', desc: 'Be a part of the nightbio.lol team. Granted by admin.', userCanToggle: false },
  verified: { id: 'verified', label: 'Verified', desc: 'Verified profile. Granted by admin.', userCanToggle: false },
  premium: { id: 'premium', label: 'Premium', desc: 'Premium supporter. Granted by admin.', userCanToggle: false }
};

function getDefaultBadges() {
  return { community: true, og: false, owner: false, staff: false, verified: false, premium: false };
}

function getStorage() {
  return window.firebaseStorage || null;
}

// Get uid for a username (from usernames index)
function getUidByUsername(username) {
  var db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  var normalized = String(username).trim().toLowerCase();
  if (!normalized) return Promise.resolve(null);
  return db.ref('usernames/' + normalized).once('value').then(function(snap) {
    return snap.val();
  });
}

// Get public bio data by username (for bio.html?u=username)
function getBioByUsername(username) {
  return getUidByUsername(username).then(function(uid) {
    if (!uid) return null;
    return getDb().ref('users/' + uid).once('value').then(function(snap) {
      var d = snap.val();
      if (!d) return null;
      var links = Array.isArray(d.links) ? d.links : [];
      return {
        uid: uid,
        username: d.username,
        displayName: d.displayName || d.username,
        bio: d.bio || '',
        avatarURL: d.avatarURL || '',
        bannerURL: d.bannerURL || '',
        songURL: d.songURL || '',
        links: links.map(function(l) { return { label: l.label || '', url: l.url || '', icon: l.icon || '', iconURL: l.iconURL || '' }; }),
        accentColor: d.accentColor || '',
        layout: d.layout || 'classic',
        fontFamily: d.fontFamily || 'Outfit',
        fontSize: d.fontSize != null ? d.fontSize : 16,
        letterSpacing: d.letterSpacing != null ? d.letterSpacing : 0,
        typewriterBio: !!d.typewriterBio,
        backgroundEffect: d.backgroundEffect || 'none',
        buttonStyle: d.buttonStyle || 'filled',
        metaTitle: d.metaTitle || '',
        metaDescription: d.metaDescription || '',
        metaImageURL: d.metaImageURL || '',
        stats: d.stats || { views: 0 },
        badges: mergeBadges(d.badges)
      };
    });
  });
}

function mergeBadges(loaded) {
  var def = getDefaultBadges();
  if (!loaded || typeof loaded !== 'object') return def;
  return {
    community: loaded.community !== false,
    og: !!loaded.og,
    owner: !!loaded.owner,
    staff: !!loaded.staff,
    verified: !!loaded.verified,
    premium: !!loaded.premium
  };
}

// Record a profile view (call from bio.html when profile is displayed)
function recordProfileView(uid) {
  var db = getDb();
  if (!db || !uid) return Promise.resolve();
  var ref = db.ref('users/' + uid + '/stats/views');
  return ref.transaction(function(current) {
    return (current || 0) + 1;
  }).catch(function() {});
}

// Get profile view count for current user (dashboard)
function getProfileViews(uid) {
  var db = getDb();
  if (!db || !uid) return Promise.resolve(0);
  return db.ref('users/' + uid + '/stats/views').once('value').then(function(snap) {
    return snap.val() || 0;
  });
}

// Get current user's full profile (for editor)
function getCurrentUserBio(uid) {
  var db = getDb();
  if (!db || !uid) return Promise.reject(new Error('Not ready'));
  return db.ref('users/' + uid).once('value').then(function(snap) {
    var d = snap.val();
    if (!d) return null;
    var links = Array.isArray(d.links) ? d.links.slice() : [];
    return {
      username: d.username || '',
      email: d.email || '',
      displayName: d.displayName || '',
      bio: d.bio || '',
      avatarURL: d.avatarURL || '',
      bannerURL: d.bannerURL || '',
      songURL: d.songURL || '',
      links: links.map(function(l) { return { label: l.label || '', url: l.url || '', icon: l.icon || '', iconURL: l.iconURL || '' }; }),
      accentColor: d.accentColor || '',
      layout: d.layout || 'classic',
      fontFamily: d.fontFamily || 'Outfit',
      fontSize: d.fontSize != null ? d.fontSize : 16,
      letterSpacing: d.letterSpacing != null ? d.letterSpacing : 0,
      typewriterBio: !!d.typewriterBio,
      backgroundEffect: d.backgroundEffect || 'none',
      buttonStyle: d.buttonStyle || 'filled',
      metaTitle: d.metaTitle || '',
      metaDescription: d.metaDescription || '',
      metaImageURL: d.metaImageURL || '',
      stats: d.stats || { views: 0 },
      badges: mergeBadges(d.badges)
    };
  });
}

// Save only bio-related fields to users/{uid} (user can only set badges.community)
function saveBio(uid, data) {
  var db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  var updates = {
    displayName: (data.displayName || '').trim().slice(0, 80),
    bio: (data.bio || '').trim().slice(0, 500),
    avatarURL: (data.avatarURL || '').trim().slice(0, 500),
    bannerURL: (data.bannerURL || '').trim().slice(0, 500),
    songURL: (data.songURL || '').trim().slice(0, 500),
    accentColor: (data.accentColor || '').trim().slice(0, 20),
    layout: String(data.layout || 'classic').slice(0, 20),
    fontFamily: String(data.fontFamily || 'Outfit').slice(0, 80),
    fontSize: Math.min(24, Math.max(12, parseInt(data.fontSize, 10) || 16)),
    letterSpacing: Math.min(2, Math.max(-1, parseFloat(data.letterSpacing) || 0)),
    typewriterBio: !!data.typewriterBio,
    backgroundEffect: String(data.backgroundEffect || 'none').slice(0, 20),
    buttonStyle: String(data.buttonStyle || 'filled').slice(0, 20),
    metaTitle: (data.metaTitle || '').trim().slice(0, 80),
    metaDescription: (data.metaDescription || '').trim().slice(0, 200),
    metaImageURL: (data.metaImageURL || '').trim().slice(0, 500),
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };
  if (data.badges && typeof data.badges.community !== 'undefined') {
    updates['badges/community'] = !!data.badges.community;
  }
  if (Array.isArray(data.links)) {
    updates.links = data.links.slice(0, 20).map(function(l) {
      return {
        label: String(l.label || '').trim().slice(0, 50),
        url: String(l.url || '').trim().slice(0, 500),
        icon: String(l.icon || '').trim().slice(0, 30),
        iconURL: String(l.iconURL || '').trim().slice(0, 500)
      };
    }).filter(function(l) { return l.url; });
  }
  return db.ref('users/' + uid).update(updates);
}

// Upload image to Storage and return download URL. field = 'avatar' | 'banner'
function uploadBioImage(uid, file, field) {
  var storage = getStorage();
  if (!storage || !uid || !file) return Promise.reject(new Error('Invalid upload'));
  var ext = (file.name && file.name.split('.').pop()) || 'jpg';
  var path = 'bios/' + uid + '/' + field + '_' + Date.now() + '.' + ext.replace(/[^a-z0-9]/gi, '');
  var ref = storage.ref(path);
  return ref.put(file, { contentType: file.type || 'image/jpeg' }).then(function() {
    return ref.getDownloadURL();
  });
}
