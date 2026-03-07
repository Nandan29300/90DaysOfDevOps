# Day 43 – Jobs, Steps, Env Vars & Conditionals

---

## Overview

Today's focus is **pipeline flow control** — how to wire multiple jobs together, share data between them, inject variables at different scopes, and run steps only when specific conditions are met.

Five workflow files were created:

| File | Task | Purpose |
|------|------|---------|
| `multi-job.yml` | Task 1 | 3 sequential jobs: build → test → deploy |
| `env-vars.yml` | Task 2 | Env vars at workflow / job / step scope + GitHub context |
| `job-outputs.yml` | Task 3 | Producer job sets outputs; consumer job reads them |
| `conditionals.yml` | Task 4 | Branch conditions, failure conditions, continue-on-error |
| `smart-pipeline.yml` | Task 5 | lint + test in parallel → summary job with branch detection |

---

## Task 1: Multi-Job Workflow

### The Workflow

**File:** `.github/workflows/multi-job.yml`

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: echo "✅ Build complete"

  test:
    runs-on: ubuntu-latest
    needs: build          # ← waits for build to succeed
    steps:
      - run: echo "✅ All tests passed"

  deploy:
    runs-on: ubuntu-latest
    needs: test           # ← waits for test to succeed
    steps:
      - run: echo "✅ Deployment complete"
```

### What `needs:` Does

`needs:` creates an **explicit dependency** between jobs.

```
Without needs:                    With needs: build → test → deploy:
build  ──▶ (parallel)             build
test   ──▶ (parallel)               └── test (starts only if build ✅)
deploy ──▶ (parallel)                     └── deploy (starts only if test ✅)
```

Rules:
- If a job in `needs:` **fails**, all downstream jobs are **skipped** automatically
- A job can depend on **multiple** parents: `needs: [build, lint]` — all must succeed
- The dependency chain is visible as a graph in the GitHub Actions UI

### Dependency Chain Diagram (Actions Tab)

```
build ──✅──▶ test ──✅──▶ deploy
```

If `build` fails → `test` is skipped → `deploy` is skipped. GitHub shows the cancelled jobs greyed out.

---

## Task 2: Environment Variables

### The Three Scopes

```yaml
env:
  APP_NAME: myapp            # ← Workflow level: visible to ALL jobs and steps

jobs:
  show-env-vars:
    env:
      ENVIRONMENT: staging   # ← Job level: visible to all steps in this job

    steps:
      - name: My step
        env:
          VERSION: 1.0.0     # ← Step level: visible ONLY inside this step
        run: |
          echo $APP_NAME      # ✅ works
          echo $ENVIRONMENT   # ✅ works
          echo $VERSION       # ✅ works

      - name: Next step
        run: |
          echo $APP_NAME      # ✅ works  (workflow scope)
          echo $ENVIRONMENT   # ✅ works  (job scope)
          echo $VERSION       # ❌ empty  (step scope ended)
```

### Scope Visibility Summary

| Variable | Workflow scope | Job scope | Step scope |
|----------|---------------|-----------|------------|
| Workflow-level `env` | ✅ | ✅ | ✅ |
| Job-level `env` | ❌ | ✅ | ✅ |
| Step-level `env` | ❌ | ❌ | ✅ (that step only) |

### GitHub Context Variables

These come from GitHub itself — not from your `env:` blocks:

| Expression | What it prints |
|-----------|---------------|
| `${{ github.sha }}` | Full 40-char commit SHA |
| `${{ github.actor }}` | Username who triggered the run |
| `${{ github.ref }}` | Full ref: `refs/heads/main` |
| `${{ github.ref_name }}` | Short branch/tag name: `main` |
| `${{ github.event_name }}` | `push`, `pull_request`, `workflow_dispatch`, etc. |
| `${{ github.repository }}` | `owner/repo-name` |
| `${{ runner.os }}` | `Linux`, `Windows`, or `macOS` |

---

## Task 3: Job Outputs

### How Outputs Work

```
Producer job                     Consumer job
─────────────────────            ─────────────────────────────────
steps:                           needs: producer
  - id: set-date                 steps:
    run: |                         - run: |
      echo "date=$(date)" \            echo "${{ needs.producer.outputs.build-date }}"
        >> $GITHUB_OUTPUT
```

Three things are required:

**1. Declare the step `id:`** — so you can reference the step's output
```yaml
- id: set-date
  run: echo "date=$(date -u +%Y-%m-%d)" >> $GITHUB_OUTPUT
```

**2. Declare `outputs:` at the job level** — maps a job output name to a step output
```yaml
jobs:
  producer:
    outputs:
      build-date: ${{ steps.set-date.outputs.date }}
```

**3. Reference via `needs.<job>.outputs.<name>`** in the consuming job
```yaml
jobs:
  consumer:
    needs: producer
    steps:
      - run: echo "${{ needs.producer.outputs.build-date }}"
