# Runbook - Nginx Web Server

## Target Service
**Service:** nginx  
**Purpose:** Web server / reverse proxy  
**Critical:** Yes

## Commands

### Environment
```bash
uname -a
cat /etc/os-release
```

### Process Check
```bash
ps aux | grep nginx
systemctl status nginx
```

**Sample Output:**
```
● nginx.service - A high performance web server
   Active: active (running) since Mon 2026-01-20 08:00:00 UTC; 2 weeks ago
   PID: 1234 (nginx)
   Tasks: 5 (limit: 4915)
   Memory: 45.2M
```

### CPU/Memory
```bash
ps -o pid,pcpu,pmem,comm -C nginx
free -h
```

**Sample Output:**
```
  PID %CPU %MEM COMMAND
 1234  0.2  0.6 nginx
 1235  0.1  0.3 nginx
 1236  0.1  0.3 nginx
```

### Network
```bash
ss -tulpn | grep nginx
curl -I http://localhost
```

**Sample Output:**
```
tcp   LISTEN 0   511   0.0.0.0:80    0.0.0.0:*   users:(("nginx",pid=1234,fd=6))
tcp   LISTEN 0   511   0.0.0.0:443   0.0.0.0:*   users:(("nginx",pid=1234,fd=7))

HTTP/1.1 200 OK
Server: nginx/1.18.0
```

### Logs
```bash
tail -n 50 /var/log/nginx/access.log
tail -n 50 /var/log/nginx/error.log
```

**Sample Output:**
```
192.168.1.100 - - [03/Feb/2026:10:30:45 +0000] "GET /api/health HTTP/1.1" 200 145
192.168.1.101 - - [03/Feb/2026:10:30:46 +0000] "POST /api/data HTTP/1.1" 201 523
```

### Findings
- Nginx responding normally
- 5 worker processes running (expected)
- Memory usage: 45MB (normal for moderate traffic)
- No error log entries in last 50 lines
- HTTP 200 responses dominating (healthy)

### If Worsens
1. Check upstream backends: `nginx -t`, check upstream logs
2. Increase worker processes if CPU maxed: edit `/etc/nginx/nginx.conf`
3. Enable debug logging: `error_log /var/log/nginx/error.log debug;`
