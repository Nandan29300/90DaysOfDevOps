# Day 36 – Docker Project: Dockerize a Full Application

---

## Task 1: App Choice — Task Manager REST API

### What I Built and Why

I built a **Task Manager REST API** using **Node.js + Express**.

**Why this app?**
- Realistic — it's the kind of microservice you'd find in any real product
- Demonstrates all three tiers: **API layer** (Express) + **database** (PostgreSQL) + **cache** (Redis)
- Node.js + Alpine gives a clear, measurable multi-stage build benefit
- Covers all challenge requirements: Dockerfile, Compose, volumes, networks, healthchecks, env vars

### Architecture

```
 ┌──────────────────────────────────────────────────────────┐
 │                   day36_frontend network                  │
 │   ┌───────────────────────────────────────────────────┐  │
 │   │   api  (Node.js/Express)   :3000 → :3000          │  │
 │   └──────────────────┬────────────────────────────────┘  │
 └─────────────────────┼────────────────────────────────────┘
                        │
 ┌──────────────────────┼────────────────────────────────────┐
 │                   day36_backend network                    │
 │   ┌───────────────────▼──────┐   ┌──────────────────────┐ │
 │   │  db  (PostgreSQL 16)     │   │  cache  (Redis 7)    │ │
 │   │  Named Vol: day36_pgdata │   │  Cache-aside layer   │ │
 │   └──────────────────────────┘   └──────────────────────┘ │
 └────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Health probe — returns `{"status":"ok"}` |
| GET | `/tasks` | List all tasks (Redis cache-aside, 30s TTL) |
| POST | `/tasks` | Create a task `{"title":"Buy milk"}` |
| PATCH | `/tasks/:id` | Toggle done `{"done":true}` |
| DELETE | `/tasks/:id` | Delete a task |

### Cache-Aside Pattern (Redis)

```
Client → GET /tasks
           │
           ├── Cache hit?  → return JSON from Redis (fast, ~1ms)
           │
           └── Cache miss? → query PostgreSQL → store in Redis (TTL 30s) → return
```

On any write (POST/PATCH/DELETE), the cache key `tasks:all` is **invalidated** so the next read is always fresh.

---

## Project Structure

```
day-36/
├── app/
│   ├── src/
│   │   └── index.js          ← Express API (routes, DB, Redis logic)
│   ├── package.json          ← Dependencies
│   ├── Dockerfile            ← Multi-stage build
│   ├── .dockerignore         ← Exclude unnecessary files from build context
│   └── README.md             ← App-level quickstart
├── docker-compose.yml        ← Full 3-service stack
├── .env                      ← Environment variables (gitignored!)
├── .gitignore
├── day-36-docker-project.md  ← This file
└── README.md
```

---

## Task 2: The Dockerfile (with comments)

```dockerfile
# ── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine3.19 AS deps

WORKDIR /app

# Copy package files FIRST — Docker layer cache optimisation:
# npm ci only reruns when package.json changes, not on every code edit
COPY package.json package-lock.json* ./

# Install only production dependencies (skip devDependencies like nodemon)
RUN npm ci --omit=dev


# ── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM node:20-alpine3.19

# Best Practice: non-root user — never run app processes as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy ONLY node_modules from the deps stage
# The full Node.js compiler/npm toolchain stays behind in stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY src/ ./src/

# Fix ownership so appuser can read/execute files
RUN chown -R appuser:appgroup /app

# Switch to non-root user for all subsequent commands
USER appuser

EXPOSE 3000

CMD ["node", "src/index.js"]
```

### Why Two Stages for Node.js?

Unlike Go (which produces a single static binary), Node.js needs `node_modules`. The two-stage approach still helps because:
- **Stage 1** has `npm` and build tools (for native addons like `bcrypt`, `sharp`)
- **Stage 2** only has the installed modules — no `npm`, no build tools
- Result: slightly smaller image, and the compiler is never in the final layer

### Build & Size Check

```sh
# Build the image
docker build -t day36-taskapi:v1 ./app

# Check size
docker images day36-taskapi:v1
# REPOSITORY        TAG   SIZE
# day36-taskapi     v1    ~145 MB  (node:20-alpine + node_modules only)

