# Day 47 – Advanced Triggers: PR Events, Cron Schedules & Event-Driven Pipelines

---

## Overview

Today goes deep into the full GitHub Actions trigger system — every push/PR-based workflow from previous days used the simplest form of `on:`. Real production pipelines use event types, path filters, schedules, and cross-workflow chaining.

Workflow files created:

| File | Trigger | Purpose |
|------|---------|---------|
| `pr-lifecycle.yml` | `pull_request` (4 types) | Fire on every PR state change; detect merge vs close |
| `pr-checks.yml` | `pull_request` | Real-world PR gate: file size, branch name, description |
| `scheduled-tasks.yml` | `schedule` + `workflow_dispatch` | Cron health check — weekly and every 6 hours |
| `smart-triggers.yml` | `push` with `paths` / `paths-ignore` | Build only when code changes, skip on docs only |
| `tests.yml` | `push` / `pull_request` | Run test suite on every push |
| `deploy-after-tests.yml` | `workflow_run` | Deploy only after `tests.yml` succeeds on `main` |
| `external-trigger.yml` | `repository_dispatch` | API-triggered deployments from external systems |

---

## Task 1: PR Lifecycle Events

### The Four Activity Types

```yaml
on:
  pull_request:
    types:
      - opened        # PR first created
      - synchronize   # New commit pushed to the PR branch
      - reopened      # PR re-opened after being closed
      - closed        # PR closed (merged OR dismissed without merge)
```

Without an explicit `types:` list, GitHub Actions defaults to: `[opened, synchronize, reopened]` — `closed` is NOT included by default.

### What Each Event Carries

| Event | `github.event.action` | Use case |
|-------|----------------------|---------|
| `opened` | `opened` | Welcome message, initial checks, label assignment |
| `synchronize` | `synchronize` | Re-run CI checks after a new commit |
| `reopened` | `reopened` | Re-run checks on a re-opened PR |
| `closed` (merged) | `closed` | Deploy to staging, update changelog, notify Slack |
| `closed` (dismissed) | `closed` | Log abandoned PR, clean up feature branch |

### Detecting a Merge vs a Close

```yaml
# ✅ Merged — closed AND merged = true
- name: Post-merge actions
  if: github.event.action == 'closed' && github.event.pull_request.merged == true
  run: echo "PR was merged"

# ✅ Abandoned — closed BUT merged = false
- name: PR closed without merge
  if: github.event.action == 'closed' && github.event.pull_request.merged == false
  run: echo "PR was dismissed"
```

`github.event.pull_request.merged` is a boolean — it's `true` only when the PR was actually merged, not just closed.

### Key PR Context Variables

| Variable | Value |
|----------|-------|
| `github.event.action` | `opened` / `synchronize` / `reopened` / `closed` |
| `github.event.pull_request.number` | PR number (e.g. `42`) |
| `github.event.pull_request.title` | PR title string |
| `github.event.pull_request.user.login` | GitHub username of PR author |
| `github.event.pull_request.merged` | `true` if merged, `false` if just closed |
| `github.event.pull_request.merged_by.login` | Who clicked merge |
| `github.event.pull_request.merge_commit_sha` | The merge commit SHA |
| `github.head_ref` | Source branch name (e.g. `feature/add-login`) |
| `github.base_ref` | Target branch name (e.g. `main`) |
| `github.event.pull_request.body` | PR description text |

---

## Task 2: PR Validation Workflow

### Three Jobs in `pr-checks.yml`

**Job 1: File size check**

```bash
# For each file changed in the PR vs base branch:
git diff --name-only origin/${{ github.base_ref }}...HEAD
# Check: stat -c%s "$file" > 1048576 → fail
```

Using `fetch-depth: 0` in checkout is essential — without the full git history, `git diff` against the base branch won't work.

**Job 2: Branch name validation**

```bash
BRANCH="${{ github.head_ref }}"
echo "$BRANCH" | grep -Eq '^(feature|fix|docs|chore|refactor)/.+'
```

Allowed prefixes: `feature/`, `fix/`, `docs/`, `chore/`, `refactor/`

Any other prefix (e.g. `my-random-branch`, `wip-something`) → pipeline fails with a clear error message showing the allowed patterns.

**Job 3: PR description check (warning only)**

```bash
BODY="${{ github.event.pull_request.body }}"
[ -z "$BODY" ] → print warning, but exit 0
```

This check **never fails** — it's an advisory nudge. Using `exit 0` always keeps the job green regardless of what the check finds.

### Difference Between Fail and Warn

```
File size check:  exit 1 → job red → merge blocked (if branch protection requires this check)
Branch name check: exit 1 → job red → merge blocked
PR body check:    exit 0 always → job green, shows warning message in logs only
```

### Testing It

