# Day 19 – Shell Scripting Project: Log Rotation, Backup & Crontab

---

## 🎯 Challenge & Project Overview

**Goal:**  
Apply everything from Days 16–18 in real-world mini projects.

**You will:**  
- Write a _log rotation_ script  
- Write a _server backup_ script  
- Schedule them with _crontab_  
- Create a combined scheduled maintenance script

---

## 📄 Task 1: Log Rotation Script

### **Requirements**
- Takes a log directory as an argument (e.g., `/var/log/myapp`)
- Compresses `.log` files older than 7 days using `gzip`
- Deletes `.gz` files older than 30 days
- Prints how many files were compressed and deleted
- Exits with an error if the directory doesn't exist

### **Script: log_rotate.sh**
```bash
#!/bin/bash
set -euo pipefail

DIR="${1:-}"

if [[ -z "$DIR" || ! -d "$DIR" ]]; then
    echo "Usage: $0 <log_directory>"
    echo "Error: Directory $DIR does not exist."
    exit 1
fi

COMPRESSED=0
DELETED=0

# Compress .log files older than 7 days
for file in $(find "$DIR" -type f -name "*.log" -mtime +7); do
    gzip "$file"
    ((COMPRESSED++))
done

# Delete .gz files older than 30 days
for file in $(find "$DIR" -type f -name "*.gz" -mtime +30); do
    rm "$file"
    ((DELETED++))
done

echo "$COMPRESSED log files compressed."
echo "$DELETED old .gz files deleted."
```

### **Example Output**
```
3 log files compressed.
2 old .gz files deleted.
```

---

## 📄 Task 2: Server Backup Script

### **Requirements**
- Takes source directory and backup destination as arguments
- Creates a timestamped `.tar.gz` archive (e.g., `backup-2026-02-08.tar.gz`)
- Verifies archive was created successfully
- Prints archive name and size
- Deletes backups older than 14 days from destination
- Handles errors — exit if source doesn't exist

### **Script: backup.sh**
```bash
#!/bin/bash
set -euo pipefail

SOURCE="${1:-}"
DEST="${2:-}"

if [[ -z "$SOURCE" || ! -d "$SOURCE" ]]; then
    echo "Usage: $0 <source_directory> <backup_destination>"
    echo "Error: Source directory $SOURCE does not exist."
    exit 1
fi

if [[ -z "$DEST" || ! -d "$DEST" ]]; then
    echo "Usage: $0 <source_directory> <backup_destination>"
    echo "Error: Destination directory $DEST does not exist."
    exit 1
fi

DATE=$(date +%Y-%m-%d)
ARCHIVE="$DEST/backup-$DATE.tar.gz"

tar -czf "$ARCHIVE" -C "$(dirname "$SOURCE")" "$(basename "$SOURCE")"

if [[ -f "$ARCHIVE" ]]; then
    SIZE=$(du -h "$ARCHIVE" | cut -f1)
    echo "Backup created: $ARCHIVE"
    echo "Archive size: $SIZE"
else
    echo "Backup failed!"
    exit 2
fi

# Delete backups older than 14 days
DELETED=$(find "$DEST" -type f -name "backup-*.tar.gz" -mtime +14 -exec rm {} \; -print | wc -l)
echo "$DELETED old backup(s) deleted."
```

### **Example Output**
```
Backup created: /backups/backup-2026-02-13.tar.gz
Archive size: 80M
1 old backup(s) deleted.
```

---

## 📄 Task 3: Crontab

### **Requirements**
1. Read scheduled tasks: `crontab -l`
2. Understand Cron syntax:
   ```
   * * * * *  command
   │ │ │ │ │
   │ │ │ │ └── Day of week (0-7)
   │ │ │ └──── Month (1-12)
   │ │ └────── Day of month (1-31)
   │ └──────── Hour (0-23)
   └────────── Minute (0-59)
   ```
3. Write cron entries for:
   - Run `log_rotate.sh` every day at 2 AM:
     ```
     0 2 * * * /path/to/log_rotate.sh /var/log/myapp
     ```
   - Run `backup.sh` every Sunday at 3 AM:
     ```
     0 3 * * 0 /path/to/backup.sh /srv/data /backups
     ```
   - Run a health check script every 5 minutes:
     ```
     */5 * * * * /path/to/health_check.sh
     ```

### **Sample Output – crontab -l**
```
0 2 * * * /path/to/log_rotate.sh /var/log/myapp
0 3 * * 0 /path/to/backup.sh /srv/data /backups
*/5 * * * * /path/to/health_check.sh
```

---

## 📄 Task 4: Combine — Scheduled Maintenance Script

### **Requirements**
- Calls log rotation function
- Calls backup function
- Logs all output to `/var/log/maintenance.log` with timestamps
- Cron: run daily at 1 AM

### **Script: maintenance.sh**
```bash
#!/bin/bash
set -euo pipefail

LOGFILE="/var/log/maintenance.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$LOGFILE"
}

LOGDIR="/var/log/myapp"
SRCDIR="/srv/data"
BKPDIR="/backups"

log "Starting maintenance."

if /path/to/log_rotate.sh "$LOGDIR" >> "$LOGFILE" 2>&1; then
    log "Log rotation successful."
else
    log "Log rotation failed!"
fi

if /path/to/backup.sh "$SRCDIR" "$BKPDIR" >> "$LOGFILE" 2>&1; then
    log "Backup successful."
else
    log "Backup failed!"
fi

log "Maintenance finished."
```

### **Cron entry:**
```
0 1 * * * /path/to/maintenance.sh
```

---

## 🧠 What I Learned

1. **Real server tasks (log rotation, backup, scheduled maintenance) are handled securely and efficiently with scripting.**
2. **Arguments, error handling, and checks are crucial for robust scripts in production.**
3. **Crontab makes scheduling automation easy — understanding cron syntax is vital for regular maintenance.**

---

## 💡 Hints & Tips

- **Find & compress:**  
  `find /path -name "*.log" -mtime +7 -exec gzip {} \;`
- **Create archive:**  
  `tar -czf backup.tar.gz /dir`
- **Delete old files:**  
  `-mtime +N` in find  
- **Check if a directory exists:**  
  `[ -d /path ]`
- **Log messages:**  
  `echo "$(date): msg" >> logfile`
- **Crontab syntax:**  
  Use `crontab -e` for edits; test scripts manually before scheduling in prod
  
**Points to Remember:**
- Always validate arguments and check directory existence before running sensitive commands.
- Set executable permissions with `chmod +x script.sh`.
- Use absolute paths in cron jobs for reliability.
- Regularly check cron logs if a scheduled task fails to run.

---
