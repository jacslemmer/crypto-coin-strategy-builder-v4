#!/bin/bash

# =============================================================================
# Crypto Coin Strategy Builder V4 - Storage Health Check Script
# =============================================================================
# Script to check the health and status of production storage
# Run manually or via cron for monitoring
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DATA_DIR="${DATA_DIR:-./data}"
LOGS_DIR="${LOGS_DIR:-./logs}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

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

# Check directory permissions
check_permissions() {
    log "INFO" "Checking directory permissions..."
    
    local dirs=("$DATA_DIR" "$LOGS_DIR" "$BACKUP_DIR")
    local all_good=true
    
    for dir in "${dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            local perms=$(stat -c "%a" "$dir" 2>/dev/null || stat -f "%Lp" "$dir")
            local owner=$(stat -c "%U:%G" "$dir" 2>/dev/null || stat -f "%Su:%Sg" "$dir")
            
            if [[ "$dir" == "$LOGS_DIR" ]]; then
                if [[ $((10#$perms)) -eq 755 ]]; then
                    log "SUCCESS" "Directory permissions: $perms ($owner) - $dir"
                else
                    log "WARNING" "Directory permissions: $perms ($owner) - $dir (expected 755)"
                    all_good=false
                fi
            else
                if [[ $((10#$perms)) -eq 750 ]]; then
                    log "SUCCESS" "Directory permissions: $perms ($owner) - $dir"
                else
                    log "WARNING" "Directory permissions: $perms ($owner) - $dir (expected 750)"
                    all_good=false
                fi
                fi
        else
            log "ERROR" "Directory not found: $dir"
            all_good=false
        fi
    done
    
    if [[ "$all_good" == true ]]; then
        log "SUCCESS" "Directory permissions check completed"
    else
        log "WARNING" "Some permission issues found"
    fi
}

# Check storage usage
check_storage_usage() {
    log "INFO" "Checking storage usage..."
    
    if [[ -d "$DATA_DIR" ]]; then
        local total_size=$(du -sh "$DATA_DIR" 2>/dev/null | cut -f1 || echo "0")
        log "SUCCESS" "Total data size: $total_size"
        
        # Check database size
        if [[ -f "$DATA_DIR/database/db.sqlite" ]]; then
            local db_size=$(du -h "$DATA_DIR/database/db.sqlite" | cut -f1)
            log "SUCCESS" "Database: $db_size"
        else
            log "WARNING" "Database file not found"
        fi
        
        # Check R2 files
        if [[ -d "$DATA_DIR/backend/r2" ]]; then
            local r2_count=$(find "$DATA_DIR/backend/r2" -type f | wc -l)
            log "SUCCESS" "R2 Files: $r2_count"
        else
            log "WARNING" "R2 directory not found"
        fi
    else
        log "ERROR" "Data directory not found"
    fi
}

# Check backup status
check_backup_status() {
    log "INFO" "Checking backup status..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        local backup_count=$(find "$BACKUP_DIR" -name "ccsb-backup-*.tar.gz" | wc -l)
        local latest_backup=$(find "$BACKUP_DIR" -name "ccsb-backup-*.tar.gz" -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [[ $backup_count -gt 0 ]]; then
            log "SUCCESS" "Backup count: $backup_count"
            if [[ -n "$latest_backup" ]]; then
                local backup_age=$(find "$latest_backup" -printf '%AY-%Am-%Ad %AH:%AM\n' 2>/dev/null)
                log "SUCCESS" "Latest backup: $backup_age"
            fi
        else
            log "WARNING" "No backups found"
        fi
    else
        log "ERROR" "Backup directory not found"
    fi
}

# Check disk space
check_disk_space() {
    log "INFO" "Checking disk space..."
    
    local disk_usage=$(df -h . | tail -1)
    local available=$(echo "$disk_usage" | awk '{print $4}')
    local usage_percent=$(echo "$disk_usage" | awk '{print $5}' | sed 's/%//')
    
    if [[ $usage_percent -lt 80 ]]; then
        log "SUCCESS" "Disk space: $available available ($usage_percent% used)"
    elif [[ $usage_percent -lt 90 ]]; then
        log "WARNING" "Disk space: $available available ($usage_percent% used)"
    else
        log "ERROR" "Disk space critical: $available available ($usage_percent% used)"
    fi
}

# Main execution
main() {
    log "INFO" "Starting storage health check"
    
    check_permissions
    check_storage_usage
    check_backup_status
    check_disk_space
    
    log "SUCCESS" "Storage health check completed"
}

# Run main function
main "$@"
