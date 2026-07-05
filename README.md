# 🌿 Easy Grow Plants

A full-stack plant marketplace & plant-care platform.

- **Backend:** Django + Django REST Framework (JWT auth), SQLite for local dev.
- **Frontend:** React (Vite) single-page app, Tailwind CSS.
- **Features:** marketplace, cart & checkout, plant care reminders, community feed,
  plant exchange, nearby sellers (map), AI plant detection, in-home **Plant Doctor**
  botanist appointments, **Expert Potting** service, an **AR plant visualizer**, an
  IoT smart-garden dashboard, and seller/admin dashboards.

---

## ✅ Prerequisites

- **Python 3.10+** (3.12 recommended)
- **Node.js 18+** and npm
- Linux/macOS/Windows. (On Windows use `venv\Scripts\activate` instead of `source venv/bin/activate`.)

---

## 🚀 Quick start (copy–paste)

Run these from the **repository root**. Use **two terminals** (one for the backend, one for the frontend).

### 1. Backend

```bash
python3 -m venv venv
source venv/bin/activate                 # Windows: venv\Scripts\activate
pip install -r requirements.txt

cd backend/core
python manage.py migrate                 # create the database
python manage.py seed_marketplace        # load the plant catalog (one image per plant)
python manage.py seed_demo_data          # nearby sellers, community & exchange demo content
python manage.py create_demo_users       # create demo login accounts
python manage.py runserver 8000          # backend at http://127.0.0.1:8000
```

### 2. Frontend (new terminal, from repo root)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev                              # app at http://localhost:5173
```

### 3. Open the app

**→ http://localhost:5173/**  — pick a language, then log in.

---

## 🖱️ One-click launcher (start everything by double-click)

After the one-time setup above (venv + `npm install`), you can start the whole
app by double-click instead of typing commands. The launcher starts both
servers (auto-picking free ports), seeds demo data on first run, and opens the
website in your browser.

### 🪟 Windows

Just **double-click `start-easygrow.bat`** in the repo folder — that's it.

For a nice Desktop icon, double-click **`install-launcher.bat`** once; it creates
a green-leaf **"Easy Grow Plants"** shortcut on your Desktop. Two small server
windows open when it runs — **close them to stop the servers**.

> First-time setup on Windows: `python -m venv venv`, then
> `venv\Scripts\pip install -r requirements.txt`, then
> `cd frontend && npm install --legacy-peer-deps`.

### 🐧 Linux / 🍎 macOS

```bash
bash install-launcher.sh   # run once → creates a Desktop icon
```
Then **double-click** the "Easy Grow Plants" icon (or run `bash start-easygrow.sh`).
Keep the terminal window it opens; press **Ctrl+C** to stop the servers. (On
GNOME, if double-click is blocked the first time, right-click the icon →
**Allow Launching**.)

---

## 🔑 Demo accounts

| Role  | Username        | Password       |
|-------|-----------------|----------------|
| Buyer | `Israt Sultana` | `EasyGrow123!` |
| Admin | `admin`         | `EasyGrow123!` |
| Seller| `EasyGrowOfficial` | `growsecure2024` |

(Login is by **username**. The admin account can also open Django admin at `/admin/`.)

---

## 🔌 Ports & configuration

| Service            | Default URL              | How to change |
|--------------------|--------------------------|---------------|
| Django backend     | `http://127.0.0.1:8000`  | `python manage.py runserver <port>` |
| Vite frontend      | `http://localhost:5173`  | `frontend` → `vite.config.js` (`server.port`) |
| IoT FastAPI (opt.) | `http://127.0.0.1:8001`  | only needed for live IoT data |

**If port 8000 is already in use**, run the backend on another port and tell the
frontend where to find it:

```bash
# backend
python manage.py runserver 8010
# frontend: create frontend/.env  (copy from frontend/.env.example)
echo "VITE_BACKEND_URL=http://127.0.0.1:8010" > frontend/.env
# then restart `npm run dev`
```

Environment variables (all optional for local dev) are documented in:
- `.env.example` — Django backend (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CORS_ORIGINS`, …). Copy to `.env` to use.
- `frontend/.env.example` — frontend proxy targets (`VITE_BACKEND_URL`, `VITE_IOT_URL`). Copy to `frontend/.env` to override.

Defaults are safe for local development, so you can run everything without creating any `.env` file.

---

## 🤖 For automated agents / one-shot launch

The backend and frontend are long-running processes — start each in its **own
background process** and leave it running. Verify success by these signals:

1. Backend ready when `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/admin/login/` returns `200`.
2. Frontend ready when the Vite log prints `Local: http://localhost:5173/`.
3. End-to-end OK when a login through the proxy returns `200`:
   ```bash
   curl -s -X POST http://localhost:5173/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"username":"Israt Sultana","password":"EasyGrow123!"}' -o /dev/null -w "%{http_code}\n"
   ```

Re-running `seed_marketplace` is safe (it replaces the catalog). Re-running
`create_demo_users` is safe (it resets the demo passwords).

---

## 📱 Pairing the Android app

The companion repo **`Easy-Grow-Plants-App`** builds an Android APK that uses
**this** backend as its server. To let a phone reach it:

1. Start the backend bound to **all interfaces** (not just localhost):
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
2. Find this machine's LAN IP (the phone must be on the **same Wi-Fi**):
   ```bash
   hostname -I | awk '{print $1}'     # e.g. 192.168.0.42
   ```
3. In the app repo, set `VITE_SERVER_URL=http://<that-IP>:8000` and build the
   APK (see that repo's README). Keep `DEBUG=True` so `/media` and `/images`
   (plant photos) are served, and run `seed_marketplace` so there's data.

CORS and `ALLOWED_HOSTS` already allow any origin/host while `DEBUG=True`, so no
extra config is needed for local LAN testing.

---

## 📁 Project structure

```
backend/
  core/            # Django project (settings, urls, manage.py)
  apps/
    users/         # auth, profiles, botanist applications
    marketplace/   # plants, orders, cart, reviews, exchange
    plant_care/    # care cards, subscriptions, community posts,
                   # Plant Doctor appointments, Expert Potting requests
    iot/           # smart-garden devices & chat
    support/       # help-center tickets & notifications
frontend/
  src/             # React app (pages/, components/, api/, i18n/)
  public/images/   # plant catalog images
arduino_iot_firmware/  # optional ESP firmware for IoT devices
```

---

## 🧪 Useful management commands

```bash
# from backend/core, with the venv active
python manage.py seed_marketplace      # (re)load the plant catalog + images
python manage.py create_demo_users     # (re)create demo accounts
python manage.py migrate               # apply DB migrations
python manage.py createsuperuser       # create your own admin
```
