# Day 45 – Docker Build & Push in GitHub Actions

---

## Overview

Today the pipeline does real production work: every push to `main` automatically builds a Docker image, tags it, and ships it to Docker Hub. No manual `docker build` or `docker push` commands — the robot handles it all.

One workflow file was created:

| File | Purpose |
|------|---------|
| `.github/workflows/docker-publish.yml` | Build on every push; push to Docker Hub only on `main` |

The app being containerised is a minimal Node.js/Express service living in `day-45/app/`.

---

## Task 1: Prepare – App & Secrets

### The App

`day-45/app/` contains a lightweight Express server with two endpoints:

| Method | Route | Response |
|--------|-------|----------|
| GET | `/` | JSON greeting with git SHA and build date |
| GET | `/health` | `{ "status": "ok", "version": "1.0.0" }` |

The Dockerfile is **multi-stage** (deps → runtime) with a non-root user — the same production pattern used on Day 36.

### Dockerfile Recap

```dockerfile
# Stage 1 — install only production dependencies
FROM node:20-alpine3.19 AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Stage 2 — lean runtime image
FROM node:20-alpine3.19
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
ARG GIT_SHA=local
ARG BUILD_DATE=local
ENV GIT_SHA=${GIT_SHA} BUILD_DATE=${BUILD_DATE}
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "src/index.js"]
```

**Key decisions:**
- `npm ci --omit=dev` — installs exact locked versions, skips devDependencies
- Two-stage build — final image has no compiler, no npm, no layer bloat
- `ARG` → `ENV` — CI injects the git SHA and build timestamp at build time
- Non-root user — security best practice; reduces blast radius of a compromise
- `HEALTHCHECK` — Docker/Kubernetes knows when the container is actually ready

### Secrets Required

Two secrets must exist in GitHub → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_TOKEN` | A Docker Hub **access token** (not your password) |

How to create a Docker Hub access token:
1. Log in to [hub.docker.com](https://hub.docker.com)
2. Click your avatar → **Account Settings** → **Security** → **Access Tokens**
3. Click **Generate Access Token**
4. Name it `github-actions`, set permission to **Read & Write**
5. Copy the token — add it to GitHub secrets as `DOCKER_TOKEN`

Using an access token instead of your password means:
- You can revoke CI access without changing your password
- Tokens can be scoped to read-only or read-write — principle of least privilege
- Rotating a compromised token doesn't affect your account login

---

## Task 2: Build the Docker Image in CI

### The Workflow File

**File:** `.github/workflows/docker-publish.yml`

```yaml
name: Docker Build & Push

on:
  push:
    branches:
      - main
      - 'feature/**'
  pull_request:
    branches:
      - main
  workflow_dispatch:

env:
  IMAGE_NAME: ${{ secrets.DOCKER_USERNAME }}/day45-cicd-app
