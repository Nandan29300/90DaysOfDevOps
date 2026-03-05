# Day 41 – Triggers & Matrix Builds

---

## Overview

Yesterday the pipeline ran on every `push`. Today we learn **every way to start a workflow** and how to test across multiple environments simultaneously using **matrix builds**.

Four new workflow files were created:

| File | Trigger | Purpose |
|------|---------|---------|
| `pr-check.yml` | `pull_request` | Runs checks on every PR to `main` |
| `scheduled.yml` | `schedule` + `push` | Daily automated health check |
| `manual.yml` | `workflow_dispatch` | Manual deploy with interactive inputs |
| `matrix.yml` | `push` + `pull_request` | Runs tests across 2 OSes × 3 Python versions |

---

## Task 1: Pull Request Trigger

### The Workflow

**File:** `.github/workflows/pr-check.yml`

```yaml
name: PR Check

on:
  pull_request:
    branches:
      - main
    types:
      - opened
      - synchronize

jobs:
  pr-check:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Print PR branch info
        run: echo "PR check running for branch: ${{ github.head_ref }}"

      - name: Print PR details
        run: |
          echo "PR opened by: ${{ github.actor }}"
          echo "Base branch: ${{ github.base_ref }}"
          echo "PR number: ${{ github.event.pull_request.number }}"
          echo "Commit SHA: ${{ github.sha }}"
```

### Key Concepts

**`on: pull_request:`**  
Triggers when any pull request event occurs. Without `branches:`, it fires for PRs against every branch.

**`branches: [main]`**  
Restricts: only fire for PRs whose **base branch** is `main`. PRs targeting `develop` or other branches are ignored.

**`types:`**  
Controls which PR events fire the trigger:

| Type | When it fires |
|------|--------------|
| `opened` | A new PR is created |
| `synchronize` | A new commit is pushed to an existing open PR |
| `reopened` | A closed PR is reopened |
| `closed` | PR is closed (merged or dismissed) — rarely used in CI |

Using just `opened` + `synchronize` catches all meaningful code changes on a PR.

**`github.head_ref`**  
The **source branch** of the PR (the branch you want to merge in).  
`github.base_ref` is the target branch (usually `main`).

### How to Test It

```bash
# Create a feature branch
git checkout -b feature/my-new-feature

# Make a change
echo "test" >> test.txt
git add test.txt
git commit -m "feat: add test file"
git push origin feature/my-new-feature

# Open a PR on GitHub: feature/my-new-feature → main
# The pr-check workflow fires automatically
```

### Where It Shows Up

The PR check appears directly on the PR page under "Checks":
```
Checks
├── PR Check / pr-check (success ✅)
│   └── All checks have passed
└── [merge button unlocks if all checks pass]
```

You can configure GitHub **branch protection rules** to require this check before anyone can merge.

---

## Task 2: Scheduled Trigger

### The Workflow

**File:** `.github/workflows/scheduled.yml`

```yaml
name: Scheduled Health Check

on:
  push:
    branches:
      - main
  schedule:
    - cron: "0 0 * * *"   # Every day at midnight UTC
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Print trigger type
        run: echo "Workflow triggered by: ${{ github.event_name }}"

      - name: Print current UTC time
        run: date -u

      - name: Simulate health check
        run: |
          echo "Running scheduled health check..."
          echo "All systems operational ✅"
```

### Understanding Cron Syntax

```
┌───────── minute       (0–59)
│  ┌────── hour         (0–23, UTC)
│  │  ┌─── day of month (1–31)
│  │  │  ┌── month      (1–12)
│  │  │  │  ┌─ day of week (0–7, 0 and 7 = Sunday)
│  │  │  │  │
*  *  *  *  *
```

### Common Cron Expressions

| Cron | Meaning |
|------|---------|
| `0 0 * * *` | Every day at midnight UTC |
| `0 9 * * 1` | **Every Monday at 9 AM UTC** ← Task 2 answer |
| `0 2 * * *` | Every day at 2 AM UTC |
| `*/15 * * * *` | Every 15 minutes |
| `0 6,18 * * *` | Twice a day at 6 AM and 6 PM UTC |
| `0 0 1 * *` | First day of every month at midnight |
| `0 0 * * 1-5` | Every weekday (Mon–Fri) at midnight |

