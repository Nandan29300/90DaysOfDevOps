# Day 49 – DevSecOps: Security in CI/CD

---

## Overview

Today, you will add security scanning to your CI/CD pipeline using GitHub Actions. This builds on your Day 48 capstone project, introducing DevSecOps principles: catch vulnerabilities and secrets leaks **before** they reach production.

DevSecOps = Development + Security + Operations. It's not a separate process — it's adding security checks to the pipeline you already have.

---

## What is DevSecOps?

**Without DevSecOps:**
> You build the app → deploy it → a security team finds a vulnerability weeks later → you scramble to fix it

**With DevSecOps:**
> You open a PR → the pipeline automatically checks for vulnerabilities → you fix it before it ever gets merged

**That's it.** DevSecOps = adding security checks to the pipeline you already have. Not a separate process — just a few extra steps.

---

## Key Principles Applied

1. **Catch problems early** — A vulnerability found in a PR takes 5 minutes to fix. The same vulnerability found in production takes days.

2. **Automate the checks** — Don't rely on someone remembering to check. Let the pipeline do it every time.

3. **Block on critical issues** — If a scan finds a serious vulnerability, the pipeline should fail — just like a failing test.

4. **Never put secrets in code** — Use GitHub Secrets (you learned this on Day 44). No `.env` files, no hardcoded API keys.

5. **Give only the access needed** — Your workflow doesn't need write access to everything. Limit permissions.

---

## What Was Added

### 1. Trivy Vulnerability Scanning

