#!/bin/bash

# ============================================
# Fluxo Quick Deployment Script
# ============================================
# This script provides a one-command deployment solution

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DEPLOY_METHOD="${1:-manual}"  # manual, docker, or pm2
PROJECT_DIR="/home/ubuntu/Fluxo"

# ============================================
# Functions
# ============================================

print_header() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════╗"
    echo "║     Fluxo Deployment Script v1.0       ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    local missing_deps=()
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    if ! command -v pnpm &> /dev/null; then
        missing_deps+=("pnpm")
    fi
    
    if [ "$DEPLOY_METHOD" = "docker" ] && ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if [ "$DEPLOY_METHOD" = "pm2" ] && ! command -v pm2 &> /dev/null; then
        missing_deps+=("pm2")
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        exit 1
    fi
    
    log_info "All requirements satisfied"
}

check_env_file() {
    if [ ! -f ".env.production" ]; then
        log_error ".env.production file not found"
        log_info "Please create .env.production with required environment variables"
        exit 1
    fi
    
    log_info "Environment file found"
}

pull_latest_code() {
    log_info "Pulling latest code from GitHub..."
    
    if [ -d ".git" ]; then
        git pull origin main
    else
        log_warn "Not a git repository, skipping pull"
    fi
}

install_dependencies() {
    log_info "Installing dependencies..."
    pnpm install --frozen-lockfile
}

run_database_migrations() {
    log_info "Running database migrations..."
    
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
    fi
    
    pnpm db:push
}

build_application() {
    log_info "Building application..."
    pnpm build
}

deploy_manual() {
    log_info "Deploying with manual method..."
    
    pull_latest_code
    install_dependencies
    run_database_migrations
    build_application
    
    log_info "✅ Build complete. Start the application with:"
    echo "  node dist/index.js"
}

deploy_pm2() {
    log_info "Deploying with PM2..."
    
    pull_latest_code
    install_dependencies
    run_database_migrations
    build_application
    
    log_info "Starting/reloading PM2 process..."
    
    if pm2 list | grep -q "fluxo"; then
        pm2 reload fluxo
    else
        pm2 start ecosystem.config.js --env production
    fi
    
    pm2 save
    
    log_info "✅ Application deployed with PM2"
    pm2 status
}

deploy_docker() {
    log_info "Deploying with Docker..."
    
    pull_latest_code
    
    log_info "Building Docker image..."
    docker build -t fluxo:latest .
    
    log_info "Starting containers..."
    docker-compose up -d
    
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    log_info "Running database migrations..."
    docker-compose exec app pnpm db:push
    
    log_info "✅ Application deployed with Docker"
    docker-compose ps
}

run_health_check() {
    log_info "Running health check..."
    sleep 5
    
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        log_info "✅ Health check passed"
    else
        log_error "❌ Health check failed"
        exit 1
    fi
}

show_deployment_info() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     Deployment Successful! 🚀          ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Application URL: http://localhost:3000"
    echo "Health Check: http://localhost:3000/api/health"
    echo ""
    
    if [ "$DEPLOY_METHOD" = "pm2" ]; then
        echo "View logs: pm2 logs fluxo"
        echo "Monitor: pm2 monit"
    elif [ "$DEPLOY_METHOD" = "docker" ]; then
        echo "View logs: docker-compose logs -f"
        echo "Stop: docker-compose down"
    fi
}

# ============================================
# Main Execution
# ============================================

main() {
    print_header
    
    log_info "Deployment method: $DEPLOY_METHOD"
    log_info "Started at: $(date)"
    
    check_requirements
    check_env_file
    
    case "$DEPLOY_METHOD" in
        manual)
            deploy_manual
            ;;
        pm2)
            deploy_pm2
            run_health_check
            ;;
        docker)
            deploy_docker
            run_health_check
            ;;
        *)
            log_error "Invalid deployment method: $DEPLOY_METHOD"
            echo "Usage: $0 [manual|pm2|docker]"
            exit 1
            ;;
    esac
    
    show_deployment_info
    
    log_info "Finished at: $(date)"
}

# Run main function
main

exit 0
