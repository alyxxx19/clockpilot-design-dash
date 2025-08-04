#!/bin/bash

# ========================
# Production Backup Script for ClockPilot
# ========================

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="clockpilot_prod_${TIMESTAMP}.sql"
COMPRESSED_BACKUP="clockpilot_prod_${TIMESTAMP}.sql.gz"

# Retention policy (days)
RETENTION_DAYS=30

echo "==== ClockPilot Production Backup Started at $(date) ===="

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform database backup
echo "Creating database backup..."
pg_dump -h $PGHOST -U $PGUSER -d $PGDATABASE -f "$BACKUP_DIR/$DB_BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Database backup created successfully: $DB_BACKUP_FILE"
else
    echo "ERROR: Database backup failed!"
    exit 1
fi

# Compress the backup
echo "Compressing backup..."
gzip "$BACKUP_DIR/$DB_BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup compressed successfully: $COMPRESSED_BACKUP"
else
    echo "ERROR: Backup compression failed!"
    exit 1
fi

# Upload to S3 if configured
if [ ! -z "$BACKUP_BUCKET" ] && [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "Uploading backup to S3..."
    aws s3 cp "$BACKUP_DIR/$COMPRESSED_BACKUP" "s3://$BACKUP_BUCKET/database-backups/$COMPRESSED_BACKUP"
    
    if [ $? -eq 0 ]; then
        echo "Backup uploaded to S3 successfully"
    else
        echo "WARNING: S3 upload failed"
    fi
fi

# Clean up old local backups
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "clockpilot_prod_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Clean up old S3 backups if AWS CLI is available
if [ ! -z "$BACKUP_BUCKET" ] && [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "Cleaning up old S3 backups..."
    aws s3 ls "s3://$BACKUP_BUCKET/database-backups/" --recursive | \
    awk '{print $4}' | \
    while read file; do
        if [ $(aws s3api head-object --bucket "$BACKUP_BUCKET" --key "$file" --query 'LastModified' --output text | xargs -I {} date -d {} +%s) -lt $(date -d "-$RETENTION_DAYS days" +%s) ]; then
            aws s3 rm "s3://$BACKUP_BUCKET/$file"
            echo "Deleted old S3 backup: $file"
        fi
    done
fi

# Create backup report
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_BACKUP" | cut -f1)
echo "==== Backup Report ===="
echo "Timestamp: $(date)"
echo "Backup file: $COMPRESSED_BACKUP"
echo "Backup size: $BACKUP_SIZE"
echo "Status: SUCCESS"

# Optional: Send notification (webhook, email, etc.)
if [ ! -z "$WEBHOOK_URL" ]; then
    curl -X POST "$WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{\"text\":\"ClockPilot backup completed successfully at $(date). Size: $BACKUP_SIZE\"}"
fi

echo "==== ClockPilot Production Backup Completed at $(date) ===="