# Day 10 – File Permissions & File Operations

## 📋 Overview
Get hands-on with **Linux file operations and permissions** — essential for security and teamwork.

---

## ✔️ Definitions & Why

- **File Permissions (`rwxrwxrwx`):** Control who can read, write, or execute a file (owner-group-others).  
  _Why:_ Prevent unauthorized changes, protect sensitive info, enable safe execution.
- **File Operations:** Create, read, and edit files directly from Linux shell for fast DevOps workflows.
- **chmod:** Command to change file and directory permissions.

---

## 🚦 Commands & Example Outputs

### 1. **Create Files**

```sh
touch devops.txt
echo "These are my devops notes." > notes.txt
vim script.sh
# Inside vim:
# i (insert mode)
# echo "Hello DevOps"
# Esc
# :wq (save and exit)
ls -l
```
_Example output:_
```
-rw-r--r-- 1 nandan nandan  0 Feb 13 10:14 devops.txt
-rw-r--r-- 1 nandan nandan 25 Feb 13 10:14 notes.txt
-rw-r--r-- 1 nandan nandan 19 Feb 13 10:15 script.sh
```

---

### 2. **Read Files**

```sh
cat notes.txt
# Output: These are my devops notes.

vim -R script.sh
# [vim opens script.sh in read-only mode]

head -n 5 /etc/passwd
tail -n 5 /etc/passwd
```

---

### 3. **Understand Permissions**

- Format: `rwxrwxrwx`
    - r = read (4)
    - w = write (2)
    - x = execute (1)
- Example:
    - `-rw-r--r--` = Owner: read/write. Group: read. Others: read.
- Who can do what? See output below:

```sh
ls -l devops.txt notes.txt script.sh
```
_Example:_
```
-rw-r--r-- 1 nandan nandan  0 Feb 13 10:14 devops.txt
-rw-r--r-- 1 nandan nandan 25 Feb 13 10:14 notes.txt
-rw-r--r-- 1 nandan nandan 19 Feb 13 10:15 script.sh
```
Answer:  
- Owner can read/write files.  
- Group and others can only read.

---

### 4. **Modify Permissions**

```sh
# Make script.sh executable
chmod +x script.sh
ls -l script.sh
# -rwxr-xr-x 1 nandan nandan ... script.sh

# Run script
./script.sh
# Output: Hello DevOps

# Set devops.txt to read-only for all
chmod a-w devops.txt
ls -l devops.txt
# -r--r--r-- 1 nandan nandan ... devops.txt

# Set notes.txt to 640 (owner: rw, group: r, others: none)
chmod 640 notes.txt
ls -l notes.txt
# -rw-r----- 1 nandan nandan ... notes.txt

# Create directory with 755 permissions
mkdir project
chmod 755 project
ls -ld project
# drwxr-xr-x 2 nandan nandan ... project
```

---

### 5. **Test Permissions**

```sh
# Try writing to a read-only file
echo "test" > devops.txt
# bash: devops.txt: Permission denied

# Remove execute permission and try to run script.sh
chmod -x script.sh
./script.sh
# bash: ./script.sh: Permission denied
```

---

## 📊 Summary Table

| File/Dir      | Before         | After         | Who can do what     |
|---------------|----------------|--------------|---------------------|
| devops.txt    | -rw-r--r--     | -r--r--r--    | All can read only   |
| notes.txt     | -rw-r--r--     | -rw-r-----    | Owner rw, group r   |
| script.sh     | -rw-r--r--     | -rwxr-xr-x    | Owner all, others rx|
| project/      | drwxr-xr-x     | drwxr-xr-x    | Owner all, others rx|

---

## 🧩 What You Should Know

- `chmod` changes file/directory permissions.
- `ls -l` shows permissions in rwx format.
- Permission denied means you can't write/execute without proper rights.

---

## 💾 Commands Used

```sh
touch devops.txt
echo "These are my devops notes." > notes.txt
vim script.sh

ls -l
cat notes.txt
vim -R script.sh
head -n 5 /etc/passwd
tail -n 5 /etc/passwd

chmod +x script.sh
./script.sh
chmod a-w devops.txt
chmod 640 notes.txt
mkdir project
chmod 755 project
ls -ld project

echo "test" > devops.txt
chmod -x script.sh
./script.sh
```

---

## 🚀 What I Learned

1. **Permissions are critical for security** – they control who can view, modify, or execute files.
2. **Linux commands (`chmod`, `ls -l`, `cat`, etc.) make file management and troubleshooting fast and clear.**
3. **Setting permissions prevents accidental or malicious file changes, ensuring safe teamwork.**

---

<!-- Add screenshots for permission changes and errors as per challenge requirements -->
