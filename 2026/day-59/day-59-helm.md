# Day 59 – Kubernetes: Helm — Package Manager

---

## Overview

Over the past eight days you have written Deployments, Services, ConfigMaps, Secrets, PVCs, and more — all as individual YAML files. For a real application you might have dozens of these. **Helm** is the package manager for Kubernetes, like apt for Ubuntu. Today you install charts, customize them, and create your own.

---

## Why Helm?

### The Problem: YAML Sprawl

A real application might have:
- 1 Deployment
- 2 Services (ClusterIP + NodePort)
- 3 ConfigMaps
- 2 Secrets
- 1 PVC
- 1 Ingress
- 1 HPA

That's **11 YAML files** to manage, version, and deploy. And if you have 10 microservices? That's **110 files**.

### The Solution: Helm

Helm packages all those YAML files into a **Chart** — a single, versioned, configurable package.

**Benefits:**
- **Package management**: Install, upgrade, rollback with one command
- **Temperalting**: Use variables to customize deployments
- **Versioning**: Track changes and rollback to any version
- **Sharing**: Share charts via repositories
- **Dependencies**: Manage chart dependencies

---

## Core Concepts

### 1. Chart

A **Chart** is a package of Kubernetes manifest templates. It contains:
- `Chart.yaml`: Metadata (name, version, description)
- `values.yaml`: Default configuration values
- `templates/`: Kubernetes manifest templates
- `charts/`: Dependencies (other charts)

**Think of it like:** A chart is like a Docker image — a template that can be instantiated.

### 2. Release

A **Release** is a specific installation of a chart in your cluster. You can install the same chart multiple times with different names.

**Example:**
```bash
helm install my-nginx bitnami/nginx      # Release 1
helm install your-nginx bitnami/nginx    # Release 2
```

**Think of it like:** A release is like a running container — an instance of an image.

### 3. Repository

A **Repository** is a collection of charts. It's like a package repository (apt, npm, Docker Hub).

**Popular repositories:**
- Bitnami: `https://charts.bitnami.com/bitnami`
- Official: `https://charts.helm.sh/stable`
- Artifact Hub: `https://artifacthub.io`

---

## Step-by-Step: Using Helm

### Step 1: Install Helm

**macOS:**
```bash
brew install helm
```

**Linux:**
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

**Windows (chocolatey):**
```bash
choco install kubernetes-helm
```

Verify:
```bash
helm version
helm env
```

**Expected output:**
```
version.BuildInfo{Version:"v3.x.x", GitCommit:"...", GitTreeState:"clean", GoVersion:"go1.x.x"}
```

---

### Step 2: Add a Repository and Search

Add the Bitnami repository:
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
```

Search for charts:
```bash
helm search repo nginx
helm search repo bitnami
```

**Expected output:**
```
NAME                    CHART VERSION   APP VERSION   DESCRIPTION
bitnami/nginx           15.x.x          1.25.x        NGINX Open Source is a web server...
bitnami/nginx-ingress   9.x.x           1.x.x         NGINX Ingress Controller...
```

List repositories:
```bash
helm repo list
```

---

### Step 3: Install a Chart

Deploy nginx:
```bash
helm install my-nginx bitnami/nginx
```

**What this does:**
- Downloads the nginx chart from Bitnami
- Creates a release named `my-nginx`
- Installs all resources (Deployment, Service, ConfigMap, etc.)

Check what was created:
```bash
kubectl get all
helm list
helm status my-nginx
helm get manifest my-nginx
```

**One command replaced writing a Deployment, Service, and ConfigMap by hand.**

---

### Step 4: Customize with Values

View default values:
```bash
helm show values bitnami/nginx
```

Install with custom values:
```bash
helm install my-nginx-custom bitnami/nginx \
  --set replicaCount=3 \
  --set service.type=NodePort
```

Create a `custom-values.yaml` file:
```yaml
# custom-values.yaml
replicaCount: 3

service:
  type: NodePort
  nodePort: 30080

resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "250m"
    memory: "256Mi"
