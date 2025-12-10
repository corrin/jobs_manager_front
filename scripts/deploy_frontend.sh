#!/bin/bash

# Frontend deployment script for both GitHub Actions CD and machine startup
# Usage: ./deploy_machine.sh

set -e  # Exit on any error

# Configuration
PROJECT_PATH="/opt/workflow_app/jobs_manager_front"

# Main deployment function
main() {
    echo "Starting frontend deployment..."

    cd "$PROJECT_PATH"

    # Update code from git
    git switch main
    git fetch origin main
    git reset --hard origin/main
    chmod +x scripts/deploy_frontend.sh

    # Update schema (graceful fallback if backend unavailable)
    if npm run update-schema 2>/dev/null; then
        echo "API schema updated"
    else
        echo "Using existing schema (backend unavailable)"
    fi

    # Ensure previous dependencies don't cause permission issues when npm ci prunes node_modules
    if [ -d node_modules ]; then
        echo "Cleaning existing node_modules with sudo to avoid permission errors..."
        sudo rm -rf node_modules
    fi

    # Install dependencies and build
    npm ci
    npm run build

    # Reload nginx to serve new build
    sudo systemctl reload nginx

    echo "Frontend deployment completed"
}

# Handle script interruption
trap 'echo "Deployment interrupted"; exit 1' INT TERM

main
