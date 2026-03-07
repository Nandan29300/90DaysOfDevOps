# Day 42 – Runners: GitHub-Hosted & Self-Hosted

---

## Overview

Every job in GitHub Actions needs a **machine** to execute on. That machine is called a **runner**. Today we explore two types:

| Type | Description |
|------|-------------|
| **GitHub-Hosted** | Cloud VMs managed entirely by GitHub — you pick the OS, GitHub provisions the machine |
| **Self-Hosted** | A machine you own and register with GitHub — your laptop, a VM, an EC2 instance, or any server |

Three workflow files were created:

| File | Task | Purpose |
|------|------|---------|
| `multi-os.yml` | Task 1 | 3 parallel jobs on Ubuntu, Windows, macOS |
| `preinstalled-tools.yml` | Task 2 | Print versions of pre-installed tools on ubuntu-latest |
| `self-hosted.yml` | Tasks 3–5 | Run a job on a self-hosted runner tagged with a custom label |

---

## Task 1: GitHub-Hosted Runners – Multi-OS

### What is a GitHub-Hosted Runner?

A **GitHub-hosted runner** is a cloud virtual machine (VM) that GitHub spins up fresh for every workflow job. It is:

- **Fully managed by GitHub** — you never install, patch, or maintain it
- **Ephemeral** — it is created at the start of the job and destroyed when the job finishes
- **Pre-loaded** with common tools (Docker, Git, Node, Python, Go, Java, etc.)
- **OS-specific** — you choose `ubuntu-latest`, `windows-latest`, or `macos-latest`

> Think of it as ordering a disposable cloud computer that lasts for exactly one job, already set up with your toolchain, and then gets erased.

### Who Manages It?

**GitHub** manages everything:
- Provisioning and deprovisioning the VM
- OS updates and security patches
- Pre-installing the common software stack
- Network connectivity
- Storage and compute

You only provide the YAML. GitHub does the rest.

### The Workflow

**File:** `.github/workflows/multi-os.yml`

```yaml
name: Multi-OS Runner Demo

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  ubuntu-job:
    runs-on: ubuntu-latest
    steps:
      - name: Print OS info
        run: echo "Running on OS: ${{ runner.os }}"
      - name: Print hostname
        run: hostname
      - name: Print current user
        run: whoami

  windows-job:
    runs-on: windows-latest
    steps:
      - name: Print OS info
        run: echo "Running on OS: ${{ runner.os }}"
      - name: Print hostname
        run: hostname
      - name: Print current user
        run: echo %USERNAME%

  macos-job:
    runs-on: macos-latest
    steps:
      - name: Print OS info
        run: echo "Running on OS: ${{ runner.os }}"
      - name: Print hostname
        run: hostname
      - name: Print current user
        run: whoami
```

### What Happens When You Push

Because all 3 jobs have **no `needs:` dependency**, they start **in parallel** the moment the workflow triggers:

```
multi-os.yml
├── ubuntu-job   ── starts immediately ──▶ (separate ubuntu VM)
├── windows-job  ── starts immediately ──▶ (separate windows VM)
└── macos-job    ── starts immediately ──▶ (separate macos VM)
```

All three run simultaneously on three different cloud machines.

### `runner.os` vs `runner.name`

| Context variable | What it prints |
|-----------------|----------------|
| `${{ runner.os }}` | `Linux`, `Windows`, or `macOS` — the OS family |
| `${{ runner.name }}` | The runner's unique machine name (e.g., `GitHub Actions 12`) |
| `hostname` command | Full hostname of the actual VM |
| `whoami` command | The user running the job (usually `runner` on Linux/macOS) |

---

## Task 2: Explore What's Pre-installed on `ubuntu-latest`

### The Workflow

**File:** `.github/workflows/preinstalled-tools.yml`

```yaml
name: Explore Pre-installed Tools

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  explore-ubuntu:
    runs-on: ubuntu-latest
    steps:
      - name: Print Docker version
        run: docker --version
      - name: Print Python version
        run: python3 --version
      - name: Print Node version
        run: node --version
      - name: Print Git version
        run: git --version
      - name: Print Java version
        run: java --version
      - name: Print Go version
        run: go version
      - name: Print runner architecture
        run: uname -m
      - name: Print available disk space
        run: df -h /
```

### Why Pre-installed Tools Matter

