# Day 46 – Reusable Workflows & Composite Actions

---

## Overview

Today the focus shifts from writing duplicate pipelines to **DRY CI/CD** — define the logic once, call it everywhere. Two mechanisms achieve this:

| Mechanism | File location | Invoked by |
|-----------|--------------|------------|
| **Reusable workflow** | `.github/workflows/*.yml` | A `uses:` key inside a caller **job** |
| **Composite action** | `.github/actions/<name>/action.yml` | A `uses:` key inside a caller **step** |

Files created today:

| File | Purpose |
|------|---------|
| `.github/workflows/reusable-build.yml` | The reusable workflow — triggered only by `workflow_call` |
| `.github/workflows/call-build.yml` | Caller that invokes the reusable workflow |
| `.github/actions/setup-and-greet/action.yml` | Custom composite action |
| `.github/workflows/use-composite-action.yml` | Workflow that uses the composite action |

---

## Task 1: Understanding `workflow_call`

### What Is a Reusable Workflow?

A reusable workflow is a **normal workflow YAML file** where the only trigger is `workflow_call`. This makes it impossible to run directly from a push or schedule — it can only be invoked by another workflow.

Think of it as a **function** in a programming language:
- The reusable workflow is the function definition
- The caller workflow is the function call
- `inputs:` are the function parameters
- `outputs:` are the return values
- `secrets:` are like sensitive parameters that are passed separately

### The `workflow_call` Trigger

```yaml
on:
  workflow_call:
    inputs:
      app_name:
        type: string
        required: true
    secrets:
      docker_token:
        required: true
    outputs:
      build_version:
        value: ${{ jobs.build.outputs.build_version }}
```

Unlike `push` or `pull_request`, `workflow_call` makes the file inert until another workflow calls it via `uses:`.

### Calling a Reusable Workflow vs Using an Action (`uses:`)

| | `uses:` in a **job** (reusable workflow) | `uses:` in a **step** (action) |
|---|---|---|
| Granularity | Entire reusable workflow (can have multiple jobs) | Single step inside a job |
| Can contain jobs? | ✅ Yes — multiple jobs with `needs:` | ❌ No — only steps |
| Runs on its own runner? | ✅ Each job gets a fresh VM | ❌ Runs in the parent job's VM |
| Can pass secrets? | ✅ Via `secrets:` section | ⚠️ Via `env:` or `with:` (no dedicated `secrets:` block) |
| Nesting limit | Max 4 levels deep | Unlimited |

### Where Must a Reusable Workflow Live?

In the **same** repo: `.github/workflows/<file>.yml`  
In a **different** repo (cross-repo): `org/repo/.github/workflows/file.yml@ref`  

The file must be in `.github/workflows/` — this path is not configurable.

---

## Task 2: Reusable Workflow

### The File

**File:** `.github/workflows/reusable-build.yml`

```yaml
name: Reusable Build Pipeline

on:
  workflow_call:
    inputs:
      app_name:
        description: Name of the application being built
        type: string
        required: true
      environment:
        description: Target deployment environment
        type: string
        required: false
        default: staging
    secrets:
      docker_token:
        required: true
    outputs:
      build_version:
        description: Versioned tag generated during the build
        value: ${{ jobs.build.outputs.build_version }}

jobs:
  build:
    name: Build ${{ inputs.app_name }}
    runs-on: ubuntu-latest
    outputs:
      build_version: ${{ steps.version.outputs.build_version }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Print build context
        run: |
          echo "Building:    ${{ inputs.app_name }}"
          echo "Environment: ${{ inputs.environment }}"
          echo "Docker token is set: $([ -n '${{ secrets.docker_token }}' ] && echo true || echo false)"

      - name: Generate build version
        id: version
        run: |
          SHORT_SHA=$(echo "${{ github.sha }}" | cut -c1-7)
          BUILD_VERSION="v1.0-${SHORT_SHA}"
          echo "build_version=${BUILD_VERSION}" >> "$GITHUB_OUTPUT"
          echo "Generated build version: ${BUILD_VERSION}"
```

### Key Points

**Secret safety — why print `true`/`false` instead of the value:**

