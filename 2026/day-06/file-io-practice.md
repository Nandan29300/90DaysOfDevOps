# Day 06 – Linux Fundamentals: Read and Write Text Files

**Date:** 2026-02-04  
**Topic:** Basic File Input/Output Operations  
**Goal:** Master fundamental commands for reading and writing text files

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Commands Reference](#commands-reference)
3. [Hands-On Practice](#hands-on-practice)
4. [Command Outputs](#command-outputs)
5. [Real-World DevOps Examples](#real-world-devops-examples)
6. [Summary](#summary)

---

## Overview

Today's focus is on mastering basic file operations that every DevOps engineer uses daily. You'll learn to create, write, read, and manipulate text files using essential Linux commands.

### Why This Matters for DevOps
- **Log Analysis**: Reading application and system logs
- **Configuration Management**: Creating and editing config files
- **Automation Scripts**: Writing and debugging shell scripts
- **Troubleshooting**: Quickly checking file contents during incidents
- **CI/CD Pipelines**: Manipulating build outputs and deployment files

---

## Commands Reference

### 1. `touch` - Create Empty Files

**Definition:** Creates an empty file or updates the timestamp of an existing file.

**Syntax:**
```bash
touch [OPTIONS] filename
```

**Common Options:**
- `-a` : Change only access time
- `-m` : Change only modification time
- `-c` : Don't create file if it doesn't exist

**Example:**
```bash
touch notes.txt
```

**Output:**
```bash
# No output, but file is created. Verify with:
ls -l notes.txt
# -rw-r--r-- 1 user user 0 Feb 04 10:30 notes.txt
```

---

### 2. Redirection Operators: `>` and `>>`

**Definition:** 
- `>` : Redirects output to a file (overwrites existing content)
- `>>` : Redirects output to a file (appends to existing content)

**Examples:**

**Overwrite (using `>`):**
```bash
echo "This is line 1" > notes.txt
```

**Append (using `>>`):**
```bash
echo "This is line 2" >> notes.txt
echo "This is line 3" >> notes.txt
```

**Visual Difference:**
```bash
# First write (overwrites)
echo "First line" > test.txt
cat test.txt
# Output: First line

# Second write with > (overwrites previous content)
echo "Second line" > test.txt
cat test.txt
# Output: Second line

# Append with >>
echo "Third line" >> test.txt
cat test.txt
# Output:
# Second line
# Third line
```

---

### 3. `cat` - Concatenate and Display Files

**Definition:** Reads and displays the entire contents of one or more files.

**Syntax:**
```bash
cat [OPTIONS] filename
```

**Common Options:**
- `-n` : Number all output lines
- `-b` : Number non-empty output lines
- `-s` : Squeeze multiple blank lines into one
- `-A` : Show all non-printing characters

**Example:**
```bash
cat notes.txt
```

**Output:**
```bash
This is line 1
This is line 2
This is line 3
```

**With Line Numbers:**
```bash
cat -n notes.txt
```

**Output:**
```bash
     1  This is line 1
     2  This is line 2
     3  This is line 3
```

---

### 4. `head` - Display Beginning of File

**Definition:** Displays the first N lines of a file (default is 10 lines).

**Syntax:**
```bash
head [OPTIONS] filename
```

**Common Options:**
- `-n NUMBER` : Show first NUMBER lines
- `-c NUMBER` : Show first NUMBER bytes

**Example:**
```bash
head -n 2 notes.txt
```

**Output:**
```bash
This is line 1
This is line 2
```

---

### 5. `tail` - Display End of File

**Definition:** Displays the last N lines of a file (default is 10 lines).

**Syntax:**
```bash
tail [OPTIONS] filename
```

**Common Options:**
- `-n NUMBER` : Show last NUMBER lines
- `-f` : Follow file in real-time (great for logs!)
- `-c NUMBER` : Show last NUMBER bytes

**Example:**
```bash
tail -n 2 notes.txt
```

**Output:**
```bash
This is line 2
This is line 3
```

**Real-time Log Monitoring:**
```bash
tail -f /var/log/syslog
# Keeps showing new lines as they're added
```

---

### 6. `tee` - Read from STDIN and Write to STDOUT and Files

**Definition:** Reads from standard input and writes to both standard output and files simultaneously.

**Syntax:**
```bash
command | tee [OPTIONS] filename
```

**Common Options:**
- `-a` : Append to file instead of overwriting

**Example:**
```bash
echo "Line 4 via tee" | tee -a notes.txt
```

**Output:**
```bash
Line 4 via tee
# (Also written to notes.txt)
```

**Verify:**
```bash
cat notes.txt
```

**Output:**
```bash
This is line 1
This is line 2
This is line 3
Line 4 via tee
```

---

### 7. Here Document (`<<EOF`) - Add Multiple Lines at Once

**Definition:** A Here Document (heredoc) allows you to input multiple lines of text without using multiple echo commands. The delimiter (commonly `EOF`) marks the beginning and end of the input block.

**Syntax:**
```bash
cat <<DELIMITER >> filename
line 1
line 2
line 3
DELIMITER
```

**Common Delimiters:**
- `EOF` (End Of File) - most common
- `EOL` (End Of Lines)
- `END`
- Any custom word you choose

**How It Works:**
1. `cat <<EOF` tells the shell to read input until it sees `EOF`
2. All lines between the first `EOF` and the closing `EOF` are treated as input
3. `>>` appends this input to the file

**Example 1: Create File with Multiple Lines**
```bash
cat <<EOF > day6.txt
cat reads full file
head reads top lines
tail reads bottom lines
These skills help in DevOps
EOF
```

**Output:**
```bash
# No terminal output, but file is created with 4 lines
```

**Verify:**
```bash
cat day6.txt
```

**Output:**
```bash
cat reads full file
head reads top lines
tail reads bottom lines
These skills help in DevOps
```

---

**Example 2: Append Multiple Lines**
```bash
cat <<EOF >> day6.txt
Additional line 1
Additional line 2
Additional line 3
EOF
```

**Verify:**
```bash
cat day6.txt
```

**Output:**
```bash
cat reads full file
head reads top lines
tail reads bottom lines
These skills help in DevOps
Additional line 1
Additional line 2
Additional line 3
```

---

**Example 3: Create Configuration File**
```bash
cat <<EOF > app-config.yml
server:
  host: localhost
  port: 8080
database:
  name: myapp_db
  user: admin
EOF
```

**Verify:**
```bash
cat app-config.yml
```

**Output:**
```bash
server:
  host: localhost
  port: 8080
database:
  name: myapp_db
  user: admin
```

---

**Example 4: Create Script File**
```bash
cat <<'EOF' > backup.sh
#!/bin/bash
echo "Starting backup..."
tar -czf backup.tar.gz /home/user/documents
echo "Backup completed!"
EOF
```

**Note:** Using `<<'EOF'` (with quotes) prevents variable expansion.

**Verify:**
```bash
cat backup.sh
```

**Output:**
```bash
#!/bin/bash
echo "Starting backup..."
tar -czf backup.tar.gz /home/user/documents
echo "Backup completed!"
```

---

**Why Use EOF?**

✅ **Faster**: Write multiple lines in one command  
✅ **Cleaner**: No need for multiple `echo` statements  
✅ **Readable**: Better for scripts and automation  
✅ **Preserves Formatting**: Maintains indentation and spacing  

**Comparison:**

**Without EOF (repetitive):**
```bash
echo "Line 1" >> file.txt
echo "Line 2" >> file.txt
echo "Line 3" >> file.txt
echo "Line 4" >> file.txt
```

**With EOF (elegant):**
```bash
cat <<EOF >> file.txt
Line 1
Line 2
Line 3
Line 4
EOF
```

---

### 8. `grep` - Search Text in Files

**Definition:** `grep` (Global Regular Expression Print) searches for patterns in files and displays matching lines. It's one of the most powerful text search tools in Linux.

**Syntax:**
```bash
grep [OPTIONS] pattern filename
```

**Common Options:**
- `-i` : Ignore case (case-insensitive search)
- `-n` : Show line numbers
- `-v` : Invert match (show lines that DON'T match)
- `-c` : Count matching lines
- `-r` : Recursive search in directories
- `-w` : Match whole words only
- `-A N` : Show N lines after match
- `-B N` : Show N lines before match
- `-C N` : Show N lines before and after match

---

**Example 1: Basic Search**
```bash
cat day6.txt | grep head
```

**Output:**
```bash
head reads top lines
```

**Explanation:** Filters and shows only lines containing the word "head".

---

**Example 2: Direct File Search (Without cat)**
```bash
grep head day6.txt
```

**Output:**
```bash
head reads top lines
```

**Note:** This is more efficient than using `cat | grep`.

---

**Example 3: Case-Insensitive Search**
```bash
grep -i DEVOPS day6.txt
```

**Output:**
```bash
These skills help in DevOps
```

---

**Example 4: Show Line Numbers**
```bash
grep -n reads day6.txt
```

**Output:**
```bash
1:cat reads full file
2:head reads top lines
3:tail reads bottom lines
```

---

**Example 5: Count Matches**
```bash
grep -c reads day6.txt
```

**Output:**
```bash
3
```

---

**Example 6: Invert Match (Show Non-Matching Lines)**
```bash
grep -v reads day6.txt
```

**Output:**
```bash
These skills help in DevOps
```

---

**Example 7: Search Multiple Patterns**
```bash
grep -E "head|tail" day6.txt
```

**Output:**
```bash
head reads top lines
tail reads bottom lines
```

---

**Example 8: Match Whole Words Only**
```bash
grep -w "read" day6.txt
```

**Output:**
```bash
# No output - because "read" appears as "reads", not as a whole word
```

```bash
grep -w "reads" day6.txt
```

**Output:**
```bash
cat reads full file
head reads top lines
tail reads bottom lines
```

---

**Example 9: Show Context (Lines Before and After)**
```bash
grep -C 1 "head" day6.txt
```

**Output:**
```bash
cat reads full file
head reads top lines
tail reads bottom lines
```

**Explanation:** Shows 1 line before and 1 line after the match.

---

**Example 10: Real-World - Search in Log Files**

Create a sample log file:
```bash
cat <<EOF > app.log
[2026-02-04 10:00:01] INFO: Application started
[2026-02-04 10:00:05] DEBUG: Loading configuration
[2026-02-04 10:00:10] ERROR: Database connection failed
[2026-02-04 10:00:15] WARN: Retrying connection
[2026-02-04 10:00:20] INFO: Database connected successfully
[2026-02-04 10:00:25] ERROR: API endpoint not responding
EOF
```

**Search for errors:**
```bash
grep ERROR app.log
```

**Output:**
```bash
[2026-02-04 10:00:10] ERROR: Database connection failed
[2026-02-04 10:00:25] ERROR: API endpoint not responding
```

**Search for errors with line numbers:**
```bash
grep -n ERROR app.log
```

**Output:**
```bash
3:[2026-02-04 10:00:10] ERROR: Database connection failed
6:[2026-02-04 10:00:25] ERROR: API endpoint not responding
```

**Count errors:**
```bash
grep -c ERROR app.log
```

**Output:**
```bash
2
```

---

**Why grep is Essential for DevOps:**

✅ **Log Analysis**: Quickly find errors in large log files  
✅ **Debugging**: Search for specific error messages  
✅ **Monitoring**: Filter logs for critical events  
✅ **Configuration**: Find specific settings in config files  
✅ **Code Review**: Search for function names or variables  

---

**Common grep Use Cases:**

```bash
# Find all ERROR logs
grep ERROR /var/log/application.log

# Find all failed login attempts
grep "Failed password" /var/log/auth.log

# Search recursively in all files
grep -r "TODO" /home/user/project/

# Find configuration value
grep "port" /etc/nginx/nginx.conf

# Exclude certain patterns
grep -v "DEBUG" app.log

# Case-insensitive search for errors
grep -i error logs/*.log
```

---

## Hands-On Practice

### Step-by-Step Practice Session

Follow these steps exactly to complete Day 06:

#### Step 1: Create Empty File
```bash
touch notes.txt
ls -l notes.txt
```

**Expected Output:**
```bash
-rw-r--r-- 1 nandan29300 nandan29300 0 Feb 04 10:30 notes.txt
```

---

#### Step 2: Write First Line (Overwrite)
```bash
echo "Day 06: Learning Linux File I/O" > notes.txt
cat notes.txt
```

**Expected Output:**
```bash
Day 06: Learning Linux File I/O
```

---

#### Step 3: Append Second Line
```bash
echo "Command: cat - displays full file content" >> notes.txt
cat notes.txt
```

**Expected Output:**
```bash
Day 06: Learning Linux File I/O
Command: cat - displays full file content
```

---

#### Step 4: Append Third Line
```bash
echo "Command: head - shows first N lines" >> notes.txt
cat notes.txt
```

**Expected Output:**
```bash
Day 06: Learning Linux File I/O
Command: cat - displays full file content
Command: head - shows first N lines
```

---

#### Step 5: Use tee to Add Fourth Line
```bash
echo "Command: tail - shows last N lines" | tee -a notes.txt
```

**Expected Output:**
```bash
Command: tail - shows last N lines
```

**Verify File:**
```bash
cat notes.txt
```

**Expected Output:**
```bash
Day 06: Learning Linux File I/O
Command: cat - displays full file content
Command: head - shows first N lines
Command: tail - shows last N lines
```

---

#### Step 6: Use EOF to Add Multiple Lines at Once
```bash
cat <<EOF >> notes.txt
Command: tee - writes and displays simultaneously
Redirection: > overwrites file
Redirection: >> appends to file
These commands are essential for DevOps
EOF
```

**No terminal output, verify file:**
```bash
cat notes.txt
```

**Expected Output:**
```bash
Day 06: Learning Linux File I/O
Command: cat - displays full file content
Command: head - shows first N lines
Command: tail - shows last N lines
Command: tee - writes and displays simultaneously
Redirection: > overwrites file
Redirection: >> appends to file
These commands are essential for DevOps
```

---

#### Step 7: View with Line Numbers
```bash
cat -n notes.txt
```

**Expected Output:**
```bash
     1  Day 06: Learning Linux File I/O
     2  Command: cat - displays full file content
     3  Command: head - shows first N lines
     4  Command: tail - shows last N lines
     5  Command: tee - writes and displays simultaneously
     6  Redirection: > overwrites file
     7  Redirection: >> appends to file
     8  These commands are essential for DevOps
```

---

#### Step 8: Practice Reading with head
```bash
head -n 3 notes.txt
```

**Expected Output:**
```bash
Day 06: Learning Linux File I/O
Command: cat - displays full file content
Command: head - shows first N lines
```

---

#### Step 9: Practice Reading with tail
```bash
tail -n 3 notes.txt
```

**Expected Output:**
```bash
Redirection: > overwrites file
Redirection: >> appends to file
These commands are essential for DevOps
```

---

#### Step 10: Create day6.txt with EOF Method
```bash
cat <<EOF > day6.txt
cat reads full file
head reads top lines
tail reads bottom lines
These skills help in DevOps
EOF
```

**Verify:**
```bash
cat day6.txt
```

**Expected Output:**
```bash
cat reads full file
head reads top lines
tail reads bottom lines
These skills help in DevOps
```

---

#### Step 11: Search Text Using grep
```bash
grep head day6.txt
```

**Expected Output:**
```bash
head reads top lines
```

---

#### Step 12: Search with Line Numbers
```bash
grep -n reads day6.txt
```

**Expected Output:**
```bash
1:cat reads full file
2:head reads top lines
3:tail reads bottom lines
```

---

#### Step 13: Case-Insensitive grep
```bash
grep -i devops day6.txt
```

**Expected Output:**
```bash
These skills help in DevOps
```

---

#### Step 14: Count Occurrences
```bash
grep -c reads day6.txt
```

**Expected Output:**
```bash
3
```

---

#### Step 15: Read Middle Section
```bash
head -n 5 notes.txt | tail -n 2
```

**Expected Output:**
```bash
Command: tail - shows last N lines
Command: tee - writes and displays simultaneously
```

---

#### Step 16: Create Practice Log File
```bash
cat <<EOF > practice.log
[INFO] System started
[ERROR] Failed to connect
[WARN] Low memory
[INFO] Connection restored
[ERROR] Timeout occurred
EOF
```

**Search for errors:**
```bash
grep ERROR practice.log
```

**Expected Output:**
```bash
[ERROR] Failed to connect
[ERROR] Timeout occurred
```

---

## Summary

### Commands Mastered Today

| Command | Purpose | Common Use |
|---------|---------|------------|
| `touch` | Create empty file | Initialize files |
| `>` | Overwrite file | Create/replace content |
| `>>` | Append to file | Add new content |
| `cat` | Display full file | View file contents |
| `head` | Show first N lines | Preview file start |
| `tail` | Show last N lines | Monitor logs |
| `tee` | Write and display | Log while showing output |
| `<<EOF` | Multi-line input | Create configs/scripts |
| `grep` | Search text | Find patterns in files |

---

### Key Takeaways

1. **`>` vs `>>`**: Remember, `>` destroys existing content, `>>` preserves it
2. **`cat`**: Best for small files; use `less` or `more` for large files
3. **`head` and `tail`**: Perfect for quick file inspections
4. **`tee`**: Essential for logging scripts while seeing output
5. **`<<EOF`**: Makes writing multi-line content much easier and cleaner
6. **`grep`**: The most powerful text search tool - master it for log analysis
7. **Pipes (`|`)**: Combine commands for powerful data processing
8. **Combination**: Commands can be piped together for powerful operations

---

### grep Options Quick Reference

| Option | Description | Example |
|--------|-------------|---------|
| `-i` | Case-insensitive | `grep -i error log.txt` |
| `-n` | Show line numbers | `grep -n "failed" log.txt` |
| `-c` | Count matches | `grep -c ERROR log.txt` |
| `-v` | Invert match | `grep -v DEBUG log.txt` |
| `-r` | Recursive search | `grep -r "TODO" ./src` |
| `-w` | Whole word match | `grep -w "test" file.txt` |
| `-A N` | N lines after | `grep -A 3 ERROR log.txt` |
| `-B N` | N lines before | `grep -B 2 ERROR log.txt` |
| `-C N` | N lines around | `grep -C 1 ERROR log.txt` |

---

### Resources

- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/)
- [Linux Command Line Basics](https://ubuntu.com/tutorials/command-line-for-beginners)
- [Bash Redirection Guide](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)
- [grep Manual](https://www.gnu.org/software/grep/manual/grep.html)
- [Here Documents Guide](https://tldp.org/LDP/abs/html/here-docs.html)

---

## Quick Command Cheat Sheet

```bash
# File Creation
touch file.txt                          # Create empty file

# Writing
echo "text" > file.txt                  # Overwrite
echo "text" >> file.txt                 # Append

# Multi-line Writing
cat <<EOF >> file.txt
line 1
line 2
EOF

# Reading
cat file.txt                            # Full file
head -n 5 file.txt                      # First 5 lines
tail -n 5 file.txt                      # Last 5 lines
tail -f file.txt                        # Real-time monitoring

# Searching
grep "pattern" file.txt                 # Basic search
grep -i "pattern" file.txt              # Case-insensitive
grep -n "pattern" file.txt              # With line numbers
grep -c "pattern" file.txt              # Count matches
grep -v "pattern" file.txt              # Invert match
grep -r "pattern" directory/            # Recursive

# Combining Commands
cat file.txt | grep "error"             # Search in file
tail -f app.log | grep ERROR            # Monitor errors
grep -i error *.log | wc -l             # Count errors across files
```

---
