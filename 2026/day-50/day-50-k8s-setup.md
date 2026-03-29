# Day 50 – Kubernetes: Architecture & Cluster Setup

---

## Overview

Today you start your Kubernetes journey. You've been building and shipping containers with Docker, but what happens when you need to run hundreds of containers across multiple servers? You need an orchestrator. Today you'll understand the Kubernetes architecture, set up a local cluster, and run your first `kubectl` commands.

This is where things get real.

---

## What is Kubernetes?

**Kubernetes** (also known as **K8s**) is an open-source container orchestration platform that automates the deployment, scaling, and management of containerized applications.

**Why was Kubernetes created?**
- Docker lets you run containers on a single host, but it doesn't help you manage hundreds/thousands of containers across many servers
- Kubernetes solves scheduling, scaling, self-healing, and service discovery for containers in production
- It was created by Google in 2014, inspired by their internal Borg system
- The name "Kubernetes" is Greek for "helmsman" or "pilot" — the one who steers a ship

**What problems does Kubernetes solve?**
- **Scheduling**: Decides which server (node) should run each container
- **Scaling**: Automatically adds or removes containers based on load
- **Self-healing**: Restarts failed containers, replaces unhealthy nodes
- **Service Discovery**: Containers can find and communicate with each other
- **Load Balancing**: Distributes traffic across multiple containers
- **Rolling Updates**: Deploy new versions without downtime
- **Rollback**: Revert to previous version if something goes wrong

---

## Kubernetes Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Control Plane (Master)                    │
├─────────────────────────────────────────────────────────────┤
│  API Server ←─── etcd (Database)                            │
│       ↑                                                     │
│  Scheduler ──── Controller Manager                          │
└─────────────────────────────────────────────────────────────┘
                          ↑
                          │ (Communication)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                     Worker Nodes                             │
├─────────────────────────────────────────────────────────────┤
│  kubelet ←─── kube-proxy                                    │
│       ↓                                                     │
│  Container Runtime (containerd/CRI-O)                       │
│       ↓                                                     │
│  [Pod] [Pod] [Pod]                                          │
└─────────────────────────────────────────────────────────────┘
```

---

### Control Plane Components (Master Node)

The control plane is the brain of the cluster. It makes global decisions about the cluster (e.g., scheduling) and detects and responds to cluster events.

#### 1. API Server (`kube-apiserver`)

**What it does:**
- The front door to the cluster — every command goes through it
- Validates and processes REST requests
- Serves the Kubernetes API
- The only component that talks directly to etcd

**How it works:**
- When you run `kubectl apply -f pod.yaml`, the request goes to the API Server
- The API Server validates the request, stores the state in etcd, and notifies other components
- All other components watch the API Server for changes

**Key point:** If the API Server goes down, you cannot interact with the cluster, but existing workloads continue running.

---

#### 2. etcd

**What it does:**
- A distributed key-value store that holds all cluster state
- Stores configuration data, node information, pod states, secrets, and more
- The single source of truth for the cluster

**How it works:**
- When you create a pod, the API Server writes the pod spec to etcd
- When a pod's status changes, the API Server updates etcd
- etcd uses Raft consensus algorithm to ensure data consistency across multiple instances

**Key point:** If etcd loses data, the cluster loses its state. Always back up etcd in production.

---

#### 3. Scheduler (`kube-scheduler`)

**What it does:**
- Watches for newly created pods that have no node assigned
- Selects the best node for each pod based on resource requirements, constraints, and affinity rules

**How it works:**
- Watches the API Server for unscheduled pods
- Filters nodes that can run the pod (resource availability, taints, tolerations)
- Scores the remaining nodes and picks the best one
- Updates the pod's `nodeName` field via the API Server

**Key point:** The scheduler only decides WHERE to run the pod — it doesn't actually start the pod. The kubelet on the selected node does that.

---

#### 4. Controller Manager (`kube-controller-manager`)

**What it does:**
- Runs controller processes that watch the cluster state and make changes to move the current state toward the desired state
- Handles node failures, pod replication, endpoints, and more

**How it works:**
- Each controller watches the API Server for specific resources
- When the actual state doesn't match the desired state, the controller takes action
- Examples:
  - **Node Controller**: Notices when a node goes down and reschedules its pods
  - **Replication Controller**: Ensures the correct number of pods are running
  - **Endpoint Controller**: Populates endpoint objects (joins services and pods)

**Key point:** Controllers are control loops that continuously watch and reconcile state.

---

### Worker Node Components

Worker nodes are the machines (physical or virtual) where your applications actually run.

#### 1. kubelet

**What it does:**
- The agent that runs on each worker node
- Communicates with the API Server
- Ensures containers are running in their pods as specified

**How it works:**
- Watches the API Server for pods assigned to its node
- Downloads container images and starts containers using the container runtime
- Reports pod status back to the API Server
- Performs health checks and restarts failed containers

**Key point:** The kubelet is the "node manager" — it's responsible for everything happening on its node.

---

#### 2. kube-proxy

**What it does:**
- Maintains network rules on each node
- Enables communication between pods and services
- Handles load balancing for services

**How it works:**
- Watches the API Server for service and endpoint changes
- Updates iptables or IPVS rules on the node
- Routes traffic to the correct pod based on service definitions

**Key point:** kube-proxy is responsible for the networking layer that allows pods to communicate across nodes.

---

#### 3. Container Runtime

**What it does:**
- The software that actually runs containers
- Pulls images, starts/stops containers, manages container lifecycle

**Common container runtimes:**
- **containerd**: The most common runtime in modern Kubernetes
- **CRI-O**: A lightweight runtime specifically for Kubernetes
- **Docker**: Was used historically, but Kubernetes now uses containerd directly

**Key point:** The kubelet tells the container runtime what to run, and the runtime does the actual work.

---

## What Happens When You Deploy a Pod?

Let's trace the request through each component:

```
1. You run: kubectl apply -f pod.yaml
   ↓
