// Firebase config for nightbio.lol
// If you use Realtime Database in another region, set databaseURL from Firebase Console.
// Storage: If you get CORS/404 on uploads, try the other bucket name. In Firebase Console → Build → Storage
// you'll see the bucket (e.g. nightbio.appspot.com or nightbio.firebasestorage.app). Use that exact value.
const firebaseConfig = {
  apiKey: "AIzaSyAhJyobGZR3Z07kzV6pFr3crHmOEF9aeiI",
  authDomain: "nightbio.firebaseapp.com",
  projectId: "nightbio",
  storageBucket: "nightbio.firebasestorage.app",
  messagingSenderId: "461206647505",
  appId: "1:461206647505:web:4ec6dddbcfab53c6b94bf0",
  databaseURL: "https://nightbio-default-rtdb.firebaseio.com"
};

// Initialize Firebase (when SDK is loaded). Safe to call on every page.
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
    return null;
  }
  var app;
  try {
    app = firebase.app();
  } catch (e) {
    app = firebase.initializeApp(firebaseConfig);
  }
  window.firebaseAuth = firebase.auth();
  window.firebaseDb = firebase.database();
  if (typeof firebase.storage !== 'undefined' && app) {
    try {
      // Use app explicitly so the correct storageBucket from config is used
      window.firebaseStorage = firebase.storage(app);
    } catch (err) {
      console.error('Firebase Storage init error:', err);
      window.firebaseStorage = null;
    }
  } else {
    window.firebaseStorage = null;
  }
  return app;
}
