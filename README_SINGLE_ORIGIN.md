# Easy Grow Plants - Single Origin Setup ✅

Your Django-React application is now configured to run entirely on **http://127.0.0.1:8000**!

## 🚀 Quick Start

### First Time Setup (Full Build)
Run this to set up everything and build the frontend:
```batch
run.bat
```

This will:
1. ✅ Check Python installation
2. ✅ Create/activate virtual environment
3. ✅ Install Python dependencies  
4. ✅ Run database migrations
5. ✅ Build React frontend (production build)
6. ✅ Start Django server

### Quick Restart (Development)
If you've already built the frontend and just want to restart the server:
```batch
start.bat
```

## 📂 What Changed?

### Before ❌
- **Backend**: http://127.0.0.1:8000 (Django API)
- **Frontend**: http://localhost:5173 (Vite dev server)
- **Issues**: CORS configuration needed, two servers running

### After ✅
- **Everything**: http://127.0.0.1:8000
- **Frontend**: Served as static files by Django
- **API**: Same origin (`/api/*`)
- **Benefits**: No CORS issues, single server, production-ready

## 🎯 How It Works

```
User visits http://127.0.0.1:8000/
         ↓
    Django Server
         ↓
    ┌────────────────┐
    │  URL Pattern?  │
    └────────────────┘
         ↓
    ┌────┴────┐
    │         │
    ↓         ↓
/api/*    All other routes
  ↓              ↓
Django API   React App
(REST)     (index.html + JS/CSS)
```

### Static File Serving
- Vite builds frontend → `frontend/dist/`
- Django's `STATICFILES_DIRS` includes `frontend/dist/`
- Django serves:
  - `/assets/index.js` → `frontend/dist/assets/index.js`
  - `/assets/index.css` → `frontend/dist/assets/index.css`
  - `/` → `frontend/dist/index.html` (catch-all)

## 🔨 Development Workflow

### Option 1: Production Mode (Recommended)
Build once, run Django only:

```batch
# Build frontend (do this after frontend changes)
cd frontend
npm run build
cd ..

# Start Django server
start.bat
```

### Option 2: Development Mode (Hot Reload)
Run both servers for frontend development:

**Terminal 1 - Django:**
```batch
.venv\Scripts\activate
python manage.py runserver 127.0.0.1:8000
```

**Terminal 2 - React Dev Server:**
```batch
cd frontend
npm run dev
```

Then visit:
- **Frontend**: http://localhost:5173 (hot reload)
- **Backend API**: http://127.0.0.1:8000/api

The Vite dev server proxies API calls to Django.

When done, rebuild the frontend:
```batch
cd frontend
npm run build
```

## 📁 Project Structure

```
Easy-Grow-Plants/
├── backend/
│   ├── core/
│   │   └── config/
│   │       ├── settings.py    # STATICFILES_DIRS configured
│   │       └── urls.py         # Catch-all route for React
│   └── apps/                   # Django apps
│
├── frontend/
│   ├── dist/                   # 🔨 Build output (served by Django)
│   │   ├── index.html
│   │   └── assets/
│   │       ├── index.[hash].js
│   │       └── index.[hash].css
│   ├── src/                    # React source code
│   │   └── api/
│   │       └── axios.js        # Uses relative paths (/api)
│   └── vite.config.js          # Build config (base: '/')
│
├── run.bat                     # Full setup & build
├── start.bat                   # Quick restart
└── SINGLE_ORIGIN_SETUP.md      # Detailed documentation
```

## 🔧 Configuration Files

### 1. Django Settings (`backend/core/config/settings.py`)
```python
# Static files served from root
STATIC_URL = '/'
STATICFILES_DIRS = [
    BASE_DIR.parent / 'frontend' / 'dist',  # React build
]

# CORS not needed - same origin
```

### 2. Django URLs (`backend/core/config/urls.py`)
```python
# API routes
path('api/', include(router.urls)),

# Catch-all - serves React app
re_path(r'^.*$', react_app_view, name='react_app'),
```

### 3. Vite Config (`frontend/vite.config.js`)
```javascript
export default defineConfig({
    base: '/',  // Django serves from root
    build: {
        outDir: 'dist',
    }
})
```

### 4. Axios Config (`frontend/src/api/axios.js`)
```javascript
export const api = axios.create({
    baseURL: '/api',  // Relative URL
});
```

## 🌐 Accessing Your App

### Main Application
http://127.0.0.1:8000

### API Endpoints
- http://127.0.0.1:8000/api/plants/
- http://127.0.0.1:8000/api/auth/login/
- http://127.0.0.1:8000/api/plant-care/categories/

### Admin Panel
http://127.0.0.1:8000/admin/

## 🐛 Troubleshooting

### Frontend not loading?
```batch
cd frontend
npm install
npm run build
cd ..
python manage.py runserver 127.0.0.1:8000
```

### Static files 404?
Check that `frontend/dist/` exists and contains:
- `index.html`
- `assets/` folder

### After pulling new code:
```batch
# Update dependencies
pip install -r requirements.txt
cd frontend && npm install && cd ..

# Rebuild frontend
cd frontend && npm run build && cd ..

# Restart server
start.bat
```

### Build errors?
Make sure Node.js and npm are installed:
```batch
node --version
npm --version
```

## 📊 What Happens When You Visit a URL?

| URL | Handled By | Response |
|-----|-----------|----------|
| `http://127.0.0.1:8000/` | Django → React | React App (index.html) |
| `http://127.0.0.1:8000/plant-care` | Django → React | React App (client-side routing) |
| `http://127.0.0.1:8000/api/plants/` | Django API | JSON data |
| `http://127.0.0.1:8000/admin/` | Django Admin | Admin interface |
| `http://127.0.0.1:8000/assets/index.js` | Django Static | JavaScript file |

## ✨ Benefits

✅ **No CORS Issues** - Same origin for everything  
✅ **Single Port** - One URL to remember  
✅ **Production Ready** - Matches deployment setup  
✅ **Simpler Auth** - Cookies/sessions work seamlessly  
✅ **Better Performance** - No development proxy overhead  
✅ **Easier Deployment** - One server to configure  

## 🚢 Production Deployment

For production, consider:
1. Use `python manage.py collectstatic` to gather all static files
2. Use a production WSGI server (Gunicorn, uWSGI)
3. Use Nginx or Whitenoise to serve static files efficiently

Example with Whitenoise:
```python
# settings.py
MIDDLEWARE = [
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    # ... other middleware
]
```

## 📚 Documentation

- See `SINGLE_ORIGIN_SETUP.md` for more detailed information
- Check `run.bat` for the build and startup process
- Check `start.bat` for quick restart during development

---

**Need help?** Check the troubleshooting section or the detailed setup guide!
