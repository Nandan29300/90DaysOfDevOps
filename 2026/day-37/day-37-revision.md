# Day 37 – Docker Revision: Days 29–36

---

## Self-Assessment Checklist

> ✅ Can do confidently | 🔄 Shaky | ❌ Haven't done

| # | Skill | Status |
|---|-------|--------|
| 1 | Run a container from Docker Hub (interactive + detached) | ✅ Can do confidently |
| 2 | List, stop, remove containers and images | ✅ Can do confidently |
| 3 | Explain image layers and how caching works | ✅ Can do confidently |
| 4 | Write a Dockerfile from scratch with FROM, RUN, COPY, WORKDIR, CMD | ✅ Can do confidently |
| 5 | Explain CMD vs ENTRYPOINT | ✅ Can do confidently |
| 6 | Build and tag a custom image | ✅ Can do confidently |
| 7 | Create and use named volumes | ✅ Can do confidently |
| 8 | Use bind mounts | ✅ Can do confidently |
| 9 | Create custom networks and connect containers | ✅ Can do confidently |
| 10 | Write a docker-compose.yml for a multi-container app | ✅ Can do confidently |
| 11 | Use environment variables and .env files in Compose | ✅ Can do confidently |
| 12 | Write a multi-stage Dockerfile | ✅ Can do confidently |
| 13 | Push an image to Docker Hub | ✅ Can do confidently |
| 14 | Use healthchecks and depends_on | 🔄 Shaky |

---

## Quick-Fire Questions — Answers

### 1. What is the difference between an image and a container?

| | Image | Container |
|--|-------|-----------|
| **What it is** | A read-only, layered template — a blueprint | A running (or stopped) instance of an image |
| **State** | Static — never changes | Has its own writable layer on top |
| **Analogy** | A class definition | An object instantiated from that class |
| **Storage** | Stored in registry / local image cache | Lives on the Docker host while it exists |

```sh
docker images          # list images (templates)
docker ps -a           # list containers (instances)

# One image → many containers
docker run -d --name c1 nginx
docker run -d --name c2 nginx   # same image, two separate containers
```

When a container is removed, its writable layer is gone — but the image remains untouched.

---

### 2. What happens to data inside a container when you remove it?

**It is permanently lost.**

Every container gets a thin **writable layer** on top of the read-only image layers. This layer stores any files the container creates or modifies at runtime. When you run `docker rm`, that writable layer is destroyed.

```sh
docker run --name test alpine sh -c "echo 'hello' > /data.txt"
docker rm test
docker run --name test2 alpine cat /data.txt
# cat: /data.txt: No such file or directory  ← gone!
```

**How to prevent data loss:**
```sh
# Named volume — Docker-managed, persists across containers
docker run -v mydata:/data alpine

# Bind mount — tied to a host directory
docker run -v /host/path:/data alpine
```

---

### 3. How do two containers on the same custom network communicate?

On a **custom bridge network**, Docker provides automatic **DNS resolution** — containers can reach each other using their **container name** as the hostname.

```sh
# Create a custom network
docker network create my-net

# Run two containers on it
docker run -d --name api   --network my-net nginx
docker run -d --name cache --network my-net redis

# "api" can reach "cache" by name:
docker exec api ping cache        # ✅ works — DNS resolves "cache" to its IP
docker exec api curl http://cache # ✅ works
```

**Why the default bridge network doesn't do this:**  
The default `bridge` network has NO built-in DNS. Containers can only communicate via IP address (fragile — IPs can change). Always create a custom network for real apps.

---

### 4. What does `docker compose down -v` do differently from `docker compose down`?

| Command | Stops Containers | Removes Containers | Removes Networks | Removes Named Volumes |
|---------|:---:|:---:|:---:|:---:|
| `docker compose down` | ✅ | ✅ | ✅ | ❌ — volumes kept |
| `docker compose down -v` | ✅ | ✅ | ✅ | ✅ — **volumes destroyed** |

```sh
docker compose down      # safe — database data survives in named volume
docker compose down -v   # ⚠️ DANGER in production — all DB data is gone
```

**Rule:** Never run `docker compose down -v` in production unless you explicitly want to wipe the database. In development it's fine for a clean-slate reset.

---

### 5. Why are multi-stage builds useful?

Multi-stage builds let you use a **large builder image** (with compilers, SDKs, build tools) to compile your app, then copy **only the output** into a **tiny runtime image**. All build tooling is thrown away.