2. kubectl sends request to API Server
   ↓
3. API Server validates the request
   ↓
4. API Server writes pod spec to etcd
   ↓
5. Scheduler notices unscheduled pod
   ↓
6. Scheduler selects best node (e.g., node-2)
   ↓
7. Scheduler updates pod's nodeName via API Server
   ↓
8. API Server updates etcd
   ↓
9. kubelet on node-2 notices pod assigned to it
   ↓
10. kubelet tells container runtime to pull image and start container
   ↓
11. Container runtime starts the container
   ↓
12. kubelet reports pod status to API Server
   ↓
13. API Server updates etcd
   ↓
14. Pod is running!
```

---

## What Happens When Things Go Wrong?

### If the API Server goes down:
- You cannot interact with the cluster (no kubectl commands work)
- Existing workloads continue running (kubelets keep pods alive)
- New pods cannot be scheduled
- **Recovery**: Restart the API Server or failover to a backup

### If etcd goes down:
- The cluster loses its state
- API Server cannot read or write cluster data
- **Recovery**: Restore from etcd backup

### If a worker node goes down:
- kubelet stops reporting to the API Server
- Node Controller marks the node as "NotReady"
- After a timeout, Controller Manager reschedules pods to other nodes
- **Recovery**: Fix the node or replace it

### If a pod crashes:
- kubelet notices the pod is not running
- kubelet restarts the container (based on restart policy)
- If the pod keeps crashing, it enters `CrashLoopBackOff` state
- **Recovery**: Fix the application code or configuration

---

## Step-by-Step: Setting Up Your Local Cluster

### Step 1: Install kubectl

`kubectl` is the CLI tool you use to talk to your Kubernetes cluster.

**macOS:**
```bash
brew install kubectl
```

**Linux (amd64):**
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

**Windows (with chocolatey):**
```bash
choco install kubernetes-cli
```

**Verify installation:**
```bash
kubectl version --client
```

**Expected output:**
```
Client Version: v1.XX.X
```

---

### Step 2: Choose Your Local Cluster Tool

You have two options for running a local Kubernetes cluster:

#### Option A: kind (Kubernetes in Docker)

**What it is:**
- Runs Kubernetes clusters using Docker containers as nodes
- Lightweight and fast to start
- Great for CI/CD and local development

**Install kind:**

**macOS:**
```bash
brew install kind
```

**Linux:**
```bash
curl -Lo ./kind https://kind.sigs.k8s.io/dl/latest/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

**Create a cluster:**
```bash
kind create cluster --name devops-cluster
```

**Verify:**
```bash
kubectl cluster-info
kubectl get nodes
```

---

#### Option B: minikube

**What it is:**
- Runs a single-node Kubernetes cluster inside a VM or container
- More feature-rich (supports addons, dashboards, etc.)
- Good for learning and experimentation

**Install minikube:**

**macOS:**
```bash
brew install minikube
```

