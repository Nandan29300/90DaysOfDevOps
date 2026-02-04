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

#### Step 6: Add More Lines for Better Practice
```bash
echo "Command: tee - writes and displays simultaneously" >> notes.txt
echo "Redirection: > overwrites file" >> notes.txt
echo "Redirection: >> appends to file" >> notes.txt
echo "These commands are essential for DevOps" >> notes.txt
```

**Verify:**
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

#### Step 7: Practice Reading with head
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

#### Step 8: Practice Reading with tail
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

#### Step 9: Read Middle Section
```bash
head -n 5 notes.txt | tail -n 2
```

**Expected Output:**
```bash
Command: tail - shows last N lines
Command: tee - writes and displays simultaneously
```

---

#### Step 10: Create Second Practice File with tee
```bash
echo "Creating file with tee" | tee practice2.txt
echo "This writes to file AND displays on screen" | tee -a practice2.txt
cat practice2.txt
```

**Expected Output:**
```bash
Creating file with tee
This writes to file AND displays on screen
Creating file with tee
This writes to file AND displays on screen
```

---

## Command Outputs

### Complete Practice Session Output

Here's what your complete terminal session should look like:

```bash
# Create file
$ touch notes.txt
$ ls -l notes.txt
-rw-r--r-- 1 nandan29300 nandan29300 0 Feb 04 10:30 notes.txt

# Write first line
$ echo "Day 06: Learning Linux File I/O" > notes.txt

# Add more lines
$ echo "Command: cat - displays full file content" >> notes.txt
$ echo "Command: head - shows first N lines" >> notes.txt
$ echo "Command: tail - shows last N lines" | tee -a notes.txt
Command: tail - shows last N lines

$ echo "Command: tee - writes and displays simultaneously" >> notes.txt
$ echo "Redirection: > overwrites file" >> notes.txt
$ echo "Redirection: >> appends to file" >> notes.txt
$ echo "These commands are essential for DevOps" >> notes.txt

# Read full file
$ cat notes.txt
Day 06: Learning Linux File I/O
Command: cat - displays full file content
Command: head - shows first N lines
Command: tail - shows last N lines
Command: tee - writes and displays simultaneously
Redirection: > overwrites file
Redirection: >> appends to file
These commands are essential for DevOps

# Read with line numbers
$ cat -n notes.txt
     1  Day 06: Learning Linux File I/O
     2  Command: cat - displays full file content
     3  Command: head - shows first N lines
     4  Command: tail - shows last N lines
     5  Command: tee - writes and displays simultaneously
     6  Redirection: > overwrites file
     7  Redirection: >> appends to file
     8  These commands are essential for DevOps

# Read first 2 lines
$ head -n 2 notes.txt
Day 06: Learning Linux File I/O
Command: cat - displays full file content

# Read last 2 lines
$ tail -n 2 notes.txt
Redirection: >> appends to file
These commands are essential for DevOps

# Count lines
$ wc -l notes.txt
8 notes.txt
```

---

## Real-World DevOps Examples

### Example 1: Quick Log Analysis

**Scenario:** Check the last 50 lines of application logs

```bash
tail -n 50 /var/log/application.log
```

**With Live Monitoring:**
```bash
tail -f /var/log/application.log
```

---

### Example 2: Creating Configuration Files

**Scenario:** Create a simple Nginx config file

```bash
cat > nginx-site.conf << EOF
server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://localhost:3000;
    }
}
EOF

cat nginx-site.conf
```

---

### Example 3: Appending to Build Logs

**Scenario:** Log build steps while displaying them

```bash
echo "Starting build process..." | tee -a build.log
echo "Compiling source code..." | tee -a build.log
echo "Running tests..." | tee -a build.log
echo "Build completed successfully!" | tee -a build.log
```

---

### Example 4: Extracting Specific Log Entries

**Scenario:** Check first and last entries of today's logs

```bash
# First 10 entries
head -n 10 /var/log/app-$(date +%Y-%m-%d).log

# Last 10 entries
tail -n 10 /var/log/app-$(date +%Y-%m-%d).log
```

---

### Example 5: Creating Deployment Notes

**Scenario:** Document deployment steps

```bash
echo "=== Deployment Notes ===" > deployment.txt
echo "Date: $(date)" >> deployment.txt
echo "Environment: Production" >> deployment.txt
echo "Version: v2.3.1" >> deployment.txt
echo "Deployed by: $USER" >> deployment.txt

cat deployment.txt
```

**Output:**
```bash
=== Deployment Notes ===
Date: Wed Feb 04 10:30:00 UTC 2026
Environment: Production
Version: v2.3.1
Deployed by: nandan29300
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

---

### Key Takeaways

1. **`>` vs `>>`**: Remember, `>` destroys existing content, `>>` preserves it
2. **`cat`**: Best for small files; use `less` or `more` for large files
3. **`head` and `tail`**: Perfect for quick file inspections
4. **`tee`**: Essential for logging scripts while seeing output
5. **Combination**: Commands can be piped together for powerful operations ( | )

---

### Practice Challenges

Try these additional exercises:

#### Challenge 1: Create a Server Log
```bash
echo "[$(date)] Server started" > server.log
echo "[$(date)] Database connected" >> server.log
echo "[$(date)] API listening on port 8080" >> server.log
tail -n 1 server.log
```

#### Challenge 2: Extract Middle Lines
```bash
# Get lines 3-5 from notes.txt
head -n 5 notes.txt | tail -n 3
```

#### Challenge 3: Count Words in File
```bash
cat notes.txt | wc -w
```

#### Challenge 4: Save and Display System Info
```bash
date | tee system-info.txt
uptime | tee -a system-info.txt
whoami | tee -a system-info.txt
cat system-info.txt
```

---

### Resources

- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/)
- [Linux Command Line Basics](https://ubuntu.com/tutorials/command-line-for-beginners)
- [Bash Redirection Guide](https://www.gnu.org/software/bash/manual/html_node/Redirections.html)

---
