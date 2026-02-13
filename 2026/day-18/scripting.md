# Day 18 – Shell Scripting: Functions & Slightly Advanced Concepts

---

## 🎯 Challenge Overview

**Goal:**  
Write cleaner, reusable scripts — learn functions, strict mode, and real-world shell script patterns.

**You will:**
- Write and call functions
- Use `set -euo pipefail` for safer scripts
- Work with return values and local variables
- Build a slightly advanced script

---

## 📝 Definitions & Explanations

- **Function:**  
  Encapsulates code for reuse and clarity, can accept arguments.
- **Strict Mode:**  
  `set -euo pipefail` makes scripts safer: exit on errors, prevent undefined variables, catch pipe failures.
- **Local Variables:**  
  Declared in functions with `local` keyword; don't affect global scope.

---

## 📄 Task 1: Basic Functions

### **Challenge**
- Create `functions.sh` with:
    - `greet`: prints "Hello, <name>!"
    - `add`: prints the sum of two numbers
    - Call both from the script

### **Script: functions.sh**
```bash
#!/bin/bash

greet() {
    echo "Hello, $1!"
}

add() {
    SUM=$(( $1 + $2 ))
    echo "$1 + $2 = $SUM"
}

greet "Nandan"
add 7 5
```

**Output:**
```
Hello, Nandan!
7 + 5 = 12
```

---

## 📄 Task 2: Functions with Return Values

### **Challenge**
- Create `disk_check.sh` with:
    - `check_disk`: checks disk usage of /
    - `check_memory`: checks free memory
    - Main section calls both

### **Script: disk_check.sh**
```bash
#!/bin/bash

check_disk() {
    echo "Disk Usage:"
    df -h /
}

check_memory() {
    echo "Memory Usage:"
    free -h
}

check_disk
check_memory
```

**Output:**
```
Disk Usage:
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        20G   15G   5G  75% /
Memory Usage:
              total        used        free      shared  buff/cache   available
Mem:           3.8G        1.9G        0.7G         40M        1.2G        1.7G
Swap:          2.0G          0B        2.0G
```

---

## 📄 Task 3: Strict Mode — set -euo pipefail

### **Challenge**
- Create `strict_demo.sh` with strict mode at the top
    - Use undefined variable -> set -u error
    - Command fails -> set -e error
    - Piped command fails -> set -o pipefail error
- Document what each flag does

### **Script: strict_demo.sh**
```bash
#!/bin/bash
set -euo pipefail

echo "Strict mode enabled."
# set -u: using undefined variable
echo $UNDEFINED_VAR   # Causes script to exit/error

# set -e: command fails
false                 # Causes script to exit/error

# set -o pipefail: pipe fails if any part fails
false | echo "Test"   # Causes script to exit/error
```

**Output (example):**
```
Strict mode enabled.
/home/nandan/strict_demo.sh: line 4: UNDEFINED_VAR: unbound variable
```
(The script exits immediately at first error.)

**Explanation:**
- `set -e`: Exit immediately if any command fails (non-zero).
- `set -u`: Error and exit on usage of unset variables.
- `set -o pipefail`: If any command in a pipe fails, the pipe as a whole is considered failed.

---

## 📄 Task 4: Local Variables

### **Challenge**
- Create `local_demo.sh` with:
    - Function that uses `local` variable
    - Show that local variable does not leak outside
    - Compare with a regular (global) variable

### **Script: local_demo.sh**
```bash
#!/bin/bash

demo_local() {
    local MY_VAR="inside"
    echo "Inside function: MY_VAR = $MY_VAR"
}

demo_global() {
    MY_VAR="global"
    echo "Inside function: MY_VAR = $MY_VAR"
}

demo_local
echo "Outside function: MY_VAR = ${MY_VAR:-undefined}"

demo_global
echo "Outside function: MY_VAR = $MY_VAR"
```

**Output:**
```
Inside function: MY_VAR = inside
Outside function: MY_VAR = undefined
Inside function: MY_VAR = global
Outside function: MY_VAR = global
```

---

## 📄 Task 5: Build a Script — System Info Reporter

### **Challenge**
- Create `system_info.sh` that uses functions for:
    - Hostname and OS info
    - Uptime
    - Disk usage (top 5)
    - Memory usage
    - Top 5 CPU-consuming processes
    - Main function that calls all, with headers
    - Use `set -euo pipefail` for safety

### **Script: system_info.sh**
```bash
#!/bin/bash
set -euo pipefail

print_hostname_os() {
    echo "===== Hostname & OS Info ====="
    hostname
    cat /etc/os-release | grep PRETTY_NAME
}

print_uptime() {
    echo "===== Uptime ====="
    uptime
}

print_disk_usage() {
    echo "===== Top 5 Disk Usage ====="
    df -h | sort -r -k 5 | head -6
}

print_memory_usage() {
    echo "===== Memory Usage ====="
    free -h
}

print_top_cpu() {
    echo "===== Top 5 CPU Processes ====="
    ps -eo pid,comm,%cpu --sort=-%cpu | head -6
}

main() {
    print_hostname_os
    echo
    print_uptime
    echo
    print_disk_usage
    echo
    print_memory_usage
    echo
    print_top_cpu
}

main
```

**Output:**
```
===== Hostname & OS Info =====
nandan-virtualbox
PRETTY_NAME="Ubuntu 22.04.1 LTS"

===== Uptime =====
 11:41:44 up 12 days,  2:22,  1 user,  load average: 0.11, 0.13, 0.13

===== Top 5 Disk Usage =====
[Disk info...]

===== Memory Usage =====
[Memory info...]

===== Top 5 CPU Processes =====
  PID COMMAND         %CPU
 4069 chrome         14.1
 1926 bash            2.1
 ...
```

---

## 🧠 What I Learned

1. **Functions structure scripts for reuse, clarity, and maintenance.**
2. **Strict mode (`set -euo pipefail`) prevents silent errors, protects against bad variable usage, and catches pipeline failures.**
3. **Local variables in functions prevent unintended side-effects; robust scripts rely on careful variable scoping and error handling.**

---

## 💡 Hints

- **Function syntax:**  
  `function_name() { ... }`
- **Local variables:**  
  `local VAR="value"`
- **Strict mode:**  
  Add `set -euo pipefail` after the shebang.
- **Arguments:**  
  Access as `$1`, `$2` inside functions.
- **Exit code:**  
  `$?` gives last command’s exit status.
- **Section headers:**  
  Use `echo "==== Section ===="` for script readability.

---

## 🔑 Tips & Points to Remember

- Always use strict mode in scripts to prevent silent bugs.
- Use functions to avoid repeating code; easier to add/modify features.
- Use `local` in functions for variables that shouldn't leak globally.
- Modular scripts are easier to debug and extend.
- Validate inputs and check exit codes to handle and report errors properly.
- Document and comment scripts for future self/team use.

---
