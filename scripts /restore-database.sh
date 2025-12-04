#!/bin/bash

# ============================================
# Fluxo Database Restore Script
# ============================================
# This script restores the Fluxo database from a backup file

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups}"

# Database credentials
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-fluxo_production}"
DB_USER="${DB_USER:-fluxo}"
DB_PASSWORD="${DB_PASSWORD}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
    if ! command -v mysql &> /dev/null; then
        log_error "mysql client is not installed"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        log_error "DB_PASSWORD is not set"
        exit 1
    fi
}

list_backups() {
    log_info "Available backups in $BACKUP_DIR:"
    echo ""
    
    backups=($(find "$BACKUP_DIR" -name "fluxo_*.sql.gz" -type f | sort -r))
    
    if [ ${#backups[@]} -eq 0 ]; then
        log_error "No backup files found"
        exit 1
    fi
    
    for i in "${!backups[@]}"; do
        backup_file="${backups[$i]}"
        backup_name=$(basename "$backup_file")
        backup_size=$(du -h "$backup_file" | cut -f1)
        backup_date=$(stat -c %y "$backup_file" | cut -d' ' -f1,2 | cut -d'.' -f1)
        
        echo "  [$i] $backup_name ($backup_size) - $backup_date"
    done
    
    echo ""
}

select_backup() {
    if [ -n "$1" ]; then
        BACKUP_FILE="$1"
        if [ ! -f "$BACKUP_FILE" ]; then
            log_error "Backup file not found: $BACKUP_FILE"
            exit 1
        fi
    else
        list_backups
        
        read -p "Enter backup number to restore (or 'q' to quit): " selection
        
        if [ "$selection" = "q" ]; then
            log_info "Restore cancelled"
            exit 0
        fi
        
        backups=($(find "$BACKUP_DIR" -name "fluxo_*.sql.gz" -type f | sort -r))
        BACKUP_FILE="${backups[$selection]}"
        
        if [ ! -f "$BACKUP_FILE" ]; then
            log_error "Invalid selection"
            exit 1
        fi
    fi
    
    log_info "Selected backup: $(basename $BACKUP_FILE)"
}

confirm_restore() {
    log_warn "⚠️  WARNING: This will OVERWRITE the current database!"
    log_warn "Database: $DB_NAME"
    log_warn "Host: $DB_HOST"
    echo ""
    
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi
}

create_pre_restore_backup() {
    log_info "Creating pre-restore backup..."
    
    PRE_RESTORE_FILE="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
    
    mysqldump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASSWORD" \
        --single-transaction \
        --quick \
        "$DB_NAME" | gzip > "$PRE_RESTORE_FILE"
    
    log_info "Pre-restore backup saved: $(basename $PRE_RESTORE_FILE)"
}

restore_database() {
    log_info "Starting database restore..."
    
    gunzip < "$BACKUP_FILE" | mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASSWORD" \
        "$DB_NAME"
    
    if [ $? -eq 0 ]; then
        log_info "✅ Database restored successfully"
    else
        log_error "❌ Restore failed"
        exit 1
    fi
}

verify_restore() {
    log_info "Verifying restore..."
    
    table_count=$(mysql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --user="$DB_USER" \
        --password="$DB_PASSWORD" \
        --batch \
        --skip-column-names \
        -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';" \
        2>/dev/null)
    
    log_info "Tables in database: $table_count"
    
    if [ "$table_count" -gt 0 ]; then
        log_info "Restore verification passed"
    else
        log_error "Restore verification failed - no tables found"
        exit 1
    fi
}

# ============================================
# Main Execution
# ============================================

main() {
    log_info "=== Fluxo Database Restore ==="
    log_info "Started at: $(date)"
    
    check_requirements
    select_backup "$1"
    confirm_restore
    create_pre_restore_backup
    restore_database
    verify_restore
    
    log_info "=== Restore Complete ==="
    log_info "Finished at: $(date)"
}

# Run main function
main "$@"

exit 0
