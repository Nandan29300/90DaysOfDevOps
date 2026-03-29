# Day 51 – Kubernetes: Pods & Manifests

---

## Overview

Yesterday you set up a Kubernetes cluster. Today you actually deploy something. You will learn the structure of a Kubernetes manifest file and use it to create Pods — the smallest deployable unit in Kubernetes. By the end of today, you should be able to write a Pod definition from scratch without looking at docs.

---

## What is a Pod?

A **Pod** is the smallest deployable unit in Kubernetes. It can hold one or more containers that share:
- **Network**: All containers in a pod share the same IP address and port space
- **Storage**: Containers can share volumes
- **Specification**: How to run the containers (images, ports, commands, etc.)

**Key characteristics:**
- Most real-world Pods have a single container
- Multi-container Pods are possible for tightly coupled workloads (sidecar pattern)
- Pods are ephemeral — they can be created, destroyed, and recreated at any time
- Pods are not scheduled directly — they're managed by controllers like Deployments

---

## The Anatomy of a Kubernetes Manifest

Every Kubernetes resource is defined using a YAML manifest with **four required top-level fields**:

```yaml
apiVersion: v1          # Which API version to use
kind: Pod               # What type of resource
metadata:               # Name, labels, namespace
  name: my-pod
  labels:
    app: my-app
spec:                   # The actual specification (what you want)
  containers:
  - name: my-container
    image: nginx:latest
    ports:
    - containerPort: 80
```

### Field-by-Field Explanation

#### 1. `apiVersion`
- Tells Kubernetes which API group to use
- For Pods: `v1`
- For Deployments: `apps/v1`
- For Services: `v1`
- Different resources have different API versions

#### 2. `kind`
- The type of resource you're creating
- Examples: `Pod`, `Deployment`, `Service`, `ConfigMap`, `Secret`
- Must match the `apiVersion` you're using

#### 3. `metadata`
- The identity of your resource
- **Required**: `name` — must be unique within a namespace
- **Optional**: `labels` — key-value pairs for organization and selection
- **Optional**: `namespace` — which namespace to create the resource in (defaults to `default`)
- **Optional**: `annotations` — additional metadata (not used for selection)

#### 4. `spec`
- The desired state of the resource
- For Pods: defines which containers to run, images, ports, commands, etc.
- This is where you specify what you want Kubernetes to do

---

## Step-by-Step: Creating Your First Pod

### Step 1: Create the Manifest File

Create a file called `nginx-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: nginx
    environment: dev
spec:
  containers:
  - name: nginx
    image: nginx:latest
    ports:
    - containerPort: 80
```

**What this does:**
- Creates a Pod named `nginx-pod`
- Adds labels `app: nginx` and `environment: dev`
- Runs a single container using the `nginx:latest` image
- Exposes port 80 inside the container

---

### Step 2: Apply the Manifest

```bash
kubectl apply -f nginx-pod.yaml
```

**What happens:**
1. kubectl reads the YAML file
2. Sends the request to the API Server
3. API Server validates the request
4. API Server stores the Pod spec in etcd
5. Scheduler assigns the Pod to a node
6. kubelet on that node pulls the image and starts the container
7. Pod is running!

---

### Step 3: Verify the Pod is Running

```bash
# List all pods
kubectl get pods

# List pods with more details (node, IP)
kubectl get pods -o wide

# Get detailed info about the pod
kubectl describe pod nginx-pod
```

**Expected output for `kubectl get pods`:**
```
NAME        READY   STATUS    RESTARTS   AGE
nginx-pod   1/1     Running   0          30s
```

**What the columns mean:**
- `NAME`: The pod name
- `READY`: Number of ready containers / total containers
- `STATUS`: Current state (Pending, Running, Succeeded, Failed, etc.)
- `RESTARTS`: Number of times the container has been restarted
- `AGE`: How long the pod has been running

---

### Step 4: Explore the Pod

```bash
# Read the container logs
kubectl logs nginx-pod

# Get a shell inside the container
kubectl exec -it nginx-pod -- /bin/bash

# Inside the container, run:
curl localhost:80
exit
```