When a job starts on `ubuntu-latest`, the runner already has a full development toolchain loaded — you do **not** waste time installing common binaries every run.

**Without pre-installed tools:**
```
Install Docker (2 min) → Install Node (1 min) → Install Git (30 sec) → Run test (10 sec)
= ~3.5 minutes of setup for 10 seconds of actual work
```

**With pre-installed tools:**
```
Run test (10 sec)
= 10 seconds total
```

Benefits:
- **Faster pipelines** — no install overhead for standard tools
- **Simpler YAML** — you skip install steps for the common stack
- **Consistency** — every run uses the same known-good versions
- **Cost savings** — GitHub Actions bills by the minute; less time = lower cost

### Key Pre-installed Software on `ubuntu-latest`

| Category | Tools available |
|----------|----------------|
| Runtime | Python 3, Node.js, Ruby, Go, Java (JDK), .NET |
| Containers | Docker, Docker Compose, Podman |
| Version control | Git, GitHub CLI (`gh`) |
| Cloud CLIs | AWS CLI, Azure CLI, Google Cloud SDK |
| Build tools | make, cmake, gcc, g++ |
| Package managers | pip, npm, yarn, apt |
| Utilities | curl, wget, jq, unzip, zip, rsync |

Full list: https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md

---

## Task 3: Set Up a Self-Hosted Runner

### Steps (Done on Your Machine / VM)

**1. Go to your GitHub repo → Settings → Actions → Runners → New self-hosted runner**

Select:
- OS: **Linux**
- Architecture: **x64**

**2. Run the commands GitHub generates** (example — always copy from your own GitHub UI):

```bash
# Create a runner directory
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.x.x.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.x.x/actions-runner-linux-x64-2.x.x.tar.gz

# Extract the package
tar xzf ./actions-runner-linux-x64-2.x.x.tar.gz

# Configure the runner (GitHub generates your token automatically)
./config.sh --url https://github.com/YOUR-USERNAME/YOUR-REPO \
            --token YOUR_REGISTRATION_TOKEN
```

**3. Start the runner:**

```bash
# Run interactively (foreground — for testing)
./run.sh

# OR install as a persistent background service
sudo ./svc.sh install
sudo ./svc.sh start
```

**4. Verify in GitHub:**

Go to **Settings → Actions → Runners** — your runner should appear with a green **Idle** dot.

```
Runners
├── ✅ my-machine  (self-hosted, linux, x64)  Idle
```

### What Happens During Configuration

When you run `./config.sh`, the runner:
1. Authenticates to GitHub using the one-time registration token
2. Registers itself under your repo's runner pool
3. Creates a `.credentials` file to authenticate future job requests
4. Stores configuration in `.runner` file (name, OS, labels)

The token expires after 1 hour — if you miss the window, generate a new one from GitHub UI.

---

## Task 4: Use Your Self-Hosted Runner

### The Workflow

**File:** `.github/workflows/self-hosted.yml`

```yaml
name: Self-Hosted Runner Demo

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  run-on-self-hosted:
    runs-on: [self-hosted, my-linux-runner]

    steps:
      - name: Print hostname
        run: hostname

      - name: Print working directory
        run: pwd

      - name: Print current user
        run: whoami

      - name: Print runner OS and architecture
        run: uname -a

      - name: Create a proof file
        run: |
          echo "Job ran at $(date) on $(hostname)" > /tmp/day42-self-hosted-proof.txt
          cat /tmp/day42-self-hosted-proof.txt

      - name: Verify proof file exists
        run: |
          if [ -f /tmp/day42-self-hosted-proof.txt ]; then
            echo "✅ Proof file exists on the self-hosted machine"
          else
            echo "❌ Proof file not found"
            exit 1
          fi
```

### `runs-on: self-hosted`

When you write `runs-on: self-hosted`, GitHub looks in your repo's runner pool for any runner that carries the **built-in label `self-hosted`**. Every self-hosted runner automatically gets these default labels:

- `self-hosted` (always present)
- `linux` / `windows` / `macOS` (OS label)
- `x64` / `arm64` (architecture label)

### Proof File

After the workflow runs, check your machine:

```bash
cat /tmp/day42-self-hosted-proof.txt
# Output: Job ran at Sun Mar 8 10:30:00 UTC 2026 on your-machine-name
```

