# Day 34 – Docker Compose: Real-World Multi-Container Apps

---

## What is Docker Compose? (Definition)

**Docker Compose** is a tool for defining and running **multi-container Docker applications** using a single YAML file (`docker-compose.yml`).  
Instead of manually running several `docker run` commands, you describe your entire stack — services, networks, volumes, environment variables — in one file and control it with simple commands.

> Think of it as an **orchestra conductor**: each container is a musician, and `docker-compose.yml` is the score that tells everyone when to start, what to do, and how to talk to each other.

### Key Concepts

| Term | Meaning |
|------|---------|
| **Service** | A container definition in Compose (e.g., `web`, `db`, `redis`) |
| **Image** | The Docker image a service is built from |
| **Build** | Build an image from a local Dockerfile instead of pulling from a registry |
| **Volume** | Persistent storage that survives container removal |
| **Network** | A virtual network that allows containers to communicate |
| **depends_on** | Declare start-order dependencies between services |
| **Healthcheck** | A command run periodically to verify a container is working correctly |
| **Restart Policy** | Rules Docker uses to automatically restart a container |

---

## Project Structure

```
day-34/
├── app/
│   ├── app.py              ← Flask application (connects to DB + Redis)
│   ├── requirements.txt    ← Python dependencies
│   └── Dockerfile          ← Custom image build instructions
├── docker-compose.yml      ← Full 3-service stack definition
├── day-34-compose-advanced.md  ← This file
└── README.md
```

---

## Task 1: Build Your Own App Stack

### Architecture

```
 ┌──────────────────────────────────────────────────┐
 │               day34_frontend network              │
 │   ┌─────────────────────────────────────────┐    │
 │   │     web (Flask)  :5000 → :5000          │    │
 │   └───────────────┬─────────────────────────┘    │
 └───────────────────┼──────────────────────────────┘
                     │
 ┌───────────────────┼──────────────────────────────┐
 │               day34_backend network               │
 │   ┌───────────────▼──────┐  ┌──────────────────┐ │
 │   │  db (PostgreSQL 16)  │  │  redis (Redis 7)  │ │
 │   │  Named Vol: pgdata   │  │  In-memory cache  │ │
 │   └──────────────────────┘  └──────────────────┘ │
 └───────────────────────────────────────────────────┘
```

### Services

| Service | Image / Build | Role | Port |
|---------|--------------|------|------|
| `web` | Built from `./app/Dockerfile` | Flask web app | 5000 |
| `db` | `postgres:16-alpine` | Relational database | internal |
| `redis` | `redis:7-alpine` | Hit counter / cache | internal |

### The Flask App (`app/app.py`)

The app does three things on every `GET /` request:
1. **Increments a hit counter in Redis** using `INCR hits`
2. **Inserts a row** into the `visits` table in PostgreSQL
3. **Returns a JSON response** with both the Redis hit count and Postgres total

```python
@app.route("/")
def index():
    hits  = redis_client.incr("hits")           # Redis counter
    # insert visit + count rows in Postgres …
    return jsonify(message="Hello!", redis_hits=hits, postgres_visits=total)
```

### The Dockerfile (`app/Dockerfile`)

```dockerfile
FROM python:3.12-slim          # Slim base = smaller image
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # Cached layer
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
```

**Why copy `requirements.txt` before the rest of the code?**  
Docker builds images layer by layer. If you copy code + requirements together, every code change re-installs all packages. Copying `requirements.txt` first means the install layer is only re-run when dependencies actually change — faster builds.

### How to Bring It Up

```sh
# Build images and start all services in detached mode
docker compose up --build -d

# Check running containers
docker compose ps

# Test the app
curl http://localhost:5000
# Expected:
# {"message":"Hello from the Flask app!","postgres_visits":1,"redis_hits":1}

# View logs
docker compose logs -f web
```

---

## Task 2: `depends_on` & Healthchecks

### The Problem Without `depends_on`

