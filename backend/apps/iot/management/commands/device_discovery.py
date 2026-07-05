"""
Zero-config device auto-detection.

Arduino devices broadcast a small UDP packet ( {"device_id","ip"} ) on the LAN
every few seconds. This listener receives them and keeps each Device's
ip_address / last_seen up to date automatically — so a device is detected the
moment it powers on, no matter what DHCP address it got.

Run alongside the web server:

    python manage.py device_discovery

Neither the laptop nor the Arduino needs to know the other's IP in advance.
"""
import json
import socket

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from backend.apps.iot.models import Device

DEFAULT_PORT = 45454


class Command(BaseCommand):
    help = "Listen for UDP broadcasts from Easy Grow devices and auto-register their IP addresses."

    def add_arguments(self, parser):
        parser.add_argument("--port", type=int, default=DEFAULT_PORT,
                            help=f"UDP port to listen on (default {DEFAULT_PORT}).")

    def handle(self, *args, **opts):
        port = opts["port"]
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        except OSError:
            pass
        sock.bind(("", port))
        self.stdout.write(self.style.SUCCESS(
            f"Device discovery listening on UDP :{port}  (Ctrl-C to stop)"))

        User = get_user_model()
        while True:
            try:
                data, addr = sock.recvfrom(1024)
            except KeyboardInterrupt:
                self.stdout.write("Discovery stopped.")
                break
            except OSError:
                continue

            src_ip = addr[0]
            try:
                msg = json.loads(data.decode("utf-8", "ignore"))
                device_id = str(msg.get("device_id") or "").strip()
                # Trust the packet's own IP, fall back to the sender address.
                ip = str(msg.get("ip") or "").strip() or src_ip
            except (ValueError, AttributeError):
                continue
            if not device_id:
                continue

            self._register(User, device_id, ip)

    def _register(self, User, device_id, ip):
        # Update-only: we keep a registered device's IP fresh, but never
        # auto-create one. This way the user adds the device once (with its
        # device_id) and its IP is then tracked automatically — no duplicate
        # device_id conflicts, and ownership stays correct.
        device = Device.objects.filter(device_id=device_id).first()
        if not device:
            self.stdout.write(
                f"  {device_id} broadcasting @ {ip} — not registered yet. "
                f"Add it on the Devices page (Device ID: {device_id}) to start tracking.")
            return
        changed = device.ip_address != ip
        device.ip_address = ip
        device.is_active = True
        device.last_seen = timezone.now()
        device.save(update_fields=["ip_address", "is_active", "last_seen"])
        tag = self.style.WARNING(f"IP updated -> {ip}") if changed else f"online @ {ip}"
        self.stdout.write(f"  {device_id}: {tag}")
