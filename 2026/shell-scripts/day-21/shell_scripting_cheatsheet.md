# Shell Scripting Cheat Sheet

A quick-reference guide to everyday Shell scripting for DevOps and automation tasks. Includes explanations, syntax, and real-world ready examples.

---

## Quick Reference Table

| Topic      | Key Syntax                      | Example                           |
|------------|---------------------------------|-----------------------------------|
| Variable   | `VAR="value"`                   | `NAME="DevOps"`                   |
| Argument   | `$1, $2`                        | `./script.sh arg1 arg2`           |
| If         | `if [ condition ]; then ... fi` | `if [ -f file ]; then ... fi`     |
| For loop   | `for i in list; do ... done`    | `for i in 1 2 3; do ... done`     |
| Function   | `name() { ... }`                | `greet() { echo "Hi"; }`          |
| Grep       | `grep pattern file`             | `grep -i "error" log.txt`         |
| Awk        | `awk '{print $1}' file`         | `awk -F: '{print $1}' /etc/passwd`|
| Sed        | `sed 's/old/new/g' file`        | `sed -i 's/foo/bar/g' config.txt` |

---

## 1. Basics

### Shebang  
**Definition:**  
`#!/bin/bash` (the *shebang*) at the top of a script tells the OS which interpreter to use.

**Example:**
```bash
#!/bin/bash
echo "Hello, DevOps!"
```

### Running a Script  
**Making a script executable:**
```bash
chmod +x myscript.sh
```

**Running the script (two ways):**
```bash
./myscript.sh    # Uses the shebang interpreter
bash myscript.sh # Runs with bash, ignores shebang
```

### Comments  
- Single-line: starts with `#`
- Inline: after a command

**Example:**
```bash
# This is a comment
echo "Hello"  # This is an inline comment
```

### Variables

| Syntax     | Description              | Example                       |
|------------|-------------------------|-------------------------------|
| `VAR=val`  | Assign value            | `NAME="Nandan"`               |
| `$VAR`     | Use variable            | `echo $NAME`                  |
| `"$VAR"`   | Preserves spaces        | `echo "$NAME"`                |
| `'$VAR'`   | Literal string (no eval)| `echo '$NAME'` outputs `$NAME`|

### Reading User Input  
**Example:**
```bash
read -p "Enter your name: " NAME
echo "Hello, $NAME!"
```

### Command-line Arguments

| Variable | Meaning                             | Example (demo.sh foo bar)       |
|----------|-------------------------------------|---------------------------------|
| `$0`     | Script name                         | demo.sh                         |
| `$1`     | 1st argument                        | foo                             |
| `$2`     | 2nd argument                        | bar                             |
| `$@`     | All arguments (separate words)      | foo bar                         |
| `$#`     | Number of arguments                 | 2                               |
| `$?`     | Exit code of last command           | 0 (success), non-0 (fail)       |

**Example:**
```bash
echo "Script: $0, Arg1: $1, Arg count: $#"
```

---

## 2. Operators and Conditionals

### String Comparisons

| Operator | Meaning             | Example                                   |
|----------|---------------------|-------------------------------------------|
| =        | Equal               | `[ "$A" = "$B" ]`                         |
| !=       | Not equal           | `[ "$A" != "$B" ]`                        |
| -z       | Is empty            | `[ -z "$A" ]`                             |
| -n       | Is NOT empty        | `[ -n "$A" ]`                             |

### Integer Comparisons

| Operator | Meaning              | Example      |
|----------|----------------------|-------------|
| -eq      | Equal                | `[ $A -eq $B ]`|
| -ne      | Not equal            | `[ $A -ne $B ]`|
| -lt      | Less than            | `[ $A -lt $B ]`|
| -gt      | Greater than         | `[ $A -gt $B ]`|
| -le      | Less or equal        | `[ $A -le $B ]`|
| -ge      | Greater or equal     | `[ $A -ge $B ]`|

### File Test Operators

| Operator | Test                      | Example           |
|----------|---------------------------|-------------------|
| -f       | File exists (is regular)  | `[ -f file ]`     |
| -d       | Is directory              | `[ -d dir ]`      |
| -e       | Exists (any type)         | `[ -e file ]`     |
| -r       | Readable                  | `[ -r file ]`     |
| -w       | Writable                  | `[ -w file ]`     |
| -x       | Executable                | `[ -x script.sh ]`|
| -s       | Size greater than zero    | `[ -s file ]`     |

### if, elif, else Syntax

**Example:**
```bash
if [ $A -gt 0 ]; then
  echo "A is positive"
elif [ $A -eq 0 ]; then
  echo "A is zero"
else
  echo "A is negative"
fi
```