```bash
# Safe — only confirms the secret exists
echo "Docker token is set: $([ -n '${{ secrets.docker_token }}' ] && echo true || echo false)"

# Dangerous — even with masking, don't do this
echo "Token: ${{ secrets.docker_token }}"
```

Even though GitHub auto-masks secrets, a partially encoded or split value may bypass the mask. Confirming presence (`true`/`false`) is the safest pattern.

**Output chain — three levels:**
```
step output          → stored in GITHUB_OUTPUT
job output           → reads from steps.<id>.outputs.<name>
workflow_call output → reads from jobs.<job-id>.outputs.<name>
```

---

## Task 3: Caller Workflow

### The File

**File:** `.github/workflows/call-build.yml`

```yaml
name: Call Reusable Build

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  build:
    name: Invoke reusable build
    uses: ./.github/workflows/reusable-build.yml
    with:
      app_name: "my-web-app"
      environment: "production"
    secrets:
      docker_token: ${{ secrets.DOCKER_TOKEN }}

  print-version:
    name: Print build version from reusable workflow
    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Print version output
        run: |
          echo "Build version: ${{ needs.build.outputs.build_version }}"
```

### What You See in the Actions Tab

When this workflow runs, GitHub shows two jobs in the graph:
```
Invoke reusable build ──✅──▶ Print build version from reusable workflow
       │
       └── (expands to show the reusable workflow's internal jobs)
```

The caller's `build` job doesn't have steps — it has a nested workflow run. GitHub renders it as an expandable section so you can see the reusable workflow's own steps inside the caller's run.

### Caller Syntax Reference

```yaml
# Same repo — path relative to repo root
uses: ./.github/workflows/reusable-build.yml

# Different repo at a specific branch/tag/SHA
uses: org/shared-workflows/.github/workflows/build.yml@main
uses: org/shared-workflows/.github/workflows/build.yml@v2.1.0
uses: org/shared-workflows/.github/workflows/build.yml@abc1234
```

---

## Task 4: Outputs from a Reusable Workflow

### The Output Chain (Three Levels)

```
Inside reusable workflow:
  step:  echo "build_version=v1.0-a1b2c3d" >> "$GITHUB_OUTPUT"
  job:   outputs: { build_version: ${{ steps.version.outputs.build_version }} }
  on.workflow_call: outputs: { build_version: { value: ${{ jobs.build.outputs.build_version }} } }
                                                                          ↑
                                          This is what the caller reads

In the caller:
  ${{ needs.build.outputs.build_version }}   →   "v1.0-a1b2c3d"
```

### Why Three Levels?

Because the value travels through three isolated scopes:
1. **Step** — runs in a shell process; writes to a file
2. **Job** — aggregates step outputs; the job's VM reports them back to GitHub
3. **Workflow** — the reusable workflow reports job outputs to the caller

Skipping any level means the value won't propagate. All three declarations are required.

---

## Task 5: Composite Action

### What Is a Composite Action?

A composite action bundles multiple steps into a single reusable unit, invoked at the **step** level with `uses:`. It runs inside the calling job's VM — no separate runner is spawned.

### The File

**File:** `.github/actions/setup-and-greet/action.yml`

```yaml
name: Setup and Greet
description: Prints a greeting in the given language and exposes a greeted output.

inputs:
  name:
    description: Name of the person or service to greet
    required: true
  language:
    description: Language for the greeting (en, es, fr, hi, de)
    required: false
    default: en

outputs:
  greeted:
    description: Set to true after the greeting is printed
    value: ${{ steps.greet.outputs.greeted }}

runs:
  using: composite
  steps:
    - name: Print greeting
      id: greet
      shell: bash
      run: |
        case "${{ inputs.language }}" in
          es) echo "¡Hola, ${{ inputs.name }}! 👋" ;;
          fr) echo "Bonjour, ${{ inputs.name }} ! 👋" ;;
          hi) echo "नमस्ते, ${{ inputs.name }}! 👋" ;;
          de) echo "Hallo, ${{ inputs.name }}! 👋" ;;
          *)  echo "Hello, ${{ inputs.name }}! 👋" ;;
        esac
        echo "greeted=true" >> "$GITHUB_OUTPUT"

    - name: Print context
      shell: bash
      run: |
        echo "Date      : $(date -u)"
        echo "Runner OS : ${{ runner.os }}"
        echo "Repo      : ${{ github.repository }}"
```

