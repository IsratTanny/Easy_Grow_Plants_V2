# Architecture: Before vs After

## BEFORE: Two-Server Setup ❌

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                       │
└─────────────────────────────────────────────────────────┘
                    │                │
                    │                │
                    ▼                ▼
    ┌───────────────────┐  ┌───────────────────┐
    │  Django Backend   │  │  Vite Dev Server  │
    │  Port: 8000       │  │  Port: 5173       │
    │                   │  │                   │
    │  • REST API       │  │  • React App      │
    │  • Admin          │  │  • Hot Reload     │
    │  • Auth           │  │  • Proxy to 8000  │
    └───────────────────┘  └───────────────────┘
           │
           ▼
    ┌───────────────────┐
    │   SQLite DB       │
    └───────────────────┘

PROBLEMS:
  ❌ CORS configuration required
  ❌ Two servers to manage
  ❌ Different ports for dev/prod
  ❌ More complex deployment
  ❌ Proxy overhead in development
```

## AFTER: Single-Origin Setup ✅

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                       │
│         http://127.0.0.1:8000                          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │     Django Server (8000)       │
        │                                │
        │  URL Router:                   │
        │  ┌──────────────────────────┐  │
        │  │ /api/*     → REST API    │  │
        │  │ /admin/    → Admin Panel │  │
        │  │ /assets/*  → Static Files│  │
        │  │ /*         → React App   │  │
        │  └──────────────────────────┘  │
        │                                │
        │  Static Files:                 │
        │  ┌──────────────────────────┐  │
        │  │ frontend/dist/           │  │
        │  │ ├── index.html           │  │
        │  │ └── assets/              │  │
        │  │     ├── index.[hash].js  │  │
        │  │     └── index.[hash].css │  │
        │  └──────────────────────────┘  │
        └────────────────────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   SQLite DB     │
                └─────────────────┘

BENEFITS:
  ✅ No CORS needed - same origin
  ✅ One server, one port
  ✅ Production-ready setup
  ✅ Simpler deployment
  ✅ Better performance
```

## Request Flow

### API Request Example
```
Browser: GET http://127.0.0.1:8000/api/plants/
           ↓
Django URL Router: matches /api/*
           ↓
Django REST Framework
           ↓
PlantViewSet.list()
           ↓
Database Query
           ↓
JSON Response → Browser
```

### Frontend Route Example
```
Browser: GET http://127.0.0.1:8000/plant-care
           ↓
Django URL Router: no match for /plant-care
           ↓
Catch-all pattern: re_path(r'^.*$', react_app_view)
           ↓
Serve: frontend/dist/index.html
           ↓
Browser loads React app
           ↓
React Router: matches /plant-care
           ↓
PlantCare component renders
```

### Static Asset Example
```
Browser: GET http://127.0.0.1:8000/assets/index.DKr0FGxL.js
           ↓
Django Static Files Middleware
           ↓
STATIC_URL = '/' → Check STATICFILES_DIRS
           ↓
Found: frontend/dist/assets/index.DKr0FGxL.js
           ↓
Serve JavaScript file → Browser
```

## Directory Structure Mapping

```
Project Files                  Served URLs
──────────────────────────────────────────────────────
frontend/dist/
├── index.html          →  /*  (all non-API routes)
├── vite.svg            →  /vite.svg
└── assets/
    ├── index.xxx.js    →  /assets/index.xxx.js
    └── index.xxx.css   →  /assets/index.xxx.css

backend/core/config/
└── urls.py             →  /api/*  (API routes)
                        →  /admin/  (Admin panel)
```

## Configuration Components

### 1. Django Settings (settings.py)
```python
# Serve static files from root
STATIC_URL = '/'

# Include React build directory
STATICFILES_DIRS = [
    BASE_DIR.parent / 'frontend' / 'dist',
]
```

### 2. Django URLs (urls.py)
```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    # ... other API routes
]

# Catch-all for React app
urlpatterns += [
    re_path(r'^.*$', react_app_view),
]
```

### 3. Vite Config (vite.config.js)
```javascript
export default defineConfig({
    base: '/',  // Serve from root
    build: {
        outDir: 'dist',  // Build to dist/
    }
})
```

### 4. Axios Config (axios.js)
```javascript
export const api = axios.create({
    baseURL: '/api',  // Relative URL
});
```

## Build Process

```
┌─────────────────────┐
│   npm run build     │
│  (in frontend/)     │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│   Vite builds:      │
│   • Bundles React   │
│   • Minifies code   │
│   • Hashes files    │
│   • Creates assets  │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ Output to:          │
│ frontend/dist/      │
│ ├── index.html      │
│ └── assets/         │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ Django includes in  │
│ STATICFILES_DIRS    │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ Django serves at:   │
│ http://127.0.0.1:   │
│         8000/       │
└─────────────────────┘
```

## Development Modes

### Mode 1: Production Build (Recommended)
```
┌──────────────────┐
│ npm run build    │ → Build React
└──────────────────┘
         ↓
┌──────────────────┐
│ python manage.py │ → Start Django
│   runserver      │
└──────────────────┘
         ↓
   Single server at http://127.0.0.1:8000
```

### Mode 2: Development with Hot Reload
```
┌──────────────────┐
│ python manage.py │ → Django on :8000
│   runserver      │
└──────────────────┘

┌──────────────────┐
│ npm run dev      │ → Vite on :5173 (proxies to :8000)
└──────────────────┘

Two servers:
  - Frontend: http://localhost:5173 (hot reload)
  - Backend:  http://127.0.0.1:8000 (API)
```

## Deployment Architecture

### Development (Current)
```
Django Development Server
      ↓
Serves static files directly
      ↓
http://127.0.0.1:8000
```

### Production (Future)
```
Nginx/Apache (Web Server)
      ↓
      ├─→ Static files (CSS/JS/images)
      │
      └─→ Gunicorn/uWSGI (WSGI Server)
              ↓
          Django Application
              ↓
          Database
```

---

**This architecture provides:**
- ✅ Simplified development
- ✅ Production parity
- ✅ Better performance
- ✅ Easier maintenance
- ✅ Standard Django deployment pattern
