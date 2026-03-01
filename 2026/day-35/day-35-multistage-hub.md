# Day 35 – Multi-Stage Builds & Docker Hub

---

## What is a Multi-Stage Build? (Definition)

A **multi-stage build** uses multiple `FROM` statements in a single Dockerfile. Each `FROM` starts a new **stage**. You can copy files between stages using `COPY --from=<stage>`.

The key insight is: **only the LAST stage ends up in the final image**. All intermediate stages (compilers, build tools, source code, caches) are **thrown away**.

> Think of it like making a cake: you use lots of equipment (mixing bowls, beaters, pans) to bake it, but when you serve it, you only put the **finished cake** on the plate — not the dirty dishes.

### Why Does Image Size Matter?

| Problem with large images | Impact |
|--------------------------|--------|
| Slow to push/pull from registry | Longer CI/CD pipelines |
| Large attack surface | More packages = more CVEs |
| Wastes storage in registry | Higher costs |
| Slow container startup in Kubernetes | Pod scheduling delays |

---

## Project Structure

```
day-35/
├── app/
│   ├── main.go              ← Simple Go HTTP server
│   └── go.mod               ← Go module file
├── Dockerfile.single        ← Task 1: Single-stage (fat image)
├── Dockerfile.multistage    ← Task 2: Multi-stage (lean image)
├── Dockerfile.best-practices ← Task 5: Production-ready image
├── day-35-multistage-hub.md ← This file
└── README.md
```

---

## The Go App (`app/main.go`)

A minimal HTTP server with two endpoints:
- `GET /` → Returns a greeting message
- `GET /health` → Health probe (returns `200 ok`)

Go is the perfect language for demonstrating multi-stage builds because:
- The Go toolchain (`golang` image) is **~800 MB**
- A compiled static Go binary is **~6–10 MB**
- The size difference is dramatic and immediately visible

---

## Task 1: The Problem with Large Images

### Single-Stage Dockerfile (`Dockerfile.single`)

```dockerfile
FROM golang:1.22          # Full Go toolchain — ~800 MB base image
WORKDIR /app
COPY app/go.mod ./
RUN go mod download
COPY app/ .
RUN go build -o server .  # Binary compiled here
EXPOSE 8080
CMD ["./server"]
```

### Build & Check Size

```sh
# Build the single-stage image
docker build -f Dockerfile.single -t day35-single:v1 .

# Check its size
docker images day35-single:v1
```

**Expected output:**
```
REPOSITORY      TAG   IMAGE ID       SIZE
day35-single    v1    abc123...      ~860 MB
```

### Why Is It So Big?

The `golang:1.22` base image contains:
- The **Go compiler** (`go build`, `go test`, etc.)
- The **Go standard library** source code
- **Build tools** (gcc, make, git)
- All **build cache** and intermediate files
- The full **Ubuntu/Debian** OS underneath

At runtime, the container only needs the compiled `server` binary (~8 MB) — but it's dragging along **850 MB of build infrastructure it never uses**.

---

## Task 2: Multi-Stage Build

### Multi-Stage Dockerfile (`Dockerfile.multistage`)

```dockerfile
# ── Stage 1: Builder ──────────────────────────────────────────────────────
FROM golang:1.22 AS builder      # Named "builder" for reference later
WORKDIR /app
COPY app/go.mod ./
RUN go mod download
COPY app/ .
# Static binary: CGO_ENABLED=0 = no C libs; -ldflags="-s -w" strips debug info
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

# ── Stage 2: Runtime ──────────────────────────────────────────────────────
FROM alpine:3.19                  # Tiny 7 MB base — just enough OS
WORKDIR /app
COPY --from=builder /app/server . # ← Only copy the binary; leave everything else
EXPOSE 8080
CMD ["./server"]
```

### Build & Compare Sizes

```sh
# Build the multi-stage image
docker build -f Dockerfile.multistage -t day35-multi:v1 .

# Compare both
docker images | grep day35
```

**Expected output:**
```
REPOSITORY      TAG   SIZE
day35-single    v1    ~860 MB   ← entire Go SDK
day35-multi     v1    ~14 MB    ← binary + Alpine only
```

### Size Comparison

| Image | Base | Contains | Size |
|-------|------|----------|------|
| `day35-single:v1` | `golang:1.22` | Go compiler + source + binary | ~860 MB |
| `day35-multi:v1` | `alpine:3.19` | Binary only | ~14 MB |

