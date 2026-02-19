// Auth helpers for nightbio.lol — Firebase Auth + Realtime DB (username uniqueness)

function getAuth() {
  return window.firebaseAuth || null;
}

function getDb() {
  return window.firebaseDb || null;
}

// Check if user is banned (only readable by that user when signed in)
function isUserBanned(uid) {
  var db = getDb();
  if (!db || !uid) return Promise.resolve(false);
  return db.ref('bannedUids/' + uid).once('value').then(function(snap) {
    return snap.val() === true;
  });
}

// Check if username is already taken (Realtime Database)
function isUsernameTaken(username) {
  const db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  const normalized = String(username).trim().toLowerCase();
  const ref = db.ref('usernames/' + normalized);
  return ref.once('value').then(snap => snap.exists());
}

// Get next sequential user ID (UID 1, 2, 3...) and increment counter
function getNextUserId() {
  const db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  return db.ref('meta/lastUserId').transaction(function(current) {
    return (current || 0) + 1;
  }).then(function(result) {
    var snap = result && result.snapshot;
    if (snap && snap.val != null) return snap.val();
    if (typeof result === 'number') return result;
    return 1;
  });
}

// On signup: assign next UID, save user profile and username index
function saveUserProfile(uid, username, email) {
  const db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  const normalized = String(username).trim().toLowerCase();
  return getNextUserId().then(function(userId) {
    var userData = {
      username: username.trim(),
      email: email.trim(),
      userId: userId,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      badges: { community: true, og: false, owner: false, staff: false, verified: false, premium: false }
    };
    const updates = {
      ['users/' + uid]: userData,
      ['usernames/' + normalized]: uid
    };
    return db.ref().update(updates);
  });
}

// Validate username format (alphanumeric, underscore, 3–20 chars)
function isValidUsername(username) {
  const s = String(username).trim();
  return /^[a-zA-Z0-9_]{3,20}$/.test(s);
}

// Sanitize a string to a valid username (letters, numbers, underscore only; 3–20 chars)
function slugToUsername(s) {
  var out = String(s).replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20);
  if (out.length < 3) out = out + 'user'.slice(0, 3 - out.length);
  return out.length >= 3 ? out : 'user';
}

// Change username (handle) — once every 7 days, new handle must not be taken.
// Resolves with new username; rejects with Error message.
function changeUsername(uid, newUsername) {
  const db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  const trimmed = String(newUsername || '').trim();
  if (!isValidUsername(trimmed)) return Promise.reject(new Error('Handle must be 3–20 characters, letters, numbers and underscores only.'));
  const newNormalized = trimmed.toLowerCase();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  return db.ref('users/' + uid).once('value').then(function(snap) {
    const d = snap.val();
    const currentUsername = (d && d.username) ? String(d.username).trim() : '';
    const oldNormalized = currentUsername.toLowerCase();
    const lastChange = (d && d.lastUsernameChangeAt != null) ? (typeof d.lastUsernameChangeAt === 'number' ? d.lastUsernameChangeAt : 0) : 0;

    if (oldNormalized === newNormalized) {
      // Only case change — allow without cooldown; update users/uid/username for display
      return db.ref('users/' + uid + '/username').set(trimmed).then(function() { return trimmed; });
    }

    if (lastChange && (Date.now() - lastChange) < SEVEN_DAYS_MS) {
      return Promise.reject(new Error('You can only change your handle once every 7 days. Try again later.'));
    }

    return db.ref('usernames/' + newNormalized).once('value').then(function(snap2) {
      const existingUid = snap2.val();
      if (existingUid && existingUid !== uid) {
        return Promise.reject(new Error('That handle is already in use.'));
      }
      const updates = {
        ['users/' + uid + '/username']: trimmed,
        ['users/' + uid + '/lastUsernameChangeAt']: firebase.database.ServerValue.TIMESTAMP,
        ['usernames/' + newNormalized]: uid
      };
      if (oldNormalized) updates['usernames/' + oldNormalized] = null;
      return db.ref().update(updates).then(function() { return trimmed; });
    });
  });
}

// Ensure OAuth user has a profile in Realtime DB (username + email + userId). Creates one if missing.
function ensureOAuthUserProfile(user) {
  const db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  return db.ref('users/' + user.uid).once('value').then(function(snap) {
    if (snap.exists()) return Promise.resolve();
    var email = (user.email || '').trim();
    var base = slugToUsername(user.displayName || email.split('@')[0] || 'user');
    var username = base;
    var tries = 0;
    function trySave() {
      return isUsernameTaken(username).then(function(taken) {
        if (!taken) return saveUserProfile(user.uid, username, email || user.uid + '@oauth.local');
        tries++;
        username = base + String(tries);
        if (username.length > 20) username = base.slice(0, 20 - String(tries).length) + tries;
        return trySave();
      });
    }
    return trySave();
  });
}