# Compare with full node image base:
# node:20 (debian) + same modules ≈ ~380 MB
```

| Base | Size |
|------|------|
| `node:20` (Debian) | ~380 MB |
| `node:20-alpine3.19` | ~145 MB |
| Reduction | **~62% smaller** |

---

## Task 3: Docker Compose (`docker-compose.yml`)

### Full File Annotated

```yaml
services:

  api:
    build:
      context: ./app          # Look for Dockerfile inside ./app/
    container_name: day36_api
    image: nandan29300/day36-taskapi:latest
    ports:
      - "${PORT:-3000}:3000"  # Use PORT from .env; fallback to 3000
    env_file: .env            # Inject all variables from .env
    depends_on:
      db:
        condition: service_healthy   # App waits for DB healthcheck to pass
      cache:
        condition: service_started   # Redis starts in <1s, no healthcheck needed
    restart: on-failure
    networks:
      - frontend
      - backend

  db:
    image: postgres:16-alpine
    container_name: day36_db
    env_file: .env
    volumes:
      - pgdata:/var/lib/postgresql/data  # Data survives container removal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskuser -d taskdb"]
      interval: 10s     # Check every 10s
      timeout: 5s       # Fail if no response within 5s
      retries: 5        # Unhealthy after 5 consecutive failures
      start_period: 15s # Grace window at startup
    restart: always
    networks:
      - backend         # db is NOT on frontend — only api can reach it

  cache:
    image: redis:7-alpine
    container_name: day36_redis
    restart: always
    networks:
      - backend

volumes:
  pgdata:
    name: day36_pgdata

networks:
  frontend:
    name: day36_frontend
  backend:
    name: day36_backend   # Isolated — db and redis unreachable from outside
```

### The `.env` File

```sh
# .env  (never commit to Git!)
PORT=3000
DB_HOST=db
DB_PORT=5432
DB_NAME=taskdb
DB_USER=taskuser
DB_PASSWORD=taskpass
REDIS_HOST=redis
POSTGRES_DB=taskdb
POSTGRES_USER=taskuser
POSTGRES_PASSWORD=taskpass
```

Using `.env` + `env_file:` means:
- No hardcoded credentials in `docker-compose.yml` (safe to commit)
- Easy to override for different environments (dev / staging / prod)
- CI/CD pipelines inject these as secrets — never touch the file

### Bring It Up & Verify

```sh
# Build and start all services
docker compose up --build -d

# Check status — wait for db to show (healthy)
docker compose ps

# Follow logs
docker compose logs -f api

# Test the API
curl http://localhost:3000/health
# {"status":"ok"}

curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Docker"}'
# {"id":1,"title":"Learn Docker","done":false,"created_at":"..."}

curl http://localhost:3000/tasks
# {"source":"db","tasks":[{"id":1,"title":"Learn Docker","done":false,...}]}

# Second call — served from Redis cache
curl http://localhost:3000/tasks
# {"source":"cache","tasks":[...]}

curl -X PATCH http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'
# {"id":1,"title":"Learn Docker","done":true,...}

curl -X DELETE http://localhost:3000/tasks/1
# {"message":"Task deleted"}
```

### Data Persistence Test

```sh
# Stop and remove containers (keep volumes)
docker compose down

# Start again
docker compose up -d

# Data is still there!
curl http://localhost:3000/tasks
# {"source":"db","tasks":[...same data...]}

# ONLY this destroys data:
docker compose down -v   # -v removes volumes too
```

---

## Task 4: Ship It — Tag & Push to Docker Hub

```sh
# Log in to Docker Hub
docker login

# Build with the Hub tag directly
docker build -t nandan29300/day36-taskapi:v1 ./app
docker build -t nandan29300/day36-taskapi:latest ./app

# OR tag an existing local image
docker tag day36-taskapi:v1 nandan29300/day36-taskapi:v1
docker tag day36-taskapi:v1 nandan29300/day36-taskapi:latest

# Push both tags
docker push nandan29300/day36-taskapi:v1
docker push nandan29300/day36-taskapi:latest
```

### Docker Hub Link

> 🔗 **`https://hub.docker.com/r/nandan29300/day36-taskapi`**

### Tags

| Tag | Description |
|-----|-------------|
| `v1` | Initial release — Node.js Task API |
| `latest` | Points to v1 |

---

## Task 5: Test the Whole Flow (Fresh Pull)

```sh
# 1. Nuke everything local
docker compose down -v
docker rmi nandan29300/day36-taskapi:latest

# 2. Pull from Docker Hub
docker pull nandan29300/day36-taskapi:latest

# 3. Run using compose (api image comes from Hub, db and redis from their registries)
docker compose up -d

# 4. Verify
curl http://localhost:3000/health
# {"status":"ok"}  ✅

curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Fresh pull test"}'
# ✅ Task created — full flow works from Docker Hub image
```

---

## Challenges Faced & How I Solved Them

### Challenge 1: App starts before DB is ready

**Problem:** Node.js app tried to connect to PostgreSQL immediately on startup, before Postgres finished initializing → `ECONNREFUSED`.

**Solution:**
1. Added `depends_on` with `condition: service_healthy` in Compose
2. Added a retry loop in `initDB()` — if the DB connection fails, wait 2 seconds and try again (up to 10 times)

```js
async function initDB() {
  let retries = 10;
  while (retries--) {
    try {
      await pool.query("CREATE TABLE IF NOT EXISTS tasks (...)");
      return;
    } catch (err) {
      console.log(`DB not ready, retrying… (${retries} left)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