**Linux:**
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

**Start a cluster:**
```bash
minikube start
```

**Verify:**
```bash
kubectl cluster-info
kubectl get nodes
```

---

### Step 3: Verify Your Cluster is Running

After creating your cluster, verify everything is working:

```bash
# Check cluster info
kubectl cluster-info

# List all nodes
kubectl get nodes

# Get detailed info about your node
kubectl describe node <node-name>

# List all namespaces
kubectl get namespaces

# See ALL pods running in the cluster (across all namespaces)
kubectl get pods -A
```

**Expected output for `kubectl get nodes`:**
```
NAME                 STATUS   ROLES           AGE   VERSION
devops-cluster       Ready    control-plane   1m    v1.XX.X
```

---

### Step 4: Explore the kube-system Namespace

The `kube-system` namespace contains the control plane components running as pods:

```bash
kubectl get pods -n kube-system
```

**You should see pods like:**
- `etcd-devops-cluster` — The etcd database
- `kube-apiserver-devops-cluster` — The API Server
- `kube-scheduler-devops-cluster` — The Scheduler
- `kube-controller-manager-devops-cluster` — The Controller Manager
- `coredns-*` — DNS service for the cluster
- `kube-proxy-*` — Network proxy (runs on each node)

**These are the architecture components you learned about — running as actual pods inside the cluster!**

**Verify:** Can you match each running pod in `kube-system` to a component in your architecture diagram?

---

### Step 5: Practice Cluster Lifecycle

Build muscle memory with cluster operations:

```bash
# Delete your cluster
kind delete cluster --name devops-cluster
# (or: minikube delete)

# Recreate it
kind create cluster --name devops-cluster
# (or: minikube start)

# Verify it is back
kubectl get nodes
```

---

### Step 6: Explore kubectl Configuration

```bash
# Check which cluster kubectl is connected to
kubectl config current-context

# List all available contexts (clusters)
kubectl config get-contexts

# See the full kubeconfig
kubectl config view
```

**What is a kubeconfig?**
- A file that stores cluster connection information
- Default location: `~/.kube/config`
- Contains: cluster addresses, credentials, contexts
- You can switch between clusters using contexts

---

## Common kubectl Commands

### Cluster Information
```bash
kubectl cluster-info          # Show cluster endpoints
kubectl get nodes             # List all nodes
kubectl describe node <name>  # Detailed node info
```

### Namespaces
```bash
kubectl get namespaces        # List all namespaces
kubectl get pods -A           # List pods in all namespaces
kubectl get pods -n kube-system  # List pods in kube-system namespace
```

### Configuration
```bash
kubectl config current-context    # Current cluster context
kubectl config get-contexts       # List all contexts
kubectl config view               # View kubeconfig
```

### Debugging
```bash
kubectl get events               # List cluster events
kubectl logs <pod-name>          # View pod logs
kubectl describe pod <pod-name>  # Detailed pod info
```

---

## Troubleshooting Common Issues

### Issue: kubectl cannot connect to cluster

**Symptoms:**
```
The connection to the server localhost:8080 was refused
```

**Solutions:**
1. Check if your cluster is running:
   ```bash
   kind get clusters
   # or
   minikube status
   ```

2. Check your kubeconfig context:
   ```bash
   kubectl config current-context
   kubectl config get-contexts
   ```

3. Switch to the correct context:
   ```bash
   kubectl config use-context kind-devops-cluster
   # or
   kubectl config use-context minikube
   ```

---

### Issue: Nodes show NotReady status

**Symptoms:**
```
NAME    STATUS     ROLES           AGE   VERSION
node1   NotReady   control-plane   1m    v1.XX.X
```

**Solutions:**
1. Wait a few minutes — nodes may take time to initialize
2. Check node events:
   ```bash
   kubectl describe node <node-name>
   ```
3. Check kubelet logs:
   ```bash
   # For kind
   docker exec -it <container-name> journalctl -u kubelet
   
   # For minikube
   minikube ssh
   journalctl -u kubelet
   ```

---

### Issue: Pods in kube-system are not running

**Symptoms:**
```
NAMESPACE     NAME                       READY   STATUS             RESTARTS   AGE
kube-system   coredns-xxx                0/1     CrashLoopBackOff   5          5m
```

**Solutions:**
1. Check pod logs:
   ```bash
   kubectl logs <pod-name> -n kube-system
   ```
