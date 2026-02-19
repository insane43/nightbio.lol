// Bio link data and storage — nightbio.lol

// Badges: community = everyone, toggleable; others = admin-granted only
window.BIO_BADGES = {
  community: { id: 'community', label: 'Community', desc: 'Default badge for everyone. Show you\'re part of nightbio.', userCanToggle: true },
  og: { id: 'og', label: 'OG', desc: 'Be an early supporter of nightbio.lol. Granted by admin.', userCanToggle: false },
  owner: { id: 'owner', label: 'Owner', desc: 'Site owner. Granted by admin.', userCanToggle: false },
  staff: { id: 'staff', label: 'Staff', desc: 'Be a part of the nightbio.lol team. Granted by admin.', userCanToggle: false },
  verified: { id: 'verified', label: 'Verified', desc: 'Requires a certain following on a social media platform. Granted by admin.', userCanToggle: false },
  premium: { id: 'premium', label: 'Premium', desc: 'Purchase from our server to unlock premium features and support nightbio.', userCanToggle: false }
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

// Get public bio data by username (for bio.html?u=username).
// Fetches profileViews/{uid} so stats.views is correct for public display.
function getBioByUsername(username) {
  var db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  return getUidByUsername(username).then(function(uid) {
    if (!uid) return null;
    return Promise.all([
      db.ref('users/' + uid).once('value'),
      db.ref('profileViews/' + uid).once('value')
    ]).then(function(results) {
      var snap = results[0];
      var viewsSnap = results[1];
      var d = snap.val();
      if (!d) return null;
      var views = (viewsSnap && viewsSnap.val()) || 0;
      var links = Array.isArray(d.links) ? d.links : [];
      var merged = mergeBadges(d.badges);
      var visibleBadges = applyBadgeVisibility(merged, d.badgeVisibility);
      return {
        uid: uid,
        userId: d.userId != null ? d.userId : null,
        username: d.username,
        displayName: d.displayName || d.username,
        bio: d.bio || '',
        avatarURL: d.avatarURL || '',
        bannerURL: d.bannerURL || '',
        songURL: d.songURL || '',
        links: links.map(function(l) { return { label: l.label || '', url: l.url || '', icon: l.icon || '', iconURL: l.iconURL || '' }; }),
        accentColor: d.accentColor || '',
        layout: d.layout || 'classic',
        profileAlignment: (/^(left|right|center)$/i.test(d.profileAlignment) ? d.profileAlignment.toLowerCase() : 'center'),
        fontFamily: d.fontFamily || 'Outfit',
        fontSize: d.fontSize != null ? d.fontSize : 16,
        letterSpacing: d.letterSpacing != null ? d.letterSpacing : 0,
        typewriterBio: !!d.typewriterBio,
        backgroundEffect: d.backgroundEffect || 'none',
        buttonStyle: d.buttonStyle || 'filled',
        displayStyle: (d.displayStyle || 'default') === 'card' ? 'card' : 'default',
        modalOpacity: d.modalOpacity != null ? Math.min(100, Math.max(0, parseInt(d.modalOpacity, 10) || 96)) : 96,
        modalBlur: d.modalBlur != null ? Math.min(24, Math.max(0, parseInt(d.modalBlur, 10) || 0)) : 0,
        modalBorderOpacity: d.modalBorderOpacity != null ? Math.min(100, Math.max(0, parseInt(d.modalBorderOpacity, 10) || 20)) : 20,
        modalRadius: d.modalRadius != null ? Math.min(32, Math.max(8, parseInt(d.modalRadius, 10) || 24)) : 24,
        clickToEnter: !!d.clickToEnter,
        metaTitle: d.metaTitle || '',
        metaDescription: d.metaDescription || '',
        metaImageURL: d.metaImageURL || '',
        showViewsOnBio: !!d.showViewsOnBio,
        stats: { views: views },
        badges: visibleBadges,
        premiumButtonShape: (d.premiumButtonShape || '').trim().slice(0, 20),
        premiumLinkHoverEffect: (d.premiumLinkHoverEffect || '').trim().slice(0, 20),
        premiumLinkFontSize: d.premiumLinkFontSize != null ? Math.min(24, Math.max(12, parseInt(d.premiumLinkFontSize, 10) || 16)) : null,
        premiumLinkBorderRadius: d.premiumLinkBorderRadius != null ? Math.min(50, Math.max(0, parseInt(d.premiumLinkBorderRadius, 10) || 8)) : null,
        premiumUsernameEffect: (d.premiumUsernameEffect || '').trim().slice(0, 30),
        premiumGlowUsername: !!d.premiumGlowUsername,
        premiumGlowSocials: !!d.premiumGlowSocials,
        premiumGlowBadges: !!d.premiumGlowBadges,
        premiumGlowBio: !!d.premiumGlowBio,
        premiumNameGradient: (d.premiumNameGradient || '').trim().slice(0, 200),
        premiumBioFontSize: d.premiumBioFontSize != null ? Math.min(24, Math.max(12, parseInt(d.premiumBioFontSize, 10) || 15)) : null,
        premiumVideoBackground: (d.premiumVideoBackground || '').trim().slice(0, 500),
        premiumBannerBlur: d.premiumBannerBlur != null ? Math.min(20, Math.max(0, parseInt(d.premiumBannerBlur, 10) || 0)) : 0,
        premiumAvatarBorder: (d.premiumAvatarBorder || '').trim().slice(0, 100),
        premiumHideBranding: !!d.premiumHideBranding,
        premiumCustomCSS: (d.premiumCustomCSS || '').trim().slice(0, 2000),
        premiumCustomFontFamily: (d.premiumCustomFontFamily || '').trim().slice(0, 80),
        premiumLayoutPreset: (d.premiumLayoutPreset || '').trim().slice(0, 20),
        premiumProfileAnimation: (d.premiumProfileAnimation || '').trim().slice(0, 20),
        premiumParallax: !!d.premiumParallax
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

// Apply visibility: only show badges that are granted AND not hidden (badgeVisibility[key] !== false).
function applyBadgeVisibility(badges, visibility) {
  var out = {};
  var keys = ['community', 'og', 'owner', 'staff', 'verified', 'premium'];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (!!badges[k] && (visibility == null || visibility[k] !== false)) out[k] = true;
  }
  return out;
}

// Record a profile view (call from bio.html when profile is displayed).
// Uses profileViews/{uid} so unauthenticated visitors can increment.
function recordProfileView(uid) {
  var db = getDb();
  if (!db || !uid) return Promise.resolve();
  var ref = db.ref('profileViews/' + uid);
  return ref.transaction(function(current) {
    return (current || 0) + 1;
  }).catch(function() {});
}

// Get profile view count (dashboard, admin, or public bio when showViewsOnBio).
function getProfileViews(uid) {
  var db = getDb();
  if (!db || !uid) return Promise.resolve(0);
  return db.ref('profileViews/' + uid).once('value').then(function(snap) {
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
      lastUsernameChangeAt: d.lastUsernameChangeAt != null ? d.lastUsernameChangeAt : null,
      email: d.email || '',
      displayName: d.displayName || '',
      bio: d.bio || '',
      avatarURL: d.avatarURL || '',
      bannerURL: d.bannerURL || '',
      songURL: d.songURL || '',
      userId: d.userId != null ? d.userId : null,
      links: links.map(function(l) { return { label: l.label || '', url: l.url || '', icon: l.icon || '', iconURL: l.iconURL || '' }; }),
      accentColor: d.accentColor || '',
      layout: d.layout || 'classic',
      profileAlignment: (/^(left|right|center)$/i.test(d.profileAlignment) ? d.profileAlignment.toLowerCase() : 'center'),
      fontFamily: d.fontFamily || 'Outfit',
      fontSize: d.fontSize != null ? d.fontSize : 16,
      letterSpacing: d.letterSpacing != null ? d.letterSpacing : 0,
      typewriterBio: !!d.typewriterBio,
      backgroundEffect: d.backgroundEffect || 'none',
      buttonStyle: d.buttonStyle || 'filled',
      displayStyle: (d.displayStyle || 'default') === 'card' ? 'card' : 'default',
      modalOpacity: d.modalOpacity != null ? Math.min(100, Math.max(0, parseInt(d.modalOpacity, 10) || 96)) : 96,
      modalBlur: d.modalBlur != null ? Math.min(24, Math.max(0, parseInt(d.modalBlur, 10) || 0)) : 0,
      modalBorderOpacity: d.modalBorderOpacity != null ? Math.min(100, Math.max(0, parseInt(d.modalBorderOpacity, 10) || 20)) : 20,
      modalRadius: d.modalRadius != null ? Math.min(32, Math.max(8, parseInt(d.modalRadius, 10) || 24)) : 24,
      clickToEnter: !!d.clickToEnter,
      metaTitle: d.metaTitle || '',
      metaDescription: d.metaDescription || '',
      metaImageURL: d.metaImageURL || '',
      showViewsOnBio: !!d.showViewsOnBio,
      stats: d.stats || { views: 0 },
      badges: mergeBadges(d.badges),
      badgeVisibility: d.badgeVisibility && typeof d.badgeVisibility === 'object' ? d.badgeVisibility : {},
      premiumButtonShape: (d.premiumButtonShape || '').trim().slice(0, 20),
      premiumLinkHoverEffect: (d.premiumLinkHoverEffect || '').trim().slice(0, 20),
      premiumLinkFontSize: d.premiumLinkFontSize != null ? Math.min(24, Math.max(12, parseInt(d.premiumLinkFontSize, 10) || 16)) : null,
      premiumLinkBorderRadius: d.premiumLinkBorderRadius != null ? Math.min(50, Math.max(0, parseInt(d.premiumLinkBorderRadius, 10) || 8)) : null,
      premiumUsernameEffect: (d.premiumUsernameEffect || '').trim().slice(0, 30),
      premiumGlowUsername: !!d.premiumGlowUsername,
      premiumGlowSocials: !!d.premiumGlowSocials,
      premiumGlowBadges: !!d.premiumGlowBadges,
      premiumGlowBio: !!d.premiumGlowBio,
      premiumNameGradient: (d.premiumNameGradient || '').trim().slice(0, 200),
      premiumBioFontSize: d.premiumBioFontSize != null ? Math.min(24, Math.max(12, parseInt(d.premiumBioFontSize, 10) || 15)) : null,
      premiumVideoBackground: (d.premiumVideoBackground || '').trim().slice(0, 500),
      premiumBannerBlur: d.premiumBannerBlur != null ? Math.min(20, Math.max(0, parseInt(d.premiumBannerBlur, 10) || 0)) : 0,
      premiumAvatarBorder: (d.premiumAvatarBorder || '').trim().slice(0, 100),
      premiumHideBranding: !!d.premiumHideBranding,
      premiumCustomCSS: (d.premiumCustomCSS || '').trim().slice(0, 2000),
      premiumCustomFontFamily: (d.premiumCustomFontFamily || '').trim().slice(0, 80),
      premiumLayoutPreset: (d.premiumLayoutPreset || '').trim().slice(0, 20),
      premiumProfileAnimation: (d.premiumProfileAnimation || '').trim().slice(0, 20),
      premiumParallax: !!d.premiumParallax
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
    profileAlignment: (/^(left|right|center)$/i.test(data.profileAlignment) ? data.profileAlignment.toLowerCase() : 'center'),
    fontFamily: String(data.fontFamily || 'Outfit').slice(0, 80),
    fontSize: Math.min(24, Math.max(12, parseInt(data.fontSize, 10) || 16)),
    letterSpacing: Math.min(2, Math.max(-1, parseFloat(data.letterSpacing) || 0)),
    typewriterBio: !!data.typewriterBio,
    backgroundEffect: String(data.backgroundEffect || 'none').slice(0, 20),
    buttonStyle: String(data.buttonStyle || 'filled').slice(0, 20),
    displayStyle: (data.displayStyle || 'default') === 'card' ? 'card' : 'default',
    modalOpacity: data.modalOpacity != null ? Math.min(100, Math.max(0, parseInt(data.modalOpacity, 10) || 96)) : 96,
    modalBlur: data.modalBlur != null ? Math.min(24, Math.max(0, parseInt(data.modalBlur, 10) || 0)) : 0,
    modalBorderOpacity: data.modalBorderOpacity != null ? Math.min(100, Math.max(0, parseInt(data.modalBorderOpacity, 10) || 20)) : 20,
    modalRadius: data.modalRadius != null ? Math.min(32, Math.max(8, parseInt(data.modalRadius, 10) || 24)) : 24,
    clickToEnter: !!data.clickToEnter,
    metaTitle: (data.metaTitle || '').trim().slice(0, 80),
    metaDescription: (data.metaDescription || '').trim().slice(0, 200),
    metaImageURL: (data.metaImageURL || '').trim().slice(0, 500),
    showViewsOnBio: !!data.showViewsOnBio,
    updatedAt: firebase.database.ServerValue.TIMESTAMP
  };
  if (data.badges && typeof data.badges === 'object') {
    if (data.badges.community !== undefined) updates['badges/community'] = !!data.badges.community;
  }
  if (data.badgeVisibility && typeof data.badgeVisibility === 'object') {
    var visKeys = ['community', 'og', 'owner', 'staff', 'verified', 'premium'];
    for (var j = 0; j < visKeys.length; j++) {
      var vk = visKeys[j];
      if (data.badgeVisibility[vk] !== undefined) updates['badgeVisibility/' + vk] = !!data.badgeVisibility[vk];
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
    }).filter(function(l) { return l.url; });
  }
  if (data.premiumButtonShape !== undefined) updates.premiumButtonShape = String(data.premiumButtonShape || '').trim().slice(0, 20);
  if (data.premiumLinkHoverEffect !== undefined) updates.premiumLinkHoverEffect = String(data.premiumLinkHoverEffect || '').trim().slice(0, 20);
  if (data.premiumLinkFontSize !== undefined) updates.premiumLinkFontSize = data.premiumLinkFontSize != null ? Math.min(24, Math.max(12, parseInt(data.premiumLinkFontSize, 10) || 16)) : null;
  if (data.premiumLinkBorderRadius !== undefined) updates.premiumLinkBorderRadius = data.premiumLinkBorderRadius != null ? Math.min(50, Math.max(0, parseInt(data.premiumLinkBorderRadius, 10) || 8)) : null;
  if (data.premiumUsernameEffect !== undefined) updates.premiumUsernameEffect = String(data.premiumUsernameEffect || '').trim().slice(0, 30);
  if (data.premiumGlowUsername !== undefined) updates.premiumGlowUsername = !!data.premiumGlowUsername;
  if (data.premiumGlowSocials !== undefined) updates.premiumGlowSocials = !!data.premiumGlowSocials;
  if (data.premiumGlowBadges !== undefined) updates.premiumGlowBadges = !!data.premiumGlowBadges;
  if (data.premiumGlowBio !== undefined) updates.premiumGlowBio = !!data.premiumGlowBio;
  if (data.premiumNameGradient !== undefined) updates.premiumNameGradient = String(data.premiumNameGradient || '').trim().slice(0, 200);
  if (data.premiumBioFontSize !== undefined) updates.premiumBioFontSize = data.premiumBioFontSize != null ? Math.min(24, Math.max(12, parseInt(data.premiumBioFontSize, 10) || 15)) : null;
  if (data.premiumVideoBackground !== undefined) updates.premiumVideoBackground = String(data.premiumVideoBackground || '').trim().slice(0, 500);
  if (data.premiumBannerBlur !== undefined) updates.premiumBannerBlur = data.premiumBannerBlur != null ? Math.min(20, Math.max(0, parseInt(data.premiumBannerBlur, 10) || 0)) : 0;
  if (data.premiumAvatarBorder !== undefined) updates.premiumAvatarBorder = String(data.premiumAvatarBorder || '').trim().slice(0, 100);
  if (data.premiumHideBranding !== undefined) updates.premiumHideBranding = !!data.premiumHideBranding;
  if (data.premiumCustomCSS !== undefined) updates.premiumCustomCSS = String(data.premiumCustomCSS || '').trim().slice(0, 2000);
  if (data.premiumCustomFontFamily !== undefined) updates.premiumCustomFontFamily = String(data.premiumCustomFontFamily || '').trim().slice(0, 80);
  if (data.premiumLayoutPreset !== undefined) updates.premiumLayoutPreset = String(data.premiumLayoutPreset || '').trim().slice(0, 20);
  if (data.premiumProfileAnimation !== undefined) updates.premiumProfileAnimation = String(data.premiumProfileAnimation || '').trim().slice(0, 20);
  if (data.premiumParallax !== undefined) updates.premiumParallax = !!data.premiumParallax;
  return db.ref('users/' + uid).update(updates);
}

// Upload image to Storage and return download URL. field = 'avatar' | 'banner'
// onProgress(percent) is optional; called with 0-100.
// Progress may stay at 0% until the end in some environments; we use a single max-wait timeout.
function uploadBioImage(uid, file, field, onProgress) {
  var storage = getStorage();
  if (!storage) return Promise.reject(new Error('Storage not loaded. Refresh the page.'));
  if (!uid || !file) return Promise.reject(new Error('Invalid upload'));
  var maxSize = 5 * 1024 * 1024; // 5MB per storage rules
  if (file.size > maxSize) return Promise.reject(new Error('Image must be under 5MB.'));
  // Storage rules require image/* and size < 5MB. Ensure contentType is always image/*
  var contentType = (file.type && file.type.indexOf('image/') === 0) ? file.type : 'image/jpeg';
  var ext = (file.name && file.name.split('.').pop()) || 'jpg';
  var safeExt = ext.replace(/[^a-z0-9]/gi, '') || 'jpg';
  var path = 'bios/' + uid + '/' + field + '_' + Date.now() + '.' + safeExt;
  var ref = storage.ref(path);
  var metadata = { contentType: contentType };
  var task = ref.put(file, metadata);
  return new Promise(function(resolve, reject) {
    var done = false;
    var maxWaitMs = 180000; // 3 minutes max
    var timeoutId = null;
    function finishErr(err) {
      if (done) return;
      done = true;
      if (timeoutId) clearTimeout(timeoutId);
      reject(err);
    }
    function finishOk(url) {
      if (done) return;
      done = true;
      if (timeoutId) clearTimeout(timeoutId);
      resolve(url);
    }
    timeoutId = setTimeout(function() {
      if (done) return;
      try { task.cancel(); } catch (e) {}
      finishErr(new Error('Upload took too long. Try a smaller image (under 1MB). In Firebase Console go to Build → Storage and check your bucket name matches firebase-config.js (e.g. nightbio.appspot.com vs nightbio.firebasestorage.app).'));
    }, maxWaitMs);

    task.on('state_changed',
      function(snapshot) {
        if (onProgress && snapshot.totalBytes > 0) {
          var pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      finishErr,
      function() {
        ref.getDownloadURL().then(finishOk).catch(finishErr);
      }
    );
  });
}

// Upload MP3 to Storage and return download URL. Used for profile song.
// onProgress(percent) is optional; called with 0-100.
function uploadBioSong(uid, file, onProgress) {
  var storage = getStorage();
  if (!storage) return Promise.reject(new Error('Storage not loaded. Refresh the page.'));
  if (!uid || !file) return Promise.reject(new Error('Invalid upload'));
  var path = 'bios/' + uid + '/song_' + Date.now() + '.mp3';
  var ref = storage.ref(path);
  var contentType = (file.type && file.type.indexOf('audio') === 0) ? file.type : 'audio/mpeg';
  var task = ref.put(file, { contentType: contentType });
  return new Promise(function(resolve, reject) {
    task.on('state_changed',
      function(snapshot) {
        if (onProgress && snapshot.totalBytes > 0) {
          var pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      reject,
      function() {
        ref.getDownloadURL().then(resolve).catch(reject);
      }
    );
  });
}
