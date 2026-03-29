# Day 58 – Kubernetes: Metrics Server & Horizontal Pod Autoscaler (HPA)

---

## Overview

Yesterday you set resource requests and limits. Today you put that to work. Install the **Metrics Server** so Kubernetes can see actual resource usage, then set up a **Horizontal Pod Autoscaler (HPA)** that scales your app up under load and back down when things calm down.

---

## Why Metrics and Autoscaling?

### The Problem: No Visibility

Without metrics:
- Kubernetes doesn't know actual CPU/memory usage
- Can't make scaling decisions
- No way to detect overload
- Manual scaling is slow and error-prone

### The Problem: Manual Scaling

Without autoscaling:
- Scale up too late = poor performance during traffic spikes
- Scale down too late = wasted resources during low traffic
- Human intervention required for every scaling event

### The Solution

**Metrics Server**: Collects resource usage from nodes and pods
**HPA**: Automatically scales pods based on metrics

**Think of it like this:**
- Metrics Server = The dashboard showing speed and fuel level
- HPA = The cruise control that adjusts speed automatically

---

## Metrics Server

### What Is It?

Metrics Server is a cluster-wide aggregator of resource usage data. It:
- Collects CPU and memory usage from each node's kubelet
- Exposes metrics via the Kubernetes API
- Provides data for `kubectl top` and HPA
- Polls kubelets every 15 seconds

### What It's NOT

- Not a full monitoring solution (use Prometheus for that)
- Not for historical data (only current usage)
- Not for custom metrics (only CPU and memory)

### Installation

**Minikube:**
```bash
minikube addons enable metrics-server
```

**Kind/kubeadm:**
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

**For local clusters**, you may need to add `--kubelet-insecure-tls` flag:
```bash
kubectl edit deployment metrics-server -n kube-system
# Add to args:
# - --kubelet-insecure-tls
```

### Verify Installation

```bash
# Wait 60 seconds for metrics to populate
kubectl top nodes
kubectl top pods -A
```

**Expected output for `kubectl top nodes`:**
```
NAME                 CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
kind-control-plane   250m         12%    1024Mi          50%
```

**Expected output for `kubectl top pods -A`:**
```
NAMESPACE     NAME                                     CPU(cores)   MEMORY(bytes)
kube-system   coredns-xxxxx-yyyyy                      5m           10Mi
kube-system   metrics-server-xxxxx-yyyyy               15m          30Mi
default       nginx-pod                                2m           5Mi
```

---

## kubectl top

### Commands

```bash
# Node usage
kubectl top nodes

# Pod usage (all namespaces)
kubectl top pods -A

# Pod usage (specific namespace)
kubectl top pods -n default

# Sort by CPU
kubectl top pods -A --sort-by=cpu

# Sort by memory
kubectl top pods -A --sort-by=memory

# Specific pod
kubectl top pod my-pod
```

### Understanding the Output

**CPU:**
- `250m` = 0.25 CPU cores
- `1` = 1 CPU core
- Percentage = (usage / node capacity) × 100

**Memory:**
- `1024Mi` = 1 GiB
- Percentage = (usage / node capacity) × 100

**Key point:** `kubectl top` shows **actual usage**, not requests or limits.

---

## Horizontal Pod Autoscaler (HPA)

### What Is It?

HPA automatically scales the number of pods in a deployment based on observed metrics.

**How it works:**
1. HPA checks metrics every 15 seconds
2. Calculates desired replicas based on target utilization
3. Scales up or down to match

**Formula:**
```
desiredReplicas = ceil(currentReplicas × (currentUsage / targetUsage))
```

**Example:**
- Current: 2 replicas, 80% CPU usage
- Target: 50% CPU usage
- Desired: ceil(2 × (80 / 50)) = ceil(3.2) = 4 replicas

### HPA Requirements

1. **Metrics Server** must be installed
2. **Resource requests** must be set on containers
3. HPA uses requests to calculate utilization percentage

**Without requests, HPA cannot work** — TARGETS shows `<unknown>`.

---

## Step-by-Step: Setting Up HPA

### Step 1: Install Metrics Server

```bash
# For Minikube
minikube addons enable metrics-server

# For Kind/kubeadm
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Wait 60 seconds
kubectl top nodes
```

---

### Step 2: Create a Deployment with CPU Requests

Create `php-apache-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php-apache
spec:
  replicas: 1
  selector:
    matchLabels:
      run: php-apache
  template:
    metadata:
      labels:
        run: php-apache
    spec:
      containers:
      - name: php-apache
        image: registry.k8s.io/hpa-example
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "200m"
          limits:
            cpu: "500m"
```