The Docker build workflow now scans images for critical vulnerabilities using [Trivy](https://github.com/aquasecurity/trivy-action).

**Location:** `.github/workflows/reusable-docker.yml`

**What it does:**
- Scans your Docker image for known CVEs (Common Vulnerabilities and Exposures)
- Prints a readable table in the logs
- Fails the pipeline if CRITICAL or HIGH vulnerabilities are found
- If it passes, your image is clean — proceed to push and deploy

**Example Trivy Step:**

```yaml
- name: Scan image with Trivy
  uses: aquasecurity/trivy-action@0.20.0
  with:
    image-ref: '${{ inputs.image_name }}:${{ inputs.tag }}'
    format: 'table'
    exit-code: '1'
    ignore-unfixed: true
    vuln-type: 'os,library'
    severity: 'CRITICAL'
```

**Parameters explained:**
- `image-ref`: The Docker image to scan (name:tag)
- `format: 'table'`: Prints a readable table in the logs
- `exit-code: '1'`: Fail the step if vulnerabilities are found (use `'0'` to just warn)
- `ignore-unfixed: true`: Only show vulnerabilities that have a fix available
- `vuln-type: 'os,library'`: Scan both OS packages and application libraries
- `severity: 'CRITICAL'`: Only fail on CRITICAL severity (add `HIGH` to include both)

---

### 2. GitHub Secret Scanning

GitHub can automatically detect if someone pushes a secret (API key, token, password) to your repo.

**How to enable:**
1. Go to your repo → Settings → **Code security and analysis**
2. Enable **Secret scanning**
3. If available, also enable **Push protection** — this blocks the push entirely if a secret is detected

**What it catches:**
- AWS access keys
- GitHub personal access tokens
- API keys from popular services
- Private keys
- Database connection strings
- And many more...

**No workflow changes needed** — GitHub does this automatically once enabled.

---

### 3. Dependency Vulnerability Scanning

If your app uses packages (pip, npm, etc.), those packages might have known vulnerabilities.

**Location:** `.github/workflows/pr-pipeline.yml` (added to PR checks)

**Example dependency review step:**

```yaml
- name: Check Dependencies for Vulnerabilities
  uses: actions/dependency-review-action@v4
  with:
    fail-on-severity: critical
```

**What it does:**
- Checks any **new** dependencies added in the PR against a vulnerability database
- If a dependency has a critical CVE, the PR check fails
- Only works on `pull_request` events (not on push)

---

### 4. Workflow Permissions Lockdown

By default, workflows get broad permissions. We locked them down.

**Location:** All workflow files

**Example permissions block:**

```yaml
permissions:
  contents: read
```

**For workflows that need to comment on PRs:**

```yaml
permissions:
  contents: read
  pull-requests: write
```

**Why this matters:**
- If a third-party action is compromised, it can only do what the permissions allow
- Without this, a compromised action could push code, delete branches, or modify secrets
- Principle of least privilege: only give the access that's actually needed

---

## How the Pipeline Works Now

### PR Pipeline Flow

```
PR opened
  → build & test
  → dependency vulnerability check     ← NEW (Day 49)
  → PR checks pass or fail
```

### Main Branch Pipeline Flow

```
Merge to main
  → build & test
  → Docker build
  → Trivy image scan (fail on CRITICAL) ← NEW (Day 49)
  → Docker push (only if scan passes)
  → deploy
```

### Always Active

```
Always active
  → GitHub secret scanning              ← NEW (Day 49)
  → push protection for secrets         ← NEW (Day 49)
```

---

## Step-by-Step Implementation

### Step 1: Add Trivy Scan to Docker Workflow

1. Open `.github/workflows/reusable-docker.yml`
2. Add the Trivy scan step **after** Docker build but **before** Docker push
3. The scan should fail the workflow if CRITICAL vulnerabilities are found
4. Only push the image if the scan passes

**Verification:**
- Push a change to main
- Check the Actions tab — do you see the Trivy scan step?
- Did it pass or fail?
- What CVEs (if any) were found?

---

### Step 2: Enable GitHub Secret Scanning

1. Go to your repo → Settings → Code security and analysis
2. Enable **Secret scanning**
3. Enable **Push protection** if available

**Verification:**
- Try creating a file with a fake AWS key: `AKIAIOSFODNN7EXAMPLE`
- Does GitHub detect it?
- If push protection is enabled, does it block the push?

---

### Step 3: Add Dependency Review to PR Pipeline

1. Open `.github/workflows/pr-pipeline.yml`
2. Add the dependency review step
3. Set `fail-on-severity: critical`

**Verification:**
- Open a PR that adds a new package
- Check the Actions tab — did the dependency review run?
- Does it show up as a check on your PR?

---

### Step 4: Lock Down Workflow Permissions

1. Open each workflow file in `.github/workflows/`
2. Add a `permissions` block near the top (after `on:`)
3. Start with `contents: read` for most workflows
4. Add `pull-requests: write` only for workflows that comment on PRs

**Verification:**
- Check your workflow runs — do they still work?
- Are the permissions listed in the workflow run summary?

---

## Testing Your DevSecOps Pipeline

### Test 1: Vulnerability Scan
1. Push a change to main
2. Watch the Trivy scan run
3. Check the logs for the vulnerability table
4. Did it pass or fail?

### Test 2: Secret Scanning
1. Create a file with a fake secret
2. Try to push it
3. Does GitHub detect/block it?

### Test 3: Dependency Review
1. Open a PR
2. Check if dependency review runs
3. Does it show as a PR check?

### Test 4: Permissions
1. Check workflow run summary
2. Are permissions listed?
3. Do workflows still work correctly?

---

## Common Issues & Troubleshooting

### Trivy scan fails but no vulnerabilities shown
- Check the `severity` parameter — it might be set too low
- Check `ignore-unfixed: true` — it might be hiding vulnerabilities without fixes
- Try running with `format: 'json'` for more detailed output

### Dependency review not running
- It only works on `pull_request` events, not `push`
- Make sure you're opening a PR, not pushing directly

### Secret scanning not detecting secrets
- Make sure it's enabled in repo Settings
- Push protection might be blocking the push before scanning
- Try with a known pattern like `AKIAIOSFODNN7EXAMPLE` (AWS key)

### Workflows fail after adding permissions
- Check if the workflow needs additional permissions
- Look at the error message — it will tell you which permission is missing
- Add only the permissions that are actually needed

---

## Notes Section

### What I learned about DevSecOps:
- DevSecOps = adding security checks to existing pipelines
- Catch vulnerabilities early, not after deployment
- Automate security checks — don't rely on manual processes
- Block on critical issues — treat security like failing tests

### What I learned about Trivy:
- Trivy scans Docker images for known CVEs
- `exit-code: '1'` fails the pipeline on vulnerabilities
- `severity: 'CRITICAL'` only fails on critical issues
- Can also scan filesystems, git repos, and more

### What I learned about secret scanning:
- GitHub has built-in secret scanning for public repos
- Push protection blocks pushes that contain secrets
- Works automatically — no workflow changes needed
- Detects AWS keys, GitHub tokens, API keys, and more

### What I learned about dependency review:
- Checks new dependencies in PRs for vulnerabilities
- Only works on `pull_request` events
- Can fail PRs that introduce vulnerable dependencies
- Uses GitHub's advisory database

### What I learned about workflow permissions:
- Default permissions are too broad
- Principle of least privilege: only give what's needed
- Protects against compromised third-party actions
- Can be set at workflow or job level

---

## Pipeline Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PR Pipeline                               │
├─────────────────────────────────────────────────────────────┤
│  PR opened                                                  │
│    ↓                                                        │
│  Build & Test                                               │
│    ↓                                                        │
│  Dependency Vulnerability Check  ← NEW (Day 49)             │
│    ↓                                                        │
│  PR checks pass or fail                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 Main Branch Pipeline                         │
├─────────────────────────────────────────────────────────────┤
│  Merge to main                                              │
│    ↓                                                        │
│  Build & Test                                               │
│    ↓                                                        │
│  Docker Build                                               │
│    ↓                                                        │
│  Trivy Image Scan (fail on CRITICAL) ← NEW (Day 49)         │
│    ↓                                                        │
│  Docker Push (only if scan passes)                          │
│    ↓                                                        │
│  Deploy                                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Always Active                             │
├─────────────────────────────────────────────────────────────┤
│  GitHub Secret Scanning          ← NEW (Day 49)             │
│  Push Protection for Secrets     ← NEW (Day 49)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

Today you transformed your CI/CD pipeline into a **DevSecOps pipeline** by adding:

1. **Trivy vulnerability scanning** — catches CVEs in Docker images before deployment
2. **GitHub secret scanning** — prevents accidental secret leaks
3. **Dependency review** — catches vulnerable dependencies in PRs
4. **Workflow permissions lockdown** — limits blast radius if an action is compromised

Security is now part of your automation, not an afterthought. Every PR and every push to main automatically checks for vulnerabilities and secrets. This is how production pipelines should work.

---

## Next Steps

- Explore more Trivy options (e.g., scanning source code, SBOM generation)
- Add secret scanning with tools like [gitleaks](https://github.com/gitleaks/gitleaks-action)
- Enforce code review for security fixes
- Learn about OIDC (keyless authentication) for cloud deployments
- Set up security alerts and notifications

---

## Resources

- [Trivy Documentation](https://github.com/aquasecurity/trivy)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Dependency Review Action](https://github.com/actions/dependency-review-action)
- [GitHub Actions Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [DevSecOps Best Practices](https://github.blog/2021-04-14-getting-started-with-devsecops/)

---

**DevSecOps = Security as Code!**

Happy Learning!
**TrainWithShubham**
