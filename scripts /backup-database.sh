#!/bin/bash

# ============================================
# Fluxo Database Backup Script
# ============================================
# This script creates automated backups of the Fluxo database
# and uploads them to S3 (optional)

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="fluxo_${DATE}.sql.gz"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Database credentials (from environment or .env)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-fluxo_production}"
DB_USER="${DB_USER:-fluxo}"
DB_PASSWORD="${DB_PASSWORD}"

# S3 configuration (optional)
S3_BUCKET="${S3_BUCKET}"
S3_PREFIX="${S3_PREFIX:-backups/database}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# Functions
# ============================================

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
    
    if ! command -v mysqldump &> /dev/null; then
        log_error "mysqldump is not installed"
        exit 1
    fi
    
    if ! command -v gzip &> /dev/null; then
        log_error "gzip is not installed"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        log_error "DB_PASSWORD is not set"
        exit 1
    fi
}

create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

backup_database() {
    log_info "Starting database backup..."
    log_info "Database: $DB_NAME"
    log_info "Backup file: $BACKUP_FILE"
    
    mysqldump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASSWORD" \
        --single-transaction \
        --quick \
        --lock-tables=false \
        --routines \
        --triggers \
        --events \
        "$DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_info "Backup completed successfully"
        BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
        log_info "Backup size: $BACKUP_SIZE"
    else
        log_error "Backup failed"
        exit 1
    fi
}

upload_to_s3() {
    if [ -n "$S3_BUCKET" ]; then
        log_info "Uploading backup to S3..."
        
        if command -v aws &> /dev/null; then
            aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/$S3_PREFIX/$BACKUP_FILE"
            
            if [ $? -eq 0 ]; then
                log_info "Uploaded to S3: s3://$S3_BUCKET/$S3_PREFIX/$BACKUP_FILE"
            else
                log_warn "Failed to upload to S3"
            fi
        else
            log_warn "AWS CLI not installed, skipping S3 upload"
        fi
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."
    
    find "$BACKUP_DIR" -name "fluxo_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    REMAINING=$(find "$BACKUP_DIR" -name "fluxo_*.sql.gz" -type f | wc -l)
    log_info "Remaining local backups: $REMAINING"
}

verify_backup() {
    log_info "Verifying backup integrity..."
    
    if gzip -t "$BACKUP_DIR/$BACKUP_FILE"; then
        log_info "Backup file is valid"
    else
        log_error "Backup file is corrupted"
        exit 1
    fi
}

send_notification() {
    # Optional: Send notification via webhook or email
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"✅ Fluxo database backup completed: $BACKUP_FILE\"}"
    fi
}

# ============================================
# Main Execution
# ============================================

main() {
    log_info "=== Fluxo Database Backup ==="
    log_info "Started at: $(date)"
    
    check_requirements
    create_backup_dir
    backup_database
    verify_backup
    upload_to_s3
    cleanup_old_backups
    send_notification
    
    log_info "=== Backup Complete ==="
    log_info "Finished at: $(date)"
}

# Run main function
main

exit 0
