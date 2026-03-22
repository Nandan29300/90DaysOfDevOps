# Day 48 – GitHub Actions Project: End-to-End CI/CD Pipeline

---

## Overview

This is the GitHub Actions capstone — everything from Days 40–47 (workflows, triggers, secrets, Docker builds, reusable workflows, cron, `workflow_call`) combined into one cohesive production-style pipeline.

### What Was Built

A **Node.js/Express Task API** with:
- Three endpoints: `/health`, `/`, `/tasks`
- A self-contained test suite (`tests/test.js`) — no test framework, exits 0/1
- A multi-stage Dockerfile (deps → runtime, non-root user, HEALTHCHECK)

### Workflow Architecture

```
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                          REUSABLE WORKFLOWS                              │
 │  reusable-build-test.yml          reusable-docker.yml                   │
 │  ┌──────────────────────┐         ┌────────────────────────────────┐    │
 │  │ inputs: node_version │         │ inputs: image_name, tag        │    │
 │  │         run_tests    │         │         sha_tag, push          │    │
 │  │ outputs: test_result │         │ secrets: docker_username/token │    │
 │  └──────────────────────┘         │ outputs: image_url             │    │
 │                                   │ + Trivy security scan          │    │
 │                                   └────────────────────────────────┘    │
 └──────────────────────────────────────────────────────────────────────────┘

 ┌───────────────────────────────────────────────────────────────────────────┐
 │                          CALLER PIPELINES                                 │
 │                                                                           │
 │  PR opened/updated           Push to main              Every 12 hours    │
 │  ┌─────────────────┐         ┌──────────────────────────────────────┐    │
 │  │  pr-pipeline    │         │  main-pipeline                       │    │
 │  │  ─────────────  │         │  ───────────                         │    │
 │  │  build-test ✅  │         │  build-test ✅                        │    │
 │  │  pr-comment ✅  │         │      │ needs                         │    │
 │  │  (no Docker!)   │         │  docker push ✅                      │    │
 │  └─────────────────┘         │      │ needs                         │    │
 │                               │  deploy (env: production) ✅         │    │
 │                               └──────────────────────────────────────┘    │
 │                                                                           │
 │                               ┌──────────────────────────────────────┐   │
 │                               │  health-check                        │   │
 │                               │  pull → run → curl → report → clean  │   │
 │                               └──────────────────────────────────────┘   │
 └───────────────────────────────────────────────────────────────────────────┘
```

### Workflow Files

| File | Trigger | Purpose |
|------|---------|---------|
| `reusable-build-test.yml` | `workflow_call` | Install deps, run tests, output `test_result` |
| `reusable-docker.yml` | `workflow_call` | Build image, push to Docker Hub, Trivy scan, output `image_url` |
| `pr-pipeline.yml` | `pull_request` → `main` | Build & test only — no Docker push |
| `main-pipeline.yml` | `push` → `main` | build-test → Docker push → deploy (3-stage chain) |
| `health-check.yml` | `schedule` every 12h + `workflow_dispatch` | Pull image, run container, curl `/health`, report |

---

## Task 1: The App

### Endpoints

| Method | Route | Response |
|--------|-------|---------|
| GET | `/health` | `{ "status": "ok", "version": "1.0.0", "commit": "<sha>" }` |
| GET | `/` | `{ "message": "Day 48 – GitHub Actions Capstone", "env": "..." }` |
| GET | `/tasks` | JSON array of tasks |

### Test Suite (`tests/test.js`)

No test framework — pure Node.js with `http.createServer`. Runs unit checks and integration checks against a locally spun-up server on an ephemeral port:

```
=== Unit Tests ===
  ✅  app module is an Express instance
  ✅  NODE_ENV defaults to development

=== Integration Tests ===
  ✅  GET /health returns 200
  ✅  GET /health body.status === "ok"
  ✅  GET /health body.version is a string
  ✅  GET / returns 200
  ✅  GET / body.message contains "Day 48"
  ✅  GET /tasks returns 200
  ✅  GET /tasks returns an array
  ✅  GET /tasks has at least one item
  ✅  each task has id, title, done

=== Results: 9 passed, 0 failed ===
```

`process.exit(FAIL > 0 ? 1 : 0)` — makes the CI job red if any test fails.

### Dockerfile

Multi-stage build — same pattern as Days 36 and 45:
- Stage 1 (`deps`): `npm ci --omit=dev` on `node:20-alpine3.19`
- Stage 2 (runtime): copy `node_modules` + `src/`, non-root user, `HEALTHCHECK`, `ARG`-injected metadata

---

## Task 2: Reusable Build & Test Workflow

**File:** `.github/workflows/reusable-build-test.yml`

```yaml
on:
  workflow_call:
    inputs:
      node_version: { type: string, default: '20' }
      run_tests:    { type: boolean, default: true }
    outputs:
      test_result:
        value: ${{ jobs.build-test.outputs.test_result }}
```