**Reduction: ~98% smaller** 🎯

### Why Is the Multi-Stage Image So Much Smaller?

> In a multi-stage build, Docker **discards all intermediate stages** when creating the final image. The final image only contains what you explicitly `COPY` into it from previous stages. Since we only copy the compiled binary (~8 MB) into the Alpine base (~7 MB), the entire Go toolchain, all source code, and all build caches are simply **never included** in the published image.

### Key Flags Explained

| Flag | What It Does |
|------|-------------|
| `CGO_ENABLED=0` | Disables C bindings — produces a fully static binary with zero runtime dependencies |
| `GOOS=linux` | Cross-compile for Linux (matters if building on macOS/Windows) |
| `-ldflags="-s"` | Strip symbol table from binary |
| `-ldflags="-w"` | Strip DWARF debug info from binary |
| `AS builder` | Names this stage; used in `COPY --from=builder` |

---

## Task 3: Push to Docker Hub

### What is Docker Hub?

**Docker Hub** is the world's largest public container registry. It's like GitHub, but for Docker images. You push your image once, and anyone (or any server) can pull it with `docker pull`.

### Step-by-Step: Tag & Push

```sh
# Step 1: Log in to Docker Hub
docker login
# Enter your Docker Hub username and password (or Personal Access Token)

# Step 2: Tag the image with your Docker Hub username
# Format: <username>/<repository-name>:<tag>
docker tag day35-multi:v1 nandan29300/day35-goapp:v1

# Also tag as latest
docker tag day35-multi:v1 nandan29300/day35-goapp:latest

# Step 3: Push both tags
docker push nandan29300/day35-goapp:v1
docker push nandan29300/day35-goapp:latest

# Step 4: Verify — pull it back (simulate a fresh machine)
docker rmi nandan29300/day35-goapp:v1   # remove local copy
docker pull nandan29300/day35-goapp:v1  # pull from registry
docker run --rm -p 8080:8080 nandan29300/day35-goapp:v1
```

### Docker Hub Repository Link

> 🔗 `https://hub.docker.com/r/nandan29300/day35-goapp`

### Push Output (What to Expect)

```
The push refers to repository [docker.io/nandan29300/day35-goapp]
3f4a2b1c: Pushed
d8e9f0a1: Pushed
v1: digest: sha256:abc... size: 739
```

Each line is a **layer** being pushed. Layers are cached — if you push the same Alpine base in another image, it won't re-upload.

---

## Task 4: Docker Hub Repository

### After Pushing

1. Visit `https://hub.docker.com/r/nandan29300/day35-goapp`
2. Click **Edit Repository** → Add a description:
   ```
   Day 35 – 90DaysOfDevOps: Go HTTP server built with multi-stage Docker build.
   Demonstrates size reduction from ~860MB (single-stage) to ~14MB (multi-stage).
   ```

### Tags Tab

The **Tags** tab shows all pushed tags with:
- Tag name (`v1`, `latest`)
- Compressed size
- Last pushed date
- OS/Architecture (linux/amd64, linux/arm64)

### Pulling Specific Tags vs `latest`

```sh
# Pull a specific version tag — always gets exactly that build
docker pull nandan29300/day35-goapp:v1

# Pull latest — gets whatever was last tagged "latest"
docker pull nandan29300/day35-goapp:latest
```

**Important:** `latest` is just a tag — it doesn't automatically mean the newest version. You have to manually tag and push `:latest`. In production, **never rely on `latest`** — always pin a specific version tag.

### How Versioning Works

```
nandan29300/day35-goapp:v1       ← first release
nandan29300/day35-goapp:v1.1     ← patch update
nandan29300/day35-goapp:v2       ← breaking change
nandan29300/day35-goapp:latest   ← points to v2 (manually updated)
```

---

## Task 5: Image Best Practices

### Best Practices Dockerfile (`Dockerfile.best-practices`)