```dockerfile
# Stage 1: Builder — large, has Go compiler (~800 MB)
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o server .

# Stage 2: Runtime — tiny, has only the binary (~14 MB)
FROM alpine:3.19
COPY --from=builder /app/server .
CMD ["./server"]
```

**Benefits:**

| | Without Multi-Stage | With Multi-Stage |
|--|--------------------|-----------------:|
| Image size | ~860 MB | ~14 MB |
| Attack surface | Compiler + tools in prod | Binary only |
| Build secrets leaking | Risk — source in image | Safe — source stays in stage 1 |
| Pull time in CI/CD | Slow | Fast |

---

### 6. What is the difference between `COPY` and `ADD`?

| | `COPY` | `ADD` |
|--|--------|-------|
| Basic file copy | ✅ | ✅ |
| Auto-extract `.tar.gz` into image | ❌ | ✅ |
| Fetch from a URL | ❌ | ✅ |
| Recommended for? | **Everything** (predictable) | Only when you specifically need tar-extract |

```dockerfile
# Always prefer COPY — it does exactly what you expect
COPY ./app /app

# Only use ADD when you need tar extraction
ADD archive.tar.gz /app     # extracts contents into /app

# Don't use ADD for URLs — use RUN curl/wget instead (better layer control)
```

**Rule:** Default to `COPY`. Use `ADD` only when you need the tar auto-extract feature.

---

### 7. What does `-p 8080:80` mean?

```
-p <HOST_PORT>:<CONTAINER_PORT>
-p 8080:80
```

- **`8080`** → port on your **host machine** (laptop/server)
- **`80`** → port the app listens on **inside the container**

```sh
docker run -p 8080:80 nginx
# Now: http://localhost:8080  →  nginx inside container on port 80
```

**Common examples:**

| Flag | Meaning |
|------|---------|
| `-p 3000:3000` | Same port on host and container |
| `-p 8080:80` | Host 8080 maps to container 80 |
| `-p 127.0.0.1:3000:3000` | Bind only to localhost (not exposed to network) |
| No `-p` flag | Container port is unreachable from host (internal only) |

---

### 8. How do you check how much disk space Docker is using?

```sh
docker system df
```

**Example output:**
```
TYPE            TOTAL   ACTIVE   SIZE      RECLAIMABLE
Images          12      3        4.2GB     3.1GB (73%)
Containers      5       2        128MB     64MB (50%)
Local Volumes   4       2        1.3GB     800MB (61%)
Build Cache     -       -        512MB     512MB
```

```sh
# More detail (breakdown per image/container/volume)
docker system df -v

# Free up reclaimable space (dangling images, stopped containers, unused networks)
docker system prune

# Free everything unused (including all unused images, not just dangling)
docker system prune -a

# Free absolutely everything unused including volumes
docker system prune -a --volumes
```

---

## Revisit Weak Spots

### Weak Spot 1: Healthchecks & `depends_on`

**Why shaky:** I understand the concept but mix up the fields and forget `condition: service_healthy` syntax.

**Re-learned:**

```yaml
# docker-compose.yml

services:
  app:
    depends_on:
      db:
        condition: service_healthy   # wait for HEALTHY, not just STARTED
      cache:
        condition: service_started   # started is fine for Redis

  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myuser -d mydb"]
      interval: 10s      # how often to run the check
      timeout: 5s        # how long before it counts as failed
      retries: 5         # failures before marking "unhealthy"
      start_period: 15s  # grace window on first startup
```

**Healthcheck lifecycle:**

```
Container starts
      │
      ▼
  [starting]  ← inside start_period, failures don't count
      │
      ▼
  [healthy]   ← test exits 0  → depends_on: service_healthy condition met → app starts
      │
      ▼  (if test fails retries times)
  [unhealthy] ← Docker marks it unhealthy; compose won't start dependent services
```

**In your own Dockerfile:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
```

**Key insight:** `depends_on: service_healthy` just controls **start order**. It does NOT restart your app if the DB goes unhealthy later. For that you need `restart: on-failure` + retry logic in your app code.

---

### Weak Spot 2: CMD vs ENTRYPOINT

**Why shaky:** I know the theory but forget how they interact when both are set.

**Re-learned:**

```dockerfile
# CMD only — fully overridable
FROM alpine
CMD ["echo", "hello"]
# docker run myimg          → echo hello
# docker run myimg whoami   → whoami  (CMD replaced entirely)


