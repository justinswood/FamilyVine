#!/bin/bash
# Database backup script for FamilyVine
# Add to crontab: 0 2 * * * /opt/familyvine/scripts/backup-db.sh >> /opt/familyvine/backups/backup.log 2>&1
# This runs daily at 2 AM

BACKUP_DIR="/opt/familyvine/backups"
CONTAINER_NAME="familyvine-db-1"
DB_NAME="${DB_NAME:-familytree}"
DB_USER="${DB_USER:-user}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "$(date): ERROR - Container $CONTAINER_NAME is not running"
    exit 1
fi

# Run pg_dump inside the container
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/familyvine_${DATE}.sql"

# Check if backup was successful
if [ $? -eq 0 ] && [ -s "$BACKUP_DIR/familyvine_${DATE}.sql" ]; then
    # Compress the backup
    gzip "$BACKUP_DIR/familyvine_${DATE}.sql"
    SIZE=$(du -h "$BACKUP_DIR/familyvine_${DATE}.sql.gz" | cut -f1)
    echo "$(date): Backup successful - familyvine_${DATE}.sql.gz ($SIZE)"
else
    echo "$(date): Backup FAILED"
    rm -f "$BACKUP_DIR/familyvine_${DATE}.sql"
    exit 1
fi

# Remove backups older than retention period
find "$BACKUP_DIR" -name "familyvine_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "$(date): Cleaned up backups older than $RETENTION_DAYS days"