```

### Why Pass Outputs Between Jobs?

Jobs run on separate, isolated VMs. They cannot share environment variables or files directly. `outputs:` is the **official channel** for passing values between jobs.

Use cases:
- Pass a **version number** calculated in `build` to `deploy`
- Pass a **test result** from `test` to `notify` (send Slack message with pass/fail)
- Pass a **Docker image tag** from `build-image` to `push-image`
- Pass a **generated artifact name** so downstream jobs know what to download

Without `outputs:`, you would need a shared external store (S3, database) — `outputs:` keeps it simple and self-contained.

---

## Task 4: Conditionals

### `if:` on a Step

```yaml
# Only run on main branch
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  run: echo "Deploying to prod"

# Only run when a specific step failed
- name: Notify on failure
  if: steps.risky-step.outcome == 'failure'
  run: echo "risky-step failed!"
```

### Step Outcome Values

| `steps.<id>.outcome` | Meaning |
|---------------------|---------|
| `success` | Step completed with exit code 0 |
| `failure` | Step failed (non-zero exit) |
| `cancelled` | Step was cancelled |
| `skipped` | Step was skipped due to `if:` condition |

Note: `steps.<id>.outcome` is only available **after** the step runs. Use `steps.<id>.conclusion` for the final result after retry.

### `if:` on a Job

```yaml
jobs:
  push-only-job:
    if: github.event_name == 'push'   # ← entire job is skipped for PRs
    runs-on: ubuntu-latest
```

### `continue-on-error: true`

```yaml
- name: Risky step
  continue-on-error: true   # job won't fail even if this step exits with non-zero
  run: exit 1

- name: This still runs
  run: echo "Job continues!"
```

**Without `continue-on-error`:** a failing step immediately stops the job and marks it as failed.  
**With `continue-on-error: true`:** the step is marked as failed (yellow), but the **job keeps running** and is ultimately marked successful if all other steps pass.

Use it for:
- Optional lint warnings that shouldn't block a deploy
- Non-critical notification steps (e.g., Slack ping that might fail)
- Cleanup steps that might fail but must not prevent main logic

### Common `if:` Expressions

```yaml
# Branch conditions
if: github.ref == 'refs/heads/main'
if: github.ref != 'refs/heads/main'
if: startsWith(github.ref, 'refs/heads/release/')

# Event conditions
if: github.event_name == 'push'
if: github.event_name == 'pull_request'

# Step result conditions
if: steps.my-step.outcome == 'failure'
if: steps.my-step.outcome == 'success'

# Always run (even if previous step failed)
if: always()

# Only run on failure
if: failure()

# Combine conditions
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

---

## Task 5: Smart Pipeline

### The Workflow

**File:** `.github/workflows/smart-pipeline.yml`

```yaml
on:
  push:           # triggers on any branch push

jobs:
  lint:           # ─── runs in parallel ───▶
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "✅ No lint errors found"

  test:           # ─── runs in parallel ───▶
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "✅ All tests passed"

  summary:        # waits for BOTH lint AND test
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Identify branch type
        run: |
          BRANCH="${{ github.ref_name }}"
          if [ "$BRANCH" = "main" ]; then
            echo "🚀 Main branch push — production pipeline complete"
          else
            echo "🔀 Feature branch push ($BRANCH) — CI checks passed"
          fi

      - name: Print commit message
        run: echo "Commit: ${{ github.event.commits[0].message }}"
```

### Parallel + Fanin Pattern

```
push event
    │
    ├──▶ lint    ──┐
    │              ├──▶ summary (runs after BOTH complete)
    └──▶ test    ──┘
```

`needs: [lint, test]` — `summary` only starts when **both** `lint` and `test` have finished successfully. If either fails, `summary` is skipped.

---

## Key Concepts Summary

### `needs:` — Job Dependency

- Creates a **sequential dependency** between jobs
- Job A will only start after all jobs listed in `needs:` complete **successfully**
- Can list multiple: `needs: [job-a, job-b]`
- If a dependency fails → downstream job is **automatically skipped**

### `outputs:` — Job-to-Job Data Passing

- Jobs run on separate VMs — they can't share env vars or files directly
- `outputs:` is the official bridge: set a value in one job, read it in another
- Flow: `echo "key=value" >> $GITHUB_OUTPUT` → job `outputs:` block → `needs.<job>.outputs.<key>`

### Workflow Summary

```
Data flow:
  Step writes to $GITHUB_OUTPUT
      └──▶ Job outputs: block references step output
                └──▶ Downstream job reads via needs.<job>.outputs.<key>

Execution flow:
  needs: ────── controls order (sequential)
  if:    ────── controls whether a job/step runs (conditional)
  continue-on-error: ── prevents a step failure from killing the job
```
