# Day 39 – What is CI/CD?

---

## What is CI/CD? (Definition)

**CI/CD** stands for **Continuous Integration / Continuous Delivery (or Deployment)**. It is a set of **engineering practices and automated pipelines** that allow software teams to integrate code changes frequently, validate them automatically, and deliver them to production reliably and repeatedly — with minimal manual effort.

> Think of CI/CD as an **automated assembly line** for software. A car factory doesn't build one car manually from scratch each time — it has a pipeline where parts are added, tested, and inspected at each stage. CI/CD does the same for code.

---

## Task 1: The Problem — Why CI/CD Exists

### Scenario: 5 Developers, Manual Deployments

Imagine a team of 5 developers all pushing code to the same repo and manually deploying to production:

### What Can Go Wrong?

| Problem | Description |
|---------|-------------|
| **Merge conflicts** | All 5 devs work in isolation for days, then try to merge — massive conflicts that take hours to resolve |
| **Integration failures** | Dev A's code works alone; Dev B's code works alone; combined — they break each other silently |
| **Inconsistent environments** | Each developer has different OS versions, library versions, environment variables on their machine |
| **Human error in deployment** | Wrong branch deployed, wrong server, wrong config file — someone runs the wrong command at 5 PM on a Friday |
| **No rollback plan** | Manual deployment has no automated rollback — if it breaks, fixing it means another manual deploy |
| **No visibility** | No one knows what exactly is in production — was that hotfix deployed? Did the migration run? |
| **Slow feedback** | Bugs discovered days after the code was written — the developer has already moved on mentally |
| **Fear of deploying** | Teams that deploy manually start deploying less often — creating larger, riskier deployments each time |

### "It Works on My Machine" — Why It's a Real Problem

This phrase is the symptom of **environment inconsistency**. A developer runs the app on their laptop (macOS, Node 18, local PostgreSQL 14, `.env` with their own settings) and it works perfectly. They push to production (Ubuntu 22, Node 20, PostgreSQL 16, different env vars) and it crashes.

**Root causes:**
- Different OS or runtime versions
- Missing environment variables
- Locally installed global packages not declared in `package.json`
- Hardcoded local file paths
- Local database with test data that masks a SQL bug

**CI/CD solves this** by running every code change in a **clean, identical, controlled environment** (a Docker container or fresh VM) — so "works in CI" means "will work in production."

### How Many Times Can a Team Safely Deploy Manually?

| Deployment Method | Safe Frequency |
|-------------------|---------------|
| **Manual** (copy files, SSH, run scripts) | 1–2 times per week at best |
| **Manual with a checklist** | A few times per week |
| **Automated CI/CD** | Dozens to hundreds of times per day |

Amazon deploys to production every **11.7 seconds** on average. That is only possible because of fully automated CI/CD — no human touches the deployment process.

---

## Task 2: CI vs CD — Definitions

### 1. Continuous Integration (CI)

**Definition:** The practice of developers merging their code changes into a shared repository **frequently** (multiple times a day), with each merge automatically triggering a pipeline that **builds and tests** the code.

**What happens:**
- Developer pushes a commit or opens a PR
- Automated pipeline triggers instantly
- Code is compiled/built
- Unit tests, integration tests, linting, security scans run
- Developer gets fast feedback (pass/fail in minutes)

