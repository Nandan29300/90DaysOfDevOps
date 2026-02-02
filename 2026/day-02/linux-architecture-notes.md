# Day 02 --- Linux Processes & systemd (My Notes)

## 1) What is a Process? (Beginner meaning)

-   A **process = a running program** in Linux
-   Example:
    -   When you open Chrome → a process starts
    -   When you run `python app.py` → a process is created
-   Every process has:
    -   **PID (Process ID)** → unique number
    -   **Parent Process (PPID)** → who started it
- PID 1 is special → it’s always the **init / systemd** process on modern Linux.
- On modern Linux, systemd replaced the old init system
- **systemd** manages all services
- system-level systemd - PID 1
- user-level systemd - PID random

Example:

    ps

Output:

    PID   TTY   TIME   CMD
    101   pts/0 00:00  bash
    202   pts/0 00:00  python

- → Here, python is a running process with PID 202.


## 2) Linux Process States (Very Important)

### Running (R)

-   The process is actively using CPU
-   Example: a script doing calculations

Check:

    top
- Look for processes with state R


### Sleeping (S)

-   Process is waiting (for input, file, network, etc.)
-   Most normal processes are in **Sleeping state**

Example:

    ps -eo pid,state,cmd | head
    ps → list processes
    -e → show all processes on the system
    -o pid,state,cmd → show only these columns:
        PID → Process ID
        STATE → Current state of the process
        CMD → The command/program that started the process
    head → show only the first few lines (to make it short)
- So this command lists first few processes with their PID, state, and command.
- You will mostly see S.
- S (STATE) → process is Sleeping → waiting for something (input, CPU, file, etc.)
- I (STATE) → process is Idle → kernel worker process that is currently not active


### Stopped (T)

-   Process is paused (not finished, just stopped)
-   `sleep` - Purpose: Pause/wait for a certain amount of time
-   `fg` - Resume a stopped/background process in the foreground
-   `jobs` - listing stopped/background processes

Example:

    sleep 100
    # Press Ctrl + Z
    ps

To resume:

    fg


### Zombie (Z)

-   Process is finished but still in process table
-   Happens when parent process has not collected it
-   It is **not using CPU**, but still shown

Check:

    ps aux | grep Z


### Dead (X)

-   Process that is completely terminated\
-   You usually don't see this in `ps`


## 3) How to View Processes (Daily Use)

### Command 1 --- List your processes

    ps

### Command 2 --- List all system processes

    ps aux

### Command 3 --- Real-time process monitoring

    top

(Press `q` to exit)

Better alternative:

    htop

(if installed)

## 4) Killing / Managing Processes

Kill a process by PID:

    kill <PID>

Force kill:

    kill -9 <PID>

Find and kill in one command:

    pkill python

## 5) What is systemd?

-   **systemd = service manager of Linux**
-   It starts and manages background services like:
    -   ssh
    -   nginx
    -   docker
    -   mysql

## 6) systemd -- Most Important Commands (Daily Use)

Check service status:

    systemctl status ssh

Start, Stop, Restart services:

    sudo systemctl start nginx
    sudo systemctl stop nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx (Enable on boot)


## 7) Why This is Important for DevOps

-   If a service crashes, you can check it with:

        systemctl status <service>

-   If server is slow, you can check CPU with:

        top

-   If a stuck program is running, you can kill it:

        kill -9 <PID>

→ This helps you **debug real production issues.**


## 8) 5 Daily Linux Commands

1.  `ps aux` → list all processes\
2.  `top` → check CPU & memory usage\
3.  `kill -9 <PID>` → stop bad processes\
4.  `systemctl status <service>` → check service health\
5.  `systemctl restart <service>` → fix crashed services


## 9) systemctl
- systemctl = the command-line tool to talk to systemd
- It lets you check, start, stop, restart, enable, or disable services

Example:

    systemctl status ssh       # Check status of ssh service
    sudo systemctl start nginx # Start nginx
    sudo systemctl stop nginx  # Stop nginx
    sudo systemctl restart nginx # Restart nginx
    sudo systemctl enable nginx # Enable nginx to start at boot
    sudo systemctl disable nginx # Disable nginx at boot

## 10) Types of Services in Linux

1. System services (system-level)

- Managed by systemd for the whole system

- Example: ssh, nginx, docker

    Command: 
        systemctl status <service>

2. User services (user-level)

- Managed by systemd --user for a logged-in user

- Example: gnome-settings-daemon, xdg-desktop-portal

    Command: 
        systemctl --user status

3. Kernel processes / threads

- Managed by Linux kernel, not systemd

- Example: [kworker/...], [kthreadd]

4. Foreground / background processes

- Normal programs started by users in the shell

- Example: python app.py, sleep 100

- Can be stopped with Ctrl+Z and resumed with fg


## 11) Quick Summary Table:

| Term               | Meaning (Simple)                   | Example / Command              |
| ------------------ | ---------------------------------- | ------------------------------ |
| systemd            | Service manager (boss of services) | PID 1, starts ssh/nginx/docker |
| systemctl          | Command to control systemd         | `systemctl status ssh`         |
| System service     | Managed for whole system           | ssh, nginx, docker             |
| User service       | Managed for one user               | gnome-settings-daemon          |
| Kernel process     | Background system thread           | [kworker/...], [kthreadd]      |
| Foreground process | Program running in terminal        | python app.py, sleep 100       |
