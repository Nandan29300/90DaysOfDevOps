# Day 44 – Secrets, Artifacts & Running Real Tests in CI

---

## Overview

Today the pipeline starts doing **real work** — protecting sensitive credentials, preserving build outputs across jobs, running actual code tests, and speeding up repeated runs with caching.

Five workflow files were created:

| File | Task | Purpose |
|------|------|---------|
| `secrets.yml` | Tasks 1–2 | Read GitHub secrets safely; pass as env vars |
| `artifacts.yml` | Task 3 | Generate files and upload as downloadable artifacts |
| `artifact-between-jobs.yml` | Task 4 | Pass a build artifact from `build` job to `deploy` job |
| `real-tests.yml` | Task 5 | Run `scripts/test_utils.py` in CI — green/red pipeline |
| `cache.yml` | Task 6 | Cache pip packages; compare first vs second run speed |

---

## Task 1 & 2: GitHub Secrets

### What Are Secrets?

GitHub Secrets are **encrypted key-value pairs** stored in GitHub's secret store (not in your repository files). They are injected into workflow runs at runtime — the actual values are never written to disk or visible in git history.

### How to Create a Secret

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `MY_SECRET_MESSAGE` / `DOCKER_USERNAME` / `DOCKER_TOKEN`
4. Value: (your secret value)
5. Click **"Add secret"**

Secrets added for this day:
- `MY_SECRET_MESSAGE` — demo secret
- `DOCKER_USERNAME` — Docker Hub username (needed on Day 45)
- `DOCKER_TOKEN` — Docker Hub access token (needed on Day 45)

### Using Secrets in a Workflow

```yaml
# Reference in an expression — GitHub masks it in logs automatically
- run: echo "${{ secrets.MY_SECRET_MESSAGE }}"
# Output in logs: ***  ← GitHub replaces the value

# Best practice: pass as an environment variable
- name: Use secret via env
  env:
    SECRET_MSG: ${{ secrets.MY_SECRET_MESSAGE }}
    DOCKER_USER: ${{ secrets.DOCKER_USERNAME }}
  run: |
    echo "Length: ${#SECRET_MSG}"           # safe — shows length, not value
    docker login -u "$DOCKER_USER" ...      # value used in command, never echoed
```

### Why You Must NEVER Print Secrets in CI Logs

| Risk | Consequence |
|------|------------|
| **Log retention** | CI logs are stored and may be shared, downloaded, or screenshotted |
| **Third-party integrations** | Tools that consume CI logs (Slack, monitoring, SIEM) would capture the value |
| **Public repos** | Logs on public repos are visible to everyone on the internet |
| **Audit trail** | Leaked credentials in logs linger even after the secret is rotated |
| **Token abuse** | An exposed `DOCKER_TOKEN` lets anyone push images to your registry |

GitHub automatically **masks** secret values in logs — it replaces them with `***`. But never rely on this as the only safeguard. If a secret is split, encoded, or modified before echoing, the masking may not catch it.

**Golden rule:** treat secrets like passwords — never print, log, or expose them. Use them only as env vars passed directly to the commands that need them.

---

## Task 3: Upload Artifacts

### The Workflow

**File:** `.github/workflows/artifacts.yml`

```yaml
- name: Generate test report
  run: |
    mkdir -p reports
    echo "Tests run: 10" > reports/test-report.txt
    echo "Status   : ✅ ALL PASSED" >> reports/test-report.txt

- name: Upload test report artifact
  uses: actions/upload-artifact@v4
  with:
    name: test-report-${{ github.run_number }}
    path: reports/
    retention-days: 7
```

### Key Parameters

| Parameter | Description |
|-----------|-------------|
| `name` | Artifact name shown in the GitHub UI — make it unique per run with `${{ github.run_number }}` |
| `path` | File or directory to upload — can be a glob pattern |
| `retention-days` | How long GitHub stores it (default: 90 days, max: 90 days on free) |

### How to Download an Artifact

After the workflow runs:
1. Go to **Actions** tab → click the workflow run
2. Scroll to the bottom of the run page → **Artifacts** section
3. Click the artifact name to download a `.zip` file

---

## Task 4: Passing Artifacts Between Jobs

### The Problem

Jobs run on separate, isolated VMs. A file written in `build` does **not** automatically exist in `deploy`. You need to explicitly transfer it using the artifact store.

### The Pattern

```yaml
jobs:
  build:
    steps:
      - name: Create dist files
        run: echo "app-version=2.0.0" > dist/build-info.txt

      - name: Upload
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/

  deploy:
    needs: build
    steps:
      - name: Download
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: downloaded-dist/

      - name: Use it
        run: cat downloaded-dist/build-info.txt
```