**What you can do inside the pod:**
- Check if the application is running
- Debug issues
- View configuration files
- Test network connectivity

---

### Step 5: Create a Custom Pod (BusyBox)

Write a new manifest `busybox-pod.yaml` from scratch (do not copy-paste the nginx one):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: busybox-pod
  labels:
    app: busybox
    environment: dev
    team: platform
spec:
  containers:
  - name: busybox
    image: busybox:latest
    command: ["sh", "-c", "echo Hello from BusyBox && sleep 3600"]
```

**Key differences from nginx-pod:**
- Uses `busybox:latest` image (a lightweight Linux distribution)
- Uses `command` field to specify what to run
- BusyBox doesn't run a long-lived server like Nginx
- Without `sleep 3600`, the container would exit immediately

**Apply and verify:**
```bash
kubectl apply -f busybox-pod.yaml
kubectl get pods
kubectl logs busybox-pod
```

**Expected output for `kubectl logs busybox-pod`:**
```
Hello from BusyBox
```

---

## Imperative vs Declarative Approaches

### Declarative Approach (Recommended)
- Write YAML files describing what you want
- Use `kubectl apply -f <file>`
- Kubernetes figures out how to achieve the desired state
- **Pros**: Version control, reproducible, auditable
- **Cons**: More verbose, requires learning YAML syntax

**Example:**
```bash
kubectl apply -f nginx-pod.yaml
```

### Imperative Approach
- Run commands directly to create resources
- Use `kubectl run`, `kubectl create`, etc.
- **Pros**: Quick for testing, less typing
- **Cons**: Not version controlled, harder to reproduce

**Example:**
```bash
kubectl run redis-pod --image=redis:latest
```

### Comparing the Two

**Create a pod imperatively:**
```bash
kubectl run redis-pod --image=redis:latest
```

**Extract the YAML that Kubernetes generated:**
```bash
kubectl get pod redis-pod -o yaml
```

**Notice the differences:**
- Kubernetes adds a lot of metadata automatically (status, timestamps, uid, resource version)
- The generated YAML is much more verbose than your hand-written manifests
- You can use this to learn what fields Kubernetes expects

### Dry-Run: Generate YAML Without Creating Resources

```bash
# Generate YAML without creating the pod
kubectl run test-pod --image=nginx --dry-run=client -o yaml

# Save it to a file
kubectl run test-pod --image=nginx --dry-run=client -o yaml > test-pod.yaml
```

**This is a powerful trick** — use it to quickly scaffold a manifest, then customize it.

---

## Validating Manifests Before Applying

Before applying a manifest, you can validate it:

```bash
# Check if the YAML is valid (client-side)
kubectl apply -f nginx-pod.yaml --dry-run=client

# Validate against the cluster's API (server-side)
kubectl apply -f nginx-pod.yaml --dry-run=server
```

**Try breaking your YAML:**
1. Remove the `image` field
2. Run `kubectl apply -f nginx-pod.yaml --dry-run=client`
3. See what error you get

**Common validation errors:**
- Missing required fields (`apiVersion`, `kind`, `metadata`, `spec`)
- Invalid YAML syntax (indentation, colons, etc.)
- Invalid field values (wrong type, missing required sub-fields)

---

## Pod Labels and Filtering

Labels are how Kubernetes organizes and selects resources. You added labels in your manifests — now use them:

```bash
# List all pods with their labels
kubectl get pods --show-labels

# Filter pods by label
kubectl get pods -l app=nginx
kubectl get pods -l environment=dev

# Filter by multiple labels (AND condition)
kubectl get pods -l app=nginx,environment=dev

# Add a label to an existing pod
kubectl label pod nginx-pod team=backend

# Verify
kubectl get pods --show-labels

