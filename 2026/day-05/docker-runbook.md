# Runbook - Docker Service

## Target Service
**Service:** docker  
**Purpose:** Container runtime  
**Critical:** Yes

### Commands

```bash
# Environment
uname -a
docker version

# Process
ps aux | grep dockerd
systemctl status docker

# Resource Usage
ps -o pid,pcpu,pmem,comm -C dockerd
free -h
docker stats --no-stream

# Disk
df -h /var/lib/docker
docker system df

# Network
ss -tulpn | grep dockerd
docker network ls

# Logs
journalctl -u docker -n 50
docker logs <container-id> --tail 50
```

**Sample Output - Docker Stats:**
```
CONTAINER ID   CPU %   MEM USAGE / LIMIT     MEM %   NET I/O
abc123def456   2.34%   256.5MiB / 7.7GiB    3.25%   1.2MB / 854KB
```

**Sample Output - System DF:**
```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          15        5         4.5GB     2.1GB (46%)
Containers      8         3         1.2GB     800MB (66%)
Local Volumes   12        4         8.3GB     4.1GB (49%)
```

### Findings
- Docker daemon healthy, 3 active containers
- Image storage: 4.5GB (2.1GB reclaimable)
- Containers using moderate resources (3% memory)
- No OOM kills in logs

### If Worsens
1. Clean up unused resources: `docker system prune -a`
2. Check container logs for errors: `docker logs --tail 200 <id>`
3. Restart problematic container: `docker restart <id>`