### Logical Operators

| Operator | Description                 | Example                          |
|----------|-----------------------------|----------------------------------|
| `&&`     | AND                         | `[ $A -gt 0 ] && echo "Yes"`     |
| `\|\|`   | OR                          | `[ $A -gt 0 ] || echo "No"`      |
| `!`      | NOT                         | `[ ! -f file ]`                  |

### Case Statements

**Example:**
```bash
case "$1" in
  start) echo "Starting";;
  stop) echo "Stopping";;
  *) echo "Unknown";;
esac
```

---

## 3. Loops

### for Loop

- **List-based:**
    ```bash
    for i in apple banana cherry; do
      echo $i
    done
    ```
- **C-style:**
    ```bash
    for ((i=1; i<=5; i++)); do
      echo $i
    done
    ```

### while Loop

**Example:**
```bash
count=1
while [ $count -le 5 ]; do
  echo $count
  ((count++))
done
```

### until Loop

**Example:**
```bash
count=1
until [ $count -gt 5 ]; do
  echo $count
  ((count++))
done
```

### Loop Control

**break** exits the loop.  
**continue** skips current iteration.

**Example:**
```bash
for i in {1..5}; do
  [ $i -eq 3 ] && continue
  [ $i -eq 4 ] && break
  echo $i
done
```

### Looping Over Files

**Example:**
```bash
for file in *.log; do
  echo "Found $file"
done
```

### Looping Over Command Output

**Example:**
```bash
ls /tmp | while read line; do
  echo "$line"
done
```

---

## 4. Functions

### Defining a Function

```bash
greet() {
  echo "Hello, $1!"
}
```

### Calling a Function

```bash
greet "Nandan"
```

### Passing Arguments to Functions

**Example:**
```bash
sum() {
  echo "$(($1 + $2))"
}
sum 5 6  # Output: 11
```

### Return Values — `return` vs `echo`

- `return N` sets exit code (used with `if`, `$?`).
- Use `echo` to output data.

**Example:**
```bash
get_status() { [ -f "/tmp/flag" ]; return $?; }
if get_status; then echo "Found"; else echo "Not found"; fi

add() { echo "$(($1 + $2))"; }
result=$(add 2 3)
```

### Local Variables

**Example:**
```bash
my_func() {
  local name="local"
  echo $name
}
```

---

## 5. Text Processing Commands

### Grep

| Flag | Description            | Example                     |
|------|------------------------|-----------------------------|
| -i   | Ignore case            | `grep -i "error" file`      |
| -r   | Recursive              | `grep -r "TODO" .`          |
| -c   | Count matches          | `grep -c "foo" file`        |
| -n   | Show line numbers      | `grep -n "main" file`       |
| -v   | Invert match           | `grep -v "ok" file`         |
| -E   | Extended regex         | `grep -E "err|fail" file`   |

### Awk

- Print columns: `awk '{print $2}' file`
- Field separator: `awk -F: '{print $1}' /etc/passwd`
- Pattern: `awk '/error/ {print $0}' log.txt`
- BEGIN/END blocks:
    ```bash
    awk 'BEGIN{print "Head"} {print $1} END{print "Tail"}' file
    ```

### Sed

| Command              | Description                       |
|----------------------|-----------------------------------|
| `s/old/new/g`        | Substitute                       |
| `-i`                 | In-place edit                    |
| `/pattern/d`         | Delete matching lines            |

**Examples:**
```bash
sed 's/yes/no/g' file
sed -i 's/dev/prod/g' *.conf
sed '/^#/d' file  # Remove comments
```

### Cut

| Flag  | Description                      | Example                     |
|-------|----------------------------------|-----------------------------|
| -f    | Field number                     | `cut -f1,3 file`            |
| -d    | Field delimiter                  | `cut -d: -f1 /etc/passwd`   |

### Sort

| Flag  | Description                      | Example                       |
|-------|----------------------------------|-------------------------------|
|       | Alphabetical                     | `sort file`                   |
| -n    | Numerical                        | `sort -n numbers.txt`         |
| -r    | Reverse                          | `sort -r file`                |
| -u    | Unique only                      | `sort -u file`                |

### Uniq

| Flag  | Description                   | Example                   |
|-------|-------------------------------|---------------------------|
| -c    | Prefix lines by count         | `uniq -c file`            |
| -d    | Only duplicated lines         | `uniq -d file`            |

### tr

| Example                      | Description                   |
|------------------------------|-------------------------------|
| `tr 'a-z' 'A-Z' < f`         | Lowercase to uppercase        |
| `tr -d '0-9' < file`         | Delete digits                 |

