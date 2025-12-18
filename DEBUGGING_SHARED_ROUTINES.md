# Debugging Guide - Shared Routine Issues

## Issue: "No se pudo cargar la rutina"

When accessing a shared routine link like `https://vitalgym.fit/rutina/2490a8e8f1481a413beeaf0266a1b0c8`, you get an error message.

### Solutions Implemented (Commit 5dcd649)

#### 1. ✅ Automatic API URL Detection

**Problem:** The frontend was hardcoded to use `http://localhost:5000` when `VITE_API_URL` wasn't set.

**Solution:** Smart hostname-based detection:
- If on `vitalgym.fit` → uses `https://vitalgym.fit`
- If on `www.vitalgym.fit` → uses `https://www.vitalgym.fit`
- If on localhost → uses `http://localhost:5000`

**Code Location:** `vitalgym-admin/src/pages/PublicQuickRoutineView.jsx`

#### 2. ✅ Comprehensive Error Logging

**Added Frontend Logging:**
```javascript
console.log('Fetching routine from:', `${apiUrl}/api/routines/shared/${token}`);
console.error('Error loading routine:', err);
console.error('Error details:', {
  message: err.message,
  response: err.response?.data,
  status: err.response?.status
});
```

**Added Backend Logging:**
```javascript
console.log('Fetching routine with token:', token);
console.log('Found routine:', { id, nombre, isQuickRoutine });
console.log('Found exercises:', count);
console.log('Returning routine with', days, 'days');
```

### How to Debug the Issue

#### Step 1: Check Browser Console

1. Open the shared routine link
2. Press F12 or right-click → "Inspect"
3. Go to "Console" tab
4. Look for these messages:

**Expected Console Output:**
```
Fetching routine from: https://vitalgym.fit/api/routines/shared/2490a8e8...
```

**Error Scenarios:**

**A) CORS Error:**
```
Access to XMLHttpRequest at 'https://vitalgym.fit/api/routines/shared/...' 
from origin 'https://vitalgym.fit' has been blocked by CORS policy
```
**Solution:** Backend CORS is already configured. Ensure backend is deployed and running.

**B) 404 Not Found:**
```
Error details: { status: 404, message: "Rutina no encontrada" }
```
**Solution:** The routine doesn't exist or shareToken is wrong. Check database.

**C) Network Error:**
```
Error loading routine: Network Error
```
**Solution:** Backend is not accessible. Check if backend is running and accessible.

#### Step 2: Check Backend Logs

If you have access to backend logs, look for:

```
Fetching routine with token: 2490a8e8f1481a413beeaf0266a1b0c8
```

**If you see:**
- `Routine not found for token:` → Token doesn't exist in database
- `Found routine:` → Routine exists, check if `isQuickRoutine: true`
- `Routine is not a quick routine` → The routine exists but wasn't created as quick routine

#### Step 3: Verify Database

Connect to your database and run:

```sql
-- Check if the routine exists
SELECT id, nombre, isQuickRoutine, shareToken 
FROM Routines 
WHERE shareToken = '2490a8e8f1481a413beeaf0266a1b0c8';
```

**Expected Result:**
```
id | nombre          | isQuickRoutine | shareToken
---+-----------------+----------------+---------------------------
5  | Mi Rutina Rápida| 1              | 2490a8e8f1481a413beeaf0266a1b0c8
```

**If empty:** The routine doesn't exist or wasn't shared. Create it again.

**If `isQuickRoutine = 0`:** The routine exists but isn't a quick routine. It needs to be created using "Crear Rutina Rápida".

#### Step 4: Check Backend API Endpoint

Test the API directly with curl:

```bash
curl https://vitalgym.fit/api/routines/shared/2490a8e8f1481a413beeaf0266a1b0c8
```

**Expected Response:**
```json
{
  "id": 5,
  "nombre": "Mi Rutina Rápida",
  "descripcion": "...",
  "dias": [
    {
      "dia": 1,
      "ejercicios": [...]
    }
  ]
}
```

**If 404:**
```json
{
  "message": "Rutina no encontrada",
  "token": "2490a8e8f1481a413beeaf0266a1b0c8"
}
```

**If CORS Error:** The backend CORS is not properly configured (but should be).

### Common Problems and Solutions

#### Problem 1: Backend Not Running
**Symptoms:** Network errors, can't connect
**Solution:** Start the backend server:
```bash
cd vitalgym-backend
npm start
```

#### Problem 2: Database Migration Not Run
**Symptoms:** `shareToken` column doesn't exist
**Solution:** Run the migration:
```bash
mysql -u user -p database < vitalgym-backend/migrations/add_quick_routine_fields.sql
```

#### Problem 3: Wrong Environment
**Symptoms:** Frontend tries to access localhost from production
**Solution:** Already fixed in commit 5dcd649 - auto-detects hostname

#### Problem 4: Routine Not Shared Yet
**Symptoms:** 404 error, routine not found
**Solution:** 
1. Go to admin panel → Rutinas
2. Find the quick routine (yellow border)
3. Click "Compartir" button
4. Use the new link

#### Problem 5: Regular Routine (Not Quick)
**Symptoms:** "Rutina no válida" error
**Solution:** The routine was created with "Crear nueva rutina" instead of "Crear Rutina Rápida". Create a new one using the quick routine creator.

### Testing Checklist

- [ ] Database migration run (check `shareToken` column exists)
- [ ] Backend server running and accessible
- [ ] CORS configured (already done in code)
- [ ] Routine created using "Crear Rutina Rápida"
- [ ] Share button clicked and token generated
- [ ] Browser console shows correct API URL
- [ ] Backend logs show routine lookup
- [ ] API endpoint returns JSON (test with curl)

### Environment Configuration

**Frontend (.env):**
```bash
# Optional - auto-detects if not set
VITE_API_URL=https://vitalgym.fit
```

**Backend (.env):**
```bash
PORT=5000
DB_USER=vitalgym_user
DB_PASS=clave_segura
DB_HOST=localhost
DB_NAME=vitalgym
JWT_SECRET=Bayonas.VitalGym.1
```

### Quick Test

1. Create a quick routine in admin panel
2. Click "Compartir"
3. Open link in **incognito window**
4. Press F12 → Console
5. Check logs for API URL and errors
6. Verify routine loads

### Support Information

If the issue persists:
1. Share browser console logs
2. Share backend server logs
3. Verify database has the routine with correct `shareToken`
4. Test API endpoint with curl
5. Check all environment variables are set

---

**Last Updated:** Commit 5dcd649
**Status:** ✅ Auto-detection implemented, comprehensive logging added
