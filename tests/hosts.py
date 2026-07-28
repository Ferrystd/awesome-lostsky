import sys
import os

HOSTS_PATH = r"C:\Windows\System32\drivers\etc\hosts"
TARGET_IP = "127.0.0.1"


def is_admin():
    try:
        return os.getuid() == 0
    except AttributeError:
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin() != 0


def main():
    if len(sys.argv) < 2:
        print("Usage: python hosts.py <app> [slug]")
        sys.exit(1)

    if not is_admin():
        print("Error: This script must be run as Administrator.")
        sys.exit(1)

    app = sys.argv[1]
    slug = sys.argv[2] if len(sys.argv) > 2 else None

    entries_to_add = [f"{app}.lostsky.work"]
    if slug:
        entries_to_add.append(f"{slug}.{app}.lostsky.work")

    with open(HOSTS_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()

    existing_hosts = set()
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            parts = stripped.split()
            if len(parts) >= 2:
                existing_hosts.add(parts[1])

    new_entries = []
    for entry in entries_to_add:
        if entry not in existing_hosts:
            new_entries.append(f"{TARGET_IP} {entry}")

    if not new_entries:
        print("All entries already exist. Nothing to do.")
        return

    with open(HOSTS_PATH, "a", encoding="utf-8") as f:
        for entry in new_entries:
            f.write(f"\n{entry}")

    for entry in new_entries:
        print(f"Added: {entry}")


if __name__ == "__main__":
    main()