### wc

| Flag  | Description           | Example                   |
|-------|-----------------------|---------------------------|
| -l    | Line count            | `wc -l file`              |
| -w    | Word count            | `wc -w file`              |
| -c    | Char/byte count       | `wc -c file`              |

### head / tail

| Example                     | Description                   |
|-----------------------------|-------------------------------|
| `head -n 10 file`           | First 10 lines                |
| `tail -n 20 file`           | Last 20 lines                 |
| `tail -f log.txt`           | Follow updates in real time   |

---

## 6. Useful Patterns and One-Liners

| Description                       | Command Example                                                                       |
|------------------------------------|---------------------------------------------------------------------------------------|
| Find & delete files older than N days | `find /tmp/logs -name '*.log' -mtime +7 -delete`                               |
| Count lines in all .log files      | `wc -l *.log`                                                                         |
| Replace "foo" with "bar" in files  | `sed -i 's/foo/bar/g' *.txt`                                                          |
| Check if service is running        | `systemctl is-active nginx || echo "Nginx not running"`                               |
| Monitor disk with alerts           | `df -h | awk '$5 > 80 {print "Low space:", $0}'`                                      |
| Parse CSV column                   | `cut -d',' -f2 data.csv`                                                              |
| Parse JSON (needs jq)              | `jq '.users[] | .name' users.json`                                                    |
| Tail log, filter errors            | `tail -f /var/log/syslog | grep --line-buffered -i error`                             |
| List files by size                 | `ls -lhS`                                                                              |
| Find files containing "TODO"       | `grep -rl "TODO" .`                                                                   |

---

## 7. Error Handling & Debugging

| Feature              | Syntax/Usage                     | Example                             |
|----------------------|----------------------------------|-------------------------------------|
| Exit code            | `$?`                             | `echo $?`                           |
| Explicit exit codes  | `exit 0` (success), `exit 1`     | `exit 1`                            |
| Exit on error        | `set -e`                         | `set -e`                            |
| Unset var as error   | `set -u`                         | `set -u`                            |
| Pipeline fails on error | `set -o pipefail`             | `set -o pipefail`                   |
| Trace execution      | `set -x` (on), `set +x` (off)    | `set -x`                            |
| Trap signals         | `trap 'handler' SIGNAL`          | `trap 'cleanup' EXIT`               |

**Example Block:**
```bash
set -euo pipefail
trap 'echo "Cleaning up..."' EXIT

mycmd || { echo "mycmd failed!"; exit 1; }
```

---

## 8. Bonus — Full Cheat Sheet Reference Table

| Topic               | Key Concept        | Syntax / Example                                 |
|---------------------|-------------------|--------------------------------------------------|
| Shebang             | Interpreter       | `#!/bin/bash`                                    |
| Run script          | Exec permission   | `chmod +x s.sh; ./s.sh`                          |
| Variables           | Assign/use        | `VAR="abc"; echo $VAR`                           |
| Args                | CLI args          | `$0` `$1` `$@`                                   |
| Comments            | Single/Inline     | `# comment` `cmd # inline`                        |
| If/elif/else        | Condition         | `if [ ... ]; then ... elif ... else ... fi`      |
| Loops               | For/While/Until   | `for i in 1 2; do ...; done`, `while ...; do...` |
| Functions           | Def/call/args     | `myf() { ... }`, `myf 2 3`, `$1` `$2`            |
| grep                | Search            | `grep -i "foo" file`                             |
| awk                 | Process col/rows  | `awk -F, '{print $2}' data.csv`                  |
| sed                 | Edit in place     | `sed -i 's/old/new/g' file`                      |
| cut                 | Extract columns   | `cut -d: -f1 /etc/passwd`                        |
| sort                | Sort file         | `sort -n numbers.txt`                            |
| uniq                | Deduplicate       | `sort file | uniq -c`                            |
| tr                  | Translate         | `tr 'a-z' 'A-Z' < file`                          |
| wc                  | Counts            | `wc -l file`                                     |
| head / tail         | Preview           | `head -n 10 log.txt`                             |
| Error/Debug         | set, trap         | `set -euxo pipefail; trap ERR`                   |

---

# Output Samples

### Example: A Shell Script With Arguments, Functions & Error Handling

```bash
#!/bin/bash
set -euo pipefail
trap 'echo "Script ending"' EXIT

greet() {
  local name="$1"
  echo "Hello, $name!"
}

if [ $# -eq 0 ]; then
  echo "Usage: $0 name"
  exit 1
fi

greet "$1"
```

**Output:**
```bash
$ ./myscript.sh World
Hello, World!
Script ending
```

---