```bash
# Create a PR from a bad branch name:
git checkout -b my-random-feature
git push origin my-random-feature
# Open a PR → branch-name-check fails immediately
```

---

## Task 3: Scheduled Workflows

### The Two Cron Entries

```yaml
on:
  schedule:
    - cron: '30 2 * * 1'    # Every Monday 2:30 AM UTC
    - cron: '0 */6 * * *'   # Every 6 hours (00:00, 06:00, 12:00, 18:00)
  workflow_dispatch:          # Manual trigger for testing
```

### Cron Syntax Reference

```
┌─── minute (0–59)
│  ┌─── hour (0–23, UTC)
│  │  ┌─── day of month (1–31)
│  │  │  ┌─── month (1–12)
│  │  │  │  ┌─── day of week (0=Sun, 1=Mon … 6=Sat)
│  │  │  │  │
30  2  *  *  1    → Monday at 02:30 UTC
0  */6 *  *  *    → Every 6 hours
```

### Cron Expressions from Task 3

| Requirement | UTC Cron | Notes |
|-------------|----------|-------|
| Every weekday at 9 AM IST | `30 3 * * 1-5` | IST = UTC+5:30, so 9:00 IST = 03:30 UTC |
| First day of every month at midnight UTC | `0 0 1 * *` | Midnight = 00:00 UTC |

### Which Schedule Fired?

```bash
echo "Schedule: ${{ github.event.schedule }}"
# Output: "30 2 * * 1"  or  "0 */6 * * *"
```

`${{ github.event.schedule }}` returns the exact cron string that triggered the run — useful for routing different jobs per schedule in a single file.

### Why Scheduled Workflows Can Be Delayed or Skipped

GitHub's schedule documentation states:

> Scheduled workflows run on the latest commit on the default branch. If a scheduled workflow has not been run manually or by a push, GitHub may disable the schedule on the workflow in a repository that has had no recent activity.

Three real causes:
1. **Runner queue pressure** — if GitHub's runners are busy, scheduled jobs are queued and may start minutes or hours late
2. **Inactive repo throttling** — GitHub automatically disables scheduled workflows in repos with **no activity for 60 days** to save compute. You must re-enable them via the Actions tab
3. **Default branch only** — schedules only trigger on the repository's default branch; if `main` is renamed or switched, the schedule silently stops firing

**Best practice:** always add `workflow_dispatch` alongside `schedule` so you can manually trigger and test the workflow without waiting for the next cron window.

---

## Task 4: Path & Branch Filters

### `paths` vs `paths-ignore`

```yaml
# paths: INCLUDE filter — only run if at least one matching file changed
on:
  push:
    paths:
      - 'src/**'
      - 'app/**'
# If you push changes to only README.md → workflow SKIPPED entirely

# paths-ignore: EXCLUDE filter — skip run if ALL changed files match
on:
  push:
    paths-ignore:
      - '*.md'
      - 'docs/**'
# If you push changes to both src/app.js AND README.md → workflow RUNS
# (because not ALL changed files are docs)
```

### When to Use Each

| Use `paths` | Use `paths-ignore` |
|-------------|-------------------|
| You have specific directories that should trigger CI (e.g. only `src/`) | Your repo has mixed content; you want CI to run on most changes except docs |
| Monorepo: each service has its own trigger: `services/auth/**` | You want to explicitly exclude noise (changelogs, docs, config) |
| The "allowlist" approach — only these paths matter | The "denylist" approach — run unless it's only these paths |

### Branch Filters

```yaml
on:
  push:
    branches:
      - main
      - 'release/**'   # glob pattern — matches release/1.0, release/2.3-hotfix, etc.
```

`release/**` uses glob matching:
- `release/1.0` ✅
- `release/2.3-hotfix` ✅
- `release` (no `/`) ❌

### Testing Path Filters

```bash
# Push only a .md file — smart-triggers.yml should NOT run:
echo "# update" >> README.md
git add README.md && git commit -m "docs: update readme" && git push
# In Actions tab: no new run appears for smart-triggers.yml ✅

# Push a code file — should run:
echo "// updated" >> day-45/app/src/index.js
git add . && git commit -m "feat: update app" && git push
# In Actions tab: smart-triggers.yml run appears ✅
```

---

## Task 5: `workflow_run` — Chaining Workflows

### How It Works

```yaml
# In deploy-after-tests.yml:
on:
  workflow_run:
    workflows: ["Run Tests"]   # Must match the exact `name:` of the target workflow
    branches:
      - main
    types:
      - completed
```

The `workflow_run` workflow starts **after** the named workflow finishes. It receives an event with the triggering workflow's full result.

### The Gate Pattern

```yaml
- name: Check test workflow result
  run: |
    CONCLUSION="${{ github.event.workflow_run.conclusion }}"
    if [ "$CONCLUSION" != "success" ]; then
      echo "❌ Tests did not pass — deployment blocked"
      exit 1
    fi
    echo "✅ Tests passed — proceeding"
```

