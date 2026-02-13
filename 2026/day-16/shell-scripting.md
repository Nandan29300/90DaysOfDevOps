# Day 16 – Shell Scripting Basics

---

## 🎯 Challenge & Tasks

**Goal:**  
Start your shell scripting journey — learn the fundamentals every script needs.

**You will:**  
- Understand shebang (`#!/bin/bash`) and why it matters  
- Work with variables, `echo`, and `read`  
- Write basic if-else conditions  

---

## 📄 Task 1: Your First Script

### **Challenge**
- Create a file `hello.sh`
- Add the shebang line `#!/bin/bash` at the top
- Print `Hello, DevOps!` using echo
- Make it executable and run it:  
  ```
  chmod +x hello.sh
  ./hello.sh
  ```

### **Definition/Explanation**
- **Shebang (`#!/bin/bash`):**  
  Tells the OS which interpreter to use to run the script. Without it, the system may try to use the default shell or fail to run the script correctly, especially if executed directly (`./script.sh`).

### **Script: hello.sh**
```bash
#!/bin/bash
echo "Hello, DevOps!"
```

### **Output**
```
Hello, DevOps!
```

**Q: What happens if you remove the shebang line?**  
- If you run it explicitly with `bash hello.sh`, it works.  
- If you run `./hello.sh` without the shebang, you might get an error like "command not found" or your shell may assume `/bin/sh` or another default shell as the interpreter, which may not behave the same as bash.

---

## 📄 Task 2: Variables

### **Challenge**
- Create `variables.sh` with:
  - A variable for your NAME
  - A variable for your ROLE (e.g., "DevOps Engineer")
  - Print: `Hello, I am <NAME> and I am a <ROLE>`
- Try single quotes vs double quotes — what is the difference?

### **Definition/Explanation**
- **Variables:**  
  Store information for use in scripts. No spaces around `=`.
  - Use double quotes to allow variable expansion
  - Single quotes treat everything literally (no expansion)

### **Script: variables.sh**
```bash
#!/bin/bash
NAME="Nandan"
ROLE="DevOps Engineer"
echo "Hello, I am $NAME and I am a $ROLE"
echo 'Hello, I am $NAME and I am a $ROLE'
```

### **Output**
```
Hello, I am Nandan and I am a DevOps Engineer
Hello, I am $NAME and I am a $ROLE
```

**Q: Difference between single and double quotes?**  
Double quotes expand variables, single quotes print literally.

---

## 📄 Task 3: User Input with read

### **Challenge**
- Create `greet.sh` that:
  - Asks the user for their name using `read`
  - Asks for their favourite tool
  - Prints: `Hello <name>, your favourite tool is <tool>`

### **Definition/Explanation**
- **`read` command:** Prompts for and saves user input in a variable.

### **Script: greet.sh**
```bash
#!/bin/bash
read -p "Enter your name: " NAME
read -p "Enter your favourite tool: " TOOL
echo "Hello $NAME, your favourite tool is $TOOL"
```

### **Output**
```
Enter your name: Nandan
Enter your favourite tool: Docker
Hello Nandan, your favourite tool is Docker
```

---

## 📄 Task 4: If-Else Conditions

### **Challenge 1**
- Create `check_number.sh`:
  - Takes a number using `read`
  - Prints whether it is positive, negative, or zero

### **Challenge 2**
- Create `file_check.sh`:
  - Asks for a filename
  - Checks if the file exists using `-f`
  - Prints appropriate message

### **Definition/Explanation**
- **If-Else:**  
  Control structure: allows the script to make decisions.

### **Script: check_number.sh**
```bash
#!/bin/bash
read -p "Enter a number: " NUM
if [ $NUM -gt 0 ]; then
    echo "$NUM is Positive"
elif [ $NUM -lt 0 ]; then
    echo "$NUM is Negative"
else
    echo "$NUM is Zero"
fi
```

### **Output**
```
Enter a number: 6
6 is Positive
```

### **Script: file_check.sh**
```bash
#!/bin/bash
read -p "Enter filename: " FILENAME
if [ -f "$FILENAME" ]; then
    echo "File $FILENAME exists."
else
    echo "File $FILENAME does NOT exist."
fi
```

### **Output**
```
Enter filename: hello.sh
File hello.sh exists.
```

---

## 📄 Task 5: Combine It All

### **Challenge**
- Create `server_check.sh` that:
  - Stores a service name in a variable (e.g., nginx, sshd)
  - Asks: "Do you want to check the status? (y/n)"
  - If y — runs `systemctl status <service>` and prints whether it's active or not
  - If n — prints "Skipped."

### **Script: server_check.sh**
```bash
#!/bin/bash
SERVICE="sshd"
read -p "Do you want to check the status? (y/n): " REPLY
if [ "$REPLY" = "y" ]; then
    STATUS=$(systemctl is-active $SERVICE)
    if [ "$STATUS" = "active" ]; then
        echo "$SERVICE is running."
    else
        echo "$SERVICE is not running."
    fi
else
    echo "Skipped."
fi
```

### **Output**
```
Do you want to check the status? (y/n): y
sshd is running.
```

or

```
Do you want to check the status? (y/n): n
Skipped.
```

---

## 🧾 What I Learned

1. **The shebang line is critical for defining the script interpreter and ensuring portability.**
2. **Variables and user input allow dynamic, flexible scripts — double quotes expand variables, single quotes do not.**
3. **If-else statements enable your scripts to make decisions and automate real-world DevOps checks (services, files, conditions).**

---
