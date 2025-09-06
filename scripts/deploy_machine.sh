#!/bin/bash

# Frontend deployment script for both GitHub Actions CD and machine startup
# Usage: ./deploy_machine.sh main frontend

set -e  # Exit on any error

# Configuration
PROJECT_PATH="/opt/workflow_app/jobs_manager_front"
LOG_FILE="$PROJECT_PATH/logs/deploy_machine.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Main deployment function
main() {
    log "Starting frontend deployment process..."

    cd "$PROJECT_PATH"
    mkdir -p logs

    # Update code from git
    git switch main
    git fetch origin main
    git reset --hard origin/main
    chmod +x scripts/deploy_machine.sh

    # Update schema (graceful fallback if backend unavailable)
    if npm run update-schema 2>/dev/null; then
        log_success "API schema updated"
    else
        log "Backend unavailable - using existing schema"
    fi

    # Install dependencies and build
    npm ci
    npm run build

    # Restart services
    sudo systemctl restart vue
    sudo systemctl reload nginx

    log_success "Frontend deployment completed successfully!"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

main "$@"