**What this does:**
- Uses `registry.k8s.io/hpa-example` (CPU-intensive PHP-Apache server)
- Sets `resources.requests.cpu: 200m` — HPA needs this to calculate utilization
- Without this, HPA cannot work

Apply and verify:
```bash
kubectl apply -f php-apache-deployment.yaml
kubectl expose deployment php-apache --port=80
kubectl get pods
kubectl top pods
```

**Expected output:**
```
NAME                         CPU(cores)   MEMORY(bytes)
php-apache-xxxxx-yyyyy       2m           10Mi
```

---

### Step 3: Create an HPA (Imperative)

```bash
kubectl autoscale deployment php-apache --cpu-percent=50 --min=1 --max=10
```

**What this does:**
- Target: 50% CPU utilization (of requests)
- Minimum: 1 replica
- Maximum: 10 replicas

Verify:
```bash
kubectl get hpa
kubectl describe hpa php-apache
```

**Expected output:**
```
NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
php-apache   Deployment/php-apache   2%/50%    1         10        1          10s
```

**TARGETS may show `<unknown>` initially** — wait 30 seconds for metrics to arrive.

---

### Step 4: Generate Load and Watch Autoscaling

Start a load generator:
```bash
kubectl run load-generator --image=busybox:1.36 --restart=Never -- /bin/sh -c "while true; do wget -q -O- http://php-apache; done"
```

Watch HPA:
```bash
kubectl get hpa php-apache --watch
```

**Expected output (over 1-3 minutes):**
```
NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
php-apache   Deployment/php-apache   2%/50%    1         10        1          1m
php-apache   Deployment/php-apache   150%/50%  1         10        1          1m
php-apache   Deployment/php-apache   150%/50%  1         10        4          1m
php-apache   Deployment/php-apache   80%/50%   1         10        4          2m
```

**CPU climbs above 50%, replicas increase, CPU stabilizes.**

Check pods:
```bash
kubectl get pods
```

**Multiple pods are running now.**

Stop the load:
```bash
kubectl delete pod load-generator
```

**Scale-down is slow** (5-minute stabilization window) — you don't need to wait.

---

### Step 5: Create an HPA from YAML (Declarative)

Delete the imperative HPA:
```bash
kubectl delete hpa php-apache
```

Create `hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: php-apache
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: php-apache
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Pods
        value: 4
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
```

**Field explanations:**
- `scaleTargetRef`: Which deployment to scale
- `minReplicas`: Minimum number of pods
- `maxReplicas`: Maximum number of pods
- `metrics`: Target CPU utilization (50%)
- `behavior`: Fine-grained control over scaling
  - `scaleUp`: No stabilization, add up to 4 pods every 15 seconds
  - `scaleDown`: 5-minute stabilization, remove up to 2 pods every 60 seconds

Apply and verify:
```bash
kubectl apply -f hpa.yaml
kubectl describe hpa php-apache
```

**The `behavior` section controls:**
- How fast to scale up (no delay)
- How fast to scale down (5-minute window)
- How many pods to add/remove at once

---

## HPA Behavior Deep Dive

### Scale-Up Behavior

```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 0  # No delay
    policies:
    - type: Pods
      value: 4                     # Add up to 4 pods
      periodSeconds: 15            # Every 15 seconds
```

**What this means:**
- When CPU exceeds target, scale up immediately
- Can add up to 4 pods every 15 seconds
- Fast response to traffic spikes

### Scale-Down Behavior

```yaml
behavior:
  scaleDown:
    stabilizationWindowSeconds: 300  # 5-minute window
    policies:
    - type: Pods
      value: 2                     # Remove up to 2 pods
      periodSeconds: 60            # Every 60 seconds
```

**What this means:**
- When CPU drops below target, wait 5 minutes
- Then remove up to 2 pods every 60 seconds
- Prevents flapping (scale up/down repeatedly)

### Why Stabilization Windows?

**Scale-up**: No delay needed — respond quickly to load
**Scale-down**: 5-minute delay — prevent flapping if traffic is variable

---

## autoscaling/v1 vs autoscaling/v2

| Feature | v1 | v2 |
|---------|----|----|
| **API version** | autoscaling/v1 | autoscaling/v2 |
| **Metrics** | CPU only | CPU + memory + custom |
| **Behavior** | No control | Fine-grained control |
| **Multiple metrics** | No | Yes |
| **Recommendation** | Simple cases | Production use |

**Use `autoscaling/v2`** for production — it supports multiple metrics and fine-grained scaling behavior.

---