# Remove a label
kubectl label pod nginx-pod environment-
```

**Why labels matter:**
- Deployments use labels to find which pods to manage
- Services use labels to find which pods to route traffic to
- You can use labels for monitoring, logging, and cost allocation

---

## Pod Lifecycle

### Pod Phases

A pod goes through several phases during its lifecycle:

1. **Pending**: The pod has been accepted but not yet scheduled (waiting for a node)
2. **Running**: The pod has been bound to a node and at least one container is running
3. **Succeeded**: All containers have terminated successfully (exit code 0)
4. **Failed**: All containers have terminated, and at least one has a non-zero exit code
5. **Unknown**: The pod state could not be determined

### Container States

Inside a pod, each container can be in one of these states:

1. **Waiting**: Container is not running (pulling image, waiting for dependencies)
2. **Running**: Container is executing without issues
3. **Terminated**: Container has finished execution (completed or failed)

### Restart Policies

The `restartPolicy` field determines what happens when a container exits:

- `Always` (default): Always restart the container
- `OnFailure`: Only restart if the container exits with a non-zero exit code
- `Never`: Never restart the container

**Example:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: job-pod
spec:
  restartPolicy: OnFailure
  containers:
  - name: job
    image: busybox
    command: ["sh", "-c", "echo Running job && exit 0"]
```

---

## Multi-Container Pods

Sometimes you need multiple containers in a single pod. Common patterns:

### Sidecar Pattern
A helper container that assists the main container:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-with-logger
spec:
  containers:
  - name: web
    image: nginx:latest
    ports:
    - containerPort: 80
  - name: logger
    image: busybox
    command: ["sh", "-c", "tail -f /var/log/nginx/access.log"]
    volumeMounts:
    - name: logs
      mountPath: /var/log/nginx
  volumes:
  - name: logs
    emptyDir: {}
```

**What this does:**
- Main container: nginx web server
- Sidecar container: tails the nginx access log
- Both containers share a volume for logs

### Ambassador Pattern
A proxy container that handles network communication:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: app-with-proxy
spec:
  containers:
  - name: app
    image: my-app:latest
    ports:
    - containerPort: 8080
  - name: proxy
    image: envoyproxy/envoy:latest
    ports:
    - containerPort: 80
```

---

## Common Pod Operations

### View Pod Details
```bash
# Get pod info
kubectl get pods

# Get detailed info
kubectl describe pod <pod-name>

# View pod YAML
kubectl get pod <pod-name> -o yaml

# View pod logs
kubectl logs <pod-name>

# View logs from a specific container in a multi-container pod
kubectl logs <pod-name> -c <container-name>
```

### Execute Commands in a Pod
```bash
# Get a shell
kubectl exec -it <pod-name> -- /bin/bash

# Run a single command
kubectl exec <pod-name> -- ls /usr/share/nginx/html

# Execute in a specific container
kubectl exec -it <pod-name> -c <container-name> -- /bin/sh
```

### Debugging Pods
```bash
# Check pod events
kubectl describe pod <pod-name>

# Check pod status
kubectl get pod <pod-name> -o wide

# View pod logs
kubectl logs <pod-name>

# View previous container logs (if container restarted)
kubectl logs <pod-name> --previous
```

---

## Clean Up

Delete all the pods you created:

```bash
# Delete by name
kubectl delete pod nginx-pod
kubectl delete pod busybox-pod
kubectl delete pod redis-pod

# Or delete using the manifest file
kubectl delete -f nginx-pod.yaml

# Verify everything is gone
kubectl get pods
```

**Important:** When you delete a standalone Pod, it is gone forever. There is no controller to recreate it. This is why in production you use **Deployments** (coming on Day 52) instead of bare Pods.

---

## Tips and Tricks

### 1. Use Dry-Run to Generate Templates
```bash
kubectl run my-pod --image=nginx --dry-run=client -o yaml > pod.yaml
```
Then customize the generated YAML.

### 2. Use kubectl explain to Learn Fields
```bash
kubectl explain pod
kubectl explain pod.spec
kubectl explain pod.spec.containers
```

### 3. Use kubectl edit to Modify Resources
```bash
kubectl edit pod nginx-pod
```
Opens the resource in your default editor.

