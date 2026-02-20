# Firebase Storage – Fix 404 / CORS on image upload

If the console shows **404** or **CORS preflight did not succeed** when you upload a profile or cover image, the Storage bucket is missing or the name is wrong.

## Step 1: Enable Storage and create the bucket

1. Open **[Firebase Console](https://console.firebase.google.com/)** and select your project (**nightbio**).
2. In the left sidebar, click **Build → Storage**.
3. If you see **“Get started”**:
   - Click **Get started**.
   - Choose a location for the bucket (e.g. same as your Realtime Database).
   - Accept the security rules (you can edit them later).
   - Click **Done**.
4. If it asks you to upgrade to the **Blaze (pay-as-you-go)** plan, you must upgrade to use Storage. New Firebase projects often need this for Storage. You can set a budget limit so you don’t get charged unexpectedly.

After this, you should see the Storage **Files** tab and no “Get started” button.

## Step 2: Use the exact bucket name in your app

1. On the **Storage** page, look at the top for the bucket name. It may look like:
   - `nightbio.firebasestorage.app`, or  
   - `nightbio.appspot.com`
2. Open **firebase-config.js** in your project.
3. Set `storageBucket` to that **exact** name (no `gs://`), for example:
   - `storageBucket: "nightbio.firebasestorage.app"`
   - or `storageBucket: "nightbio.appspot.com"`
4. Save and try uploading again.

## Step 3: (Only if you still get CORS) Set CORS on the bucket

If uploads still fail with CORS after Step 1 and 2:

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and run `gcloud auth login`.
2. In a terminal, from your project folder, run (use the bucket name from the Console):

   ```bash
   gsutil cors set storage-cors.json gs://nightbio.firebasestorage.app
   ```

   or, if your bucket is the other one:

   ```bash
   gsutil cors set storage-cors.json gs://nightbio.appspot.com
   ```

3. Wait a minute and try the upload again.

---

**favicon.ico 404** – The dashboard (and other pages if you add it) now use an inline favicon so the browser does not request `/favicon.ico`. That 404 should be gone.

**Quirks Mode** – That message often comes from the **Google Translate** widget or an extension, not from your HTML. Your pages already have `<!DOCTYPE html>`. You can ignore it unless the layout looks wrong.