```

The trigger fires on:
- Every push to `main` (build **and** push)
- Every push to any `feature/**` branch (build only, no push)
- Every PR targeting `main` (build only, no push)
- `workflow_dispatch` — manual trigger from the Actions tab

### Build Step (always runs)

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: ./day-45/app
    push: ${{ github.ref == 'refs/heads/main' && github.event_name != 'pull_request' }}
    tags: |
      ${{ env.IMAGE_NAME }}:latest
      ${{ env.IMAGE_NAME }}:sha-${{ steps.vars.outputs.short_sha }}
    build-args: |
      GIT_SHA=${{ steps.vars.outputs.short_sha }}
      BUILD_DATE=${{ github.event.head_commit.timestamp }}
    cache-from: type=gha
    cache-to:   type=gha,mode=max
```

**What `docker/setup-buildx-action` does:**  
Installs and activates BuildKit — Docker's next-gen build engine. Required to use `cache-from: type=gha` (GitHub Actions layer cache) and for multi-platform builds.

**Verifying the build step:**  
In the Actions tab → click the run → expand the **Build and push** step. You should see:
```
#5 [deps 1/3] FROM docker.io/library/node:20-alpine3.19
#8 [deps 3/3] RUN npm ci --omit=dev
#12 exporting layers
#13 pushing manifest for docker.io/<user>/day45-cicd-app:latest
```
A green checkmark on this step means the image built successfully.

---

## Task 3: Push to Docker Hub — Two Tags

### Why Two Tags?

| Tag | Format | Purpose |
|-----|--------|---------|
| `latest` | `username/repo:latest` | Always points to the most recent build — easy for `docker pull` |
| Commit SHA | `username/repo:sha-a1b2c3d` | Immutable — pinpoints exactly which code is in the image |

Using only `latest` is risky in production: you can never tell which code version is running. The SHA tag gives you auditability and rollback capability.

### Computing the Short SHA

```yaml
- name: Set short SHA
  id: vars
  run: echo "short_sha=$(echo '${{ github.sha }}' | cut -c1-7)" >> "$GITHUB_OUTPUT"
```

`${{ github.sha }}` is the full 40-character SHA. `cut -c1-7` takes the first 7 characters — the same short hash git shows in `git log --oneline`. The value is written to `$GITHUB_OUTPUT` so subsequent steps can reference it as `${{ steps.vars.outputs.short_sha }}`.

### Docker Hub After Push

On Docker Hub you will see:
```
Repository: <username>/day45-cicd-app
Tags:
  latest      pushed just now
  sha-a1b2c3d pushed just now
```

Each tag points to the same image digest — they are aliases for the same layers.

---

## Task 4: Only Push on Main Branch

### The Condition

```yaml
push: ${{ github.ref == 'refs/heads/main' && github.event_name != 'pull_request' }}
```

This single expression controls whether `docker/build-push-action` pushes:

| Scenario | `github.ref` | `github.event_name` | Push? |
|----------|-------------|---------------------|-------|
| Push to `main` | `refs/heads/main` | `push` | ✅ Yes |
| Push to `feature/x` | `refs/heads/feature/x` | `push` | ❌ No |
| PR to `main` | `refs/heads/main` | `pull_request` | ❌ No |
| Manual dispatch on `main` | `refs/heads/main` | `workflow_dispatch` | ✅ Yes |

The login step uses the same condition:

```yaml
- name: Log in to Docker Hub
  if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_TOKEN }}
```

This means the `DOCKER_TOKEN` secret is **never accessed** on feature branch or PR runs — the credentials are not even passed to the runner. This is the secure approach.

### Testing the Condition

```bash
# 1. Create and push a feature branch
git checkout -b feature/test-ci
echo "# test" >> day-45/app/src/test.txt
git add .
git commit -m "test: verify feature branch does not push"
git push origin feature/test-ci

# Expected result in Actions tab:
# ✅ Build step succeeds (image is built)
# ⏭️  Login step is SKIPPED  
# push: false in build-push step → image NOT pushed to Docker Hub
```

---

## Task 5: Status Badge

The badge shows the current state of the `docker-publish` workflow in your README.

### Badge URL Format

```
https://github.com/<user>/<repo>/actions/workflows/docker-publish.yml/badge.svg
```

### Adding to README

```markdown
[![Docker Build & Push](https://github.com/<user>/github-actions-practice/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/<user>/github-actions-practice/actions/workflows/docker-publish.yml)
```

| Badge state | What it means |
|-------------|--------------|
| ![passing](https://img.shields.io/badge/build-passing-brightgreen) | Last run on `main` was successful — image is live on Docker Hub |
| ![failing](https://img.shields.io/badge/build-failing-red) | Last run failed — check the Actions tab for the error |
| ![no status](https://img.shields.io/badge/build-no%20status-lightgrey) | Workflow has never run (or was renamed) |

---

## Task 6: Pull and Run Locally

### The Full Journey

```
git push origin main
      │
      ▼
GitHub detects push to main
      │
      ▼
Actions runner (ubuntu-latest VM) starts
      │
      ├── checkout code
      ├── compute short SHA
      ├── set up Docker Buildx
      ├── docker/login-action → authenticates to Docker Hub
      ├── docker/build-push-action → builds image using Dockerfile
      │       ├── Stage 1: npm ci (deps layer, cached after first run)
      │       └── Stage 2: copy deps + src, inject ARGs, set user
      ├── push :latest tag    → Docker Hub registry
      ├── push :sha-<7chars>  → Docker Hub registry
      └── write step summary
            │
            ▼
Docker Hub stores the image layers
            │
            ▼
Anyone anywhere can now:
  docker pull <username>/day45-cicd-app:latest
  docker run -p 3000:3000 <username>/day45-cicd-app:latest
            │
            ▼
  curl http://localhost:3000/health
  → { "status": "ok", "version": "1.0.0" }
```

### Pulling and Running

```bash
# Pull the latest image
docker pull <username>/day45-cicd-app:latest

# Run it
docker run -d -p 3000:3000 --name day45-app <username>/day45-cicd-app:latest

# Verify it works
curl http://localhost:3000/health
# {"status":"ok","version":"1.0.0"}

curl http://localhost:3000/
# {"message":"Hello from Day 45 – Docker CI/CD Pipeline!","commit":"a1b2c3d","built":"2026-03-15T..."}

# Pull a specific commit SHA tag (immutable — always the exact same code)
docker pull <username>/day45-cicd-app:sha-a1b2c3d

# Clean up
docker stop day45-app && docker rm day45-app
```

### What Each Tag Is For in Practice

```
Production deployment:
  image: username/day45-cicd-app:sha-a1b2c3d   ← pinned, immutable, safe for prod

Development / quick demo:
  image: username/day45-cicd-app:latest         ← always newest build, convenient
```

Using the SHA tag in a production deployment means you can:
1. **Audit** — know exactly which commit is running in prod
2. **Roll back** — redeploy the previous SHA tag instantly
3. **Compare** — diff two running versions by their SHA

---

## Complete Workflow YAML

```yaml
name: Docker Build & Push

on:
  push:
    branches:
      - main
      - 'feature/**'
  pull_request:
    branches:
      - main
  workflow_dispatch:

env:
  IMAGE_NAME: ${{ secrets.DOCKER_USERNAME }}/day45-cicd-app

jobs:
  docker:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set short SHA
        id: vars
        run: echo "short_sha=$(echo '${{ github.sha }}' | cut -c1-7)" >> "$GITHUB_OUTPUT"

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ./day-45/app
          push: ${{ github.ref == 'refs/heads/main' && github.event_name != 'pull_request' }}
          tags: |
            ${{ env.IMAGE_NAME }}:latest
            ${{ env.IMAGE_NAME }}:sha-${{ steps.vars.outputs.short_sha }}
          build-args: |
            GIT_SHA=${{ steps.vars.outputs.short_sha }}
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
          cache-from: type=gha
          cache-to:   type=gha,mode=max

      - name: Pipeline summary
        run: |
          echo "## Docker CI/CD Summary" >> "$GITHUB_STEP_SUMMARY"
          echo "| Key | Value |"          >> "$GITHUB_STEP_SUMMARY"
          echo "|-----|-------|"          >> "$GITHUB_STEP_SUMMARY"
          echo "| Branch | \`${{ github.ref_name }}\` |" >> "$GITHUB_STEP_SUMMARY"
          echo "| Commit | \`${{ steps.vars.outputs.short_sha }}\` |" >> "$GITHUB_STEP_SUMMARY"
          echo "| Image  | \`${{ env.IMAGE_NAME }}\` |" >> "$GITHUB_STEP_SUMMARY"
          echo "| Pushed | \`${{ github.ref == 'refs/heads/main' && github.event_name != 'pull_request' }}\` |" >> "$GITHUB_STEP_SUMMARY"
```

---

## Key Concepts Summary

| Concept | What It Does |
|---------|-------------|
| `docker/login-action@v3` | Authenticates to Docker Hub using secrets — credentials never appear in logs |
| `docker/setup-buildx-action@v3` | Enables BuildKit: layer caching, multi-platform, better build output |
| `docker/build-push-action@v5` | Builds image from a Dockerfile and optionally pushes to a registry in one step |
| `cache-from: type=gha` | Restores Docker layer cache from GitHub's object store → faster rebuilds |
| `$GITHUB_OUTPUT` | Mechanism to pass values between steps (replaces deprecated `set-output`) |
| `ARG` → `ENV` in Dockerfile | Bakes immutable metadata (commit SHA, build date) into the image at build time |
| Conditional push | `push: ${{ ... }}` — same `build-push-action` runs always; push only happens when the expression evaluates to `true` |
| SHA tag | `sha-a1b2c3d` — immutable pointer to exact code; essential for production rollbacks |