# ENTRYPOINT only — fixed executable
FROM alpine
ENTRYPOINT ["echo"]
# docker run myimg          → echo (empty)
# docker run myimg hello    → echo hello  (args appended to ENTRYPOINT)


# ENTRYPOINT + CMD — the production pattern
FROM alpine
ENTRYPOINT ["echo"]
CMD ["default message"]
# docker run myimg              → echo "default message"  (CMD = default args)
# docker run myimg custom       → echo custom             (CMD overridden)
# docker run --entrypoint sh myimg  → sh                  (ENTRYPOINT overridden)
```

**Mental model:**

```
ENTRYPOINT = the program to always run
CMD        = the default arguments to that program (easily replaced)
```

**Real-world example:**

```dockerfile
# A script that accepts a command argument
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# User can do:
docker run myimg                         # runs entrypoint.sh nginx ...
docker run myimg redis-server            # runs entrypoint.sh redis-server
```

**Rule:** Use `ENTRYPOINT` for the executable, `CMD` for default flags. Only use `CMD` alone for simple apps where you want full flexibility.

---

## Days 29–36 Recap

| Day | Topic | Key Takeaway |
|-----|-------|-------------|
| 29 | Docker Intro | Container = isolated process; image = template; `docker run`, `ps`, `rm` |
| 30 | Dockerfile Basics | FROM, WORKDIR, COPY, RUN, EXPOSE, CMD; layer caching = copy deps before code |
| 31 | Docker Images & Registry | `docker build`, `tag`, `push`, `pull`; Docker Hub; image layers |
| 32 | Volumes & Networking | Named volumes persist data; bind mounts for dev; custom networks = DNS |
| 33 | Docker Compose Basics | `docker-compose.yml`; multi-container in one file; `up`, `down`, `logs` |
| 34 | Compose Advanced | `depends_on` + `service_healthy`; restart policies; `.env` files; named networks |
| 35 | Multi-Stage Builds & Hub | Single-stage ~860 MB vs multi-stage ~14 MB; non-root user; push to Hub |
| 36 | Docker Project | Dockerized real 3-tier app (Node + Postgres + Redis) end-to-end |

---

## Points to Remember 📌

1. **Images are immutable; containers are ephemeral** — data in a container's writable layer is lost on `docker rm`. Always use volumes for anything worth keeping.

2. **Custom networks are mandatory for production** — default bridge has no DNS. Always define named networks in your compose file.

3. **`depends_on: service_healthy` ≠ "app will always connect"** — it controls startup order only. Build retry logic into your app for resilience.

4. **`.dockerignore` is not optional** — without it, `node_modules`, `.git`, `.env` all land in your build context (slow builds, possible secret leaks).

5. **Never use `latest` as a base image tag** — pin exact versions (`alpine:3.19`, `node:20-alpine3.19`) for reproducible builds.

6. **`docker system prune -a`** is your best friend for reclaiming disk space — but never run it on a production host with critical images.

7. **Layer order matters** — copy dependency files (`package.json`, `go.mod`, `requirements.txt`) before source code to maximise cache hits.

8. **`COPY` over `ADD`** — use `COPY` by default; `ADD` only when you specifically need tar auto-extraction.

9. **`down -v` destroys data** — in production, `docker compose down` (without `-v`) is almost always what you want.

10. **Healthchecks protect your stack** — a service that has started is not necessarily ready. Always define healthchecks on stateful services (databases, queues).

---

## Tips 💡

- Run `docker compose config` before `docker compose up` — it validates your YAML and shows you all resolved env vars so you catch mistakes early.
- Use `docker stats` to live-monitor CPU and memory usage of all running containers — great for debugging a slow or memory-leaking container.
- Use `docker exec -it <name> sh` to "SSH into" a container for live debugging — check env vars with `env`, inspect the filesystem, test network with `ping`/`curl`.
- Use `docker inspect <container> | grep IPAddress` to find a container's IP when you need it.
- Tag images with git commit SHA in CI for perfect traceability:  
  `docker build -t myapp:$(git rev-parse --short HEAD) .`
- Use `--no-cache` flag when you suspect a cached layer is causing a stale build:  
  `docker build --no-cache -t myapp:v2 .`
