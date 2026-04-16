#!/usr/bin/env python3
"""Malindra CLI - Frequently used commands for development and deployment."""

import argparse
import subprocess
import sys
from pathlib import Path

# Detect repo root: either current dir (if running from repo) or find it
_CWD = Path.cwd()
if (_CWD / "backend" / "docker-compose.yml").exists():
    ROOT = _CWD
elif (_CWD.parent / "backend" / "docker-compose.yml").exists():
    ROOT = _CWD.parent
else:
    # Fallback to script location (may not work if installed to /usr/local/bin)
    ROOT = Path(__file__).parent

BACKEND = ROOT / "backend"


def run(cmd, cwd=None, check=True):
    """Run a shell command."""
    print(f"$ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, check=check)
    return result.returncode


def cmd_build_frontend(args):
    """Build Next.js static site."""
    return run(["pnpm", "build"], cwd=ROOT)


def cmd_dev_frontend(args):
    """Start Next.js dev server."""
    return run(["pnpm", "dev"], cwd=ROOT)


def cmd_build_backend(args):
    """Build backend Docker image."""
    return run(["docker", "compose", "build", "backend"], cwd=BACKEND)


def cmd_start_backend(args):
    """Start backend services (postgres, redis, backend)."""
    return run(["docker", "compose", "up", "-d"], cwd=BACKEND)


def cmd_stop_backend(args):
    """Stop backend services."""
    return run(["docker", "compose", "down"], cwd=BACKEND)


def cmd_restart_backend(args):
    """Restart backend services."""
    return run(["docker", "compose", "restart"], cwd=BACKEND)


def cmd_logs_backend(args):
    """Show backend logs."""
    service = args.service if hasattr(args, 'service') else "backend"
    return run(["docker", "compose", "logs", "-f", service], cwd=BACKEND)


def cmd_sync_content(args):
    """Sync content from git submodule and generate embeddings."""
    import urllib.request
    import json

    url = "http://localhost:8000/api/articles/sync?generate_embeddings=true"
    req = urllib.request.Request(url, method="POST")

    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            print(json.dumps(data, indent=2))
            return 0
    except Exception as e:
        print(f"Error: {e}")
        return 1


def cmd_search(args):
    """Search articles via semantic search."""
    import urllib.request
    import json
    import urllib.parse

    query = urllib.parse.quote(args.query)
    url = f"http://localhost:8000/api/search?q={query}&limit={args.limit}"

    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            for result in data.get("results", []):
                print(f"\n[{result['category']}] {result['title']}")
                print(f"  Similarity: {result['similarity']:.2f}")
                print(f"  Chunk: {result['chunk_text'][:200]}...")
            return 0
    except Exception as e:
        print(f"Error: {e}")
        return 1


def cmd_nginx_test(args):
    """Test nginx configuration."""
    return run(["sudo", "nginx", "-t"])


def cmd_nginx_reload(args):
    """Reload nginx configuration."""
    return run(["sudo", "systemctl", "reload", "nginx"])


def cmd_setup_nginx(args):
    """Run nginx setup script."""
    return run(["sudo", "bash", ".bash/configure-nginx.sh"], cwd=ROOT)


def cmd_setup_fail2ban(args):
    """Run fail2ban setup script."""
    return run(["sudo", "bash", ".bash/setup-fail2ban.sh"], cwd=ROOT)


def cmd_status(args):
    """Show project status."""
    print("=== SIGINT Wiki Status ===\n")

    # Check nginx
    result = subprocess.run(["systemctl", "is-active", "nginx"], capture_output=True, text=True)
    print(f"Nginx: {result.stdout.strip()}")

    # Check fail2ban
    result = subprocess.run(["systemctl", "is-active", "fail2ban"], capture_output=True, text=True)
    print(f"Fail2ban: {result.stdout.strip()}")

    # Check docker containers
    print("\nDocker Containers:")
    subprocess.run(["docker", "ps", "--format", "table {{.Names}}\t{{.Status}}\t{{.Ports}}"])

    # Check disk usage
    print("\nDisk Usage:")
    subprocess.run(["df", "-h", "/"])

    return 0


def cmd_update_content(args):
    """Update content git submodule."""
    return run(["git", "submodule", "update", "--remote"], cwd=ROOT)


def main():
    parser = argparse.ArgumentParser(
        description="Malindra CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s build-frontend          # Build static site
  %(prog)s start-backend           # Start all backend services
  %(prog)s sync-content            # Sync articles and generate embeddings
  %(prog)s search "SDR hardware"   # Search articles
  %(prog)s status                  # Show project status
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Frontend commands
    p = subparsers.add_parser("build-frontend", help="Build Next.js static site")
    p.set_defaults(func=cmd_build_frontend)

    p = subparsers.add_parser("dev-frontend", help="Start Next.js dev server")
    p.set_defaults(func=cmd_dev_frontend)

    # Backend commands
    p = subparsers.add_parser("build-backend", help="Build backend Docker image")
    p.set_defaults(func=cmd_build_backend)

    p = subparsers.add_parser("start-backend", help="Start backend services")
    p.set_defaults(func=cmd_start_backend)

    p = subparsers.add_parser("stop-backend", help="Stop backend services")
    p.set_defaults(func=cmd_stop_backend)

    p = subparsers.add_parser("restart-backend", help="Restart backend services")
    p.set_defaults(func=cmd_restart_backend)

    p = subparsers.add_parser("logs-backend", help="Show backend logs")
    p.add_argument("--service", default="backend", help="Service name (backend, postgres, redis)")
    p.set_defaults(func=cmd_logs_backend)

    # Content commands
    p = subparsers.add_parser("sync-content", help="Sync content and generate embeddings")
    p.set_defaults(func=cmd_sync_content)

    p = subparsers.add_parser("update-content", help="Update content git submodule")
    p.set_defaults(func=cmd_update_content)

    # Search
    p = subparsers.add_parser("search", help="Search articles via semantic search")
    p.add_argument("query", help="Search query")
    p.add_argument("--limit", type=int, default=5, help="Number of results")
    p.set_defaults(func=cmd_search)

    # Nginx commands
    p = subparsers.add_parser("nginx-test", help="Test nginx configuration")
    p.set_defaults(func=cmd_nginx_test)

    p = subparsers.add_parser("nginx-reload", help="Reload nginx configuration")
    p.set_defaults(func=cmd_nginx_reload)

    p = subparsers.add_parser("setup-nginx", help="Run nginx setup script")
    p.set_defaults(func=cmd_setup_nginx)

    # Security commands
    p = subparsers.add_parser("setup-fail2ban", help="Run fail2ban setup script")
    p.set_defaults(func=cmd_setup_fail2ban)

    # Status
    p = subparsers.add_parser("status", help="Show project status")
    p.set_defaults(func=cmd_status)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