```

Install using values file:
```bash
helm install my-nginx-values bitnami/nginx -f custom-values.yaml
```

Check overrides:
```bash
helm get values my-nginx-values
helm get values my-nginx-values --all
```

---

### Step 5: Upgrade and Rollback

Upgrade:
```bash
helm upgrade my-nginx bitnami/nginx --set replicaCount=5
```

Check history:
```bash
helm history my-nginx
```

**Expected output:**
```
REVISION    UPDATED                     STATUS      CHART           APP VERSION    DESCRIPTION
1           <timestamp>                 superseded  nginx-15.x.x    1.25.x         Install complete
2           <timestamp>                 deployed    nginx-15.x.x    1.25.x         Upgrade complete
```

Rollback:
```bash
helm rollback my-nginx 1
```

Check history again:
```bash
helm history my-nginx
```

**Expected output:**
```
REVISION    UPDATED                     STATUS      CHART           APP VERSION    DESCRIPTION
1           <timestamp>                 superseded  nginx-15.x.x    1.25.x         Install complete
2           <timestamp>                 superseded  nginx-15.x.x    1.25.x         Upgrade complete
3           <timestamp>                 deployed    nginx-15.x.x    1.25.x         Rollback to 1
```

**Rollback creates a new revision (3), not overwriting revision 2.**

---

### Step 6: Create Your Own Chart

Scaffold a new chart:
```bash
helm create my-app
```

Explore the directory structure:
```
my-app/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default values
├── charts/             # Dependencies
├── templates/          # Kubernetes manifest templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   └── _helpers.tpl    # Template helpers
└── .helmignore         # Files to ignore
```

Look at the Go template syntax in templates:
```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

Edit `values.yaml`:
```yaml
# values.yaml
replicaCount: 3

image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent

service:
  type: NodePort
  port: 80

resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "250m"
    memory: "256Mi"
```

Validate:
```bash
helm lint my-app
```

Preview:
```bash
helm template my-release ./my-app
```

Install:
```bash
helm install my-release ./my-app
```

Upgrade:
```bash
helm upgrade my-release ./my-app --set replicaCount=5
```

---

## Helm Template Syntax

### Values

```yaml
# Access values
{{ .Values.replicaCount }}
{{ .Values.image.repository }}
{{ .Values.service.type }}
```

### Built-in Objects

```yaml
# Chart metadata
{{ .Chart.Name }}
{{ .Chart.Version }}
{{ .Chart.AppVersion }}

# Release information
{{ .Release.Name }}
{{ .Release.Namespace }}
{{ .Release.Revision }}

# Template information
{{ .Template.Name }}
```

### Functions

```yaml
# String functions
{{ .Values.name | upper }}
{{ .Values.name | lower }}
{{ .Values.name | quote }}

# Default values
{{ .Values.replicaCount | default 1 }}

# Conditional
{{- if .Values.autoscaling.enabled }}
  # HPA config here
{{- end }}

# Loops
{{- range .Values.env }}
- name: {{ .name }}
  value: {{ .value }}
{{- end }}
```

### Include

```yaml
# Include another template
{{ include "my-app.fullname" . }}
{{ include "my-app.labels" . | nindent 4 }}
```

---

## Helm Commands Reference

### Repository Management
```bash
helm repo add <name> <url>    # Add repository
helm repo update              # Update repositories
helm repo list                # List repositories
helm repo remove <name>       # Remove repository
```

### Chart Management
```bash
helm search repo <keyword>    # Search charts
helm show values <chart>      # Show default values
helm show chart <chart>       # Show chart metadata
helm pull <chart>             # Download chart
```

### Release Management
```bash
helm install <name> <chart>   # Install release
helm upgrade <name> <chart>   # Upgrade release
helm rollback <name> <rev>    # Rollback to revision
helm uninstall <name>         # Uninstall release
helm list                     # List releases
helm status <name>            # Show release status
helm history <name>           # Show release history
```

