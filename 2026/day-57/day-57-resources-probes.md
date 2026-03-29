# Day 57 – Kubernetes: Resource Requests, Limits & Probes

---

## Overview

Your Pods are running, but Kubernetes has no idea how much CPU or memory they need — and no way to tell if they are actually healthy. Today you set **resource requests and limits** for smart scheduling, then add **probes** so Kubernetes can detect and recover from failures automatically.

---

## Why Resources and Probes?

### The Problem: Unmanaged Resources

Without resource management:
- Pods can consume unlimited CPU and memory
- One Pod can starve others
- Kubernetes can't schedule efficiently
- Noisy neighbor problems

### The Problem: No Health Checks

Without probes:
- Kubernetes doesn't know if your app is healthy
- A stuck container keeps running forever
- Traffic goes to unhealthy Pods
- No automatic recovery

### The Solution

**Resource requests/limits**: Tell Kubernetes how much CPU/memory your app needs
**Probes**: Tell Kubernetes how to check if your app is healthy

---

## Resource Requests and Limits

### What Are They?

**Requests**: The guaranteed minimum resources a Pod gets
- Used by the scheduler to decide where to place the Pod
- Pod is guaranteed to get at least this much

**Limits**: The maximum resources a Pod can use
- Enforced by the kubelet at runtime
- Pod cannot exceed this much

**Think of it like this:**
- Request = Your reserved parking spot (guaranteed)
- Limit = The maximum speed limit (enforced)

### CPU Units

CPU is measured in **millicores**:
- `1000m` = 1 CPU core
- `500m` = 0.5 CPU cores
- `100m` = 0.1 CPU cores
- `1` = 1 CPU core (same as `1000m`)

### Memory Units

Memory is measured in bytes:
- `128Mi` = 128 mebibytes
- `1Gi` = 1 gibibyte
- `512Ki` = 512 kibibytes
- `128M` = 128 megabytes (decimal)

---

## Quality of Service (QoS) Classes

Kubernetes assigns QoS classes based on resource configuration:

| QoS Class | Condition | Behavior |
|-----------|-----------|----------|
| **Guaranteed** | requests == limits | Last to be evicted, most protected |
| **Burstable** | requests < limits | Evicted before Guaranteed, after BestEffort |
| **BestEffort** | No requests/limits set | First to be evicted |

**Recommendation:** Use `Guaranteed` for critical workloads, `Burstable` for most apps.

---

## Step-by-Step: Resource Requests and Limits

### Step 1: Create a Pod with Resources

Create `resource-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: resource-pod
spec:
  containers:
  - name: app
    image: nginx:latest
    resources:
      requests:
        cpu: "100m"
        memory: "128Mi"
      limits:
        cpu: "250m"
        memory: "256Mi"
```

**Field explanations:**
- `requests.cpu: "100m"` — Guaranteed 0.1 CPU cores
- `requests.memory: "128Mi"` — Guaranteed 128 MiB memory
- `limits.cpu: "250m"` — Maximum 0.25 CPU cores
- `limits.memory: "256Mi"` — Maximum 256 MiB memory

Apply and verify:
```bash
kubectl apply -f resource-pod.yaml
kubectl describe pod resource-pod
```

**Look for these sections in the output:**
```
Requests:
  cpu:     100m
  memory:  128Mi
Limits:
  cpu:     250m
  memory:  256Mi
QoS Class:       Burstable
```

**QoS is `Burstable`** because requests < limits.

---

### Step 2: OOMKilled — Exceeding Memory Limits

Create `oom-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: oom-pod
spec:
  containers:
  - name: stress
    image: polinux/stress
    command: ["stress"]
    args: ["--vm", "1", "--vm-bytes", "200M", "--vm-hang", "1"]
    resources:
      limits:
        memory: "100Mi"
```

**What this does:**
- Uses `polinux/stress` image to stress test memory
- Tries to allocate 200M of memory
- Memory limit is only 100Mi
- Container gets killed (OOMKilled)

Apply and watch:
```bash
kubectl apply -f oom-pod.yaml
kubectl get pod oom-pod -w
```

**Expected output:**
```
NAME     READY   STATUS      RESTARTS   AGE
oom-pod  0/1     OOMKilled   0          5s
oom-pod  0/1     CrashLoopBackOff   1          6s
```

