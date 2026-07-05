#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Easy Grow Plants — one-click launcher
# Starts the Django backend + Vite frontend, then opens the site in a browser.
# Double-click the desktop icon (see install-launcher.sh) or run this directly.
# ─────────────────────────────────────────────────────────────────────────────
set -u
REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

PY="$REPO/venv/bin/python"
FRONTEND="$REPO/frontend"
BACKDIR="$REPO/backend/core"

echo "🌿 Easy Grow Plants launcher"
echo "   repo: $REPO"

# ── Sanity checks ────────────────────────────────────────────────────────────
if [ ! -x "$PY" ]; then
  echo "❌ Python venv not found at $PY"
  echo "   First-time setup:  python3 -m venv venv && venv/bin/pip install -r requirements.txt"
  read -rp "Press Enter to close..."; exit 1
fi
if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "❌ Frontend deps missing. Run once:  cd frontend && npm install --legacy-peer-deps"
  read -rp "Press Enter to close..."; exit 1
fi

# ── Pick free ports (backend 8000→8080→…, frontend 5173→5174→…) ──────────────
port_taken() { ss -ltn 2>/dev/null | grep -q ":$1 "; }
BPORT=8000; port_taken 8000 && BPORT=8080
while port_taken "$BPORT"; do BPORT=$((BPORT+1)); done
FPORT=5173
while port_taken "$FPORT"; do FPORT=$((FPORT+1)); done
echo "   backend port: $BPORT | frontend port: $FPORT"

# Align the Vite dev-proxy (/api,/media) with the chosen backend port.
printf 'VITE_BACKEND_URL=http://127.0.0.1:%s\nVITE_IOT_URL=http://127.0.0.1:8001\n' "$BPORT" > "$FRONTEND/.env"

# ── Prepare the database (migrate; seed demo data on first run) ──────────────
cd "$BACKDIR"
"$PY" manage.py migrate --noinput >/dev/null 2>&1
PLANTS=$("$PY" manage.py shell -c "from backend.apps.marketplace.models import Plant; print(Plant.objects.count())" 2>/dev/null | tail -1)
if [ "${PLANTS:-0}" = "0" ]; then
  echo "   seeding demo data (first run)…"
  "$PY" manage.py seed_marketplace   >/dev/null 2>&1
  "$PY" manage.py seed_demo_data      >/dev/null 2>&1
  "$PY" manage.py create_demo_users   >/dev/null 2>&1
fi

# ── Start backend ────────────────────────────────────────────────────────────
"$PY" manage.py runserver "0.0.0.0:$BPORT" >/tmp/easygrow-backend.log 2>&1 &
BPID=$!

# ── Start Arduino auto-discovery (LAN UDP listener) ──────────────────────────
"$PY" manage.py device_discovery >/tmp/easygrow-discovery.log 2>&1 &
DPID=$!

# ── Start frontend on the chosen port ────────────────────────────────────────
cd "$FRONTEND"
npm run dev -- --port "$FPORT" --strictPort >/tmp/easygrow-frontend.log 2>&1 &
FPID=$!

# ── Wait for the frontend to come up ─────────────────────────────────────────
URL="http://localhost:$FPORT/"
echo -n "   starting servers"
for _ in $(seq 1 40); do
  if curl -s -o /dev/null "$URL" 2>/dev/null; then break; fi
  echo -n "."; sleep 1
done
echo " ready ✅"

# ── Open the site in Edge / Chrome / default browser ─────────────────────────
open_browser() {
  for b in microsoft-edge microsoft-edge-stable google-chrome google-chrome-stable chromium chromium-browser brave-browser; do
    if command -v "$b" >/dev/null 2>&1; then "$b" "$1" >/dev/null 2>&1 & return 0; fi
  done
  # Windows/WSL and macOS fallbacks, then Linux default
  command -v cmd.exe >/dev/null 2>&1 && { cmd.exe /c start "" "$1" >/dev/null 2>&1 & return 0; }
  command -v open >/dev/null 2>&1 && { open "$1" & return 0; }
  command -v xdg-open >/dev/null 2>&1 && { xdg-open "$1" & return 0; }
}
open_browser "$URL"

echo ""
echo "🌿 Easy Grow Plants is running:"
echo "     Website : $URL"
echo "     Backend : http://localhost:$BPORT   (LAN: http://$(hostname -I 2>/dev/null | awk '{print $1}'):$BPORT)"
echo "     Login   : Israt Sultana / EasyGrow123!   (admin: admin / EasyGrow123!)"
echo ""
echo "Keep this window open. Press Ctrl+C here to stop both servers."

cleanup() { echo; echo "Stopping servers…"; kill "$BPID" "$FPID" 2>/dev/null; exit 0; }
trap cleanup INT TERM
wait
