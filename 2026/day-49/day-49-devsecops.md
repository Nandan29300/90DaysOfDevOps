# Day 49 – DevSecOps: Security in CI/CD

---

## Overview

Today, you will add security scanning to your CI/CD pipeline using GitHub Actions. This builds on your Day 48 capstone project, introducing DevSecOps principles: catch vulnerabilities and secrets leaks before they reach production.

---

## What Was Added

- **Trivy vulnerability scanning**: The Docker build workflow now scans images for critical vulnerabilities using [Trivy](https://github.com/aquasecurity/trivy-action).
- **Fail on critical issues**: The pipeline blocks if critical vulnerabilities are found.
- **No secrets in code**: All sensitive values are managed via GitHub Secrets.

---

## How It Works

- On every push/PR, the pipeline:
  1. Builds and tests the app
  2. Builds the Docker image
  3. **Runs Trivy to scan the image for vulnerabilities**
  4. Uploads a scan report as an artifact
  5. Fails the workflow if critical issues are found

---

## Example Trivy Step (from `.github/workflows/reusable-docker.yml`):

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

---

## Screenshot

> _Paste a screenshot of your pipeline running a Trivy scan here._

---

## Key DevSecOps Principles Applied

- **Automated security checks**: No manual steps required
- **Block on critical vulnerabilities**: Pipeline fails if found
- **No secrets in code**: All secrets are in GitHub Secrets

---

## Next Steps

- Explore more Trivy options (e.g., scanning source code, SBOM)
- Add secret scanning (e.g., [gitleaks](https://github.com/gitleaks/gitleaks-action))
- Enforce code review for security fixes

---

**DevSecOps = Security as Code!**