### Answer: Cron for Every Monday at 9 AM UTC

```
0 9 * * 1
```

Breakdown:
- `0` → at minute 0 (on the hour)
- `9` → at 9 AM
- `*` → every day of the month
- `*` → every month
- `1` → only on Monday (1 = Monday in cron)

### Important Note on Schedule Triggers

GitHub Actions does **not guarantee exact execution time** for scheduled workflows. During high GitHub load, runs can be delayed by 5–15 minutes. For critical timing-sensitive jobs, consider a dedicated cron service (like AWS EventBridge) that calls `workflow_dispatch` via API.

Scheduled workflows on **public repos** are automatically disabled if the repo has no activity for 60 days. GitHub sends a warning email before disabling.

---

## Task 3: Manual Trigger (`workflow_dispatch`)

### The Workflow

**File:** `.github/workflows/manual.yml`

```yaml
name: Manual Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Target environment to deploy to"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production
      version:
        description: "Version or tag to deploy (e.g. v1.2.0)"
        required: false
        default: "latest"
        type: string
      dry_run:
        description: "Perform a dry run without actual deployment"
        required: false
        default: "false"
        type: choice
        options:
          - "false"
          - "true"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Print deployment inputs
        run: |
          echo "Environment : ${{ github.event.inputs.environment }}"
          echo "Version     : ${{ github.event.inputs.version }}"
          echo "Dry run     : ${{ github.event.inputs.dry_run }}"

      - name: Simulate deployment
        run: |
          DRY="${{ github.event.inputs.dry_run }}"
          ENV="${{ github.event.inputs.environment }}"
          VER="${{ github.event.inputs.version }}"
          if [ "$DRY" = "true" ]; then
            echo "DRY RUN — Would deploy $VER to $ENV"
          else
            echo "Deploying $VER to $ENV... ✅"
          fi
```

### Input Types

| Type | Description |
|------|-------------|
| `string` | Free-text input field |
| `choice` | Dropdown with predefined options |
| `boolean` | Checkbox (true/false) |
| `number` | Numeric input |
| `environment` | GitHub Environment selector (needs Environments configured) |

### How to Trigger Manually

1. Go to your GitHub repo
2. Click **Actions** tab
3. Find **"Manual Deploy"** in the left sidebar
4. Click **"Run workflow"** button (top right)
5. A form appears with your inputs:
   - Environment dropdown: `staging` / `production`
   - Version text field
   - Dry run dropdown
6. Fill in values → click **"Run workflow"**
7. A new run appears — expand the steps to see your input values printed

### Why `workflow_dispatch` Is Useful

- **Controlled production deploys** — you run the deploy manually after approving on staging
- **One-off operations** — database migrations, cache flushes, report generation
- **Debugging** — trigger a workflow without polluting the commit history with dummy commits
- **API automation** — `workflow_dispatch` can also be triggered via GitHub's REST API:
  ```bash
  curl -X POST \
    -H "Authorization: token YOUR_PAT" \
    https://api.github.com/repos/OWNER/REPO/actions/workflows/manual.yml/dispatches \
    -d '{"ref":"main","inputs":{"environment":"staging"}}'
  ```

---

## Task 4: Matrix Builds

### The Workflow

**File:** `.github/workflows/matrix.yml`

```yaml
name: Matrix Build

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

jobs:
  test:
    runs-on: ${{ matrix.os }}

    strategy:
      fail-fast: false
      matrix:
        os:
          - ubuntu-latest
          - windows-latest
        python-version:
          - "3.10"
          - "3.11"
          - "3.12"

        exclude:
          - os: windows-latest
            python-version: "3.10"

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - name: Print Python version
        run: python --version

      - name: Run tests
        run: python -c "print('All tests passed ✅')"
```

### How Matrix Works

The `matrix:` block defines **variables**. GitHub creates one job for **every combination** of those variables.