### Key Design Points

**`cache: npm` with `cache-dependency-path`:**
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ${{ inputs.node_version }}
    cache: npm
    cache-dependency-path: day-48/app/package-lock.json
```
This caches `~/.npm` keyed on `package-lock.json` — subsequent runs skip the full `npm ci` download.

**Conditional test step:**
```yaml
- name: Run tests
  if: inputs.run_tests == true
  run: |
    if node tests/test.js; then
      echo "test_result=passed" >> "$GITHUB_OUTPUT"
    else
      echo "test_result=failed" >> "$GITHUB_OUTPUT"
      exit 1
    fi
```

The `if:` condition means the PR pipeline can call this workflow with `run_tests: false` during a "build-only" check without changing anything else.

---

## Task 3: Reusable Docker Build & Push Workflow

**File:** `.github/workflows/reusable-docker.yml`

```yaml
on:
  workflow_call:
    inputs:
      image_name: { type: string, required: true }
      tag:        { type: string, required: true }
      sha_tag:    { type: string, default: '' }
      push:       { type: boolean, default: true }
    secrets:
      docker_username: { required: true }
      docker_token:    { required: true }
    outputs:
      image_url:
        value: ${{ jobs.docker.outputs.image_url }}
```

### Dynamic Tag List

```bash
TAGS="${{ inputs.image_name }}:${{ inputs.tag }}"
if [ -n "${{ inputs.sha_tag }}" ]; then
  TAGS="${TAGS},${{ inputs.image_name }}:${{ inputs.sha_tag }}"
fi
echo "tags=${TAGS}" >> "$GITHUB_OUTPUT"
```

This allows the caller to always get `latest` and optionally also `sha-a1b2c3d` without hardcoding.

### Trivy Security Scan (Brownie Points)

```yaml
- name: Scan image with Trivy
  uses: aquasecurity/trivy-action@0.20.0
  with:
    image-ref: '${{ inputs.image_name }}:${{ inputs.tag }}'
    format: 'table'
    exit-code: '1'
    ignore-unfixed: true
    severity: 'CRITICAL'
  continue-on-error: true
```

`exit-code: '1'` — Trivy fails the step if any CRITICAL CVE is found.  
`continue-on-error: true` — on first adoption, this prevents blocking the entire pipeline while the team establishes a baseline. Remove `continue-on-error` once all CVEs are addressed.

The scan report is uploaded as an artifact (`trivy-report-<run-number>`) for 14 days so engineers can review CVEs without re-running the pipeline.

---

## Task 4: PR Pipeline

**File:** `.github/workflows/pr-pipeline.yml`

```yaml
jobs:
  build-test:
    uses: ./.github/workflows/reusable-build-test.yml
    with:
      node_version: '20'
      run_tests: true

  pr-comment:
    needs: build-test
    steps:
      - run: echo "PR checks passed for branch: ${{ github.head_ref }}"
```

### What Runs on a PR (and what doesn't)

| Step | Runs on PR? |
|------|------------|
| Install dependencies | ✅ |
| Run tests | ✅ |
| Build Docker image | ❌ |
| Push to Docker Hub | ❌ |
| Deploy | ❌ |

This is intentional: PRs validate the code is correct. Building and pushing a Docker image for every PR would waste registry storage and build minutes.

**Testing it:**
```bash
git checkout -b feature/new-endpoint
# make a change
git push origin feature/new-endpoint
# open a PR → pr-pipeline.yml fires
# Check Actions tab: only build-test and pr-comment jobs appear
# No Docker build, no image in Docker Hub
```

---

## Task 5: Main Branch Pipeline

**File:** `.github/workflows/main-pipeline.yml`

```yaml
jobs:
  build-test:
    uses: ./.github/workflows/reusable-build-test.yml
    with: { node_version: '20', run_tests: true }

  docker:
    needs: build-test
    uses: ./.github/workflows/reusable-docker.yml
    with:
      image_name: ${{ secrets.DOCKER_USERNAME }}/day48-capstone-app
      tag: latest
      push: true
    secrets:
      docker_username: ${{ secrets.DOCKER_USERNAME }}
      docker_token:    ${{ secrets.DOCKER_TOKEN }}

  deploy:
    needs: docker
    environment: production
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying image ${{ needs.docker.outputs.image_url }} to production"
```

### The Three-Stage Chain

```
build-test ──✅──▶ docker ──✅──▶ deploy
    │                  │               │
tests pass        push + scan     simulated deploy
                  to Docker Hub   (environment: production)
```

**`needs:` dependency rules:**
- If `build-test` fails → `docker` is skipped → `deploy` is skipped
- If `docker` fails → `deploy` is skipped
- All three must succeed for a green pipeline

### `environment: production`

Setting `environment: production` in the deploy job:
1. Shows "production" as a protected gate in the Actions UI
2. Enables environment-scoped secrets and variables (separate from repo secrets)
3. Allows "Required reviewers" in repo Settings → Environments — the deploy job pauses and waits for a human to approve before executing

---

## Task 6: Scheduled Health Check

**File:** `.github/workflows/health-check.yml`

```yaml
on:
  schedule:
    - cron: '0 */12 * * *'   # 00:00 and 12:00 UTC
  workflow_dispatch:
