# Backend URL Configuration Guide

## Problem: Frontend Can't Access Backend

When you see this error:
```
Access to XMLHttpRequest at 'http://localhost:5000/api/routines/shared/...' 
from origin 'https://vitalgym.fit' has been blocked by CORS policy
```

This means the frontend is trying to access `localhost:5000`, but it needs to access your actual backend server.

## Solution: Configure Backend URL

You have **3 ways** to configure the backend URL (in priority order):

### Method 1: Runtime Configuration (RECOMMENDED for Production) ✅

**After building and deploying the frontend**, edit the `config.js` file in your deployment:

**File location:** `/dist/config.js` or `https://vitalgym.fit/config.js`

```javascript
window.VITALGYM_CONFIG = {
  // Set this to your backend URL
  API_URL: 'https://vitalgym.fit:5000'  // Example: if backend is on port 5000
  // Or if backend is on standard HTTPS port:
  // API_URL: 'https://api.vitalgym.fit'
  // Or same domain:
  // API_URL: 'https://vitalgym.fit'
};
```

**Advantages:**
- Can be changed WITHOUT rebuilding the frontend
- Different for each deployment environment
- Easy to update

**How to update:**
1. SSH into your server
2. Edit `/path/to/your/frontend/config.js`
3. Change `API_URL` to your backend URL
4. Save and reload the page (no restart needed!)

### Method 2: Environment Variable at Build Time

Set `VITE_API_URL` when building:

```bash
cd vitalgym-admin
VITE_API_URL=https://vitalgym.fit:5000 npm run build
```

Or create `.env.production` file:
```
VITE_API_URL=https://vitalgym.fit:5000
```

Then build:
```bash
npm run build
```

**Disadvantages:**
- Baked into the build
- Need to rebuild to change
- Can't have different configs per deployment

### Method 3: Auto-Detection (Current Behavior)

If neither Method 1 nor 2 is configured, the app will:

- On `vitalgym.fit` → tries `https://vitalgym.fit` (same domain, standard port)
- On `localhost` → tries `http://localhost:5000`

This works if your backend is on the **same domain** as frontend.

## Your Current Situation

Based on your error, you need to tell the frontend where your backend is.

### Option A: Backend on Port 5000

If your backend is running on `https://vitalgym.fit:5000`:

1. Edit `https://vitalgym.fit/config.js`:
```javascript
window.VITALGYM_CONFIG = {
  API_URL: 'https://vitalgym.fit:5000'
};
```

2. Make sure your backend CORS allows this (already configured in the code)

### Option B: Backend on Standard Port (80/443)

If your backend is on standard HTTPS port:

1. Edit `https://vitalgym.fit/config.js`:
```javascript
window.VITALGYM_CONFIG = {
  API_URL: 'https://vitalgym.fit'
};
```

Or just leave it empty (auto-detects same domain):
```javascript
window.VITALGYM_CONFIG = {
  API_URL: ''
};
```

### Option C: Backend on Different Domain

If backend is on different domain like `https://api.vitalgym.fit`:

1. Edit `https://vitalgym.fit/config.js`:
```javascript
window.VITALGYM_CONFIG = {
  API_URL: 'https://api.vitalgym.fit'
};
```

2. Update backend CORS in `vitalgym-backend/src/app.js`:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://vitalgym.fit',
  'https://www.vitalgym.fit',
  'https://api.vitalgym.fit'  // Add this
];
```

## Testing

After configuring, test with browser console:

1. Open `https://vitalgym.fit/rutina/YOUR_TOKEN`
2. Open DevTools (F12) → Console tab
3. Look for these messages:
```
Using runtime config API URL: https://vitalgym.fit:5000
Final API URL: https://vitalgym.fit:5000
Fetching routine from: https://vitalgym.fit:5000/api/routines/shared/...
```

4. Should NOT see `localhost:5000` anymore!

## Quick Fix for Your Issue

Based on your error, do this NOW:

1. **Find where your frontend is deployed**
   - Probably: `/var/www/vitalgym/` or similar

2. **Edit the config.js file**
```bash
sudo nano /var/www/vitalgym/config.js
```

3. **Change the API_URL**
```javascript
window.VITALGYM_CONFIG = {
  API_URL: 'https://vitalgym.fit:5000'  // Adjust port if needed
};
```

4. **Save and test**
   - No restart needed!
   - Just reload the shared routine link

## Verification Checklist

- [ ] Backend is running and accessible
- [ ] Backend port is correct (check with: `curl https://vitalgym.fit:5000/api/routines/shared/TOKEN`)
- [ ] config.js is edited with correct backend URL
- [ ] Browser console shows correct API URL (not localhost)
- [ ] CORS is configured to allow the frontend domain

## Common Backend Locations

- **Same server, port 5000:** `https://vitalgym.fit:5000`
- **Same server, reverse proxy:** `https://vitalgym.fit` (port 80/443)
- **Different subdomain:** `https://api.vitalgym.fit`
- **Different server:** `https://backend.example.com`

## Need Help?

Check browser console logs - they show:
1. Which API URL is being used
2. What the actual request URL is
3. Full error details

---

**Last Updated:** Commit (will be updated)
**Files Modified:** 
- `vitalgym-admin/public/config.js` (new runtime config)
- `vitalgym-admin/index.html` (loads config.js)
- `vitalgym-admin/src/pages/PublicQuickRoutineView.jsx` (uses runtime config)