```
matrix:
  os:             [ubuntu-latest, windows-latest]   = 2 values
  python-version: ["3.10", "3.11", "3.12"]          = 3 values

Total combinations = 2 × 3 = 6 jobs
```

These 6 jobs run **in parallel** on separate runners:

```
matrix.yml
├── test (ubuntu-latest, python 3.10)   ── parallel ──▶
├── test (ubuntu-latest, python 3.11)   ── parallel ──▶
├── test (ubuntu-latest, python 3.12)   ── parallel ──▶
├── test (windows-latest, python 3.10)  ── parallel ──▶
├── test (windows-latest, python 3.11)  ── parallel ──▶
└── test (windows-latest, python 3.12)  ── parallel ──▶
```

All 6 run simultaneously — if each takes 2 minutes, the whole matrix completes in ~2 minutes instead of 12.

### After Exclude: How Many Jobs?

With the `exclude` rule removing `(windows-latest, python 3.10)`:

```
Original combinations: 2 × 3 = 6
Excluded: 1  (windows-latest + 3.10)
Remaining jobs: 5
```

```
Matrix jobs after exclude:
├── test (ubuntu-latest,  python 3.10)  ✅ included
├── test (ubuntu-latest,  python 3.11)  ✅ included
├── test (ubuntu-latest,  python 3.12)  ✅ included
├── test (windows-latest, python 3.10)  ❌ EXCLUDED
├── test (windows-latest, python 3.11)  ✅ included
└── test (windows-latest, python 3.12)  ✅ included

Total: 5 jobs run
```

### Using Matrix Values in Steps

The matrix variables are available as context variables anywhere in the job:
```yaml
runs-on: ${{ matrix.os }}              # ← use matrix value for runner
python-version: ${{ matrix.python-version }}  # ← use in action inputs
run: echo "Testing on ${{ matrix.os }}" # ← use in shell commands
```

---

## Task 5: Exclude & fail-fast

### `fail-fast: true` (the default)

When any job in the matrix fails, GitHub **immediately cancels all other in-progress jobs** in the matrix.

```
Scenario: Python 3.10 fails on ubuntu.

fail-fast: true (default)
├── test (ubuntu,  3.10)  ❌ FAILED  ← triggers cancellation
├── test (ubuntu,  3.11)  ⏹️ CANCELLED
├── test (ubuntu,  3.12)  ⏹️ CANCELLED
├── test (windows, 3.11)  ⏹️ CANCELLED
└── test (windows, 3.12)  ⏹️ CANCELLED

Result: Pipeline fails fast. CI minutes saved.
You know one thing broke — fix it before spending time on the others.
```

### `fail-fast: false`

When a job fails, all **other jobs continue running** to completion.

```
Scenario: Python 3.10 fails on ubuntu.

fail-fast: false
├── test (ubuntu,  3.10)  ❌ FAILED
├── test (ubuntu,  3.11)  ✅ passed  (kept running)
├── test (ubuntu,  3.12)  ✅ passed  (kept running)
├── test (windows, 3.11)  ✅ passed  (kept running)
└── test (windows, 3.12)  ✅ passed  (kept running)

Result: Full picture — you see EXACTLY which combos fail and which pass.
```

### When to Use Each

| Setting | Use When |
|---------|---------|
| `fail-fast: true` | You want fast feedback — if anything is broken, stop everything now |
| `fail-fast: false` | You want full coverage — see all failures across the matrix in one run |

**Best practice:** Use `fail-fast: false` when debugging a compatibility issue (you want to see all broken combos at once). Use the default `true` in your main CI to keep runs fast and cheap.

---

## All Triggers — Complete Reference

