#!/bin/bash
# Script to initialize and update git submodules

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$REPO_ROOT"

echo "Checking git submodules..."

# Check if there are any submodules defined
if [[ ! -f ".gitmodules" ]]; then
    echo "No submodules defined in this repository."
    exit 0
fi

# List submodules
echo "Submodules found:"
while IFS= read -r line; do
    if [[ "$line" =~ ^\[submodule ]]; then
        echo "  - $(echo "$line" | sed 's/\[submodule "//;s/"\]//')"
    fi
done < .gitmodules
echo

# Check if submodules are initialized
if [[ -f ".git/modules/content/HEAD" ]] || git submodule status | grep -qv "^-"; then
    echo "Submodules already initialized. Updating..."
    git submodule update --recursive
else
    echo "Initializing submodules..."
    git submodule init
    git submodule update --recursive
fi

# Show submodule status
echo
echo "Submodule status:"
git submodule status

echo
echo "Done! Submodules are ready."
