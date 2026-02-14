# Day 20 – Bash Scripting Challenge: Log Analyzer and Report Generator

---

## 🎯 Challenge Overview

**Goal:**  
Automate the analysis of daily server log files, identify key events, and generate a summary report.

---

## 📄 Bash Script (`log_analyzer.sh`)

See full script in the repository.

---

## 🖥️ Sample Output

**Terminal:**
```
Report generated: log_report_2026-02-13.txt
Log file moved to archive/
```

**Report file (`log_report_2026-02-13.txt`):**
```
===== Log Analysis Report =====
Date of analysis    : 2026-02-13
Log file name       : sample_log.log
Total lines         : 1000
Total error count   : 84

--- Top 5 Error Messages ---
45 Failed to connect - 32456
20 Out of memory - 33445
8 Segmentation fault - 12429
7 Disk full - 93231
4 Invalid input - 77432

--- Critical Events ---
Line 84: 2026-02-13 10:15:23 CRITICAL Disk full - 9934
Line 217: 2026-02-13 14:32:01 CRITICAL Failed to connect - 44801
```

---

## 🛠️ Commands & Tools Used

- **grep** – filter log lines (ERROR, Failed, CRITICAL)
- **awk** – process error messages
- **sort, uniq -c, head** – count and rank error occurrences
- **wc -l** – line count
- **date** – timestamps/report naming
- **mv, mkdir** – archiving
- **set -euo pipefail** – robust error handling

---

## 🧠 What I Learned

1. Bash scripting can automate complex, real-world log analysis and reporting.
2. Combining tools (grep, awk, sort, uniq, head) gives deep insights into logs.
3. Validation, error handling, and archival are critical for safe file management.

---

## 📝 Tips & Points to Remember

- Always validate command-line arguments and file existence.
- Timestamped report files keep everything sorted day by day.
- Top error extraction lets you focus troubleshooting efforts.
- Archive logs after processing for a clean workspace.
- Modular Bash scripts are easy to extend for multi-log and multi-server analysis.

---