### Flow Diagram

```
build VM                      GitHub Artifact Store          deploy VM
─────────────────────         ──────────────────────         ─────────────────────
dist/build-info.txt  ──▶──▶  [build-output artifact]  ──▶─▶  downloaded-dist/
                              (temporary storage)
```

### When Would You Use Artifacts in a Real Pipeline?

| Use case | What's uploaded | Who downloads it |
|----------|----------------|-----------------|
| **Build → Deploy** | Compiled binary / Docker image layers | Deploy job |
| **Test → Report** | JUnit XML / HTML test report | Report publishing job |
| **Build → Security scan** | Built artifact | SAST/vulnerability scanner job |
| **CI → CD** | Versioned release package | Deployment to staging/production |
| **Debugging** | Logs and core dumps on failure | Developer downloads manually |
| **Matrix → Summary** | Per-OS test results | Aggregation job |

Artifacts decouple jobs from each other — each job only needs to know the artifact name, not how it was built or where the builder ran.

---

## Task 5: Running Real Tests in CI

### The Test Script

**File:** `scripts/test_utils.py`

Tests three pure utility functions:
- `is_even(n)` — checks if a number is even
- `is_palindrome(s)` — checks if a string reads the same forwards and backwards
- `fizzbuzz(n)` — returns Fizz, Buzz, FizzBuzz, or the number as a string

The script exits with code `0` if all tests pass, `1` if any fail — making GitHub mark the pipeline green or red respectively.

### The Workflow

```yaml
- name: Run test suite
  run: python day-44/scripts/test_utils.py
```

No special test framework needed - the script handles its own pass/fail exit code.

### Break → Red Pipeline

To intentionally break it:
```python
# Change a correct expected value to wrong in test_utils.py
check("2 is even", False, is_even(2))   # wrong expected — will fail
```
Push → pipeline goes **red ❌**

To fix it:
```python
check("2 is even", True, is_even(2))    # correct — back to green
```
Push → pipeline goes **green ✅**

### Why Real Tests in CI Matter

```
Without CI tests:               With CI tests:
Push → merge to main            Push → CI runs tests
     → bug ships to prod             → broken code BLOCKED
     → hotfix needed                 → developer fixes before merge
     → users affected                → users never see the bug
```

---

## Task 6: Caching

### What Is Caching?

`actions/cache` saves specified directories between workflow runs. On the **first run** (cache miss), dependencies are downloaded and then saved. On **subsequent runs** (cache hit), the saved directory is restored directly — skipping the download entirely.

### The Cache Key

```yaml
key: ${{ runner.os }}-pip-${{ hashFiles('day-44/scripts/requirements.txt') }}
```

| Part | Purpose |
|------|---------|
| `${{ runner.os }}` | Different OS = different binaries = separate cache |
| `pip-` | Namespace to avoid collisions with Node or other caches |
| `hashFiles(...)` | If `requirements.txt` changes → new hash → cache invalidated → fresh install |

### Cache Hit vs Miss

```
Run 1 (cache miss):
  install packages (30–60 sec) → cache saved to GitHub's object store

Run 2 (cache hit, same requirements.txt):
  cache restored (~5 sec) → skip full install → ~50 sec saved per run
```

### What Is Being Cached and Where Is It Stored?

**What:** The pip download cache (`~/.cache/pip`) — the directory where pip stores downloaded wheel files before installing them. Restoring this directory means pip finds packages locally and doesn't hit PyPI.

**Where:** GitHub's own blob storage, associated with your repository. Cache entries are stored per repo, per branch (with fallback to the default branch). Maximum cache size: **10 GB per repository**. Entries unused for 7 days are evicted automatically.

### Cache Hit Output

```yaml
- name: Print cache status
  run: |
    if [ "${{ steps.pip-cache.outputs.cache-hit }}" = "true" ]; then
      echo "✅ Cache HIT — packages restored from cache (fast path)"
    else
      echo "ℹ️  Cache MISS — downloading packages fresh"
    fi
```

---

## Secrets vs Env Vars vs Outputs — Quick Reference

| Mechanism | Scope | Use for |
|-----------|-------|---------|
| `secrets.*` | Repo/org level, encrypted | Passwords, tokens, API keys |
| `env:` (workflow/job/step) | YAML defined, plaintext | Non-sensitive config (app name, version) |
| `$GITHUB_OUTPUT` | Between steps in a job | Passing calculated values (build ID, date) |
| `needs.<job>.outputs` | Between jobs | Sharing job results (version, artifact name) |
| Artifacts | Between jobs / external download | Files, binaries, reports |
| Cache | Between runs | Dependencies, compiled assets |