Without `depends_on`, Docker Compose starts all services simultaneously. The Flask app tries to connect to PostgreSQL before Postgres has finished starting → **connection refused** → app crashes.

### Solution: `depends_on` + `condition: service_healthy`

```yaml
# In docker-compose.yml
web:
  depends_on:
    db:
      condition: service_healthy   # ← App waits until DB is HEALTHY, not just started
```

This is stronger than the basic `depends_on: [db]` which only waits for the container to *start*, not for it to be *ready to accept connections*.

### Healthcheck on the DB Service

```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
    interval: 10s      # Run check every 10 seconds
    timeout: 5s        # If no response in 5s, count as failure
    retries: 5         # After 5 failures → mark container as "unhealthy"
    start_period: 10s  # Don't count failures during first 10s (startup grace)
```

**`pg_isready`** is a built-in Postgres utility that returns exit code `0` when the server is accepting connections and `non-0` otherwise.

### Healthcheck States

| State | Meaning |
|-------|---------|
| `starting` | Container just launched; in `start_period` grace window |
| `healthy` | Last check returned exit code 0 |
| `unhealthy` | Exceeded `retries` consecutive failures |

### Test It

```sh
docker compose down -v
docker compose up --build -d

# Watch health status
docker compose ps
# db will show (healthy) before web starts
```

---

## Task 3: Restart Policies

### What is a Restart Policy?

A restart policy tells Docker what to do when a container **exits** (either because it crashed or was killed).

### The Four Policies

| Policy | Behaviour | Use Case |
|--------|-----------|----------|
| `no` (default) | Never restart automatically | Short-lived scripts / CI jobs |
| `always` | Always restart, even after `docker stop` and daemon reboot | Critical services (DB, proxy) |
| `on-failure` | Restart only if exit code is non-zero | Apps that might crash but should recover |
| `unless-stopped` | Like `always` but respects manual `docker stop` | General-purpose services |

### In Our Compose File

```yaml
db:
  restart: always      # DB must NEVER stay down — always bring it back

web:
  restart: on-failure  # Restart if Flask crashes; don't restart on intentional stop
```

### Test `restart: always` on the DB

```sh
# Find the container ID
docker ps

# Kill the DB container (simulates a crash)
docker kill day34_db

# Watch it come back within seconds
docker compose ps
# day34_db should restart automatically
```

### Test `restart: on-failure` on the Web App

```sh
# A clean stop should NOT cause a restart
docker compose stop web
docker compose ps    # web stays stopped

# But if web crashes (non-zero exit), it WILL restart
```

### When to Use Each

- **`always`** → Databases, message brokers, reverse proxies — anything that must be running 24/7
- **`on-failure`** → Application servers — crash recovery yes, but respect intentional shutdowns
- **`unless-stopped`** → Development environments — restart on reboot, but stop when you `docker stop`
- **`no`** → One-off containers, migration jobs, build containers

---

## Task 4: Custom Dockerfiles in Compose

### Using `build:` Instead of `image:`

```yaml
web:
  build: ./app    # Points to the folder containing the Dockerfile
```

When `build:` is present, Compose builds the image from the Dockerfile and uses it. No need to pre-build or push to a registry.

### Make a Code Change and Rebuild

```sh
# Edit app/app.py — e.g., change the message string
# Then rebuild and restart in ONE command:
docker compose up --build -d

# Only the `web` image is rebuilt; db and redis are untouched
```

### Why This Matters

In development, you want to:
1. Change code
2. See the result immediately

`docker compose up --build` rebuilds only changed images (layer caching) and restarts only affected containers — no need to touch running DB or Redis.

```sh
# Build without starting
docker compose build web

# Rebuild and restart a single service
docker compose up --build -d web
```

---

## Task 5: Named Networks & Volumes

### Named Networks — Why Define Them Explicitly?

By default, Compose creates a single network called `<project>_default`. All services join it and can talk to each other. This is fine for dev, but in production:

- You want **isolation** — the web app should not be able to directly reach the DB from the internet
- You want **clarity** — explicit names make `docker network ls` readable
- You need **separation** — frontend containers vs backend containers

