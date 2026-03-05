# Day 40 – Your First GitHub Actions Workflow

---

## What is GitHub Actions?

**GitHub Actions** is GitHub's built-in CI/CD platform. It lets you define automated workflows — written as YAML files — that run in response to events (like a push, a PR, or a schedule) directly inside GitHub's infrastructure.

You don't need to set up a separate Jenkins server or CircleCI account. The workflow file lives **inside your repository**, and GitHub runs it for you on cloud VMs called **runners**.

> Think of GitHub Actions as a robot that wakes up every time you push code, reads a set of instructions you wrote, and executes them on a fresh cloud machine.

---

## Task 1: Repository Setup

### Step-by-step

```bash
# 1. Create a new public repo on GitHub called: github-actions-practice
#    (Done via GitHub UI → New repository → Public)

# 2. Clone it locally
git clone https://github.com/<your-username>/github-actions-practice.git
cd github-actions-practice

# 3. Create the workflow folder structure
mkdir -p .github/workflows
```

### Why `.github/workflows/`?

GitHub automatically watches this exact directory. Any `.yml` file placed here is treated as a workflow definition. This path is **hardcoded** — it cannot be customised.

```
github-actions-practice/
├── .github/
│   └── workflows/
│       └── hello.yml      ← GitHub reads this automatically
└── README.md
```

---

## Task 2: Hello Workflow

### The Workflow File

**File:** `.github/workflows/hello.yml`

```yaml
name: Hello GitHub Actions

on:
  push:

jobs:
  greet:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Say Hello
        run: echo "Hello from GitHub Actions!"

      - name: Print current date and time
        run: date

      - name: Print branch name
        run: echo "Triggered by branch: ${{ github.ref_name }}"

      - name: List files in the repo
        run: ls -la

      - name: Print runner operating system
        run: echo "Runner OS: ${{ runner.os }}"
```

### How to Push and Watch It Run

```bash
git add .github/
git commit -m "ci: add first GitHub Actions workflow"
git push origin main
```

Then:
1. Open your GitHub repository in a browser
2. Click the **Actions** tab at the top
3. You will see a new workflow run appear with a yellow spinner (running)
4. After ~30 seconds it turns **green ✅** — your first pipeline passed

### What a Green Run Looks Like

```
Actions tab
│
└── Hello GitHub Actions (workflow name)
    └── ci: add first GitHub Actions workflow (run triggered by commit)
        └── greet (job)
            ├── ✅ Set up job
            ├── ✅ Checkout code
            ├── ✅ Say Hello
            ├── ✅ Print current date and time
            ├── ✅ Print branch name
            ├── ✅ List files in the repo
            ├── ✅ Print runner operating system
            └── ✅ Complete job
```

Clicking any step expands its output — exactly like reading terminal output.

---

## Task 3: Anatomy of the Workflow File

### Every Key Explained (In Plain Words)

```yaml
name: Hello GitHub Actions
```
**`name:`** — The display name of the workflow. This is what appears in the Actions tab. It's optional but always include it — without it GitHub uses the filename.

---

```yaml
on:
  push:
```
**`on:`** — Defines the **trigger**: what event causes the workflow to run. Here, `push` means "run this workflow every time any commit is pushed to any branch." You can narrow it:
```yaml
on:
  push:
    branches: [main]         # only trigger on pushes to main
  pull_request:              # also trigger on PRs
```

---

```yaml
jobs:
  greet:
```
**`jobs:`** — The top-level container for all jobs. Each key under `jobs:` is a **job ID** (here: `greet`). Job IDs are used internally to wire jobs together with `needs:`.

---

```yaml
    runs-on: ubuntu-latest
```
**`runs-on:`** — Tells GitHub which type of **runner** (virtual machine) to provision for this job. `ubuntu-latest` is a fresh Ubuntu VM that GitHub spins up, runs your steps on, and then destroys. Every run gets a brand-new machine.

| Value | Machine |
|-------|---------|
| `ubuntu-latest` | Ubuntu 24.04 LTS |
| `windows-latest` | Windows Server 2022 |
| `macos-latest` | macOS 14 (Apple Silicon) |
| `self-hosted` | Your own registered server |