```
on:
  │
  ├── push:                        Push commits to a branch
  │     branches: [main, develop]
  │     tags: ['v*']               Only version tags
  │     paths: ['src/**']          Only if these files changed
  │
  ├── pull_request:                PR opened, updated, or reopened
  │     branches: [main]
  │     types: [opened, synchronize, reopened]
  │
  ├── schedule:                    Time-based (cron)
  │     - cron: '0 0 * * *'
  │
  ├── workflow_dispatch:           Manual button in UI or API call
  │     inputs:
  │       environment:
  │         type: choice
  │
  ├── workflow_call:               Called by another workflow (reusable)
  │
  ├── release:                     GitHub release published
  │     types: [published]
  │
  ├── issues:                      Issue opened/closed/labelled
  │
  ├── issue_comment:               Comment on issue or PR
  │
  └── repository_dispatch:         External webhook event
```

---

## Points to Remember 📌

1. **`pull_request` triggers on the merge commit** — GitHub creates a temporary merge commit between your branch and `main` and runs the workflow against that. This catches conflicts before merging.

2. **`github.head_ref` vs `github.ref_name`** — inside a `pull_request` trigger, `github.ref_name` is the merge ref (not useful); use `github.head_ref` to get the actual source branch name.

3. **Cron runs in UTC** — always convert your local timezone to UTC when writing cron schedules. 9 AM IST = 3:30 AM UTC.

4. **`workflow_dispatch` inputs are always strings internally** — even if you declare `type: boolean`, the value in `${{ github.event.inputs.my_bool }}` is the string `"true"` or `"false"`, not a real boolean. Use string comparison: `if [ "$VAR" = "true" ]`.

5. **Matrix multiplies all axis combinations** — 3 OS × 4 versions = 12 jobs. Be mindful of CI minute costs on private repos. Use `include:` to add specific combos instead of the full cross-product.

6. **`exclude:` matches on all specified keys** — it removes the exact combination. A partial match also works: `exclude: - os: windows-latest` removes ALL Windows jobs regardless of other variables.

7. **`include:` adds extra combinations or injects extra variables** — use it to add a special combo (e.g., latest Python on macOS) without redefining the whole matrix.

8. **`fail-fast: false` is essential for compatibility debugging** — when you're trying to find which OS/version breaks, you need all jobs to complete, not cancel on the first failure.

9. **Scheduled workflows must be on the default branch** — the `schedule:` trigger only works if the workflow file is on the repo's default branch (`main`). A schedule in a feature branch will not run.

10. **Path filters on `push` save CI minutes** — `paths: ['src/**', 'tests/**']` means the workflow only runs when application code changes, not on every docs update.

---

## Tips 💡

- Combine multiple triggers in one `on:` block — a workflow can respond to both `push` and `pull_request`:
  ```yaml
  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]
  ```
- Use `paths-ignore:` to skip the workflow when only irrelevant files change:
  ```yaml
  on:
    push:
      paths-ignore:
        - '**.md'
        - 'docs/**'
  ```
- Add `include:` to a matrix to inject additional variables for specific combinations:
  ```yaml
  matrix:
    python-version: ["3.10", "3.11", "3.12"]
    include:
      - python-version: "3.12"
        experimental: true   # extra variable only for 3.12
  ```
- Use [crontab.guru](https://crontab.guru) to build and validate cron expressions visually.
- `workflow_dispatch` can be triggered from the GitHub CLI: `gh workflow run manual.yml --ref main -f environment=staging`

---

## Summary

| Task | Done | Key Learning |
|------|------|-------------|
| 1 | ✅ `pr-check.yml` — PR trigger | `pull_request` fires on open/synchronize; shows as check on PR page; use `github.head_ref` for source branch |
| 2 | ✅ `scheduled.yml` — cron trigger | Cron for every Monday 9 AM UTC = `0 9 * * 1`; schedule only works from default branch |
| 3 | ✅ `manual.yml` — `workflow_dispatch` with 3 inputs | Inputs appear as a form in Actions UI; input types: string, choice, boolean; also triggerable via API |
| 4 | ✅ `matrix.yml` — 2 OS × 3 Python = 6 jobs | All run in parallel; matrix variables available as `${{ matrix.xyz }}`; use `actions/setup-python@v5` |
| 5 | ✅ `exclude` + `fail-fast: false` | After exclude: 5 jobs; `fail-fast: true` cancels others on first failure; `false` lets all complete |
