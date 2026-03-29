# Day 52 – Kubernetes: Namespaces & Deployments

---

## Overview

Yesterday you created standalone Pods. The problem? Delete a Pod and it is gone forever — no one recreates it. Today you fix that with **Deployments**, the real way to run applications in Kubernetes. You will also learn **Namespaces**, which let you organize and isolate resources inside a cluster.

---

## What are Namespaces?

**Namespaces** are a way to divide cluster resources between multiple teams, projects, or environments. They provide:

- **Isolation**: Resources in different namespaces are isolated from each other
- **Organization**: Group related resources together
- **Access Control**: Apply different permissions to different namespaces
- **Resource Quotas**: Limit resource usage per namespace

**Think of it like this:**
- A Kubernetes cluster is like a large building
- Namespaces are like different floors in the building
- Each floor (namespace) has its own rooms (resources)
- You can have the same room name on different floors

---

## Default Namespaces

Kubernetes comes with built-in namespaces:

```bash
kubectl get namespaces
```

**You should see:**

| Namespace | Purpose |
|-----------|---------|
| `default` | Where your resources go if you don't specify a namespace |
| `kube-system` | Kubernetes internal components (API server, scheduler, etc.) |
| `kube-public` | Publicly readable resources (cluster info) |
| `kube-node-lease` | Node heartbeat tracking |

**Check what's running in kube-system:**
```bash
kubectl get pods -n kube-system
```

These are the control plane components keeping your cluster alive. **Do not touch them.**

---

## Creating Custom Namespaces

### Method 1: Using kubectl (Imperative)

```bash
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace production
```

### Method 2: Using YAML (Declarative)

Create a file `namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: development
  labels:
    environment: dev
    team: platform
```

Apply it:
```bash
kubectl apply -f namespace.yaml
```

### Verify Namespaces

```bash
kubectl get namespaces
```

**Expected output:**
```
NAME              STATUS   AGE
default           Active   10d
dev               Active   1m
kube-node-lease   Active   10d
kube-public       Active   10d
kube-system       Active   10d
production        Active   1m
staging           Active   1m
```

---

## Working with Namespaces

### Run Resources in a Specific Namespace

```bash
# Run a pod in the dev namespace
kubectl run nginx-dev --image=nginx:latest -n dev

# Run a pod in the staging namespace
kubectl run nginx-staging --image=nginx:latest -n staging
```

### List Resources Across Namespaces

```bash
# List pods in default namespace only
kubectl get pods

# List pods in a specific namespace
kubectl get pods -n dev

# List pods in ALL namespaces
kubectl get pods -A
# or
kubectl get pods --all-namespaces
```

**Important:** `kubectl get pods` without `-n` only shows the `default` namespace. You must specify `-n <namespace>` or use `-A` to see everything.

### Set a Default Namespace

Instead of typing `-n dev` every time, set a default:

```bash
kubectl config set-context --current --namespace=dev
```

Now `kubectl get pods` will show pods in the `dev` namespace.

### Delete a Namespace

```bash
kubectl delete namespace dev
```

**Warning:** Deleting a namespace removes **everything** inside it. Be very careful with this in production!

---

## What are Deployments?

A **Deployment** tells Kubernetes: "I want X replicas of this Pod running at all times." If a Pod crashes, the Deployment controller recreates it automatically.

**Key features:**
- **Self-healing**: Automatically replaces failed pods
- **Scaling**: Easily increase or decrease the number of pods
- **Rolling updates**: Deploy new versions without downtime
- **Rollback**: Revert to previous version if something goes wrong

**Think of it like this:**
- A Pod is like a single worker
- A Deployment is like a manager who ensures there are always enough workers
- If a worker gets sick (pod crashes), the manager hires a replacement

---

## Creating a Deployment

Create a file `nginx-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: dev
  labels:
    app: nginx
    environment: dev
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.24
        ports:
        - containerPort: 80
```

### Field-by-Field Explanation

#### `apiVersion: apps/v1`
- Deployments are in the `apps` API group, version `v1`
- Different from Pods which use `v1`

#### `kind: Deployment`
- Specifies this is a Deployment resource

#### `metadata`
- `name`: Name of the deployment
- `namespace`: Which namespace to create it in
- `labels`: Key-value pairs for organization

#### `spec.replicas: 3`
- Tells Kubernetes to maintain 3 identical pods at all times

#### `spec.selector.matchLabels`
- How the Deployment finds which pods it manages
- **Must match** the labels in `template.metadata.labels`

#### `spec.template`
- The Pod template — the Deployment creates Pods using this blueprint
- This is where you define the container image, ports, etc.

---

## Deploying and Verifying

### Apply the Deployment

```bash
kubectl apply -f nginx-deployment.yaml
```

### Check the Deployment

```bash
kubectl get deployments -n dev
```

**Expected output:**
```
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   3/3     3            3           30s
```

**What the columns mean:**
- `READY`: Number of ready replicas / desired replicas
- `UP-TO-DATE`: Number of replicas updated to the latest version
- `AVAILABLE`: Number of replicas available to users
- `AGE`: How long the deployment has been running