---

```yaml
    steps:
```
**`steps:`** — The ordered list of commands that run **sequentially** inside the job. If any step fails, all subsequent steps are skipped and the job is marked failed.

---

```yaml
      - name: Checkout code
        uses: actions/checkout@v4
```
**`uses:`** — Runs a **pre-built Action** from the GitHub Actions Marketplace. `actions/checkout@v4` is the official action to clone your repository onto the runner. Without this step, your runner is a blank VM with no code on it.

The `@v4` is the version tag — always pin to a version for stability and security.

---

```yaml
      - name: Say Hello
        run: echo "Hello from GitHub Actions!"
```
**`run:`** — Executes a **raw shell command** on the runner. The default shell is `bash` on Ubuntu. You can run anything you'd type in a terminal: `npm install`, `python main.py`, `docker build`, etc.

**`name:` (on a step)** — A human-readable label for the step. It shows up in the GitHub Actions UI so you can find it quickly. Without a name, GitHub shows the first 50 characters of the `run:` command instead.

---

### Complete Anatomy Diagram

```
hello.yml
│
├── name: ────────── Display name in Actions tab
│
├── on: ──────────── TRIGGER — what event fires the workflow
│   └── push
│
└── jobs: ────────── All jobs in this workflow
    └── greet: ───── JOB ID (user-defined name)
        │
        ├── runs-on: ── RUNNER — what machine to use
        │
        └── steps: ──── Ordered list of steps
            ├── name: ─── Label shown in UI
            │   uses: ─── Run a pre-built Action
            │
            ├── name: ─── Label shown in UI
            │   run: ──── Run a shell command
            │
            └── ...
```

---

## Task 4: Extended Steps Explained

The workflow above (Tasks 2 + 4 combined) includes these extra steps:

### Print date and time
```yaml
- name: Print current date and time
  run: date
```
`date` is a standard Linux command. Output on the runner looks like:
```
Wed Mar  5 10:23:44 UTC 2026
```
Useful for auditing exactly when a job ran.

---

### Print branch name
```yaml
- name: Print branch name
  run: echo "Triggered by branch: ${{ github.ref_name }}"
```
`${{ github.ref_name }}` is a **GitHub Actions context variable**. GitHub injects dozens of these automatically — no setup needed.

| Variable | Value |
|----------|-------|
| `github.ref_name` | Branch or tag name (`main`, `feature/login`) |
| `github.sha` | Full commit SHA |
| `github.actor` | Username who triggered the run |
| `github.repository` | `owner/repo` |
| `github.event_name` | `push`, `pull_request`, etc. |
| `runner.os` | `Linux`, `Windows`, `macOS` |

---

### List files
```yaml
- name: List files in the repo
  run: ls -la
```
Confirms the checkout step worked — you can see your files are on the runner. Useful for debugging path issues.

---

### Print runner OS
```yaml
- name: Print runner operating system
  run: echo "Runner OS: ${{ runner.os }}"
```
`runner.os` is a context variable from the `runner` context. Output: `Runner OS: Linux`.

---

## Task 5: Breaking the Pipeline on Purpose

### The Intentional Failure

```yaml
- name: This step will fail on purpose
  run: exit 1
```

Push this. In the Actions tab you will see:

```
greet (job)
├── ✅ Set up job
├── ✅ Checkout code
├── ✅ Say Hello
├── ❌ This step will fail on purpose
│       Process completed with exit code 1.
├── ⏭️  Print current date and time  (skipped — previous step failed)
└── ❌ Complete job
```

### What a Failed Pipeline Looks Like

```
Actions tab
│
└── Hello GitHub Actions
    └── ci: break it on purpose ❌ (red X)
        └── greet ❌
            └── This step will fail on purpose
                  Run exit 1
                  Error: Process completed with exit code 1.
```

Key things to observe:
1. The overall workflow run shows a **red ❌** in the Actions tab
2. The specific **job** that failed is highlighted in red
3. Expanding the failed step shows the exact error output and exit code
4. All steps **after** the failing step are automatically **skipped** (shown as grey)
5. GitHub can send you an **email notification** for failed runs (configurable in Settings → Notifications)

