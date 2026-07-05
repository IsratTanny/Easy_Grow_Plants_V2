#!/usr/bin/env bash
# Installs a double-click desktop icon that launches Easy Grow Plants.
# Run once:  bash install-launcher.sh
set -e
REPO="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$REPO/start-easygrow.sh"

read -r -d '' ENTRY <<EOF || true
[Desktop Entry]
Version=1.0
Type=Application
Name=Easy Grow Plants
Comment=Start the servers and open the Easy Grow Plants website
Exec=bash "$REPO/start-easygrow.sh"
Icon=$REPO/easygrow-icon.png
Terminal=true
Categories=Development;Education;
EOF

APPS="$HOME/.local/share/applications"
mkdir -p "$APPS"
printf '%s\n' "$ENTRY" > "$APPS/EasyGrowPlants.desktop"
chmod +x "$APPS/EasyGrowPlants.desktop"

DESK="$(xdg-user-dir DESKTOP 2>/dev/null || echo "$HOME/Desktop")"
mkdir -p "$DESK"
cp "$APPS/EasyGrowPlants.desktop" "$DESK/EasyGrowPlants.desktop"
chmod +x "$DESK/EasyGrowPlants.desktop"

# Mark the desktop shortcut as trusted so it launches on double-click (GNOME).
gio set "$DESK/EasyGrowPlants.desktop" metadata::trusted true 2>/dev/null || true
gio set "$DESK/EasyGrowPlants.desktop" metadata::trust true 2>/dev/null || true

echo "✅ 'Easy Grow Plants' launcher installed:"
echo "   Desktop : $DESK/EasyGrowPlants.desktop"
echo "   Menu    : also searchable in your applications menu"
echo
echo "Double-click the green leaf icon on your Desktop to start everything."
echo "(GNOME may ask once — right-click the icon → 'Allow Launching' if double-click is blocked.)"