## HPA with Multiple Metrics

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: php-apache
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: php-apache
  minReplicas: 1
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 50
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
```

**What this does:**
- Scale up if CPU > 50% OR memory > 70%
- Scale down only if BOTH are below target

---

## Common Issues & Troubleshooting

### Issue: HPA shows `<unknown>` targets

**Symptoms:**
```
NAME         REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
php-apache   Deployment/php-apache   <unknown>/50%  1    10        1          1m
```

**Causes:**
- Metrics Server not installed
- Resource requests not set
- Metrics not yet collected

**Solutions:**
1. Check Metrics Server: `kubectl get pods -n kube-system | grep metrics-server`
2. Check resource requests: `kubectl describe deployment php-apache`
3. Wait 30 seconds for metrics to populate

---

### Issue: HPA not scaling up

**Symptoms:**
- CPU is high but replicas stay at 1
- HPA shows high TARGETS but no scaling

**Causes:**
- Already at maxReplicas
- Metrics not updating
- HPA not configured correctly

**Solutions:**
1. Check HPA: `kubectl describe hpa php-apache`
2. Check maxReplicas: `kubectl get hpa php-apache -o yaml`
3. Check metrics: `kubectl top pods`

---

### Issue: HPA scaling too aggressively

**Symptoms:**
- Pods scale up and down rapidly
- Unstable replica count

**Causes:**
- Stabilization window too short
- Target utilization too low
- Load is spiky

**Solutions:**
1. Increase stabilization window
2. Increase target utilization
3. Adjust scale-up/down policies

---

## Tips and Tricks

### 1. Use kubectl top for Monitoring
```bash
kubectl top nodes
kubectl top pods -A --sort-by=cpu
```

### 2. Use kubectl describe for HPA Details
```bash
kubectl describe hpa php-apache
```

### 3. Use kubectl get with Custom Columns
```bash
kubectl get hpa -o custom-columns='NAME:.metadata.name,TARGET:.spec.metrics[0].resource.target.averageUtilization,MIN:.spec.minReplicas,MAX:.spec.maxReplicas,CURRENT:.status.currentReplicas'
```

### 4. Use kubectl wait for Conditions
```bash
kubectl wait --for=condition=Ready pod -l run=php-apache --timeout=60s
```

### 5. Use kubectl rollout for Updates
```bash
kubectl rollout status deployment/php-apache
```

---

## Clean Up

```bash
# Delete HPA
kubectl delete hpa php-apache

# Delete Service
kubectl delete service php-apache

# Delete Deployment
kubectl delete deployment php-apache

# Delete load generator
kubectl delete pod load-generator

# Verify
kubectl get hpa
kubectl get pods
kubectl get services
```

**Leave Metrics Server installed** — it's useful for monitoring.

---

## Notes Section

### What I learned about Metrics Server:
- Collects CPU and memory usage from nodes and pods
- Provides data for `kubectl top` and HPA
- Polls kubelets every 15 seconds
- Not a full monitoring solution (use Prometheus for that)

### What I learned about kubectl top:
- Shows actual resource usage
- Different from requests/limits
- Can sort by CPU or memory
- Requires Metrics Server

### What I learned about HPA:
- Automatically scales pods based on metrics
- Requires resource requests to be set
- Formula: desiredReplicas = ceil(currentReplicas × (currentUsage / targetUsage))
- Scale-up is fast, scale-down has 5-minute stabilization

### What I learned about autoscaling/v2:
- Supports multiple metrics (CPU, memory, custom)
- Fine-grained control with behavior section
- Better than v1 for production use
- Can control scale-up and scale-down separately

### What I learned about troubleshooting:
- HPA shows `<unknown>` if no metrics
- Check Metrics Server installation
- Check resource requests are set
- Use `kubectl describe hpa` for details

---

## Summary

Today you learned:

1. **Metrics Server**: Collects resource usage from nodes and pods
2. **kubectl top**: View actual CPU and memory usage
3. **HPA**: Automatically scales pods based on metrics
4. **autoscaling/v2**: Advanced HPA with multiple metrics and behavior control
5. **Scaling behavior**: Scale-up vs scale-down policies
6. **Troubleshooting**: Common issues and solutions

You now know how to automatically scale your applications based on resource usage!

---

## Next Steps

- Learn about Vertical Pod Autoscaler (VPA)
- Explore custom metrics with Prometheus
- Understand Pod Disruption Budgets
- Learn about Cluster Autoscaler
- Practice with real-world applications

---

## Resources

- [Metrics Server](https://github.com/kubernetes-sigs/metrics-server)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [HPA Algorithm](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/#algorithm-details)
- [kubectl top](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#top)

---

**Autoscaling is essential for production Kubernetes!**

Happy Learning!
**TrainWithShubham**
