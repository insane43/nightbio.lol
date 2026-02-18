# nightbio.lol

Bio-link site (similar to guns.lol / fakecrime.bio) with a dark purple & black theme. This repo currently has **login and signup only** so you can verify auth and email verification work.

## What’s included

- **index.html** — Landing with Log in / Create account
- **signup.html** — Sign up with username, email, password. Username uniqueness and verification email.
- **login.html** — Log in; blocks until email is verified
- **dashboard.html** — Bio editor: Profile, Links (with platform icons), Appearance (templates, layout, fonts, typewriter, background), Analytics (profile views), SEO (meta title/description/image)
- **bio.html** — Public bio with layouts, fonts, typewriter effect, link icons, badges; `nightbio.lol/bio.html?u=USERNAME` or **nightbio.lol/USERNAME**
- **admin.html** — Admin dashboard (IP-restricted to 172.56.25.44): list users, grant/revoke badges (OG, Owner, Staff, Verified, Premium)
- **Badges** — Community (everyone, toggleable), OG / Owner / Staff / Verified / Premium (admin-granted only)
- **Firebase** — Auth (email + Google OAuth), Realtime Database, Storage

## Firebase setup

1. **Authentication**  
   In [Firebase Console](https://console.firebase.google.com) → Project **nightbio** → Authentication → Sign-in method:
   - Enable **Email/Password**.
   - Enable **Google** (for “Continue with Google”). Add your app’s support email and, if needed, configure the OAuth consent screen in Google Cloud Console for the same project.

2. **Authorized domains (required for Google OAuth)**  
   If you see **“This domain is not authorized for OAuth operations”** when using “Continue with Google”:
   - In Firebase Console go to **Authentication** → **Settings** (or **Settings** in the left sidebar under “Authentication”) → **Authorized domains**.
   - Add every domain where the app runs:
     - **`localhost`** — for local testing (e.g. `http://localhost:5500` or `http://127.0.0.1:5500`).
     - **Your live domain** — e.g. **`nightbio.lol`** (no `http://` or path, just the hostname).
   - Save. Google sign-in will then work from those domains.

3. **Realtime Database**  
   Create a Realtime Database if you don’t have one. Copy its URL (e.g. `https://nightbio-default-rtdb.firebaseio.com` or your region). Put it in `js/firebase-config.js` as `databaseURL`.

4. **Storage** — Enable Firebase Storage. Deploy rules: `firebase deploy --only storage`. The repo includes `storage.rules`: read for all, write for `bios/{uid}/*` only when `request.auth.uid == uid` (images under 5MB).

5. **Database rules** — Public bios need read access. Set `users` and `usernames` to `.read: true`; `.write` only for the owner on `users/{uid}`. To enable **profile view counting**, you must allow writes to `users/{uid}/stats/views` (e.g. allow unauthenticated increment-only writes, or use a Cloud Function to record views).

6. **Hosting** — Clean URLs: `/`, `/login`, `/signup`, `/dashboard`, `/admin`, `/bio`; `/:username` shows that user's bio. Deploy with `firebase deploy`.

7. **Admin dashboard** — Use the **Admin dashboard** button (top left on the home page). On click, your IP is checked; if it matches **172.56.25.44**, you are signed in with the admin account and redirected to **/admin**. Create the admin user in Firebase Auth: email **admin@nightbio.lol**, password **9916202374Aa**, then add that user’s UID to **adminUids/{uid}: true** in the Realtime Database so badge writes are allowed. If the IP is not allowed, a message is shown and no sign-in occurs.

## Run locally

Open the project folder and serve the files (e.g. with Live Server, or any static server). Go to `/` or `index.html`. Sign up → check email for verification link → verify → log in. **Note:** Clean URLs (`/login`, `/dashboard`, etc.) work when deployed with Firebase Hosting; locally you may need to open `login.html` etc. directly unless your server has the same rewrites.

## Design

- Colors: subtle dark purple and black
- Animations: fade/slide on load, button hover, form stagger
- Font: Outfit (Google Fonts)
- All custom HTML/CSS/JS; Firebase loaded via CDN
