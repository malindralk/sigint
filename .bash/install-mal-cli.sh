#!/bin/bash
# Install mal.py CLI to /usr/local/bin
# This allows running 'mal' from anywhere

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
CLI_SOURCE="$REPO_ROOT/mal.py"
INSTALL_PATH="/usr/local/bin/mal"

echo "Installing Malindra CLI..."
echo "Source: $CLI_SOURCE"
echo "Target: $INSTALL_PATH"

# Check if source exists
if [[ ! -f "$CLI_SOURCE" ]]; then
    echo "Error: mal.py not found at $CLI_SOURCE"
    exit 1
fi

# Copy to /usr/local/bin
sudo cp "$CLI_SOURCE" "$INSTALL_PATH"
sudo chmod +x "$INSTALL_PATH"

# Verify installation
if command -v mal &> /dev/null; then
    echo ""
    echo "✓ Malindra CLI installed successfully!"
    echo ""
    echo "Usage: mal [command]"
    echo ""
    echo "Examples:"
    echo "  mal status              # Check project status"
    echo "  mal build-frontend      # Build static site"
    echo "  mal start-backend       # Start backend services"
    echo "  mal --help              # Show all commands"
    echo ""
else
    echo "Error: Installation failed. Check if /usr/local/bin is in your PATH."
    exit 1
fi
