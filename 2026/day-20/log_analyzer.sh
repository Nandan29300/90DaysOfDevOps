#!/bin/bash
set -euo pipefail

# Task 1: Input and Validation
LOGFILE="${1:-}"
if [[ -z "$LOGFILE" ]]; then
    echo "Error: Please provide a log file as an argument."
    exit 1
fi

if [[ ! -f "$LOGFILE" ]]; then
    echo "Error: Log file '$LOGFILE' does not exist."
    exit 1
fi

REPORT="log_report_$(date +%Y-%m-%d).txt"
TOTAL_LINES=$(wc -l < "$LOGFILE")
DATE=$(date +"%Y-%m-%d")

# Task 2: Error Count
ERROR_COUNT=$(grep -E "ERROR|Failed" "$LOGFILE" | wc -l)

# Task 3: Critical Events (with line numbers)
CRITICAL_EVENTS=$(grep -n "CRITICAL" "$LOGFILE")

# Task 4: Top Error Messages
TOP_ERRORS=$(grep "ERROR" "$LOGFILE" | awk '{$1=""; $2=""; $3=""; sub(/^ +/, "", $0); print}' | sort | uniq -c | sort -rn | head -5)

# Task 5: Summary Report
{
    echo "===== Log Analysis Report ====="
    echo "Date of analysis    : $DATE"
    echo "Log file name       : $LOGFILE"
    echo "Total lines         : $TOTAL_LINES"
    echo "Total error count   : $ERROR_COUNT"
    echo ""
    echo "--- Top 5 Error Messages ---"
    echo "$TOP_ERRORS"
    echo ""
    echo "--- Critical Events ---"
    if [[ -n "$CRITICAL_EVENTS" ]]; then
        echo "$CRITICAL_EVENTS"
    else
        echo "No critical events found."
    fi
} > "$REPORT"

echo "Report generated: $REPORT"

# Task 6 (Optional): Archive Processed Logs
ARCHIVE_DIR="archive"
if [[ ! -d "$ARCHIVE_DIR" ]]; then
    mkdir "$ARCHIVE_DIR"
fi
mv "$LOGFILE" "$ARCHIVE_DIR/"
echo "Log file moved to $ARCHIVE_DIR/"