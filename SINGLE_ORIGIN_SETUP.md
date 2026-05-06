# Django-React Single-Origin Setup

## Overview
Your Easy Grow Plants application now runs entirely on **http://127.0.0.1:8000**.

Django serves both:
- Backend API endpoints (under `/api/`)
- React frontend (served as static files from `frontend/dist/`)

## How It Works

### 1. **Frontend Build Process**
- Vite builds the React app into static files in `frontend/dist/`
- The build creates:
  - `index.html` - Entry point
  - `assets/` - JavaScript and CSS files with hashed names

### 2. **Django Static Files**
- Django's `STATICFILES_DIRS` includes `frontend/dist/`
- Static files (JS, CSS, images) are served from `/static/`
- Django serves these files automatically in development mode

### 3. **Routing**
- API routes: `http://127.0.0.1:8000/api/*` → Django REST API
- Admin panel: `http://127.0.0.1:8000/admin/` → Django Admin
- All other routes: `http://127.0.0.1:8000/*` → React App (client-side routing)

### 4. **React Router Integration**
- Django has a catch-all route that serves `index.html`
- React Router handles all client-side navigation
- When you visit any URL, Django serves the React app, then React Router takes over

## Running the Application

### Quick Start
Simply run the batch file:
```batch
./run.bat
```

This will:
1. ✅ Check Python installation
2. ✅ Activate virtual environment
3. ✅ Install Python dependencies
4. ✅ Run database migrations
5. ✅ Build React frontend (production build)
6. ✅ Start Django server on http://127.0.0.1:8000

### Manual Steps

If you prefer to run manually:

```batch
# 1. Activate virtual environment
.venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run migrations
python manage.py migrate

# 4. Build frontend
cd frontend
npm install
npm run build
cd ..

# 5. Start Django server
python manage.py runserver 127.0.0.1:8000
```

## Development Workflow

### Working on Frontend
If you're actively developing the frontend and want hot reload:

**Terminal 1 - Django Backend:**
```batch
.venv\Scripts\activate
python manage.py runserver 127.0.0.1:8000
```

**Terminal 2 - React Frontend (Development Mode):**
```batch
cd frontend
npm run dev
```

This runs React on `http://localhost:5173` with hot reload. The Vite dev server proxies API calls to Django at port 8000.

When done developing, rebuild the frontend:
```batch
cd frontend
npm run build
```

### Working on Backend
Just run Django and visit http://127.0.0.1:8000 (assuming frontend is already built):
```batch
.venv\Scripts\activate
python manage.py runserver 127.0.0.1:8000
```

## File Structure

```
Easy Grow Plants/
├── backend/
│   ├── core/
│   │   ├── config/
│   │   │   ├── settings.py         # Django settings (STATICFILES_DIRS)
│   │   │   └── urls.py              # URL routing (catch-all for React)
│   │   └── templates/
│   │       └── index.html           # (Not used - kept for reference)
│   └── apps/                        # Django apps
│
├── frontend/
│   ├── dist/                        # Built React app (served by Django)
│   │   ├── index.html               # Entry point
│   │   └── assets/                  # JS/CSS bundles
│   ├── src/                         # React source code
│   │   └── api/
│   │       └── axios.js             # API client (uses relative URLs)
│   └── vite.config.js               # Build configuration
│
├── run.bat                          # One-click startup script
└── manage.py                        # Django management script
```

## Key Configuration Files

### 1. `backend/core/config/settings.py`
```python
# Static files configuration
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR.parent / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
    BASE_DIR.parent / 'frontend' / 'dist',  # React build output
]

# CORS not needed - same origin
# CORS_ALLOW_ALL_ORIGINS = True  # Uncomment if needed
```

### 2. `backend/core/config/urls.py`
```python
# Catch-all route to serve React app
urlpatterns += [
    re_path(r'^.*$', react_app_view, name='react_app'),
]
```

### 3. `frontend/vite.config.js`
```javascript
export default defineConfig({
    base: '/',  // Django serves from root
    build: {
        outDir: 'dist',
    },
    // Dev server proxy for development
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
            }
        }
    }
})
```

### 4. `frontend/src/api/axios.js`
```javascript
export const api = axios.create({
    baseURL: '/api',  // Relative URL - works on same origin
});
```

## Benefits of Single-Origin Setup

✅ **No CORS Issues** - Same origin means no cross-origin restrictions
✅ **Simpler Deployment** - One server, one port, one domain
✅ **Production-Ready** - Matches typical production setup
✅ **Easier Authentication** - Cookies and sessions work seamlessly
✅ **Better Performance** - No proxy overhead in production

## Troubleshooting

### Frontend not loading?
1. Check if `frontend/dist/` exists
2. Build the frontend: `cd frontend && npm run build`
3. Restart Django server

### 404 on API calls?
1. Ensure URLs start with `/api/`
2. Check Django's `urls.py` for correct routing

### Static files not loading?
1. Run: `python manage.py collectstatic` (if needed)
2. Check `STATICFILES_DIRS` in settings.py
3. Ensure `frontend/dist/` is included

### After pulling new code:
```batch
# Update dependencies
pip install -r requirements.txt
cd frontend && npm install && cd ..

# Rebuild frontend
cd frontend && npm run build && cd ..

# Restart server
python manage.py runserver 127.0.0.1:8000
```

## Production Deployment

For production, you'll want to:
1. Build React in production mode: `npm run build`
2. Collect all static files: `python manage.py collectstatic`
3. Use a production WSGI server like Gunicorn
4. Serve static files with Nginx or Whitenoise

Example with Whitenoise:
```python
# settings.py
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    # ... other middleware
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

## Summary

Your app now works like a traditional server-rendered application, but with a modern React frontend!

- **Development**: Use `run.bat` or run Django + React dev servers separately
- **Production**: Build React, run Django, everything on port 8000
- **Access**: http://127.0.0.1:8000
