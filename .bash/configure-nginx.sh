#!/bin/bash
# Script to configure nginx to include sigint repo nginx configs

NGINX_CONF="/etc/nginx/nginx.conf"
SIGINT_NGINX_DIR="/home/www/sigint/.nginx"
BACKUP_DIR="/etc/nginx/backups"

# Set permissions for nginx to traverse and read sigint repo configs
echo "Setting permissions for nginx to access sigint repo..."

# Give www-data execute permission to traverse /home/www
sudo setfacl -m u:www-data:x /home/www

# Give www-data execute permission to traverse /home/www/sigint
sudo setfacl -m u:www-data:x /home/www/sigint

# Give www-data execute permission to traverse .nginx directory
sudo setfacl -m u:www-data:x "$SIGINT_NGINX_DIR"

# Give www-data read permission on all nginx config files
sudo setfacl -m u:www-data:r "$SIGINT_NGINX_DIR"/*.conf

# Set default ACL for future config files in .nginx directory
sudo setfacl -d -m u:www-data:r "$SIGINT_NGINX_DIR"

echo "Permissions set successfully."

# Create backup directory if it doesn't exist
sudo mkdir -p "$BACKUP_DIR"

# Backup current nginx.conf with timestamp
sudo cp "$NGINX_CONF" "$BACKUP_DIR/nginx.conf.$(date +%Y%m%d_%H%M%S)"

# Check if sigint include already exists
if grep -q "sigint/.nginx" "$NGINX_CONF"; then
    echo "Sigint nginx include already configured."
    exit 0
fi

# Add include directive for sigint nginx configs
# Insert after the sites-enabled include line
sudo sed -i '/include \/etc\/nginx\/sites-enabled\/\*;/a\\tinclude /home/www/sigint/.nginx/*.conf;' "$NGINX_CONF"

# Test nginx configuration
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "Nginx configuration valid."
    echo "Run 'sudo systemctl reload nginx' to apply changes."
else
    echo "Nginx configuration test failed. Restoring backup..."
    sudo cp "$BACKUP_DIR/nginx.conf.$(ls -t $BACKUP_DIR | head -1)" "$NGINX_CONF"
    exit 1
fi