### 4. Use kubectl get with Custom Columns
```bash
kubectl get pods -o custom-columns='NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName'
```

### 5. Use kubectl wait for Conditions
```bash
kubectl wait --for=condition=Ready pod/nginx-pod --timeout=60s
```

### 6. Use kubectl top to View Resource Usage
```bash
kubectl top pods
kubectl top nodes
```

---

## Troubleshooting Common Issues

### Issue: Pod stuck in Pending

**Symptoms:**
```
NAME        READY   STATUS    RESTARTS   AGE
nginx-pod   0/1     Pending   0          5m
```

**Causes:**
- No node has enough resources (CPU/memory)
- Node selector doesn't match any nodes
- PersistentVolumeClaim is not bound

**Solutions:**
1. Check pod events: `kubectl describe pod nginx-pod`
2. Check node resources: `kubectl describe nodes`
3. Check if image exists: `docker pull nginx:latest`

---

### Issue: Pod stuck in CrashLoopBackOff

**Symptoms:**
```
NAME        READY   STATUS             RESTARTS   AGE
nginx-pod   0/1     CrashLoopBackOff   5          5m
```

**Causes:**
- Application crashes immediately
- Missing configuration or environment variables
- Port conflict

**Solutions:**
1. Check logs: `kubectl logs nginx-pod`
2. Check previous logs: `kubectl logs nginx-pod --previous`
3. Describe pod: `kubectl describe pod nginx-pod`
4. Exec into container: `kubectl exec -it nginx-pod -- /bin/sh`

---

### Issue: ImagePullBackOff

**Symptoms:**
```
NAME        READY   STATUS             RESTARTS   AGE
nginx-pod   0/1     ImagePullBackOff   0          2m
```

**Causes:**
- Image doesn't exist
- Image name is misspelled
- Private image requires credentials
- Network issues

**Solutions:**
1. Check image name: `kubectl describe pod nginx-pod`
2. Try pulling manually: `docker pull nginx:latest`
3. Check if image is private and needs credentials

---

## Notes Section

### What I learned about Pods:
- Pods are the smallest deployable unit in Kubernetes
- Pods can contain one or more containers
- Pods share network and storage
- Pods are ephemeral — they can be created and destroyed at any time

### What I learned about Manifests:
- Four required fields: apiVersion, kind, metadata, spec
- apiVersion tells Kubernetes which API to use
- kind specifies the resource type
- metadata provides identity (name, labels)
- spec defines the desired state

### What I learned about Imperative vs Declarative:
- Imperative: Run commands directly (quick for testing)
- Declarative: Write YAML files (recommended for production)
- Dry-run generates YAML without creating resources
- kubectl explain helps learn available fields

### What I learned about Pod Lifecycle:
- Phases: Pending, Running, Succeeded, Failed, Unknown
- Container states: Waiting, Running, Terminated
- Restart policies: Always, OnFailure, Never
- Labels help organize and select resources

---

## Summary

Today you learned:

1. **What Pods are**: The smallest deployable unit in Kubernetes
2. **Manifest structure**: apiVersion, kind, metadata, spec
3. **Creating Pods**: Using YAML files and kubectl apply
4. **Imperative vs Declarative**: Two approaches to creating resources
5. **Pod lifecycle**: Phases, container states, restart policies
6. **Labels and filtering**: How to organize and select resources
7. **Debugging**: How to troubleshoot pod issues

You now know how to write Pod manifests from scratch and deploy them to Kubernetes. Tomorrow you'll learn about Deployments — the real way to run applications in production!

---

## Next Steps

- Learn about Deployments (Day 52)
- Understand ReplicaSets
- Explore Services and networking
- Learn about ConfigMaps and Secrets
- Practice with multi-container pods

---

## Resources

- [Kubernetes Pods Documentation](https://kubernetes.io/docs/concepts/workloads/pods/)
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)
- [Kubernetes Manifest Reference](https://kubernetes.io/docs/reference/kubernetes-api/)

---

**Pods are the foundation of everything in Kubernetes!**

Happy Learning!
**TrainWithShubham**