Check details:
```bash
kubectl describe pod oom-pod
```

**Look for:**
```
Last State:     Terminated
  Reason:       OOMKilled
  Exit Code:    137
```

**Exit code 137 = OOMKilled** (128 + SIGKILL)

**Key point:** CPU is throttled when over limit. Memory is killed — no mercy.

---

### Step 3: Pending Pod — Requesting Too Much

Create `pending-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pending-pod
spec:
  containers:
  - name: app
    image: nginx:latest
    resources:
      requests:
        cpu: "100"
        memory: "128Gi"
```

**What this does:**
- Requests 100 CPU cores (impossible on most clusters)
- Requests 128 GiB memory (impossible on most clusters)
- No node can satisfy this request

Apply and check:
```bash
kubectl apply -f pending-pod.yaml
kubectl get pod pending-pod
```

**Expected output:**
```
NAME         READY   STATUS    RESTARTS   AGE
pending-pod  0/1     Pending   0          1m
```

Check events:
```bash
kubectl describe pod pending-pod
```

**Look for:**
```
Events:
  Type     Reason            Age   From               Message
  ----     ------            ----  ----               -------
  Warning  FailedScheduling  1m    default-scheduler  0/3 nodes are available: 3 Insufficient cpu, 3 Insufficient memory.
```

**The scheduler tells you exactly why** the Pod can't be scheduled.

---

## Probes

### What Are Probes?

Probes are health checks that Kubernetes runs on your containers:

| Probe Type | Purpose | Failure Action |
|------------|---------|----------------|
| **Liveness** | Is the container alive? | Restart container |
| **Readiness** | Is the container ready for traffic? | Remove from Service endpoints |
| **Startup** | Has the container started? | Kill container |

### Probe Types

Each probe can use one of these methods:

| Method | Description | Use Case |
|--------|-------------|----------|
| `httpGet` | HTTP GET request | Web servers, APIs |
| `exec` | Execute a command | Any container |
| `tcpSocket` | TCP connection check | Databases, caches |

### Probe Parameters

```yaml
initialDelaySeconds: 10  # Wait before first probe
periodSeconds: 5         # How often to probe
timeoutSeconds: 1        # Timeout for probe
successThreshold: 1      # Successes needed to be healthy
failureThreshold: 3      # Failures needed to be unhealthy
```

---

## Step-by-Step: Liveness Probe

### Step 4: Create a Liveness Probe Pod

Create `liveness-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: liveness-pod
spec:
  containers:
  - name: app
    image: busybox:latest
    command:
    - /bin/sh
    - -c
    - touch /tmp/healthy; sleep 30; rm -f /tmp/healthy; sleep 600
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/healthy
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 3
```

**What this does:**
- Creates `/tmp/healthy` on startup
- Deletes it after 30 seconds
- Liveness probe checks for `/tmp/healthy` every 5 seconds
- After 3 consecutive failures, container is restarted

Apply and watch:
```bash
kubectl apply -f liveness-pod.yaml
kubectl get pod liveness-pod -w
```

**Expected output:**
```
NAME           READY   STATUS    RESTARTS   AGE
liveness-pod   1/1     Running   0          30s
liveness-pod   1/1     Running   1          60s
liveness-pod   1/1     Running   2          90s
```

Check restart count:
```bash
kubectl describe pod liveness-pod
```

**Look for:**
```
Restart Count:  3
Events:
  Type     Reason     Age               From               Message
  ----     ------     ----              ----               -------
  Normal   Pulled     1m                kubelet            Container image "busybox:latest" already present on machine
  Normal   Created    1m                kubelet            Created container app
  Normal   Started    1m                kubelet            Started container app
  Warning  Unhealthy  30s               Liveness probe failed: cat: can't open '/tmp/healthy': No such file or directory
  Normal   Killing    30s               kubelet            Container app failed liveness probe, will be restarted
```

**The container is restarted** when the liveness probe fails.

---

## Step-by-Step: Readiness Probe

### Step 5: Create a Readiness Probe Pod

Create `readiness-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: readiness-pod
  labels:
    app: readiness-demo
spec:
  containers:
  - name: nginx
    image: nginx:latest
    ports:
    - containerPort: 80
    readinessProbe:
      httpGet:
        path: /
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 5
```