### Checking Out the Correct Commit

When `workflow_run` fires, `HEAD` is the latest main commit — not necessarily the commit that was tested. To deploy exactly what was tested:

```yaml
- name: Checkout tested commit
  uses: actions/checkout@v4
  with:
    ref: ${{ github.event.workflow_run.head_sha }}
```

### `workflow_run` vs `workflow_call`

| | `workflow_run` | `workflow_call` |
|---|---|---|
| **How triggered** | Automatically when a named workflow completes | Explicitly called by another workflow using `uses:` |
| **Coupling** | Loose — listens for an event, no tight dependency | Tight — caller explicitly invokes the callee |
| **Knows the result?** | Yes — `${{ github.event.workflow_run.conclusion }}` | No — if the called workflow fails, the calling job fails directly |
| **Runs in same context?** | No — separate run, separate context | Shares the caller's run context |
| **Can pass inputs?** | No — read-only access to trigger metadata | Yes — `inputs:` and `secrets:` |
| **Best for** | Post-CI deployment gates, notification workflows | Shared reusable build/test/deploy patterns |
| **Analogy** | Event listener (`addEventListener('tests-done', deploy)`) | Function call (`deploy(inputs)`) |

### Run Order in the Actions Tab

```
Push to main
    │
    ▼
[Run Tests]  (tests.yml fires first)
    │ ✅ success
    ▼
[Deploy After Tests]  (deploy-after-tests.yml fires via workflow_run)
    │ checks conclusion == 'success'
    ▼
    simulate deployment
```

---

## Task 6: `repository_dispatch` — External Event Triggers

### What It Is

`repository_dispatch` lets any external system — a Slack bot, monitoring alert, another CI system, a shell script — trigger a GitHub Actions workflow via the GitHub API. The caller sends an `event_type` and an arbitrary JSON `client_payload`.

### Triggering It

```bash
# Using the GitHub CLI (recommended)
gh api repos/<owner>/<repo>/dispatches \
  -f event_type=deploy-request \
  -f 'client_payload={"environment":"production","version":"v1.2.3","requester":"nandan"}'

# Using curl with a PAT
curl -X POST \
  -H "Authorization: Bearer $GITHUB_PAT" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/<owner>/<repo>/dispatches \
  -d '{"event_type":"deploy-request","client_payload":{"environment":"production"}}'
```

**Requirements:**
- The PAT or token must have `repo` scope (or `contents: write` in a fine-grained token)
- The request goes to the repo's default branch

### Reading the Payload

```yaml
- run: |
    echo "environment : ${{ github.event.client_payload.environment }}"
    echo "version     : ${{ github.event.client_payload.version }}"
```

The `client_payload` is a free-form JSON object — the sender can put anything in it. The workflow reads it through `github.event.client_payload.<key>`.

### When External Systems Trigger Pipelines

Real-world scenarios:

| External system | Event type | What happens |
|----------------|------------|-------------|
| **Slack bot** | `deploy-request` | Engineer types `/deploy production v1.2` in Slack → bot calls API → workflow deploys |
| **Monitoring (PagerDuty/Datadog)** | `rollback-request` | Alert fires for error spike → monitoring calls API → workflow rolls back to last good version |
| **Another CI system (Jenkins/GitLab)** | `smoke-test-request` | After Jenkins builds an artifact → triggers GitHub Actions for smoke tests |
| **Internal release tool** | `deploy-request` | Release manager clicks "Deploy" in an internal web app → app calls GitHub API → pipeline runs |
| **Webhook from partner service** | Any event | Partner notifies you of data update → trigger ingestion pipeline |

The key advantage: external systems don't need to know how your pipeline works — they just fire an event with a payload. The workflow decides what to do with it.

---

## Key Concepts Summary

| Concept | What It Does |
|---------|-------------|
| `pull_request: types:` | Filters which PR lifecycle events fire the workflow |
| `github.event.pull_request.merged` | `true` only if PR was actually merged (vs just closed) |
| `schedule: cron:` | Time-based trigger; multiple entries allowed; runs on default branch only |
| `paths:` filter | Include trigger — workflow only runs if a matching file changed |
| `paths-ignore:` filter | Exclude trigger — workflow skipped only if ALL changed files match |
| `workflow_run:` | Event-based trigger when a named workflow completes; receives conclusion |
| `github.event.workflow_run.conclusion` | `success`, `failure`, `cancelled`, `skipped` |
| `repository_dispatch:` | API-triggered workflow; receives `client_payload` from the caller |
| `github.event.client_payload.*` | Access to the JSON payload sent by the external system |
| `workflow_dispatch` alongside `schedule` | Allows manual test runs so you don't wait for the cron window |
