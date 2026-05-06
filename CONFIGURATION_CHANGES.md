# Configuration Changes Summary

## Overview
Your Django-React project has been successfully configured to run entirely on **http://127.0.0.1:8000**.

## Files Modified

### 1. `backend/core/config/settings.py`
**Changes:**
- Changed `STATIC_URL` from `'/static/'` to `'/'` to match Vite's output
- Updated `STATICFILES_DIRS` to only include `frontend/dist/`
- Removed CORS configuration (commented out) - not needed for same-origin setup
- Added `MEDIA_URL` and `MEDIA_ROOT` configuration

**Impact:**
- Django now serves static files from the root path
- React build assets (`/assets/*`) are served correctly
- No CORS headers needed

### 2. `backend/core/config/urls.py`
**Changes:**
- Removed Django HTML view functions (home_view, marketplace_view, logout_view)
- Removed HTML page routes (login, register, dashboard, etc.)
- Added `react_app_view()` function to serve React's index.html
- Added catch-all route pattern that serves the React app for all non-API routes
- Added static and media file serving in DEBUG mode

**Impact:**
- All non-API routes now serve the React application
- React Router handles client-side routing
- API routes remain unchanged under `/api/`

### 3. `frontend/vite.config.js`
**Changes:**
- Added `base: '/'` to match Django's serving path
- Added `build` configuration with:
  - `outDir: 'dist'`
  - `emptyOutDir: true`
  - `manifest: true`
  - Asset naming with hashes

**Impact:**
- Vite builds output to `frontend/dist/`
- Assets use absolute paths from root (`/assets/`)
- Compatible with Django's static file serving

### 4. `run.bat`
**Changes:**
- Added Node.js/npm check before building frontend
- Added frontend build step (Step 5)
- Removed frontend dev server startup
- Changed server message to show single URL
- Now builds production frontend before starting Django

**Impact:**
- One-command setup builds everything
- Only Django server runs (no separate frontend server)
- Production-ready build every time

### 5. `.gitignore`
**Changes:**
- Added comprehensive Python, Django, and React ignore patterns
- Added `frontend/dist/` to ignore built files
- Added `frontend/node_modules/`
- Added IDE and environment file ignores

**Impact:**
- Build artifacts not tracked in git
- Cleaner repository

## Files Created

### 1. `start.bat`
**Purpose:** Quick restart script for development
**Usage:** `start.bat`
**Features:**
- Activates virtual environment
- Starts Django server only
- No frontend build (assumes already built)

### 2. `backend/core/templates/index.html`
**Purpose:** Placeholder template (not actively used)
**Note:** Django serves from `frontend/dist/index.html` directly

### 3. `SINGLE_ORIGIN_SETUP.md`
**Purpose:** Detailed technical documentation
**Contents:**
- How the setup works
- Routing explanation
- Configuration details
- Production deployment guide

### 4. `README_SINGLE_ORIGIN.md`
**Purpose:** User-friendly quick start guide
**Contents:**
- Quick start instructions
- Development workflow
- Troubleshooting guide
- Project structure

### 5. `CONFIGURATION_CHANGES.md`
**Purpose:** This file - summary of all changes

## Configuration Flow

```
1. User runs run.bat
   ↓
2. Frontend builds to frontend/dist/
   ↓
3. Django starts with STATICFILES_DIRS including frontend/dist/
   ↓
4. User visits http://127.0.0.1:8000
   ↓
5. Django checks URL:
   - /api/* → Django REST API
   - /admin/ → Django Admin
   - /assets/* → Static files from frontend/dist/assets/
   - /* (anything else) → frontend/dist/index.html
   ↓
6. React app loads and handles client-side routing
```

## API Compatibility

**No changes needed to existing frontend code!**

The axios configuration already uses relative paths:
```javascript
baseURL: '/api'
```

This works perfectly with same-origin setup.

## Testing the Setup

### 1. Build and Start
```batch
./run.bat
```

### 2. Test URLs
- Main app: http://127.0.0.1:8000
- API: http://127.0.0.1:8000/api/plants/
- Admin: http://127.0.0.1:8000/admin/

### 3. Verify Static Files
Check that these load:
- http://127.0.0.1:8000/assets/index.[hash].js
- http://127.0.0.1:8000/assets/index.[hash].css

## Rollback Instructions

If you need to revert to the old setup:

### 1. settings.py
```python
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

### 2. urls.py
Restore the original HTML view routes and remove the catch-all pattern.

### 3. Run both servers
```batch
# Terminal 1
python manage.py runserver 8000

# Terminal 2
cd frontend && npm run dev
```

## Environment Variables (Future)

Consider adding to `.env` file:
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=127.0.0.1,localhost
```

Update settings.py to read from environment:
```python
import os
from pathlib import Path

DEBUG = os.getenv('DEBUG', 'False') == 'True'
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-change-me')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
```

## Next Steps

1. ✅ Configuration complete
2. ✅ Frontend built
3. ⏭️ Test all routes and API endpoints
4. ⏭️ Verify authentication flows
5. ⏭️ Check file upload/media handling
6. ⏭️ Consider production deployment options

## Support

If you encounter issues:
1. Check `README_SINGLE_ORIGIN.md` for troubleshooting
2. Review `SINGLE_ORIGIN_SETUP.md` for technical details
3. Verify `frontend/dist/` exists and contains build files
4. Check Django logs for errors
5. Open browser console to check for 404s on static files

---

**Configuration Date:** 2026-02-11  
**Django + React Single Origin Setup** ✅
