#!/bin/bash
# Script to manage SSL certificates with Certbot for sigint nginx configs

set -e

NGINX_DIR="/home/www/sigint/.nginx"
DEFAULT_EMAIL="info@malindra.lk"
DEFAULT_NAME="Malindra"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if certbot is installed
check_certbot() {
    log_info "Checking if certbot is installed..."
    if ! command -v certbot &> /dev/null; then
        log_error "Certbot is not installed. Please install certbot first."
        log_info "Run: sudo apt install certbot python3-certbot-nginx"
        exit 1
    fi

    if ! certbot plugins 2>/dev/null | grep -q "nginx"; then
        log_error "Certbot nginx plugin is not installed."
        log_info "Run: sudo apt install python3-certbot-nginx"
        exit 1
    fi

    log_info "Certbot $(certbot --version) is installed with nginx plugin."
}

# Extract unique domains from nginx configs
extract_domains() {
    log_info "Extracting domains from nginx configs..."
    DOMAINS=()

    for conf_file in "$NGINX_DIR"/*.conf; do
        if [[ -f "$conf_file" ]]; then
            # Extract server_name values
            while read -r line; do
                # Remove 'server_name' and semicolons, split by space
                names=$(echo "$line" | sed 's/server_name//;s/;//g' | tr -s ' ')
                for name in $names; do
                    # Skip wildcards and empty strings
                    if [[ -n "$name" && "$name" != "_" && ! "$name" =~ \* ]]; then
                        if [[ ! " ${DOMAINS[*]} " =~ " ${name} " ]]; then
                            DOMAINS+=("$name")
                        fi
                    fi
                done
            done < <(grep "server_name" "$conf_file")
        fi
    done

    if [[ ${#DOMAINS[@]} -eq 0 ]]; then
        log_error "No domains found in nginx configs."
        exit 1
    fi

    log_info "Found domains: ${DOMAINS[*]}"
}

# Perform NS lookup for domains
check_dns() {
    log_info "Performing DNS lookups..."
    local failed=0

    for domain in "${DOMAINS[@]}"; do
        log_info "Checking DNS for $domain..."

        # Check if domain resolves
        if ! host "$domain" &> /dev/null; then
            log_error "DNS lookup failed for $domain"
            failed=1
            continue
        fi

        # Get the IP address
        local ip=$(host "$domain" | grep "has address" | head -1 | awk '{print $NF}')
        if [[ -z "$ip" ]]; then
            log_warn "No A record found for $domain"
            failed=1
            continue
        fi

        log_info "  $domain -> $ip"

        # Check if it points to this server
        local server_ip=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
        if [[ "$ip" != "$server_ip" ]]; then
            log_warn "  $domain ($ip) may not point to this server ($server_ip)"
        fi
    done

    if [[ $failed -eq 1 ]]; then
        log_error "Some DNS lookups failed. Please fix DNS before continuing."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check for existing certificates
check_existing_certs() {
    log_info "Checking for existing certificates..."
    EXISTING_CERTS=()

    for domain in "${DOMAINS[@]}"; do
        if [[ -d "/etc/letsencrypt/live/$domain" ]]; then
            EXISTING_CERTS+=("$domain")
            log_info "  Certificate exists for $domain"
        fi
    done
}

# Clean up old certbot managed blocks from nginx configs
cleanup_certbot_blocks() {
    log_info "Checking for old certbot managed blocks..."

    local found=0
    for conf_file in "$NGINX_DIR"/*.conf; do
        if [[ -f "$conf_file" ]]; then
            if grep -q "# managed by Certbot" "$conf_file"; then
                log_warn "Found certbot managed blocks in $conf_file"
                found=1
            fi
        fi
    done

    if [[ $found -eq 1 ]]; then
        read -p "Clean up old certbot blocks? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for conf_file in "$NGINX_DIR"/*.conf; do
                if [[ -f "$conf_file" ]]; then
                    # Remove lines with "# managed by Certbot"
                    # Note: This is a simple cleanup. For complex configs, manual review is recommended.
                    sed -i '/# managed by Certbot/d' "$conf_file"

                    # Remove empty ssl_certificate lines (certbot may have added them)
                    sed -i '/^[[:space:]]*ssl_certificate[[:space:]]*;$/d' "$conf_file"
                    sed -i '/^[[:space:]]*ssl_certificate_key[[:space:]]*;$/d' "$conf_file"
                fi
            done
            log_info "Cleanup complete."
        fi
    else
        log_info "No old certbot blocks found."
    fi
}

# Remove old certbot certificates (optional)
remove_old_certs() {
    if [[ ${#EXISTING_CERTS[@]} -gt 0 ]]; then
        log_warn "Existing certificates found for: ${EXISTING_CERTS[*]}"
        read -p "Revoke and remove existing certificates? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for domain in "${EXISTING_CERTS[@]}"; do
                log_info "Removing certificate for $domain..."
                sudo certbot delete --cert-name "$domain" --non-interactive || true
            done
        fi
    fi
}

# Request new certificates
request_certificates() {
    log_info "Preparing to request certificates..."

    # Get email from user or use default
    local email="$DEFAULT_EMAIL"
    read -p "Enter email for Let's Encrypt [$email]: " input_email
    if [[ -n "$input_email" ]]; then
        email="$input_email"
    fi

    # Build domain list for certbot
    local domain_args=""
    for domain in "${DOMAINS[@]}"; do
        domain_args="$domain_args -d $domain"
    done

    log_info "Requesting certificates for: ${DOMAINS[*]}"
    log_info "Email: $email"

    # Run certbot with nginx plugin
    # Using --nginx will have certbot modify the configs directly
    # --deploy-hook can be used to run commands after obtaining certs
    sudo certbot --nginx \
        --non-interactive \
        --agree-tos \
        --email "$email" \
        $domain_args \
        --keep-or-expand \
        --deploy-hook "echo 'Certificate deployed successfully'"

    if [[ $? -eq 0 ]]; then
        log_info "Certificates obtained successfully!"
    else
        log_error "Failed to obtain certificates."
        exit 1
    fi
}

# Setup auto-renewal
setup_renewal() {
    log_info "Setting up auto-renewal..."

    # Check if timer is already enabled
    if systemctl is-active certbot.timer &> /dev/null; then
        log_info "Certbot auto-renewal timer is already active."
    else
        log_info "Enabling certbot auto-renewal..."
        sudo systemctl enable certbot.timer
        sudo systemctl start certbot.timer
    fi

    # Test renewal
    log_info "Testing renewal process (dry run)..."
    sudo certbot renew --dry-run || log_warn "Dry run had issues, check configuration."
}

# Main execution
main() {
    echo "========================================"
    echo "  Certbot SSL Certificate Manager"
    echo "  Sigint Nginx Configuration"
    echo "========================================"
    echo

    check_certbot
    extract_domains
    check_dns
    check_existing_certs
    cleanup_certbot_blocks
    remove_old_certs
    request_certificates
    setup_renewal

    echo
    log_info "SSL Certificate setup complete!"
    log_info "Don't forget to reload nginx: sudo systemctl reload nginx"
}

main "$@"