**What this does:**
- Checks if nginx is serving HTTP on port 80
- If probe fails, Pod is removed from Service endpoints
- Container is NOT restarted

Apply and verify:
```bash
kubectl apply -f readiness-pod.yaml
kubectl get pod readiness-pod
```

**Expected output:**
```
NAME           READY   STATUS    RESTARTS   AGE
readiness-pod  1/1     Running   0          10s
```

Create a Service:
```bash
kubectl expose pod readiness-pod --port=80 --name=readiness-svc
kubectl get endpoints readiness-svc
```

**Expected output:**
```
NAME           ENDPOINTS         AGE
readiness-svc  10.244.0.5:80     10s
```

**The Pod IP is listed** in the endpoints.

Now break the probe:
```bash
kubectl exec readiness-pod -- rm /usr/share/nginx/html/index.html
kubectl get pod readiness-pod
```

**Expected output:**
```
NAME           READY   STATUS    RESTARTS   AGE
readiness-pod  0/1     Running   0          2m
```

**READY shows `0/1`** — the Pod is not ready.

Check endpoints:
```bash
kubectl get endpoints readiness-svc
```

**Expected output:**
```
NAME           ENDPOINTS   AGE
readiness-svc  <none>      2m
```

**Endpoints are empty** — no traffic is sent to this Pod.

**Key difference:** Readiness failure removes from endpoints, but does NOT restart the container.

---

## Step-by-Step: Startup Probe

### Step 6: Create a Startup Probe Pod

Create `startup-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: startup-pod
spec:
  containers:
  - name: app
    image: busybox:latest
    command:
    - /bin/sh
    - -c
    - sleep 20; touch /tmp/started; sleep 600
    startupProbe:
      exec:
        command:
        - cat
        - /tmp/started
      periodSeconds: 5
      failureThreshold: 12
    livenessProbe:
      exec:
        command:
        - cat
        - /tmp/started
      periodSeconds: 5
```

**What this does:**
- Container takes 20 seconds to start (sleep 20)
- Startup probe checks for `/tmp/started` every 5 seconds
- `failureThreshold: 12` = 60 second budget (12 × 5 = 60)
- Liveness probe only kicks in after startup succeeds

Apply and watch:
```bash
kubectl apply -f startup-pod.yaml
kubectl get pod startup-pod -w
```

**Expected output:**
```
NAME         READY   STATUS    RESTARTS   AGE
startup-pod  0/1     Running   0          20s
startup-pod  1/1     Running   0          25s
```

**The Pod stays in Running state** while the startup probe fails, then becomes Ready.

**What would happen if `failureThreshold` were 2 instead of 12?**
- Startup probe would fail after 10 seconds (2 × 5)
- Container would be killed before it finishes starting (needs 20 seconds)
- Pod would be stuck in CrashLoopBackOff

---

## Probe Comparison

| Probe | Purpose | Failure Action | Use Case |
|-------|---------|----------------|----------|
| **Liveness** | Is container alive? | Restart container | Detect deadlocks, hangs |
| **Readiness** | Is container ready? | Remove from endpoints | Wait for initialization |
| **Startup** | Has container started? | Kill container | Slow-starting apps |

**Execution order:**
1. Startup probe runs first (if configured)
2. After startup succeeds, liveness and readiness probes start
3. Liveness failure = restart
4. Readiness failure = remove from endpoints

---

## Advanced Topics

### Resource Quotas

Limit total resources per namespace:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: dev
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
```

### LimitRanges

Set default resource limits per namespace:

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: dev
spec:
  limits:
  - default:
      cpu: "500m"
      memory: "256Mi"
    defaultRequest:
      cpu: "100m"
      memory: "128Mi"
    type: Container
```

### Multiple Probes

You can use all three probes on the same container:

```yaml
spec:
  containers:
  - name: app
    image: my-app:latest
    startupProbe:
      httpGet:
        path: /healthz
        port: 8080
      failureThreshold: 30
      periodSeconds: 10
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      periodSeconds: 5
```

---

## Common Issues & Troubleshooting

### Issue: Pod stuck in Pending

**Symptoms:**
```
NAME   READY   STATUS    RESTARTS   AGE
my-pod 0/1     Pending   0          5m
```

