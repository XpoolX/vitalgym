# Quick Routine Feature - Testing Guide

## Prerequisites

1. Database migration must be run first:
```bash
cd vitalgym-backend/migrations
# Run the migration SQL against your database
mysql -u YOUR_USER -p YOUR_DATABASE < add_quick_routine_fields.sql
```

2. Start the backend server:
```bash
cd vitalgym-backend
npm install
npm start
```

3. Start the frontend dev server:
```bash
cd vitalgym-admin
npm install
npm run dev
```

## Test Scenarios

### Test 1: Create a Quick Routine

1. **Login** to the admin panel
2. Navigate to **Rutinas** page
3. Click the **"Crear Rutina Rápida"** button (yellow)
4. Fill in the form:
   - Name: "Rutina Full Body Principiante"
   - Description: "Rutina de 3 días para principiantes"
   - Días: 3
5. For Day 1, click "Añadir ejercicio":
   - Select muscle group: "Pecho"
   - Search for: "Press banca"
   - Click to select
   - Sets should default to: 10, 10, 10, 10
   - Rest: 60 seconds
6. Add another exercise to Day 1:
   - Select muscle group: "Espalda"
   - Search for exercise
   - Click to select
   - Adjust sets if needed
7. Repeat for Days 2 and 3
8. Click **"Guardar Rutina Rápida"**
9. Verify redirect to routines list
10. **Expected**: New routine appears with yellow border and "Rápida" badge

### Test 2: Share a Quick Routine

1. On the **Rutinas** page
2. Find the quick routine you just created
3. Click the **"Compartir"** button
4. **Expected**: Alert showing "¡Link copiado al portapapeles!" with the URL
5. **Expected**: URL format: `http://localhost:5173/rutina/[TOKEN]`
6. Paste the link in a new browser tab or incognito window

### Test 3: View Shared Routine (Public Access)

1. Open the shared link in a **new incognito/private window** (to simulate no login)
2. **Expected**: Page loads WITHOUT requiring login
3. **Expected**: Routine displays with:
   - Routine name and description
   - Days organized with headers
   - Exercises listed with names
   - Series displayed as clickable buttons (e.g., "10 10 10 10")
   - Rest time shown in seconds

### Test 4: Track Progress and Rest Timer

1. Still on the public shared routine page
2. Click on the first set number (e.g., click the first "10")
3. **Expected**: 
   - Button turns green with checkmark
   - Rest timer appears at top of screen
   - Timer counts down from the exercise's rest time
4. Click on more sets
5. **Expected**: Each click toggles the set completion
6. Refresh the page
7. **Expected**: Completed sets remain checked (saved in localStorage)
8. Click **"Reiniciar Progreso"**
9. Confirm the reset
10. **Expected**: All checkmarks cleared

### Test 5: Multiple Days and Exercise Variety

1. Create a new quick routine with 5 days
2. Add multiple exercises per day
3. Test the muscle group filter:
   - Select different muscle groups
   - Verify only exercises from that group appear
4. Test the search:
   - Type partial exercise names
   - Verify real-time filtering
5. Test add/remove sets:
   - Add sets using the + button
   - Remove sets using the - button
6. Save and share the routine

### Test 6: Mobile Responsiveness

1. Open the shared routine link on a mobile device or use browser dev tools
2. Verify:
   - Layout adapts to small screens
   - Buttons are easily tappable
   - Rest timer is visible
   - Text is readable
   - No horizontal scrolling

### Test 7: Rest Timer Controls

1. Open a shared routine
2. Complete a set to trigger the timer
3. Test the **Pausar** button
4. **Expected**: Timer pauses
5. Click the timer area to resume (if implemented)
6. Test the **Saltar** button
7. **Expected**: Timer dismisses immediately

### Test 8: Distinguish Regular vs Quick Routines

1. On the Rutinas list page
2. **Expected differences**:
   - Quick routines: Yellow border, yellow shadow, "Rápida" badge
   - Regular routines: Red border, crimson shadow, no badge
   - Quick routines: Show "Compartir" button
   - Regular routines: Show "PDF" button
   - Both: Show "Editar" and delete buttons

## Expected Results Summary

✅ Quick routines can be created with simplified interface
✅ Muscle group filtering speeds up exercise selection
✅ Text search works in real-time
✅ Routines save with `isQuickRoutine: true` flag
✅ Share button generates unique token
✅ Public link works without authentication
✅ Set tracking works with localStorage
✅ Rest timer triggers automatically
✅ Progress persists across page refreshes
✅ Mobile-friendly layout
✅ Visual distinction from regular routines

## Common Issues and Solutions

### Issue: "Rutina no encontrada"
**Solution**: The database migration wasn't run. Add the new columns to the Routines table.

### Issue: Link doesn't work (404)
**Solution**: 
- Check that frontend route `/rutina/:token` exists in App.jsx
- Verify backend route `/api/routines/shared/:token` is public (before auth middleware)

### Issue: "No se pudo cargar la rutina"
**Solution**: 
- Check backend is running
- Verify CORS is enabled
- Check browser console for network errors
- Verify `VITE_API_URL` environment variable

### Issue: Progress doesn't save
**Solution**: 
- Check browser localStorage is enabled
- Check browser console for errors
- Verify unique token in URL

### Issue: Timer doesn't start
**Solution**: 
- Verify exercise has `descansoSegundos` value
- Check browser console for JavaScript errors

## Database Verification

After creating a quick routine, verify in database:

```sql
SELECT id, nombre, isQuickRoutine, shareToken 
FROM Routines 
WHERE isQuickRoutine = 1;
```

After sharing:
```sql
SELECT id, nombre, shareToken 
FROM Routines 
WHERE shareToken IS NOT NULL;
```

## API Testing (Optional)

### Get public routine
```bash
curl http://localhost:5000/api/routines/shared/YOUR_TOKEN_HERE
```

### Generate share token (requires auth)
```bash
curl -X POST http://localhost:5000/admin/routines/1/share \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```