**What it catches:**
- Broken builds (code doesn't compile)
- Test failures introduced by new code
- Merge conflicts caught early (before they become massive)
- Style/lint violations
- Security vulnerabilities in dependencies

**Real-world example:**  
A developer on the FastAPI team opens a PR. Within minutes, GitHub Actions runs the entire test suite across Python 3.10, 3.12, 3.13, and 3.14 on macOS, Windows, and Ubuntu simultaneously. If any test fails on any combination, the PR is blocked from merging.

---

### 2. Continuous Delivery (CD)

**Definition:** An extension of CI where code that passes all tests is **automatically prepared and made ready to deploy** to production at any time — but the actual deployment to production still requires a **manual approval** step.

**How it differs from CI:**
- CI = integrate and test automatically
- Continuous Delivery = CI + automatically prepare a deployable release
- The key word is **"delivery"** — the package is delivered to the door; a human decides when to open the door

**What "delivery" means:**  
The pipeline builds a Docker image, tags it, pushes it to the registry, and updates a staging environment — all automatically. A human then reviews it on staging and clicks "Deploy to Production."

**Real-world example:**  
A fintech company uses Continuous Delivery because production deployments must be approved by a senior engineer and scheduled during a maintenance window (regulatory requirement). The pipeline does everything up to staging automatically; production needs a sign-off.

---

### 3. Continuous Deployment (CD)

**Definition:** Goes one step further than Continuous Delivery — every code change that passes all automated tests is **automatically deployed all the way to production** with zero human intervention.

**How it differs from Delivery:**
- Continuous Delivery = human manually triggers production deploy
- Continuous Deployment = production deploy is automatic after tests pass

**When teams use it:**
- High test coverage and confidence in the pipeline
- Fast-moving products (SaaS, web apps) where shipping quickly is competitive advantage
- Teams with excellent monitoring and rollback mechanisms (feature flags, canary deploys)

**Real-world example:**  
GitHub itself uses Continuous Deployment. When engineers merge to the main branch, the code automatically flows through tests → build → deploy to production within minutes. They deploy hundreds of times per day.

---

### CI vs CD vs CD — Summary

```
 👨‍💻  Developer writes code & pushes a commit
        │
        ▼
════════════════════════════════════════════════════════════════════
  CONTINUOUS INTEGRATION  (CI)
  "Does the code work at all?"
════════════════════════════════════════════════════════════════════
        │
        ├──▶  Fetch latest code from shared repo
        │
        ├──▶  Build / Compile
        │         └─ Does it even build without errors?
        │
        ├──▶  Unit Tests
        │         └─ Do individual functions behave correctly?
        │
        ├──▶  Integration Tests
        │         └─ Do components work together?
        │
        ├──▶  Linting / Code Style checks
        │         └─ Is the code clean & consistent?
        │
        └──▶  Security / Dependency scan
                  └─ Any known vulnerabilities in libraries?

        RESULT:
        ✅ All pass  →  "Code is safe to merge"
        ❌ Any fail  →  Notify developer immediately. Merge blocked.

        │  (only if ✅)
        ▼
════════════════════════════════════════════════════════════════════
  CONTINUOUS DELIVERY  (CD — the first CD)
  "Is the software always ready to ship?"
════════════════════════════════════════════════════════════════════
        │
        ├──▶  Package the application
        │         └─ Create a versioned, deployable artifact
        │              (e.g., a binary, JAR file, zip, Docker image)
        │
        ├──▶  Deploy to Staging / QA environment  (automatically)
        │         └─ Identical setup to production
        │
        ├──▶  Run automated acceptance / smoke tests on staging
        │         └─ Does the full system behave as expected?
        │
        └──▶  Release is READY — sitting at the gate ✈️

        RESULT:
        ✅ All pass  →  "Production deploy is ONE CLICK away"
        🧑 A human decides WHEN to push the button
           (business timing, approvals, change windows)

        │  (human approves OR auto-triggers if Continuous Deployment)
        ▼
════════════════════════════════════════════════════════════════════
  CONTINUOUS DEPLOYMENT  (CD — the second CD)
  "Every passing change goes live automatically"
════════════════════════════════════════════════════════════════════
        │
        ├──▶  Automatically deploy to PRODUCTION
        │         (no human involved)
        │
        ├──▶  Run production smoke tests
        │         └─ Is the live app responding correctly?
        │
        ├──▶  Monitor metrics & error rates
        │         └─ CPU, latency, error rate, crash reports
        │
        └──▶  Auto-rollback if anomaly detected 🔄

        RESULT:
        ✅ All pass  →  New version is LIVE for real users 🚀
        ❌ Anomaly   →  Automatic rollback to previous version

════════════════════════════════════════════════════════════════════
  QUICK COMPARISON
════════════════════════════════════════════════════════════════════

  CI                 │  Continuous Delivery      │  Continuous Deployment
  ───────────────────┼───────────────────────────┼────────────────────────
  Merge & test code  │  Always shippable code    │  Auto-ship every change
  automatically      │  + deploy to staging      │  straight to production
  ───────────────────┼───────────────────────────┼────────────────────────
  Ends at:           │  Ends at:                 │  Ends at:
  "merge is safe"    │  "release is ready"       │  "users have it now"
  ───────────────────┼───────────────────────────┼────────────────────────
  Human needed?      │  Human needed?            │  Human needed?
  No                 │  YES — for prod deploy    │  No
  ───────────────────┼───────────────────────────┼────────────────────────
  Example teams:     │  Fintech, healthcare      │  GitHub, Netflix,
  Everyone           │  (regulated industries)   │  SaaS startups

════════════════════════════════════════════════════════════════════
```

---

## Task 3: Pipeline Anatomy

### The Building Blocks

```
PIPELINE
│
├── Trigger          ← What starts the pipeline
│
├── Stage: Build
│   └── Job: compile
│       ├── Step: checkout code
│       ├── Step: install dependencies
│       └── Step: build binary / Docker image
│
├── Stage: Test
│   ├── Job: unit-tests
│   │   ├── Step: run unit tests
│   │   └── Step: upload coverage report (artifact)
│   └── Job: lint
│       └── Step: run linter
│
└── Stage: Deploy
    └── Job: deploy-staging
        ├── Step: pull built image (artifact)
        ├── Step: push to registry
        └── Step: deploy to server
```

### Each Part Explained

#### Trigger
**What it is:** The event that starts the pipeline automatically.

**Common triggers:**
```yaml
on:
  push:
    branches: [main, develop]      # Push to specific branches
  pull_request:                    # Any PR opened or updated
  schedule:
    - cron: "0 2 * * *"           # Every night at 2 AM
  workflow_dispatch:               # Manual button click in GitHub UI
  release:
    types: [published]             # When a GitHub release is published
```

---

#### Stage
**What it is:** A **logical phase** of the pipeline that groups related jobs together. Stages run **sequentially** — the next stage only starts if the previous one passes.

**Typical stages:**
| Stage | Purpose |
|-------|---------|
| `build` | Compile code, install deps, build Docker image |
| `test` | Run unit, integration, e2e tests |
| `security` | Dependency scanning, SAST, container image scanning |
| `package` | Push image to registry, create release artifact |
| `deploy-staging` | Deploy to staging environment |
| `deploy-production` | Deploy to production (may need approval) |

---

#### Job
**What it is:** A **unit of work** inside a stage. Each job runs on its own **runner** (fresh virtual machine or container). Jobs within the same stage can run **in parallel**.

```yaml
jobs:
  unit-tests:           # job 1 — runs in parallel with lint
    runs-on: ubuntu-latest
    steps: [...]

  lint:                 # job 2 — runs in parallel with unit-tests
    runs-on: ubuntu-latest
    steps: [...]

  deploy:               # job 3 — waits for both above
    needs: [unit-tests, lint]
    steps: [...]
```

---

#### Step
**What it is:** A **single command or action** inside a job. Steps run **sequentially** within a job — one after the other.

```yaml
steps:
  - name: Checkout code              # Step 1
    uses: actions/checkout@v4

  - name: Install dependencies       # Step 2
    run: npm ci

  - name: Run tests                  # Step 3
    run: npm test

  - name: Build Docker image         # Step 4
    run: docker build -t myapp:${{ github.sha }} .
```

---

#### Runner
**What it is:** The **machine** (VM or container) that executes a job. Every job gets a fresh runner — nothing from a previous run is left behind.

| Runner Type | Description |
|-------------|-------------|
| `ubuntu-latest` | GitHub-hosted Ubuntu VM (free) |
| `windows-latest` | GitHub-hosted Windows VM |
| `macos-latest` | GitHub-hosted macOS VM |
| Self-hosted | Your own server registered with GitHub |

**Why fresh runners matter:** Every job starts clean — no leftover files, no cached state from a previous broken run. This ensures reproducibility.

---

#### Artifact
**What it is:** A **file or directory produced by a job** that needs to be passed to another job or downloaded after the pipeline. Jobs don't share a filesystem (they run on different runners), so artifacts are the way to pass outputs between jobs.

**Common artifacts:**
- Compiled binary (`./server`)
- Docker image tar file
- Test coverage HTML report
- Build log files
- Deployed `dist/` folder

```yaml
# Upload artifact in one job
- uses: actions/upload-artifact@v4
  with:
    name: build-output
    path: ./dist/

# Download in another job
- uses: actions/download-artifact@v4
  with:
    name: build-output
```

---

## Task 4: Pipeline Diagram

### Scenario: Developer pushes code → tested → Docker image built → deployed to staging

```
 Developer
    │
    │  git push / opens PR
    ▼
┌───────────────────────────────────────────────────────────────┐
│  TRIGGER                                                       │
│  push to main or pull_request opened                          │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 1 — TEST                                                │
│                                                                │
│  ┌─────────────────────────┐  ┌────────────────────────────┐  │
│  │  Job: unit-tests         │  │  Job: lint                  │  │
│  │  Runner: ubuntu-latest   │  │  Runner: ubuntu-latest      │  │
│  │  Steps:                  │  │  Steps:                     │  │
│  │   1. checkout            │  │   1. checkout               │  │
│  │   2. install deps        │  │   2. install deps           │  │
│  │   3. run npm test        │  │   3. run eslint             │  │
│  │   4. upload coverage     │  └────────────────────────────┘  │
│  │      (artifact)          │                                  │
│  └─────────────────────────┘                                  │
│        ↑ runs in parallel ↑                                    │
└────────────────────────┬──────────────────────────────────────┘
                         │  both jobs must pass ✅
                         ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 2 — BUILD                                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Job: build-image                                         │ │
│  │  Runner: ubuntu-latest                                    │ │
│  │  Steps:                                                   │ │
│  │   1. checkout code                                        │ │
│  │   2. docker login to Docker Hub                           │ │
│  │   3. docker build -t nandan29300/myapp:$GIT_SHA .         │ │
│  │   4. docker push nandan29300/myapp:$GIT_SHA               │ │
│  │   5. docker tag ... :latest && docker push :latest        │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬──────────────────────────────────────┘
                         │  image pushed to Docker Hub ✅
                         ▼
┌───────────────────────────────────────────────────────────────┐
│  STAGE 3 — DEPLOY TO STAGING                                   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Job: deploy-staging                                      │ │
│  │  Runner: ubuntu-latest                                    │ │
│  │  Steps:                                                   │ │
│  │   1. SSH into staging server                              │ │
│  │   2. docker pull nandan29300/myapp:$GIT_SHA               │ │
│  │   3. docker compose up -d (with new image tag)            │ │
│  │   4. run smoke test: curl https://staging.myapp.com/health│ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
                  ✅ Staging live
                  🧑 Team reviews on staging
                  🚀 Manual approve → Production deploy
```

---

## Task 5: Explore in the Wild — FastAPI's CI Workflow

**Repo explored:** `tiangolo/fastapi`  
**Workflow file:** `.github/workflows/test.yml`  
**Link:** `https://github.com/tiangolo/fastapi/blob/master/.github/workflows/test.yml`

### What Triggers It?

```yaml
on:
  push:
    branches:
      - master                    # Direct push to master
  pull_request:
    types:
      - opened
      - synchronize               # PR opened or new commits pushed to PR
  schedule:
    - cron: "0 0 * * 1"          # Every Monday at midnight (weekly regression)
```

Three triggers:
1. Push to `master`
2. Any PR opened or updated
3. Weekly scheduled run every Monday midnight

### How Many Jobs Does It Have?

**5 jobs:**

| Job | Purpose |
|-----|---------|
| `changes` | Path filtering — checks if source files actually changed; skips the pipeline if only docs were updated (saves CI minutes) |
| `test` | Runs the full test suite using a **matrix strategy** — tests across Python 3.10, 3.12, 3.13, 3.14 on Ubuntu, macOS, and Windows simultaneously |
| `benchmark` | Runs performance benchmarks using CodSpeed to catch regressions in response time |
| `coverage-combine` | Downloads all coverage artifacts from the matrix test runs and merges them into one report. Fails if coverage drops below 100% |
| `check` | A "gate" job — only passes if all other jobs succeeded. Used for GitHub branch protection rules |

### What Does It Do? (Best Guess → Verified)

1. **Filter changes** — if only documentation changed, skip the expensive test matrix entirely
2. **Run tests on every OS + Python version combination** — the matrix creates ~12 parallel jobs (4 Python versions × 3 OSes). Each job installs deps with `uv` and runs `pytest` with coverage
3. **Run benchmarks** — measures performance of the framework to catch slowdowns introduced by new code
4. **Merge coverage reports** — combines coverage from all 12 jobs into one report and enforces 100% code coverage
5. **Final gate check** — branch protection requires this job to pass before any PR can merge

### Key Insight from This Workflow

FastAPI uses `dorny/paths-filter` to check if test-relevant files changed before running the expensive matrix. If only a `.md` file changed, the entire test suite is **skipped** — saving GitHub Actions minutes and speeding up documentation PRs. This is a real-world optimisation pattern worth copying.

---

## CI/CD Tools Landscape

| Tool | Type | Best For |
|------|------|---------|
| **GitHub Actions** | Cloud-native, YAML | Any project on GitHub — free for public repos |
| **GitLab CI/CD** | Built into GitLab | Self-hosted teams, enterprise |
| **Jenkins** | Open-source, self-hosted | Large orgs needing full control |
| **CircleCI** | Cloud | Speed — very fast parallel builds |
| **ArgoCD** | GitOps for Kubernetes | CD specifically for K8s deployments |
| **Tekton** | Cloud-native pipelines | Kubernetes-native CI/CD |

We will use **GitHub Actions** for the rest of this challenge — it's the most widely used, free for public repos, and the YAML syntax builds directly on Day 38.

---

## Points to Remember 📌

1. **CI/CD is a practice, not a tool** — Jenkins, GitHub Actions, GitLab CI are all tools that *implement* CI/CD. The practice is: integrate often, test automatically, deploy reliably.

2. **Continuous Integration ≠ Continuous Deployment** — CI = merge and test automatically. CD (Delivery) = release is always ready. CD (Deployment) = automatically pushed to production. Know the difference — interviewers love this question.

3. **A failing pipeline is CI/CD doing its job** — a red build is not a problem, it's the system working as designed. The problem would be deploying broken code to users.

4. **Jobs in the same stage run in parallel; stages run sequentially** — this is what makes CI fast. Tests and linting run at the same time; deploy only runs after both pass.

5. **Every job gets a fresh runner** — there is no shared state between jobs. Artifacts are the only way to pass files from one job to another.

6. **`needs:` creates job dependencies** — without `needs:`, all jobs run in parallel. Use `needs: [job1, job2]` to make a job wait for others to pass first.

7. **The deploy stage should only run on `main`** — use `if: github.ref == 'refs/heads/main'` to prevent feature branch pushes from deploying to production.

8. **Secrets must never be in YAML files** — use GitHub repository secrets (`Settings → Secrets`) for Docker Hub passwords, SSH keys, API tokens. Reference them as `${{ secrets.MY_SECRET }}`.

9. **Path filtering saves CI minutes** — use `paths:` in `on:` triggers or tools like `dorny/paths-filter` to only run expensive jobs when relevant files change.

10. **Small, frequent commits make CI work well** — a 50-file commit is hard to debug if CI fails. Commit small, merge often, let CI catch problems early when they're cheap to fix.

---

## Tips 💡

- Use `workflow_dispatch:` in your `on:` block to add a manual trigger button in the GitHub UI — great for deployments that need human initiation.
- Use **matrix strategy** to test across multiple versions without duplicating job definitions:
  ```yaml
  strategy:
    matrix:
      node: [18, 20, 22]
  ```
- Add a **CI status badge** to your `README.md` so contributors can see pipeline health at a glance:
  ```markdown
  ![CI](https://github.com/username/repo/actions/workflows/ci.yml/badge.svg)
  ```
- Use `continue-on-error: true` on non-critical steps (like uploading coverage) so a flaky upload doesn't fail the whole pipeline.
- Set `timeout-minutes:` on jobs to prevent runaway jobs from eating all your CI minutes:
  ```yaml
  jobs:
    test:
      timeout-minutes: 15
  ```
- Browse `.github/workflows/` of any popular open-source project when starting a new pipeline — don't invent from scratch, learn from battle-tested examples.

---

## Summary

| Task | Done | Key Learning |
|------|------|-------------|
| 1 | ✅ Identified 8 problems with manual deployments | "Works on my machine" = environment inconsistency; CI/CD solves with clean controlled runners |
| 2 | ✅ Defined CI, Continuous Delivery, Continuous Deployment | CI = test automatically; Delivery = human deploys; Deployment = fully automated to prod |
| 3 | ✅ Explained all 6 pipeline building blocks | Trigger → Stage → Job (parallel) → Step (sequential) → Runner → Artifact |
| 4 | ✅ Drew a 3-stage pipeline diagram | Test (parallel jobs) → Build (Docker image) → Deploy to Staging |
| 5 | ✅ Explored FastAPI's `.github/workflows/test.yml` | 3 triggers, 5 jobs, matrix testing across 12 OS+Python combos, 100% coverage gate |
