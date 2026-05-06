# Quick Reference Card 📋

## URLs
| What | URL |
|------|-----|
| **Main App** | http://127.0.0.1:8000 |
| **API Root** | http://127.0.0.1:8000/api/ |
| **Admin** | http://127.0.0.1:8000/admin/ |
| **Plants API** | http://127.0.0.1:8000/api/plants/ |
| **Auth Login** | http://127.0.0.1:8000/api/auth/login/ |
| **Plant Care** | http://127.0.0.1:8000/api/plant-care/ |

## Commands

### Start/Stop
```batch
# Full setup (first time)
run.bat

# Quick start (already built)
start.bat

# Verify setup
verify.bat
```

### Frontend
```batch
cd frontend

# Install dependencies
npm install

# Development server (with hot reload)
npm run dev           # → http://localhost:5173

# Production build
npm run build         # → frontend/dist/

# Lint
npm run lint
```

### Backend
```batch
# Activate environment
.venv\Scripts\activate

# Run server
python manage.py runserver 127.0.0.1:8000

# Migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Shell
python manage.py shell

# Collect static files (production)
python manage.py collectstatic
```

## File Locations

```
Key Files
─────────────────────────────────────────────
Settings:     backend\core\config\settings.py
URLs:         backend\core\config\urls.py
Vite Config:  frontend\vite.config.js
Axios Config: frontend\src\api\axios.js

Build Output
─────────────────────────────────────────────
Built HTML:   frontend\dist\index.html
Built Assets: frontend\dist\assets\

Database
─────────────────────────────────────────────
SQLite:       backend\core\db.sqlite3

Scripts
─────────────────────────────────────────────
Full Setup:   run.bat
Quick Start:  start.bat
Verify:       verify.bat
```

## Configuration

### Django (settings.py)
```python
STATIC_URL = '/'
STATICFILES_DIRS = [
    BASE_DIR.parent / 'frontend' / 'dist',
]
DEBUG = True
ALLOWED_HOSTS = []
```

### Vite (vite.config.js)
```javascript
base: '/',
build: { outDir: 'dist' }
server: { port: 5173 }
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page | `cd frontend && npm run build` |
| 404 on assets | Check `frontend/dist/` exists |
| API not working | Verify Django running on :8000 |
| CORS errors | Shouldn't happen - same origin! |
| Old frontend | Rebuild: `npm run build` |

## Development Workflows

### Backend Only
```batch
# Terminal 1
start.bat
```

### Frontend Only (Hot Reload)
```batch
# Terminal 1
python manage.py runserver 127.0.0.1:8000

# Terminal 2
cd frontend && npm run dev

# Visit: http://localhost:5173
```

### Frontend (Production)
```batch
cd frontend
npm run build
cd ..
start.bat

# Visit: http://127.0.0.1:8000
```

## Port Usage

| Port | Used For | When |
|------|----------|------|
| 8000 | Django Server | Always (production mode) |
| 5173 | Vite Dev Server | Development only (optional) |

## Request Routing

```
http://127.0.0.1:8000 → Django

Django Routes:
├─ /api/*        → REST API (JSON)
├─ /admin/       → Admin Panel
├─ /assets/*     → Static Files
└─ /* (else)     → React App (HTML)
```

## Important Notes

✅ **Single origin setup** - No CORS needed
✅ **Production ready** - Same setup for dev/prod
✅ **One port** - Everything on :8000
✅ **Fast** - No proxy overhead

❌ **Don't forget to build** - Run `npm run build` after frontend changes
❌ **Don't commit dist/** - It's in .gitignore
❌ **Don't use :5173 in prod** - Use :8000 instead

## API Examples

### Authentication
```javascript
// Login
POST /api/auth/login/
{ username: "user", password: "pass" }

// Get current user
GET /api/auth/me/
Headers: { Authorization: "Bearer <token>" }
```

### Plants
```javascript
// List plants
GET /api/plants/

// Get plant
GET /api/plants/{id}/

// Create plant
POST /api/plants/
```

## Environment

```bash
# Python
Python 3.10+
Virtual environment: .venv\

# Node.js
Node.js 16+
Package manager: npm

# Database
SQLite 3
```

## Documentation Files

📄 **GET_STARTED.md** - Start here!
📄 **README_SINGLE_ORIGIN.md** - User guide
📄 **SINGLE_ORIGIN_SETUP.md** - Technical details
📄 **ARCHITECTURE.md** - System architecture
📄 **CONFIGURATION_CHANGES.md** - What changed
📄 **QUICK_REFERENCE.md** - This file

---

**One command to rule them all:**
```batch
start.bat
```

**One URL to access them all:**
```
http://127.0.0.1:8000
```