### Our Network Design

```yaml
networks:
  frontend:
    name: day34_frontend   # web service only — could add nginx here
  backend:
    name: day34_backend    # db and redis — NOT reachable from outside

# web joins BOTH networks (it needs to talk to db and redis)
# db and redis join ONLY backend (internal communication only)
```

```sh
docker network ls
# day34_frontend
# day34_backend

docker network inspect day34_backend
# Shows: db and redis connected; web also connected via backend interface
```

### Named Volumes — Persistent Database Storage

```yaml
volumes:
  pgdata:
    name: day34_pgdata

db:
  volumes:
    - pgdata:/var/lib/postgresql/data
```

```sh
# Verify the volume exists
docker volume ls
# day34_pgdata

# Inspect where data is stored on the host
docker volume inspect day34_pgdata
# "Mountpoint": "/var/lib/docker/volumes/day34_pgdata/_data"

# Stop and remove containers — data persists!
docker compose down        # stops and removes containers
docker compose up -d       # restarts — data is still in pgdata volume

# Only this destroys data:
docker compose down -v     # -v flag removes volumes too
```

### Labels

Labels are key-value metadata attached to containers, useful for:
- Filtering: `docker ps --filter "label=com.day34.service=web"`
- Monitoring tools (Prometheus, Portainer) reading service metadata
- CI/CD pipelines tagging builds

```yaml
web:
  labels:
    com.day34.service: "web"
    com.day34.description: "Flask web application"
```

```sh
# Filter containers by label
docker ps --filter "label=com.day34.service=db"
```

---

## Task 6: Scaling (Bonus)

### Try Scaling

```sh
docker compose up --scale web=3 -d
```

### What Happens?

```
Error: ... address already in use
```

**It fails.** Here's why:

### Why Simple Scaling Breaks with Port Mapping

When you define:
```yaml
ports:
  - "5000:5000"
```
You're saying: **"Bind host port 5000 to container port 5000"**.

If you scale to 3 replicas, all 3 containers try to bind to host port `5000` — but a host port can only be bound by **one process at a time**. The 2nd and 3rd replicas fail to start.

### The Fix: Use a Load Balancer

To properly scale, you need a **load balancer** (like Nginx or Traefik) in front:

```
 Internet
    │
    ▼
 Nginx (port 80)          ← single entry point
    │
    ├──► web_1 :5000
    ├──► web_2 :5000
    └──► web_3 :5000
```

In this setup:
- The web service has **NO** `ports:` mapping (internal only)
- Only Nginx exposes port 80 to the host
- Nginx load-balances across the replicas by container name + round-robin DNS

```yaml
# Fixed compose for scaling
web:
  build: ./app
  # No ports: mapping here!
  networks:
    - backend

nginx:
  image: nginx:alpine
  ports:
    - "80:80"
  depends_on:
    - web
```

```sh
# Now scaling works
docker compose up --scale web=3 -d
```

---

## Full `docker-compose.yml` Explained Line by Line

```yaml
services:
  web:
    build: ./app              # Build from app/Dockerfile
    container_name: day34_web
    ports:
      - "5000:5000"           # Map host:container port
    environment:              # Pass env vars to the container
      DB_HOST: db             # "db" resolves via Docker DNS
      DB_NAME: appdb
      DB_USER: appuser
      DB_PASSWORD: apppass
      REDIS_HOST: redis       # "redis" resolves via Docker DNS
    depends_on:
      db:
        condition: service_healthy  # Wait for DB healthcheck to pass
      redis:
        condition: service_started  # Redis starts quickly, no healthcheck needed
    restart: on-failure
    networks:
      - frontend
      - backend
    labels:
      com.day34.service: "web"

  db:
    image: postgres:16-alpine
    container_name: day34_db
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: apppass
    volumes:
      - pgdata:/var/lib/postgresql/data  # Persist DB data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: always           # DB must always be running
    networks:
      - backend
    labels:
      com.day34.service: "db"

  redis:
    image: redis:7-alpine
    container_name: day34_redis
    restart: always
    networks:
      - backend
    labels:
      com.day34.service: "cache"

volumes:
  pgdata:
    name: day34_pgdata        # Explicit name for easy identification

networks:
  frontend:
    name: day34_frontend
  backend:
    name: day34_backend
```