**Causes:**
- Requesting more resources than available
- No node can satisfy the request

**Solutions:**
1. Check events: `kubectl describe pod my-pod`
2. Check node resources: `kubectl describe nodes`
3. Reduce resource requests

---

### Issue: Container keeps restarting

**Symptoms:**
```
NAME   READY   STATUS             RESTARTS   AGE
my-pod 0/1     CrashLoopBackOff   5          5m
```

**Causes:**
- Liveness probe failing
- Application crashing
- OOMKilled

**Solutions:**
1. Check logs: `kubectl logs my-pod`
2. Check previous logs: `kubectl logs my-pod --previous`
3. Describe pod: `kubectl describe pod my-pod`
4. Increase `failureThreshold` or `initialDelaySeconds`

---

### Issue: Pod not receiving traffic

**Symptoms:**
- Pod is Running but not receiving traffic
- Endpoints show `<none>`

**Causes:**
- Readiness probe failing
- Pod not matching Service selector

**Solutions:**
1. Check Pod readiness: `kubectl get pod my-pod`
2. Check endpoints: `kubectl get endpoints my-service`
3. Check readiness probe: `kubectl describe pod my-pod`
4. Fix the application or readiness probe

---

## Tips and Tricks

### 1. Use kubectl describe for Debugging
```bash
kubectl describe pod my-pod
```

### 2. Use kubectl top for Resource Usage
```bash
kubectl top pod my-pod
kubectl top nodes
```

### 3. Use kubectl get with Custom Columns
```bash
kubectl get pods -o custom-columns='NAME:.metadata.name,CPU-REQ:.spec.containers[0].resources.requests.cpu,MEM-REQ:.spec.containers[0].resources.requests.memory'
```

### 4. Use kubectl exec to Test Probes
```bash
kubectl exec my-pod -- curl localhost:8080/healthz
```

### 5. Use kubectl wait for Conditions
```bash
kubectl wait --for=condition=Ready pod/my-pod --timeout=60s
```

---

## Clean Up

```bash
# Delete Pods
kubectl delete pod resource-pod
kubectl delete pod oom-pod
kubectl delete pod pending-pod
kubectl delete pod liveness-pod
kubectl delete pod readiness-pod
kubectl delete pod startup-pod

# Delete Service
kubectl delete service readiness-svc

# Verify
kubectl get pods
kubectl get services
```

---

## Notes Section

### What I learned about Resources:
- Requests = guaranteed minimum (used for scheduling)
- Limits = maximum allowed (enforced at runtime)
- CPU is compressible (throttled)
- Memory is incompressible (OOMKilled)
- QoS: Guaranteed, Burstable, BestEffort

### What I learned about Liveness Probes:
- Detects if container is alive
- Failure = restart container
- Use for detecting deadlocks and hangs
- Be careful with startup time

### What I learned about Readiness Probes:
- Detects if container is ready for traffic
- Failure = remove from Service endpoints
- Does NOT restart container
- Use for initialization and warm-up

### What I learned about Startup Probes:
- Gives slow-starting containers extra time
- While running, liveness/readiness are disabled
- Failure = kill container
- Use for apps with long initialization

### What I learned about troubleshooting:
- Check events: `kubectl describe pod`
- Check logs: `kubectl logs`
- Check resource usage: `kubectl top`
- Check QoS class in pod description

---

## Summary

Today you learned:

1. **Resource requests/limits**: How to manage CPU and memory
2. **QoS classes**: Guaranteed, Burstable, BestEffort
3. **OOMKilled**: What happens when memory limits are exceeded
4. **Liveness probes**: Detect and restart unhealthy containers
5. **Readiness probes**: Control traffic routing
6. **Startup probes**: Handle slow-starting applications
7. **Troubleshooting**: How to debug resource and probe issues

You now know how to manage resources and health checks in Kubernetes!

---

## Next Steps

- Learn about Metrics Server and HPA (Day 58)
- Explore ResourceQuotas and LimitRanges
- Understand Pod Disruption Budgets
- Learn about Pod Priority and Preemption
- Practice with real-world applications

---

## Resources

- [Kubernetes Resource Management](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [Liveness, Readiness, Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Quality of Service](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)

---

**Resource management and probes are essential for production Kubernetes!**

Happy Learning!
**TrainWithShubham**
