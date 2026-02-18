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

// On signup: save user profile and username index
function saveUserProfile(uid, username, email) {
  const db = getDb();
  if (!db) return Promise.reject(new Error('Database not ready'));
  const normalized = String(username).trim().toLowerCase();
  var userData = {
    username: username.trim(),
    email: email.trim(),
    createdAt: firebase.database.ServerValue.TIMESTAMP,
    badges: { community: true, og: false, owner: false, staff: false, verified: false, premium: false }
  };
  const updates = {
    ['users/' + uid]: userData,
    ['usernames/' + normalized]: uid
  };
  return db.ref().update(updates);
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

// Ensure OAuth user has a profile in Realtime DB (username + email). Creates one if missing.
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