```

Both `depends_on: service_healthy` and the retry loop are needed because healthcheck only guarantees Postgres *accepts connections*, not that it's fully initialized for your specific DB/user.

---

### Challenge 2: Cache serving stale data after writes

**Problem:** After creating/updating/deleting a task, the `GET /tasks` endpoint still returned old data from Redis.

**Solution:** Added cache invalidation on every write operation:

```js
await cache.del("tasks:all");  // force next read to go to DB
```

This is the **cache-aside** (lazy-loading) pattern — the cache is only populated on reads, and cleared on writes.

---

### Challenge 3: `.env` file accidentally in build context

**Problem:** `COPY . .` in Dockerfile would copy `.env` (with passwords) into the image layer — a serious security risk.

**Solution:** Added `.env` and `.env.*` to `.dockerignore`:
```
.env
.env.*
```
Environment variables are passed at **runtime** via `env_file:` in Compose, never baked into the image.

---

## Final Image Size

```sh
docker images | grep day36
# REPOSITORY                   TAG      SIZE
# nandan29300/day36-taskapi    v1       ~145 MB
# nandan29300/day36-taskapi    latest   ~145 MB
```

Breakdown:
- `node:20-alpine3.19` base: ~60 MB
- `node_modules` (express, pg, redis, dotenv): ~85 MB
- App source code (`src/index.js`): <1 MB

---

## `.dockerignore` Explained

```
.git            ← Never needed in image; can be large
node_modules    ← Rebuilt inside container (via npm ci in stage 1)
*.log           ← No logs in image
.env            ← SECRETS — never in image!
*.md            ← Docs not needed at runtime
.DS_Store       ← macOS junk
```

Without `.dockerignore`, the entire `node_modules` folder (tens of thousands of files) would be sent to the Docker daemon as build context → slow builds.

---

## Points to Remember 📌

1. **`depends_on: condition: service_healthy`** alone isn't enough — always add a retry loop in your app code too. Healthchecks confirm the server started; your app's logic confirms it's usable.

2. **Never bake secrets into Docker images** — use `.env` + `env_file:` in Compose, or Docker secrets. Add `.env` to both `.gitignore` AND `.dockerignore`.

3. **`.dockerignore` is as important as `.gitignore`** — omitting it can add hundreds of MB to the build context and accidentally expose secrets.

4. **Cache invalidation is the hardest part of caching** — always delete the cache key on writes (POST/PATCH/DELETE), or your reads will return stale data indefinitely.

5. **The `image:` key in Compose serves double duty** — it names the locally built image AND is the tag used when you `docker push`. This keeps build and push in sync.

6. **Network isolation matters in production** — `db` and `cache` are on `backend` only. They are unreachable from the host or any container not explicitly on that network.

7. **`npm ci --omit=dev`** is better than `npm install` in Docker — it installs exactly what's in `package-lock.json` (reproducible) and skips dev tools.

8. **Copy `package.json` before source code** — Docker caches the `npm ci` layer. If you copy everything at once, a one-line code change forces a full `npm ci` re-run.

9. **`restart: always` for DB/cache, `restart: on-failure` for app** — database must survive host reboots; the app should restart on crashes but respect intentional stops.

10. **Tag images with versions, not just `latest`** — `nandan29300/day36-taskapi:v1` lets you roll back. `latest` alone means you can never go back to a previous working build.

---

## Tips 💡

- Use `docker compose exec db psql -U taskuser taskdb` to get a live DB shell without installing psql on your host.
- Use `docker compose exec cache redis-cli` to inspect Redis keys:
  ```sh
  keys *           # list all keys
  get tasks:all    # inspect the cached JSON
  ttl tasks:all    # see remaining TTL in seconds
  ```
- Add `HEALTHCHECK` to your own Dockerfile too:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -qO- http://localhost:3000/health || exit 1
  ```
- Use `docker compose config` to validate your compose file and see all resolved env vars before bringing the stack up.
- In CI/CD (GitHub Actions), use this pattern to build and push:
  ```yaml
  - uses: docker/build-push-action@v5
    with:
      context: ./app
      push: true
      tags: nandan29300/day36-taskapi:${{ github.sha }},nandan29300/day36-taskapi:latest
  ```

---

## Summary

| Task | Done | Key Achievement |
|------|------|----------------|
| 1 | ✅ Chose Node.js Express + PostgreSQL + Redis | Realistic 3-tier app covering API, DB, and cache |
| 2 | ✅ Multi-stage Dockerfile with non-root user + `.dockerignore` | ~145 MB image (vs ~380 MB on Debian base); secrets excluded |
| 3 | ✅ Full Compose stack — healthchecks, volumes, networks, `.env` | `service_healthy` dependency; isolated `backend` network |
| 4 | ✅ Tagged and pushed to Docker Hub | `nandan29300/day36-taskapi:v1` + `latest` |
| 5 | ✅ Fresh pull test — works end-to-end from Hub image | Confirmed: remove local → pull from Hub → `compose up` → API works |
