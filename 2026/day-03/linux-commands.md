````md
# 📘 Day 03 – Linux Commands Cheat Sheet  
**File:** `linux-commands-cheatsheet.md`  

> This cheat sheet is designed for **quick scanning during real troubleshooting**.  
> Each command includes: **what it does + simple example.**

---

# ==============================
# 🔹 1) PROCESS MANAGEMENT
# ==============================

## 1. `ps`
**What:** Show running processes (snapshot).  
**Example:**  
```bash
ps -ef | head
````

## 2. `ps -eo pid,state,cmd`

**What:** Custom view of processes (PID, state, command).

```bash
ps -eo pid,state,cmd | head
```

## 3. `top`

**What:** Real-time process monitor.

```bash
top
```

## 4. `htop`

**What:** User-friendly version of top (if installed).

```bash
htop
```

## 5. `kill`

**What:** Send signal to stop a process.

```bash
kill 1234
```

## 6. `kill -9`

**What:** Force kill a stuck process.

```bash
kill -9 1234
```

## 7. `pkill`

**What:** Kill process by name.

```bash
pkill nginx
```

## 8. `pgrep`

**What:** Find process ID by name.

```bash
pgrep nginx
```

## 9. `nice`

**What:** Start a process with priority.

```bash
nice -n 10 sleep 100
```

## 10. `renice`

**What:** Change priority of running process.

```bash
renice 5 -p 1234
```

## 11. `bg`

**What:** Resume stopped job in background.

```bash
bg %1
```

## 12. `fg`

**What:** Bring background job to foreground.

```bash
fg %1
```

## 13. `jobs`

**What:** List background jobs.

```bash
jobs
```

---

# ==============================

# 🔹 2) FILE SYSTEM COMMANDS

# ==============================

## 14. `pwd`

**What:** Print current working directory.

```bash
pwd
```

## 15. `ls`

**What:** List files.

```bash
ls -lh
```

## 16. `cd`

**What:** Change directory.

```bash
cd /var/log
```

## 17. `cat`

**What:** Show file content.

```bash
cat /etc/hostname
```

## 18. `less`

**What:** View large files page by page.

```bash
less /var/log/syslog
```

## 19. `head`

**What:** Show first lines of file.

```bash
head -n 10 /var/log/syslog
```

## 20. `tail`

**What:** Show last lines of file.

```bash
tail -n 20 /var/log/syslog
```

## 21. `tail -f`

**What:** Live log monitoring.

```bash
tail -f /var/log/syslog
```

## 22. `df -h`

**What:** Disk space usage.

```bash
df -h
```

## 23. `du -sh`

**What:** Folder size.

```bash
du -sh /var/log
```

## 24. `mkdir`

**What:** Create directory.

```bash
mkdir my_project
```

## 25. `rm`

**What:** Delete file.

```bash
rm test.txt
```

## 26. `rm -rf`

**What:** Force delete directory (DANGER).

```bash
rm -rf old_backup/
```

## 27. `cp`

**What:** Copy file.

```bash
cp file1.txt file2.txt
```

## 28. `mv`

**What:** Move or rename file.

```bash
mv app.log app-old.log
```

## 29. `chmod`

**What:** Change file permissions.

```bash
chmod 755 script.sh
```

## 30. `chown`

**What:** Change file owner.

```bash
chown root:root file.txt
```

---

# ==============================

# 🔹 3) NETWORKING & TROUBLESHOOTING

# ==============================

## 31. `ping`

**What:** Check connectivity to a host.

```bash
ping -c 4 google.com
```

## 32. `ip addr`

**What:** Show IP addresses.

```bash
ip addr
```

## 33. `ip route`

**What:** Show default gateway.

```bash
ip route
```

## 34. `ss -tulnp`

**What:** Show listening ports & services.

```bash
ss -tulnp
```

## 35. `netstat -tulnp`

**What:** Older alternative to ss.

```bash
netstat -tulnp
```

## 36. `curl`

**What:** Fetch web page / API.

```bash
curl https://example.com
```

## 37. `curl -I`

**What:** Get only HTTP headers.

```bash
curl -I https://example.com
```

## 38. `dig`

**What:** DNS lookup.

```bash
dig google.com
```

## 39. `traceroute`

**What:** Trace network path to server.

```bash
traceroute google.com
```

---

# ==============================

# 🔹 4) SYSTEM & SERVICE (Bonus – Useful for DevOps)

# ==============================

## 40. `systemctl status`

**What:** Check service status.

```bash
systemctl status nginx
```

## 41. `systemctl start`

**What:** Start a service.

```bash
systemctl start nginx
```

## 42. `systemctl restart`

**What:** Restart service.

```bash
systemctl restart nginx
```

## 43. `uptime`

**What:** Show system load & uptime.

```bash
uptime
```

## 44. `whoami`

**What:** Show current user.

```bash
whoami
```

## 45. `history`

**What:** Show previous commands.

```bash
history | tail
```


```
```