### Check the Pods

```bash
kubectl get pods -n dev
```

**Expected output:**
```
NAME                               READY   STATUS    RESTARTS   AGE
nginx-deployment-xxxxx-yyyyy       1/1     Running   0          30s
nginx-deployment-xxxxx-zzzzz       1/1     Running   0          30s
nginx-deployment-xxxxx-aaaaa       1/1     Running   0          30s
```

Notice the pod names are auto-generated with random suffixes.

### Check the ReplicaSet

Deployments create ReplicaSets behind the scenes:

```bash
kubectl get replicasets -n dev
```

**Expected output:**
```
NAME                         DESRED   CURRENT   READY   AGE
nginx-deployment-xxxxx       3        3         3       30s
```

---

## Self-Healing: Delete a Pod and Watch It Come Back

This is the key difference between a Deployment and a standalone Pod.

### Step 1: List Pods

```bash
kubectl get pods -n dev
```

### Step 2: Delete One Pod

```bash
kubectl delete pod nginx-deployment-xxxxx-yyyyy -n dev
```

### Step 3: Immediately Check Again

```bash
kubectl get pods -n dev
```

**What happens:**
1. You delete a pod
2. Deployment controller detects only 2 of 3 desired replicas exist
3. Deployment controller immediately creates a new pod
4. New pod is scheduled and starts running
5. You're back to 3 pods

**The replacement pod has a different name** — Kubernetes generates a new random suffix.

---

## Scaling the Deployment

### Scale Up

```bash
kubectl scale deployment nginx-deployment --replicas=5 -n dev
kubectl get pods -n dev
```

**What happens:**
1. Kubernetes creates 2 new pods
2. Total pods: 5

### Scale Down

```bash
kubectl scale deployment nginx-deployment --replicas=2 -n dev
kubectl get pods -n dev
```

**What happens:**
1. Kubernetes terminates 3 pods
2. Total pods: 2

### Scale by Editing the Manifest

Change `replicas: 4` in your YAML file and run:

```bash
kubectl apply -f nginx-deployment.yaml
```

Kubernetes will scale to match the new desired state.

---

## Rolling Updates

A **rolling update** replaces pods one by one with a new version. This means zero downtime.

### Update the Image

```bash
kubectl set image deployment/nginx-deployment nginx=nginx:1.25 -n dev
```

### Watch the Rollout

```bash
kubectl rollout status deployment/nginx-deployment -n dev
```

**Expected output:**
```
Waiting for deployment "nginx-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "nginx-deployment" rollout to finish: 2 out of 3 new replicas have been updated...
deployment "nginx-deployment" successfully rolled out
```

### Check the Rollout History

```bash
kubectl rollout history deployment/nginx-deployment -n dev
```

**Expected output:**
```
deployment.apps/nginx-deployment
REVISION  CHANGE-CAUSE
1         <none>
2         <none>
```

### Rollback to Previous Version

```bash
kubectl rollout undo deployment/nginx-deployment -n dev
kubectl rollout status deployment/nginx-deployment -n dev
```

### Verify the Rollback

```bash
kubectl describe deployment nginx-deployment -n dev | grep Image
```

**Expected output:**
```
Image: nginx:1.24
```

The image is back to the previous version.

---

## How Rolling Updates Work

1. **Create new ReplicaSet**: Deployment creates a new ReplicaSet with the new version
2. **Scale up new ReplicaSet**: New pods are created one by one
3. **Scale down old ReplicaSet**: Old pods are terminated one by one
4. **Complete**: All pods are running the new version

**Key points:**
- Old pods are only terminated after new pods are healthy
- This ensures zero downtime
- You can control the update strategy with `strategy` field

### Update Strategy Options

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max pods above desired count during update
      maxUnavailable: 0  # Max pods that can be unavailable during update
```

- `maxSurge`: How many extra pods can exist during update
- `maxUnavailable`: How many pods can be unavailable during update

---

## Deployment vs Standalone Pod

| Feature | Standalone Pod | Deployment |
|---------|---------------|------------|
| Self-healing | ❌ No | ✅ Yes |
| Scaling | ❌ Manual | ✅ Automatic |
| Rolling updates | ❌ No | ✅ Yes |
| Rollback | ❌ No | ✅ Yes |
| Production ready | ❌ No | ✅ Yes |

**Rule of thumb:** Never use standalone Pods in production. Always use Deployments.

---

## Namespace Best Practices

### 1. Use Namespaces for Environments
```bash
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace production
```

### 2. Use Namespaces for Teams
```bash
kubectl create namespace team-frontend
kubectl create namespace team-backend
kubectl create namespace team-data
```

### 3. Use Resource Quotas
Limit resource usage per namespace:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: dev
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "20"
```

### 4. Use Network Policies
Isolate network traffic between namespaces:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: dev
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

---

## Clean Up

```bash
# Delete deployment
kubectl delete deployment nginx-deployment -n dev

# Delete pods
kubectl delete pod nginx-dev -n dev
kubectl delete pod nginx-staging -n staging

# Delete namespaces (removes everything inside)
kubectl delete namespace dev staging production

# Verify
kubectl get namespaces
kubectl get pods -A
```

