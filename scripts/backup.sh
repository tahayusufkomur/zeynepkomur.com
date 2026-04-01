#!/bin/sh
BACKUP_DIR="/app/data/backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
cp /app/data/zeyneple.db "$BACKUP_DIR/zeyneple_$DATE.db" 2>&1 || echo "[backup] FAILED: $(date)"
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete 2>/dev/null
echo "[backup] Completed: $DATE"