2. Describe the pod:
   ```bash
   kubectl describe pod <pod-name> -n kube-system
   ```
3. Delete and let it recreate:
   ```bash
   kubectl delete pod <pod-name> -n kube-system
   ```

---

### Issue: kind cluster creation fails

**Symptoms:**
```
ERROR: failed to create cluster: could not find a log line that matches "Reached target .* Multi-User System"
```

**Solutions:**
1. Make sure Docker is running:
   ```bash
   docker ps
   ```
2. Increase Docker resources (memory/CPU)
3. Try a different cluster name:
   ```bash
   kind create cluster --name my-cluster-2
   ```

---

## Notes Section

### What I learned about Kubernetes:
- Kubernetes is a container orchestration platform
- It automates deployment, scaling, and management of containers
- Created by Google, inspired by their Borg system
- Name means "helmsman" or "pilot" in Greek

### What I learned about the architecture:
- Control Plane: API Server, etcd, Scheduler, Controller Manager
- Worker Nodes: kubelet, kube-proxy, Container Runtime
- API Server is the front door — all requests go through it
- etcd stores all cluster state
- Scheduler decides WHERE to run pods
- Controller Manager ensures desired state matches actual state

### What I learned about kubectl:
- kubectl is the CLI tool to interact with Kubernetes
- Uses kubeconfig to connect to clusters
- Can switch between clusters using contexts
- Default kubeconfig location: ~/.kube/config

### What I learned about local clusters:
- kind: Runs Kubernetes using Docker containers (lightweight)
- minikube: Runs a single-node cluster in a VM (feature-rich)
- Both provide a fully functional Kubernetes cluster
- Great for learning and local development

### What I learned about troubleshooting:
- Check cluster status: kubectl cluster-info
- Check node status: kubectl get nodes
- Check pod status: kubectl get pods -A
- Describe resources for details: kubectl describe <resource> <name>
- Check logs: kubectl logs <pod-name>

---

## Architecture Diagram (Detailed)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Control Plane                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ API Server   │  │    etcd      │  │  Scheduler   │          │
│  │ (Front Door) │←→│  (Database)  │  │ (Assigns     │          │
│  │              │  │              │  │  Pods to     │          │
│  │              │  │              │  │  Nodes)      │          │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘          │
│         │                                    │                  │
│         │         ┌──────────────┐           │                  │
│         │         │  Controller  │           │                  │
│         │         │  Manager     │←──────────┘                  │
│         │         │ (Watches &   │                              │
│         │         │  Reconciles) │                              │
│         │         └──────────────┘                              │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │ (All communication goes through API Server)
          │
┌─────────┼───────────────────────────────────────────────────────┐
│         │                  Worker Nodes                         │
│  ┌──────┴───────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   kubelet    │  │  kube-proxy  │  │  Container   │          │
│  │ (Node Agent) │←→│ (Networking) │  │  Runtime     │          │
│  │              │  │              │  │ (containerd) │          │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘          │
│         │                                    │                  │
│         │         ┌──────────────┐           │                  │
│         │         │     Pod      │           │                  │
│         └────────→│  ┌────────┐  │←──────────┘                  │
│                   │  │Container│  │                              │
│                   │  └────────┘  │                              │
│                   └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

Today you learned:

1. **What Kubernetes is**: A container orchestration platform that automates deployment, scaling, and management

2. **The Architecture**:
   - Control Plane: API Server, etcd, Scheduler, Controller Manager
   - Worker Nodes: kubelet, kube-proxy, Container Runtime

3. **How it works**: All requests go through the API Server, state is stored in etcd, scheduler assigns pods to nodes, kubelet runs pods

4. **Local cluster setup**: kind (Docker-based) or minikube (VM-based)

5. **kubectl basics**: The CLI tool to interact with Kubernetes

6. **Troubleshooting**: How to debug common issues

You now have a running Kubernetes cluster and understand the architecture. Tomorrow you'll start deploying real applications!

---

## Next Steps

- Deploy your first pod using kubectl
- Learn about Deployments and ReplicaSets
- Understand Services and networking
- Explore ConfigMaps and Secrets
- Practice scaling and self-healing

---

## Resources

- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)
- [kind Documentation](https://kind.sigs.k8s.io/)
- [minikube Documentation](https://minikube.sigs.k8s.io/)
- [Kubernetes the Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way) (for advanced learning)

---

**Kubernetes: The Operating System for the Cloud!**

Happy Learning!
**TrainWithShubham**