---

## Tips and Tricks

### 1. Use kubectl explain to Learn Fields
```bash
kubectl explain deployment
kubectl explain deployment.spec
kubectl explain deployment.spec.template
```

### 2. Use kubectl edit to Modify Resources
```bash
kubectl edit deployment nginx-deployment -n dev
```

### 3. Use kubectl scale for Quick Scaling
```bash
kubectl scale deployment nginx-deployment --replicas=10 -n dev
```

### 4. Use kubectl rollout for Updates
```bash
# Update image
kubectl set image deployment/nginx-deployment nginx=nginx:1.26 -n dev

# Check status
kubectl rollout status deployment/nginx-deployment -n dev

# View history
kubectl rollout history deployment/nginx-deployment -n dev

# Rollback
kubectl rollout undo deployment/nginx-deployment -n dev
```

### 5. Use kubectl get with Custom Columns
```bash
kubectl get deployments -n dev -o custom-columns='NAME:.metadata.name,READY:.status.readyReplicas,AVAILABLE:.status.availableReplicas'
```

### 6. Use kubectl wait for Conditions
```bash
kubectl wait --for=condition=Available deployment/nginx-deployment -n dev --timeout=60s
```

---

## Troubleshooting Common Issues

### Issue: Deployment not creating pods

**Symptoms:**
```
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   0/3     0            0           5m
```

**Causes:**
- Selector doesn't match template labels
- Image doesn't exist
- Insufficient resources

**Solutions:**
1. Check deployment events: `kubectl describe deployment nginx-deployment -n dev`
2. Check if selector matches template labels
3. Check if image exists: `docker pull nginx:1.24`

---

### Issue: Pods stuck in Pending

**Symptoms:**
```
NAME                               READY   STATUS    RESTARTS   AGE
nginx-deployment-xxxxx-yyyyy       0/1     Pending   0          5m
```

**Causes:**
- No node has enough resources
- Node selector doesn't match any nodes
- PersistentVolumeClaim is not bound

**Solutions:**
1. Check pod events: `kubectl describe pod nginx-deployment-xxxxx-yyyyy -n dev`
2. Check node resources: `kubectl describe nodes`
3. Check if namespace has resource quotas: `kubectl describe resourcequota -n dev`

---

### Issue: Rolling update stuck

**Symptoms:**
```
Waiting for deployment "nginx-deployment" rollout to finish: 1 out of 3 new replicas have been updated...
```

**Causes:**
- New pods are not becoming ready
- Health checks are failing
- Image pull issues

**Solutions:**
1. Check new pods: `kubectl get pods -n dev`
2. Check pod logs: `kubectl logs <new-pod-name> -n dev`
3. Check pod events: `kubectl describe pod <new-pod-name> -n dev`
4. Rollback if needed: `kubectl rollout undo deployment/nginx-deployment -n dev`

---

## Notes Section

### What I learned about Namespaces:
- Namespaces divide cluster resources between teams/projects
- Default namespaces: default, kube-system, kube-public, kube-node-lease
- Use namespaces for environments (dev, staging, production)
- Deleting a namespace removes everything inside it
- Can set resource quotas per namespace

### What I learned about Deployments:
- Deployments ensure X replicas of a pod are always running
- Self-healing: automatically replaces failed pods
- Scaling: easily increase or decrease replicas
- Rolling updates: deploy new versions without downtime
- Rollback: revert to previous version if needed

### What I learned about ReplicaSets:
- Deployments create ReplicaSets behind the scenes
- ReplicaSets ensure the desired number of pods are running
- You can see them with `kubectl get replicasets`

### What I learned about Rolling Updates:
- Replace pods one by one with new version
- Old pods only terminated after new pods are healthy
- Zero downtime deployments
- Can rollback to previous version

### What I learned about kubectl commands:
- `kubectl scale deployment <name> --replicas=N`
- `kubectl set image deployment/<name> <container>=<image>`
- `kubectl rollout status deployment/<name>`
- `kubectl rollout history deployment/<name>`
- `kubectl rollout undo deployment/<name>`

---

## Summary

Today you learned:

1. **Namespaces**: How to organize and isolate resources in a cluster
2. **Deployments**: The real way to run applications in Kubernetes
3. **Self-healing**: How Deployments automatically replace failed pods
4. **Scaling**: How to increase or decrease the number of pods
5. **Rolling updates**: How to deploy new versions without downtime
6. **Rollback**: How to revert to previous versions

You now know how to run production-grade applications in Kubernetes. Tomorrow you'll learn about Services and networking!

---

## Next Steps

- Learn about Services (expose pods to the network)
- Understand ConfigMaps and Secrets
- Explore Ingress (HTTP routing)
- Learn about StatefulSets (for stateful applications)
- Practice with real-world applications

---

## Resources

- [Kubernetes Namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/)
- [Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/#not-namespaced)

---

**Deployments are the foundation of production Kubernetes!**

Happy Learning!
**TrainWithShubham**