The file persists on your machine because self-hosted runners do **not** destroy the filesystem after the job. This is useful (persistent caches, artifacts) but also requires you to clean up yourself.

---

## Task 5: Labels

### Adding a Label During Setup

When you run `./config.sh`, you're prompted:

```
Enter the name of the runner group to add this runner to: [press Enter for Default]
Enter the name of runner: [my-linux-runner]
This runner will have the following labels: 'self-hosted', 'Linux', 'X64'
Enter any additional labels (ex. label-1,label-2): [my-linux-runner]
```

Or add labels in GitHub UI: **Settings → Actions → Runners → click runner → Edit**

### Using Labels in `runs-on`

```yaml
# Target ANY self-hosted runner
runs-on: self-hosted

# Target any self-hosted Linux runner
runs-on: [self-hosted, linux]

# Target a specific runner by custom label
runs-on: [self-hosted, my-linux-runner]

# Target a high-memory runner (if you label it that way)
runs-on: [self-hosted, high-memory]
```

### Why Labels Are Essential With Multiple Runners

Imagine you have 5 self-hosted runners:

```
Runner Pool:
├── dev-laptop        labels: [self-hosted, linux, my-linux-runner]
├── staging-server    labels: [self-hosted, linux, staging]
├── prod-server       labels: [self-hosted, linux, production]
├── gpu-machine       labels: [self-hosted, linux, gpu]
└── windows-vm        labels: [self-hosted, windows]
```

Without labels, `runs-on: self-hosted` sends the job to **whichever runner is free first** — a prod-only job might land on the dev laptop.

With labels:
- `runs-on: [self-hosted, production]` → only goes to `prod-server`
- `runs-on: [self-hosted, gpu]` → only goes to `gpu-machine`
- `runs-on: [self-hosted, windows]` → only goes to `windows-vm`

Labels give you **routing control** over your runner fleet.

---

## Task 6: GitHub-Hosted vs Self-Hosted

| | GitHub-Hosted | Self-Hosted |
|---|---|---|
| **Who manages it?** | GitHub — fully managed, zero ops from you | You — you provision, maintain, patch, and monitor it |
| **Cost** | Free for public repos; billed by the minute for private repos (Linux cheaper than macOS/Windows) | Free runner compute, but you pay for the underlying server (EC2, VPS, electricity) |
| **Pre-installed tools** | Rich toolchain pre-loaded (Docker, Node, Python, Go, etc.) | Only what you install — full control over the environment |
| **Good for** | Open source projects, standard CI/CD, simplicity, getting started fast | Long-running jobs, custom hardware (GPU), private network access, persistent caches, cost optimization at scale |
| **Security concern** | GitHub controls the machine — untrusted forks can run code on their own isolated runner (low risk on public repos) | **You** are responsible for security — avoid running untrusted PR code on self-hosted runners in public repos (high risk: malicious PR could access your machine/network) |

### Security Warning for Self-Hosted Runners on Public Repos

> Do **not** use self-hosted runners for public repositories unless you fully understand the risks. Anyone who can open a PR can potentially run arbitrary code on your machine if a workflow triggers on `pull_request` from forks.

Mitigations:
- Use self-hosted only for **private repos**, or
- Use `pull_request_target` carefully with explicit approval gates, or
- Isolate the runner in a sandboxed VM with no access to sensitive systems

---

## Runner Lifecycle Summary

```
GitHub-Hosted Runner lifecycle per job:
  1. Job queued           → GitHub allocates a fresh VM
  2. Runner starts        → Pulls job instructions from GitHub
  3. Job executes         → All steps run on the VM
  4. Job completes        → VM is wiped and destroyed forever

Self-Hosted Runner lifecycle per job:
  1. Job queued           → GitHub sends job to your registered runner
  2. Runner picks it up   → Executes in a workspace folder (_work/)
  3. Job completes        → Workspace may be retained (configurable)
  4. Runner stays idle    → Waits for the next job
```

---

## Quick Reference

```bash
# Install runner as a service (persists across reboots)
sudo ./svc.sh install
sudo ./svc.sh start

# Check service status
sudo ./svc.sh status

# Stop the service
sudo ./svc.sh stop

# Remove the runner from GitHub
./config.sh remove --token YOUR_REMOVAL_TOKEN

# View runner logs (systemd service)
journalctl -u actions.runner.YOUR-REPO.my-linux-runner -f
```
