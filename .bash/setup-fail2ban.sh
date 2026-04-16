#!/bin/bash
# Fail2Ban setup script for SIGINT Wiki
# Configures standard security jails for nginx and ssh

set -e

REPO_DIR="/home/www/sigint"
FAIL2BAN_DIR="$REPO_DIR/.fail2ban"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root or with sudo"
    exit 1
fi

# Check if fail2ban is installed
if ! command -v fail2ban-client &> /dev/null; then
    log_info "Installing fail2ban..."
    apt-get update
    apt-get install -y fail2ban
fi

log_info "Fail2Ban version: $(fail2ban-client --version | head -1)"

# Backup existing configuration
if [ -f /etc/fail2ban/jail.local ]; then
    log_info "Backing up existing jail.local..."
    cp /etc/fail2ban/jail.local "/etc/fail2ban/jail.local.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy jail configuration
log_info "Installing SIGINT jail configuration..."
cp "$FAIL2BAN_DIR/jail.local" /etc/fail2ban/jail.local

# Copy custom filters
log_info "Installing custom filters..."
if [ -f "$FAIL2BAN_DIR/nginx-bad-request.conf" ]; then
    cp "$FAIL2BAN_DIR/nginx-bad-request.conf" /etc/fail2ban/filter.d/nginx-bad-request.conf
fi

if [ -f "$FAIL2BAN_DIR/nginx-forbidden.conf" ]; then
    cp "$FAIL2BAN_DIR/nginx-forbidden.conf" /etc/fail2ban/filter.d/nginx-forbidden.conf
fi

# Set proper permissions
chmod 644 /etc/fail2ban/jail.local
chmod 644 /etc/fail2ban/filter.d/nginx-bad-request.conf 2>/dev/null || true
chmod 644 /etc/fail2ban/filter.d/nginx-forbidden.conf 2>/dev/null || true

# Test configuration
log_info "Testing fail2ban configuration..."
if fail2ban-client -t; then
    log_info "Configuration test passed"
else
    log_error "Configuration test failed"
    exit 1
fi

# Restart fail2ban
log_info "Restarting fail2ban service..."
systemctl restart fail2ban

# Enable on boot
log_info "Enabling fail2ban on boot..."
systemctl enable fail2ban

# Show status
log_info "Fail2Ban status:"
systemctl status fail2ban --no-pager | head -10

echo ""
log_info "Active jails:"
fail2ban-client status | grep "Jail list" || echo "No jails active yet"

echo ""
log_info "Fail2Ban setup complete!"
log_info "Monitor bans with: fail2ban-client status"
log_info "View logs with: tail -f /var/log/fail2ban.log"
