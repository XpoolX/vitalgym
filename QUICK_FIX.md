# Quick Fix: Shared Routine Not Loading

## Your Error

```
Access to XMLHttpRequest at 'http://localhost:5000/api/routines/shared/...' 
from origin 'https://vitalgym.fit' has been blocked by CORS policy
```

## Root Cause

The frontend at `https://vitalgym.fit` is trying to access `http://localhost:5000`, which is incorrect for production.

## Immediate Solution (2 minutes)

### Step 1: Find the config.js file

After deploying your frontend build, locate:
- **File:** `/path/to/your/deployed/frontend/config.js`
- **URL:** `https://vitalgym.fit/config.js`

You can test if it exists:
```bash
curl https://vitalgym.fit/config.js
```

### Step 2: Edit the file

SSH into your server and edit:
```bash
sudo nano /var/www/vitalgym/config.js
# or wherever your frontend is deployed
```

Change this line:
```javascript
window.VITALGYM_CONFIG = {
  API_URL: ''  // CHANGE THIS
};
```

To this (adjust port to match your backend):
```javascript
window.VITALGYM_CONFIG = {
  API_URL: 'https://vitalgym.fit:5000'
};
```

**Important:** Use the actual port where your backend is running!

### Step 3: Save and test

- Save the file (Ctrl+X, Y, Enter in nano)
- No restart needed!
- Open the shared routine link again
- Check browser console (F12) - should show your backend URL, not localhost

## Common Backend URLs

Choose the one that matches your setup:

**Backend on port 5000:**
```javascript
API_URL: 'https://vitalgym.fit:5000'
```

**Backend on standard HTTPS port (443):**
```javascript
API_URL: 'https://vitalgym.fit'
```

**Backend on subdomain:**
```javascript
API_URL: 'https://api.vitalgym.fit'
```

**Backend on HTTP (development):**
```javascript
API_URL: 'http://vitalgym.fit:5000'
```

## Verification

After editing config.js, open browser console when loading shared routine:

✅ **Correct (should see):**
```
Using runtime config API URL: https://vitalgym.fit:5000
Fetching routine from: https://vitalgym.fit:5000/api/routines/shared/...
```

❌ **Wrong (should NOT see):**
```
Fetching routine from: http://localhost:5000/api/routines/shared/...
```

## Still Not Working?

### 1. Check if backend is accessible

Test from command line:
```bash
curl https://vitalgym.fit:5000/api/routines/shared/2490a8e8f1481a413beeaf0266a1b0c8
```

Should return JSON, not an error.

### 2. Check if config.js is loaded

Browser console should show:
```
Using runtime config API URL: https://vitalgym.fit:5000
```

If not, the config.js file might not be in the right place.

### 3. Verify backend port

Check what port your backend is actually running on:
```bash
sudo netstat -tlnp | grep node
# or
sudo lsof -i :5000
```

### 4. Check CORS on backend

The backend CORS is already configured in the code to allow `vitalgym.fit`, but verify it's deployed.

File: `vitalgym-backend/src/app.js` should have:
```javascript
const allowedOrigins = [
  'https://vitalgym.fit',
  'https://www.vitalgym.fit'
];
```

## Files Modified (Commit d594547)

- ✅ `vitalgym-admin/public/config.js` - Runtime configuration
- ✅ `vitalgym-admin/index.html` - Loads config.js
- ✅ `vitalgym-admin/src/pages/PublicQuickRoutineView.jsx` - Uses runtime config
- ✅ `BACKEND_URL_CONFIGURATION.md` - Complete guide

## Need More Help?

See complete documentation:
- `BACKEND_URL_CONFIGURATION.md` - Full configuration guide
- `DEBUGGING_SHARED_ROUTINES.md` - Debugging steps
- Browser console - Shows detailed error information

---

**TL;DR:** Edit `/config.js` on your server, set `API_URL` to your backend URL (like `https://vitalgym.fit:5000`), save, and reload the page. No rebuild needed!