---

## Essential Docker Compose Commands

| Command | What it Does |
|---------|-------------|
| `docker compose up -d` | Start all services in background |
| `docker compose up --build -d` | Rebuild images then start |
| `docker compose down` | Stop and remove containers + networks |
| `docker compose down -v` | Also remove named volumes (data loss!) |
| `docker compose ps` | Show running services and their status |
| `docker compose logs -f <service>` | Follow logs of a service |
| `docker compose exec <svc> <cmd>` | Run command inside a running container |
| `docker compose build <svc>` | Build/rebuild a specific service image |
| `docker compose restart <svc>` | Restart a specific service |
| `docker compose stop <svc>` | Gracefully stop a service |
| `docker compose pull` | Pull latest images for all services |
| `docker compose config` | Validate and view the resolved compose file |
| `docker compose up --scale web=3` | Start 3 replicas of web service |

---

## Points to Remember 📌

1. **`depends_on` alone is NOT enough** — it only waits for the container to *start*, not for the app inside to be *ready*. Always combine with `condition: service_healthy` for databases.

2. **Healthchecks are essential in production** — without them, your app might try to connect to a DB that isn't ready yet and crash silently.

3. **Named volumes persist across `docker compose down`** — only `docker compose down -v` removes them. Never run `-v` in production unless you mean it.

4. **Custom networks give you DNS** — container names resolve automatically on custom networks. On the default bridge they don't.

5. **Isolate your backend network** — databases and caches should never be directly reachable from outside. Put them on an internal-only network.

6. **Use `restart: always` for stateful services** (DB, Redis), `restart: on-failure` for stateless apps.

7. **Copy `requirements.txt` before code in your Dockerfile** — this optimises Docker's layer cache and speeds up rebuilds significantly.

8. **`build:` in Compose replaces `image:` for local apps** — you don't need to manually `docker build` before `docker compose up`.

9. **Port conflicts kill scaling** — you cannot map multiple containers to the same host port. Use a reverse proxy for horizontal scaling.

10. **Environment variables in Compose are plain text** — for production, use Docker secrets or a `.env` file that is **not committed to Git**.

---

## Tips 💡

- Use `docker compose config` before bringing up a stack — it validates the YAML and shows the fully resolved config including environment variable substitution.
- Use `.env` file for secrets:  
  ```
  # .env  (add to .gitignore!)
  DB_PASSWORD=supersecret
  ```
  then in `docker-compose.yml`: `DB_PASSWORD: ${DB_PASSWORD}`
- Use `docker compose exec db psql -U appuser appdb` to get a live DB shell without installing anything on your host.
- Prefix your volume/network names with the project name (e.g., `day34_`) so they don't clash with other Compose projects on the same machine.
- Always use **tagged image versions** (`postgres:16-alpine` not `postgres:latest`) — `latest` can silently break your stack on a fresh pull.

---

## Summary

| Task | What We Did | Key Learning |
|------|-------------|-------------|
| 1 | Built a 3-service Flask + Postgres + Redis stack | Compose ties multiple containers into one runnable unit |
| 2 | Added healthchecks + `depends_on` with `condition: service_healthy` | Apps should wait for services to be *ready*, not just *started* |
| 3 | Configured restart policies | `always` for infra, `on-failure` for apps |
| 4 | Used `build:` to build from a custom Dockerfile | One command (`--build`) to rebuild and redeploy |
| 5 | Defined named networks and volumes with labels | Explicit names, isolation, and persistent storage |
| 6 | Attempted scaling — understood why it fails without a load balancer | Port conflicts; need reverse proxy for true horizontal scale |
