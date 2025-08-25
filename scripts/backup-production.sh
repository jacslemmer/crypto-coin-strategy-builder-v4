#!/bin/bash

# =============================================================================
# Crypto Coin Strategy Builder V4 - Production Backup Script
# =============================================================================
# Automated backup script for production data
# Run daily via cron: 0 2 * * * /path/to/project/scripts/backup-production.sh
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATA_DIR="${DATA_DIR:-./data}"
LOGS_DIR="${LOGS_DIR:-./logs}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO") echo -e "${BLUE}[${timestamp}] [INFO]${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[${timestamp}] [SUCCESS]${NC} $message" ;;
        "WARNING") echo -e "${YELLOW}[${timestamp}] [WARNING]${NC} $message" ;;
        "ERROR") echo -e "${RED}[${timestamp}] [ERROR]${NC} $message" ;;
    esac
}

# Create backup
create_backup() {
    local timestamp=$(date '+%Y%m%d-%H%M%S')
    local backup_file="$BACKUP_DIR/ccsb-backup-$timestamp.tar.gz"
    
    log "INFO" "Creating backup: $backup_file"
    
    # Create backup archive
    tar -czf "$backup_file" \
        --exclude="$DATA_DIR/backend/r2/temp" \
        --exclude="$LOGS_DIR/backend/*.log" \
        --exclude="$BUILD_DIR" \
        "$DATA_DIR" "$LOGS_DIR"
    
    # Verify backup
    if tar -tzf "$backup_file" > /dev/null 2>&1; then
        log "SUCCESS" "Backup created successfully: $(du -h "$backup_file" | cut -f1)"
    else
        log "ERROR" "Backup verification failed"
        rm -f "$backup_file"
        exit 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "INFO" "Cleaning up backups older than $RETENTION_DAYS days"
    
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "ccsb-backup-*.tar.gz" -mtime +$RETENTION_DAYS -print0)
    
    if [[ $deleted_count -gt 0 ]]; then
        log "SUCCESS" "Deleted $deleted_count old backup(s)"
    else
        log "INFO" "No old backups to delete"
    fi
}

# Main execution
main() {
    log "INFO" "Starting production backup process"
    
    # Check if backup directory exists
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "ERROR" "Backup directory does not exist: $BACKUP_DIR"
        exit 1
    fi
    
    # Create backup
    create_backup
    
    # Cleanup old backups
    cleanup_old_backups
    
    log "SUCCESS" "Backup process completed successfully"
}

# Run main function
main "$@"