```dockerfile
# ── Stage 1: Builder ──────────────────────────────────────────────────────
FROM golang:1.22-alpine3.19 AS builder  # BP1: alpine variant even for builder
RUN apk add --no-cache git              # BP4: one RUN per logical group
WORKDIR /app
COPY app/go.mod ./
RUN go mod download
COPY app/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

# ── Stage 2: Runtime ──────────────────────────────────────────────────────
FROM alpine:3.19                         # BP1: minimal base; BP2: pinned tag

# BP4: Combine RUN commands — each RUN = one image layer
RUN apk add --no-cache ca-certificates \
    && addgroup -S appgroup \
    && adduser  -S appuser -G appgroup

WORKDIR /app
COPY --from=builder /app/server .
RUN chown appuser:appgroup /app/server

USER appuser                             # BP3: run as non-root

EXPOSE 8080
CMD ["./server"]
```

### The 5 Best Practices Explained

#### 1. Minimal Base Image

```sh
# Compare base image sizes
docker pull ubuntu:22.04 && docker images ubuntu:22.04
# ubuntu:22.04  →  ~77 MB

docker pull alpine:3.19 && docker images alpine:3.19
# alpine:3.19   →  ~7 MB

docker pull gcr.io/distroless/static && docker images gcr.io/distroless/static
# distroless/static  →  ~2 MB (Google's minimal image — no shell at all)
```

| Base Image | Size | Has Shell | Use Case |
|-----------|------|-----------|----------|
| `ubuntu:22.04` | ~77 MB | Yes (bash) | Dev/debugging |
| `debian:slim` | ~75 MB | Yes (sh) | General apps |
| `alpine:3.19` | ~7 MB | Yes (sh) | Most production apps |
| `distroless/static` | ~2 MB | ❌ No | Static Go/Rust binaries |
| `scratch` | 0 MB | ❌ No | Fully static binaries only |

#### 2. Don't Run as Root

```dockerfile
# ❌ Bad — default Docker behaviour
# Container runs as root (UID 0)
CMD ["./server"]

# ✅ Good — create a dedicated user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
CMD ["./server"]
```

**Why it matters:** If an attacker exploits your app and gets a shell inside the container, running as root means they could:
- Read/write all files
- Install packages
- Potentially escape to the host

Running as a non-root user limits the blast radius.

```sh
# Verify the running user
docker run --rm day35-best:v1 whoami
# appuser   ✅
```

#### 3. Combine RUN Commands to Reduce Layers

```dockerfile
# ❌ Bad — 3 separate layers
RUN apk update
RUN apk add ca-certificates
RUN adduser -S appuser

# ✅ Good — 1 layer, same result
RUN apk add --no-cache ca-certificates \
    && adduser -S appuser
```

Each `RUN` instruction creates a new layer in the image. Layers add metadata overhead and can't be cleaned up if you do:
```dockerfile
RUN apt-get install something   # layer 1: installs + caches
RUN apt-get clean               # layer 2: tries to clean, but layer 1 still exists!
```
Combining into one `RUN` means the clean happens in the same layer.

#### 4. Use Specific Tags

```dockerfile
# ❌ Bad — unpredictable
FROM alpine:latest
FROM golang:latest

# ✅ Good — reproducible builds
FROM alpine:3.19
FROM golang:1.22-alpine3.19
```

With `latest`, your image might build fine today and break tomorrow when a new version is published.

#### 5. Copy Dependencies Before Code (Layer Cache)

```dockerfile
# ✅ Optimised order — dependencies cached separately from code
COPY go.mod ./
RUN go mod download    # This layer only rebuilds when go.mod changes

COPY . .               # This layer rebuilds on every code change
RUN go build -o server .
```

### Size Before vs After Best Practices

```sh
# Build all three images
docker build -f Dockerfile.single       -t day35-single:v1 .
docker build -f Dockerfile.multistage   -t day35-multi:v1 .
docker build -f Dockerfile.best-practices -t day35-best:v1 .

# Compare
docker images | grep day35
```

| Image | Dockerfile | Size | Notes |
|-------|-----------|------|-------|
| `day35-single:v1` | `Dockerfile.single` | ~860 MB | Full Go SDK included |
| `day35-multi:v1` | `Dockerfile.multistage` | ~14 MB | Binary + Alpine |
| `day35-best:v1` | `Dockerfile.best-practices` | ~14 MB | + non-root, pinned tags |

---

## Essential Commands Reference