```

### Health Check Flow

```
pull latest image
       │
  docker run -d -p 3000:3000
       │
  wait up to 50s (retry loop)
       │
  curl http://localhost:3000/health
       │
  HTTP 200 + body.status == "ok"?
       ├── yes → ✅ PASSED → write summary
       └── no  → ❌ FAILED → exit 1
       │
  docker stop + docker rm  (always, even on failure)
```

### Step Summary Output

```markdown
## Health Check Report
- **Image:**  `username/day48-capstone-app:latest`
- **Status:** PASSED
- **Time:**   Sun Mar 15 12:00:00 UTC 2026
- **Trigger:** schedule
```

This renders in the GitHub Actions run summary page as a formatted card — visible to the team without clicking into individual log lines.

---

## Task 7: Badges & Architecture

### Status Badges for README

```markdown
[![PR Pipeline](https://github.com/<user>/github-actions-capstone/actions/workflows/pr-pipeline.yml/badge.svg)](...)
[![Main Pipeline](https://github.com/<user>/github-actions-capstone/actions/workflows/main-pipeline.yml/badge.svg)](...)
[![Health Check](https://github.com/<user>/github-actions-capstone/actions/workflows/health-check.yml/badge.svg)](...)
```

### Full Pipeline Flow

```
Developer pushes a feature branch
        │
        ▼ (on: pull_request)
  pr-pipeline.yml
    └─▶ reusable-build-test.yml
          ├── npm ci
          ├── node tests/test.js
          └── output: test_result=passed
    └─▶ pr-comment: "PR checks passed for branch: feature/x"
        (no Docker build — keeps PRs fast and cheap)

Developer merges PR → push to main
        │
        ▼ (on: push → main)
  main-pipeline.yml
    └─▶ Job 1: reusable-build-test.yml
          └── tests pass → test_result=passed
    └─▶ Job 2: reusable-docker.yml  (needs: build-test)
          ├── docker login (secrets)
          ├── build image (multi-stage Dockerfile)
          ├── push :latest + :sha-a1b2c3d
          ├── Trivy scan (CRITICAL CVE check)
          └── output: image_url=username/day48-capstone-app:latest
    └─▶ Job 3: deploy  (needs: docker) (environment: production)
          └── "Deploying image username/day48-capstone-app:latest to production"

Every 12 hours (UTC 00:00 and 12:00)
        │
        ▼ (on: schedule)
  health-check.yml
    ├── docker pull latest
    ├── docker run -d -p 3000:3000
    ├── curl /health → 200 OK
    ├── write $GITHUB_STEP_SUMMARY report
    └── docker stop + rm
```

### What I Would Add Next

| Improvement | Why |
|-------------|-----|
| **Slack/Teams notification** | Alert on pipeline failure or successful production deploy |
| **Multi-environment** | Add `staging` environment between Docker push and `production` deploy |
| **Rollback workflow** | `repository_dispatch` event triggers a roll-back to the previous SHA tag |
| **Semantic versioning** | Use `semantic-release` or a version calculation step to tag `v1.2.3` instead of just `latest`/`sha-xxx` |
| **Matrix builds** | Run tests on Node 18, 20, 22 simultaneously using a matrix strategy |
| **Dependabot** | Automatically open PRs for npm and GitHub Actions version updates |
| **Remove `continue-on-error` from Trivy** | Once CVE baseline is clean, make the CRITICAL scan a hard gate |
| **DAST scan** | Add OWASP ZAP after deploy to staging for dynamic security testing |

---

## Key Concepts Summary

| Concept | Used in |
|---------|---------|
| `workflow_call` with `inputs`/`outputs`/`secrets` | `reusable-build-test.yml`, `reusable-docker.yml` |
| Calling reusable workflows with `needs:` chain | `main-pipeline.yml` (3-stage sequential) |
| `environment: production` gate | `main-pipeline.yml` deploy job |
| `pull_request` trigger, no Docker push | `pr-pipeline.yml` |
| `schedule` + `workflow_dispatch` | `health-check.yml` |
| `$GITHUB_STEP_SUMMARY` markdown report | All workflow files |
| `$GITHUB_OUTPUT` for inter-step values | All reusable workflows |
| `actions/setup-node@v4` with npm cache | `reusable-build-test.yml` |
| `docker/build-push-action@v5` with GHA cache | `reusable-docker.yml` |
| `aquasecurity/trivy-action` CRITICAL scan | `reusable-docker.yml` (brownie points) |
| Multi-tag Docker image (`latest` + SHA) | `reusable-docker.yml` |
| Docker container health-probe loop in CI | `health-check.yml` |