**`shell: bash` is required** in composite action steps — unlike regular workflow steps, composite steps don't inherit a default shell. You must declare it explicitly.

### The Caller Workflow

**File:** `.github/workflows/use-composite-action.yml`

```yaml
- name: Greet in English (default)
  id: greet-en
  uses: ./.github/actions/setup-and-greet
  with:
    name: "GitHub Actions"

- name: Greet in Hindi
  id: greet-hi
  uses: ./.github/actions/setup-and-greet
  with:
    name: "Nandan"
    language: hi

- name: Check greeted output
  run: |
    echo "greeted (EN): ${{ steps.greet-en.outputs.greeted }}"
    if [ "${{ steps.greet-en.outputs.greeted }}" = "true" ]; then
      echo "✅ Composite action output verified"
    else
      echo "❌ Composite action output missing"; exit 1
    fi
```

### Composite Action Directory Layout

```
.github/
└── actions/
    └── setup-and-greet/
        └── action.yml      ← the composite action definition
```

The directory can have any name, but the file inside must be named `action.yml` (or `action.yaml`). The `uses:` path points to the **directory**, not the file:

```yaml
uses: ./.github/actions/setup-and-greet   # ✅ correct — points to directory
uses: ./.github/actions/setup-and-greet/action.yml   # ❌ wrong — don't include the filename
```

---

## Task 6: Reusable Workflow vs Composite Action

| | Reusable Workflow | Composite Action |
|---|---|---|
| **Triggered by** | `workflow_call` in `on:` | `uses:` in a **step** |
| **Can contain jobs?** | ✅ Yes — multiple jobs with `needs:` | ❌ No — only steps |
| **Can contain multiple steps?** | ✅ Yes (within each job) | ✅ Yes |
| **Lives where?** | `.github/workflows/` | `.github/actions/<name>/` |
| **Can accept secrets directly?** | ✅ Yes — dedicated `secrets:` block in `workflow_call` | ⚠️ No — passed via `with:` or `env:` (not encrypted) |
| **Runs on its own runner?** | ✅ Yes — each job gets a fresh, isolated VM | ❌ No — runs in the calling job's VM |
| **Can have `needs:` between internal jobs?** | ✅ Yes | ❌ Not applicable |
| **Max nesting depth** | 4 levels | Unlimited |
| **Best for** | Full multi-job pipelines (build → test → deploy) shared across repos | Small, focused utilities reused across steps (setup env, notify, tag release) |

### Decision Guide

```
Do you need multiple jobs with sequential/parallel dependencies?
  ─▶ Reusable Workflow

Do you just need a few steps that run inside an existing job?
  ─▶ Composite Action

Is the logic used across completely different repos/teams?
  ─▶ Reusable Workflow (cross-repo call) or publish as a public Action

Is it a small setup utility (install tool, login, send notification)?
  ─▶ Composite Action
```

---

## Key Concepts Summary

| Concept | What It Does |
|---------|-------------|
| `on: workflow_call:` | Makes a workflow callable by other workflows; cannot be triggered directly |
| `inputs:` under `workflow_call` | Typed parameters the caller must (or can) provide |
| `secrets:` under `workflow_call` | Encrypted values passed from caller — never accessible as plain text in the reusable workflow |
| `outputs:` under `workflow_call` | Values the reusable workflow exposes back to the caller |
| `uses: ./.github/workflows/file.yml` | Calls a reusable workflow in the same repo (same-repo syntax) |
| `needs: <job>` in caller | Waits for the called workflow job to finish before running the next job |
| `runs: using: composite` | Marks `action.yml` as a composite action (vs JavaScript or Docker action) |
| `shell: bash` in composite steps | Required in composite actions — no default shell is inherited |
| `$GITHUB_OUTPUT` | Modern way to pass values between steps (write: `key=value >> $GITHUB_OUTPUT`; read: `${{ steps.<id>.outputs.key }}`) |