```sh
# ── Build ──────────────────────────────────────────────────────────────────
docker build -f Dockerfile.single       -t day35-single:v1 .
docker build -f Dockerfile.multistage   -t day35-multi:v1 .
docker build -f Dockerfile.best-practices -t day35-best:v1 .

# ── Inspect Image Layers ───────────────────────────────────────────────────
docker history day35-multi:v1           # Show all layers and their sizes
docker inspect day35-multi:v1           # Full metadata as JSON

# ── Run Locally ────────────────────────────────────────────────────────────
docker run --rm -p 8080:8080 day35-multi:v1
curl http://localhost:8080              # Test the app
curl http://localhost:8080/health       # Health check

# ── Docker Hub: Tag & Push ─────────────────────────────────────────────────
docker login
docker tag day35-multi:v1 nandan29300/day35-goapp:v1
docker tag day35-multi:v1 nandan29300/day35-goapp:latest
docker push nandan29300/day35-goapp:v1
docker push nandan29300/day35-goapp:latest

# ── Docker Hub: Pull & Verify ──────────────────────────────────────────────
docker rmi nandan29300/day35-goapp:v1   # Remove local copy
docker pull nandan29300/day35-goapp:v1  # Pull from registry
docker run --rm -p 8080:8080 nandan29300/day35-goapp:v1

# ── Cleanup ────────────────────────────────────────────────────────────────
docker rmi day35-single:v1 day35-multi:v1 day35-best:v1
docker system prune                     # Remove all dangling images/containers
```

---

## Points to Remember 📌

1. **Multi-stage builds are the industry standard** for compiled languages (Go, Java, Rust, C++). Never ship the compiler in a production image.

2. **`COPY --from=<stage>`** is the key instruction — it lets you cherry-pick only what you need from a previous stage. The rest is discarded.

3. **`CGO_ENABLED=0`** is mandatory for Go when copying to `alpine` or `scratch`. Without it, the binary has C library dependencies that don't exist in the target image.

4. **Never use `latest` tag in production** — it makes builds non-reproducible. Pin exact versions (`alpine:3.19`, `golang:1.22`).

5. **Running as root in a container is a security risk** — always create a non-root user with `adduser`/`useradd` and switch to it with `USER`.

6. **Each `RUN` instruction = one layer** — combine related commands with `&&` to minimize layer count and size.

7. **Docker Hub is public by default** — if your image contains secrets, keys, or private code, use a **private registry** (Docker Hub private repo, AWS ECR, GitHub Container Registry).

8. **`docker history <image>`** shows you exactly which instructions created which layers and how large each one is — essential for debugging bloated images.

9. **Layer caching speeds up builds** — copy dependency files (`package.json`, `go.mod`, `requirements.txt`) before source code so the expensive "install dependencies" step is only re-run when deps change.

10. **`-ldflags="-s -w"`** strips debug symbols from Go binaries — typically reduces binary size by 25–30% with no runtime impact.

---

## Tips 💡

- Use `docker scout cves <image>` (or `docker scan`) to check your image for known vulnerabilities. Smaller images have fewer packages and fewer CVEs.
- Use **`FROM scratch`** for the absolute smallest Go image (0 byte base) — but your binary must be fully static and you won't have a shell for debugging.
- Use **`DOCKER_BUILDKIT=1`** (or `docker buildx build`) for faster parallel stage builds and better cache management.
- Add a `.dockerignore` file to prevent copying unnecessary files (like `.git`, `node_modules`, `*.md`) into the build context:
  ```
  # .dockerignore
  .git
  *.md
  day-35-compose-advanced.md
  ```
- Use **multi-platform builds** to push images for both `amd64` and `arm64` (Apple Silicon, AWS Graviton):
  ```sh
  docker buildx build --platform linux/amd64,linux/arm64 \
    -t nandan29300/day35-goapp:v1 --push .
  ```
- In CI/CD (GitHub Actions), use `docker/build-push-action` which handles multi-stage builds, caching, and push automatically.

---

## Summary

| Task | What We Did | Key Learning |
|------|-------------|-------------|
| 1 | Single-stage Dockerfile — `golang:1.22` base | Image size ~860 MB; entire SDK ships to production |
| 2 | Multi-stage Dockerfile — builder + alpine | Image size ~14 MB; **98% reduction**; only binary in final image |
| 3 | Tagged and pushed to Docker Hub | `docker tag` + `docker push` + versioning strategy |
| 4 | Explored Docker Hub tags and versioning | Never use `latest` in production; pin specific tags |
| 5 | Applied 5 best practices: minimal base, non-root user, combined layers, pinned tags, layer cache | Production-ready, secure, reproducible image |