### Debugging
```bash
helm template <name> <chart>  # Render templates without installing
helm lint <chart>             # Validate chart structure
helm get manifest <name>      # Get installed manifests
helm get values <name>        # Get release values
helm get hooks <name>         # Get release hooks
```

---

## Common Issues & Troubleshooting

### Issue: Chart not found

**Symptoms:**
```
Error: failed to download "bitnami/nginx" (hint: running `helm repo update` may help)
```

**Solutions:**
1. Update repositories: `helm repo update`
2. Check repository: `helm repo list`
3. Add repository: `helm repo add bitnami https://charts.bitnami.com/bitnami`

---

### Issue: Release already exists

**Symptoms:**
```
Error: cannot re-use a name that is still in use
```

**Solutions:**
1. Use a different name: `helm install my-nginx-2 bitnami/nginx`
2. Uninstall first: `helm uninstall my-nginx`
3. Upgrade instead: `helm upgrade my-nginx bitnami/nginx`

---

### Issue: Values not applied

**Symptoms:**
- Custom values not taking effect
- Default values still used

**Solutions:**
1. Check values: `helm get values my-release`
2. Check all values: `helm get values my-release --all`
3. Verify YAML syntax: `helm lint my-chart`
4. Use `--set` for quick tests: `helm upgrade my-release bitnami/nginx --set replicaCount=5`

---

## Tips and Tricks

### 1. Use helm show before installing
```bash
helm show values bitnami/nginx | head -50
```

### 2. Use helm template for debugging
```bash
helm template my-release ./my-app | kubectl apply -f -
```

### 3. Use --dry-run to preview
```bash
helm install my-release bitnami/nginx --dry-run
```

### 4. Use helm diff plugin
```bash
helm plugin install https://github.com/databus23/helm-diff
helm diff upgrade my-release bitnami/nginx
```

### 5. Use helm get for inspection
```bash
helm get manifest my-release
helm get values my-release
helm get notes my-release
```

---

## Clean Up

```bash
# Uninstall releases
helm uninstall my-nginx
helm uninstall my-nginx-custom
helm uninstall my-nginx-values
helm uninstall my-release

# Remove chart directory
rm -rf my-app

# Remove values file
rm custom-values.yaml

# Verify
helm list
```

---

## Notes Section

### What I learned about Helm:
- Helm is the package manager for Kubernetes
- Chart = package of Kubernetes manifests
- Release = specific installation of a chart
- Repository = collection of charts

### What I learned about Charts:
- Charts contain templates, values, and metadata
- Templates use Go templating syntax
- Values customize the chart
- Charts can have dependencies

### What I learned about Releases:
- Releases are instances of charts
- Can install same chart multiple times
- Each release has a history of revisions
- Can rollback to any revision

### What I learned about Templating:
- Use {{ .Values.key }} for values
- Use {{ .Chart.Name }} for chart metadata
- Use {{ .Release.Name }} for release name
- Use functions like | upper, | default, | quote

### What I learned about troubleshooting:
- Use helm lint to validate charts
- Use helm template to preview
- Use helm get to inspect releases
- Use --dry-run to test installations

---

## Summary

Today you learned:

1. **Helm**: Package manager for Kubernetes
2. **Charts**: Packages of Kubernetes manifests
3. **Releases**: Specific installations of charts
4. **Repositories**: Collections of charts
5. **Templating**: Go templates for customization
6. **Values**: Configuration for charts
7. **Upgrade/Rollback**: Version management

You now know how to package, deploy, and manage Kubernetes applications with Helm!

---

## Next Steps

- Deploy WordPress + MySQL capstone (Day 60)
- Explore Helm hooks
- Learn about Helmfile for multi-chart deployments
- Understand chart testing
- Practice creating production charts

---

## Resources

- [Helm Documentation](https://helm.sh/docs/)
- [Helm Chart Guide](https://helm.sh/docs/chart_template_guide/)
- [Artifact Hub](https://artifacthub.io/)
- [Bitnami Charts](https://github.com/bitnami/charts)

---

**Helm is essential for managing Kubernetes applications!**

Happy Learning!
**TrainWithShubham**
