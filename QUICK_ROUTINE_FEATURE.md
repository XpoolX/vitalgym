# Quick Routine Feature - Documentation

## Overview

The Quick Routine feature allows trainers to create simplified, text-only workout routines that can be easily shared via public links. Users receiving the link don't need to register or log in - they can immediately view the routine, track their progress, and use built-in rest timers.

## Features

### 1. Quick Routine Creator
- **Location**: Accessible from the Routines list page via "Crear Rutina Rápida" button
- **Route**: `/rutinas/crear-rapida`
- **Key Features**:
  - Simplified interface focused on speed
  - Text-only (no exercise images in the form)
  - Fast exercise selection with:
    - Muscle group dropdown filter
    - Real-time text search
    - Grouped by muscle categories
  - Default 4 sets per exercise
  - Easy add/remove sets functionality

### 2. Public Routine Viewer
- **Route**: `/rutina/:token` (publicly accessible, no authentication)
- **Key Features**:
  - Clean, mobile-friendly text display
  - Format: `Exercise Name: 10 10 10 10 (60s)`
  - Interactive set tracking (checkboxes)
  - Automatic rest timer after completing each set
  - Progress saved to browser localStorage
  - Reset progress option

### 3. Share Functionality
- One-click share button for quick routines
- Generates unique, secure share token
- Automatic link copy to clipboard
- Example link: `https://yourdomain.com/rutina/abc123def456`

## Technical Implementation

### Backend Changes

#### Database Schema
New fields added to `Routines` table:
- `isQuickRoutine` (BOOLEAN): Identifies quick routines
- `shareToken` (VARCHAR, UNIQUE): Token for public sharing

Run the migration:
```sql
ALTER TABLE Routines 
ADD COLUMN isQuickRoutine BOOLEAN DEFAULT FALSE,
ADD COLUMN shareToken VARCHAR(255) UNIQUE;

CREATE INDEX idx_routines_shareToken ON Routines(shareToken);
```

#### API Endpoints

**Public Endpoint (No Auth)**:
- `GET /api/routines/shared/:token` - Get routine by share token

**Admin Endpoints (Auth Required)**:
- `POST /admin/routines/:id/share` - Generate share token for a routine

#### Model Updates
- `Routine.js`: Added `isQuickRoutine` and `shareToken` fields
- Controller: Added `generateShareToken()` and `getByShareToken()` methods

### Frontend Changes

#### New Components
1. **QuickRoutineFormPage.jsx**
   - Streamlined routine creation interface
   - Muscle group filtering
   - Real-time exercise search
   - Text-only display

2. **PublicQuickRoutineView.jsx**
   - Public viewer for shared routines
   - Set completion tracking
   - Rest timer functionality
   - LocalStorage progress persistence

#### Modified Components
1. **RoutineListPage.jsx**
   - Added "Crear Rutina Rápida" button
   - Added share button for quick routines
   - Visual distinction (yellow border) for quick routines
   - Share link generation and clipboard copy

2. **App.jsx**
   - Added `/rutinas/crear-rapida` route
   - Added `/rutina/:token` public route

## User Guide

### Creating a Quick Routine

1. Navigate to **Rutinas** page
2. Click **Crear Rutina Rápida** (yellow button)
3. Enter routine name and description
4. Select number of training days
5. For each day:
   - Click "Añadir ejercicio"
   - Select muscle group from dropdown
   - Search for exercise by name
   - Click to select
   - Adjust sets/reps and rest time
6. Click "Guardar Rutina Rápida"

### Sharing a Quick Routine

1. On the Rutinas page, find the quick routine (marked with yellow border and "Rápida" badge)
2. Click the "Compartir" button
3. The shareable link is automatically copied to your clipboard
4. Send this link to your client via WhatsApp, email, etc.

### Using a Shared Routine (Client Side)

1. Open the shared link (no login required)
2. View the routine organized by days
3. Click on each set number to mark it complete
4. After marking a set complete, a rest timer automatically starts
5. Progress is saved automatically in the browser
6. Click "Reiniciar Progreso" to reset all checkmarks

## Rest Timer

- Automatically starts after completing a set
- Shows countdown in seconds
- Large, visible display at top of screen
- Pause and Skip buttons available
- Uses the rest time configured for each exercise

## Progress Tracking

- Stored in browser's localStorage
- Persists across page refreshes
- Unique to each routine (by token)
- Can be reset at any time
- No server-side storage needed

## Security Considerations

- Share tokens are randomly generated (32 character hex)
- Tokens are unique and indexed for fast lookups
- Public routes only expose minimal data (no images, only exercise names)
- No authentication bypass - admin routes remain protected
- Tokens don't expire (can be regenerated if needed)

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- LocalStorage support required for progress tracking
- Clipboard API for share link copying

## Future Enhancements

Potential improvements:
- Expiring share links
- View-only vs interactive modes
- Print-friendly view
- Export to PDF for quick routines
- Share progress/stats
- Custom rest timer sounds/notifications