### How to Read the Error

1. Go to **Actions tab** → click the failed run
2. Click the **failed job** name (red)
3. Expand the **red step** — read the shell output
4. The exit code tells you what went wrong:
   - `exit code 1` = generic failure
   - `exit code 127` = command not found
   - `exit code 2` = misuse of shell built-in

### Fix and Recover

```yaml
# Remove or comment out the failing step, then push:
git add .github/workflows/hello.yml
git commit -m "fix: remove intentional failure step"
git push
```

The next run turns green again. GitHub keeps the history of all runs (pass and fail) — you can always look back.

---

## How GitHub Actions Pricing Works

| Usage | Cost |
|-------|------|
| Public repositories | **Free** — unlimited minutes |
| Private repos (free plan) | 2,000 minutes/month free |
| Ubuntu runner | 1x rate (cheapest) |
| Windows runner | 2x rate |
| macOS runner | 10x rate |

For everything in this challenge, your public repo will always be free.

---

## Points to Remember 📌

1. **Workflow files live in `.github/workflows/`** — this path is hardcoded. Any `.yml` file there is auto-detected by GitHub. The filename becomes the workflow name if you don't set `name:`.

2. **`on:` is the trigger, `jobs:` is the work** — without `on:`, nothing starts. Without `jobs:`, nothing runs. Both are mandatory.

3. **Every job gets a fresh, clean runner** — the runner is spun up from scratch for each run. Nothing persists between runs unless you use caching or artifacts.

4. **`uses:` vs `run:`** — `uses:` runs a pre-built Action (reusable package); `run:` executes raw shell commands. You can mix them freely in the same job.

5. **`actions/checkout@v4` is almost always your first step** — without it, the runner has no code. It's so fundamental it should be muscle memory.

6. **Steps run sequentially; jobs run in parallel (by default)** — if you have 3 jobs with no `needs:`, all 3 start at the same time on separate runners.

7. **A failed step fails the whole job** — subsequent steps are skipped. Use `continue-on-error: true` on a step if you want the job to carry on despite that step failing.

8. **GitHub context variables are your friend** — `${{ github.ref_name }}`, `${{ github.sha }}`, `${{ github.actor }}` give you rich metadata about the triggering event without any extra setup.

9. **Pin Action versions with `@v4`, never `@latest`** — unpinned versions can introduce breaking changes silently. Always use a tag or commit SHA.

10. **The Actions tab is your debugger** — every step's full shell output is visible there. When something breaks, read the expanded step output top-to-bottom, just like a terminal.

---

## Tips 💡

- Add `workflow_dispatch:` under `on:` to get a **"Run workflow"** button in the GitHub UI — great for manually triggering without pushing a commit:
  ```yaml
  on:
    push:
    workflow_dispatch:
  ```
- Use `echo "::notice::Your message"` to post a notice annotation visible directly in the PR — GitHub Actions has special log commands for this.
- Name your commits meaningfully — they appear as the workflow run title in the Actions tab. `fix: update config` is much more useful than `update`.
- Use the **Actions tab search bar** to filter runs by branch, status (success/failure), or actor.
- Prefix workflow filenames descriptively: `ci.yml`, `deploy.yml`, `lint.yml` — a project can have many workflows and clear names prevent confusion.

---

## Summary

| Task | Done | Key Learning |
|------|------|-------------|
| 1 | ✅ Created repo & `.github/workflows/` folder | GitHub auto-detects any `.yml` in `.github/workflows/` |
| 2 | ✅ Wrote `hello.yml` — trigger, job, 2 steps | Pushed → green run in Actions tab in ~30s |
| 3 | ✅ Explained every key: `on`, `jobs`, `runs-on`, `steps`, `uses`, `run`, `name` | `uses` = pre-built action; `run` = raw shell command |
| 4 | ✅ Added 4 more steps: date, branch name, file list, runner OS | `${{ github.ref_name }}` and `${{ runner.os }}` are context variables |
| 5 | ✅ Broke pipeline with `exit 1`, observed red run, fixed it | Failed step = red ❌, subsequent steps skipped, full error in expanded log |
