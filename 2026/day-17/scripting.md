# Day 17 – Shell Scripting: Loops, Arguments & Error Handling

---

## 🎯 Challenge Overview

**Goal:**  
Level up scripting skills with loops, argument handling, and robust error management.

**You will:**  
- Write `for` and `while` loops  
- Use command-line arguments (`$1`, `$#`, `$@`, `$0`)  
- Install packages automatically via script  
- Add basic error handling (`set -e`, `||`)

---

## 📝 Definitions & Explanations

- **For Loop:**  
  Repeats actions for each item in a list or sequence.  
  *Syntax:* `for item in list; do ... done`

- **While Loop:**  
  Keeps running as long as a condition is true.  
  *Syntax:* `while [ condition ]; do ... done`

- **Arguments:**  
  Inputs passed to scripts from the command line (`$1` for first arg, `$#` for count, `$@` for all args).

- **Error Handling:**  
  Ensures scripts don’t fail silently—`set -e` exits on error, `||` allows custom fallback/actions.

---

## 📄 Task 1: For Loop

### **Challenge**
- Create `for_loop.sh` — Print each fruit from a list of 5
- Create `count.sh` — Print numbers 1 to 10

### **Script: for_loop.sh**
```bash
#!/bin/bash
FRUITS="apple banana mango orange grape"
for fruit in $FRUITS; do
    echo "$fruit"
done
```

**Output:**
```
apple
banana
mango
orange
grape
```

### **Script: count.sh**
```bash
#!/bin/bash
for i in {1..10}; do
    echo "$i"
done
```

**Output:**
```
1
2
3
...
10
```

---

## 📄 Task 2: While Loop

### **Challenge**
- Create `countdown.sh`
  - Takes a number from user
  - Counts down to 0 using a while loop
  - Prints "Done!" at end

### **Script: countdown.sh**
```bash
#!/bin/bash
read -p "Enter starting number: " NUM
while [ $NUM -ge 0 ]; do
    echo "$NUM"
    NUM=$((NUM-1))
done
echo "Done!"
```

**Output:**
```
Enter starting number: 5
5
4
3
2
1
0
Done!
```

---

## 📄 Task 3: Command-Line Arguments

### **Challenge 1**
- Create `greet.sh`
  - Accepts `NAME` as `$1`
  - Prints Hello, <NAME>!
  - If no argument: Usage message

### **Script: greet.sh**
```bash
#!/bin/bash
if [ -z "$1" ]; then
    echo "Usage: ./greet.sh <name>"
    exit 1
fi
echo "Hello, $1!"
```

**Output:**
```
./greet.sh Nandan
Hello, Nandan!
./greet.sh
Usage: ./greet.sh <name>
```

### **Challenge 2**
- Create `args_demo.sh` to print count, all args, script name

### **Script: args_demo.sh**
```bash
#!/bin/bash
echo "Script Name: $0"
echo "Total Arguments: $#"
echo "All Arguments: $@"
```

**Output:**
```
./args_demo.sh one two three
Script Name: ./args_demo.sh
Total Arguments: 3
All Arguments: one two three
```

---

## 📄 Task 4: Install Packages via Script

### **Challenge**
- Create `install_packages.sh`
  - List of packages: nginx, curl, wget
  - For each: check if installed, install if missing

### **Script: install_packages.sh**
```bash
#!/bin/bash
if [ "$EUID" -ne 0 ]; then
    echo "Run as root!"
    exit 1
fi

PACKAGES="nginx curl wget"
for pkg in $PACKAGES; do
    dpkg -s $pkg &> /dev/null
    if [ $? -eq 0 ]; then
        echo "$pkg is already installed."
    else
        echo "Installing $pkg..."
        apt-get install -y $pkg
    fi
done
```

**Output:**
```
nginx is already installed.
curl is already installed.
wget is already installed.
```
(or installing output)

---

## 📄 Task 5: Error Handling

### **Challenge 1**
- Create `safe_script.sh`
  - Uses `set -e` (exit on error)
  - Creates directory /tmp/devops-test, navigates in, creates file
  - Uses `||` for custom error message

### **Script: safe_script.sh**
```bash
#!/bin/bash
set -e
mkdir /tmp/devops-test || echo "Directory already exists"
cd /tmp/devops-test || echo "Couldn't cd into /tmp/devops-test"
touch testfile.txt || echo "Couldn't create file"
echo "Script completed successfully."
```

**Output:**
```
Directory already exists
Script completed successfully.
```

### **Challenge 2**
- Modify `install_packages.sh` to check for root (Already added above).

---

## ✨ What I Learned

1. **For/while loops automate repetitive tasks and make scripts powerful.**
2. **Command-line arguments unlock flexible scripts you can reuse in multiple situations.**
3. **Error handling (`set -e`, root check, `||`) makes scripts robust and safe for real-world operations.**

---
