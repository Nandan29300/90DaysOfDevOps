# Day 50 – Kubernetes: Architecture & Cluster Setup

---

## 1. Why Kubernetes? (Recall)

- **Why was Kubernetes created?**
  - Docker lets you run containers, but it doesn't help you manage hundreds/thousands of containers across many servers. Kubernetes solves scheduling, scaling, self-healing, and service discovery for containers in production.
- **Who created Kubernetes?**
  - Google created Kubernetes, inspired by their internal Borg system.
- **What does "Kubernetes" mean?**
  - "Kubernetes" is Greek for "helmsman" or "pilot" — the one who steers a ship.

---

## 2. Kubernetes Architecture (from memory)

### Control Plane (Master Node)
- **API Server**: Entry point for all commands (kubectl, UI, etc). Validates and configures data for the API objects.
- **etcd**: Distributed key-value store for all cluster data/state.
- **Scheduler**: Assigns new pods to nodes based on resource needs and policies.
- **Controller Manager**: Watches the cluster, handles node failures, replication, etc.

### Worker Node
- **kubelet**: Agent that runs on each node, ensures containers are running as instructed.
- **kube-proxy**: Handles networking, load-balancing, and forwarding traffic to pods.
- **Container Runtime**: (e.g., containerd, Docker) Actually runs the containers.

---

## 3. Cluster Setup (kind/minikube)

### Prerequisites
- Docker installed (for kind) or VirtualBox/VM support (for minikube)

### Steps (kind example)
1. Install kind: `pip install kind` or `brew install kind`
2. Create a cluster: `kind create cluster --name day50-demo`
3. Check nodes: `kubectl get nodes`

### Steps (minikube example)
1. Install minikube: `curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64`
2. Start cluster: `minikube start`
3. Check nodes: `kubectl get nodes`

---

## 4. First kubectl Commands

- `kubectl get nodes` — List all nodes in the cluster
- `kubectl get pods -A` — List all pods in all namespaces
- `kubectl cluster-info` — Show cluster endpoints

---

## 5. Screenshot

> _Paste a screenshot of your `kubectl get nodes` output here._

---

## 6. Diagram: Kubernetes Architecture

```
flowchart TD
  subgraph Control Plane
    APIServer[API Server]
    etcd[etcd]
    Scheduler[Scheduler]
    Controller[Controller Manager]
  end
  subgraph Worker Node
    Kubelet[kubelet]
    KubeProxy[kube-proxy]
    Runtime[Container Runtime]
  end
  APIServer <--> etcd
  APIServer <--> Kubelet
  Scheduler --> APIServer
  Controller --> APIServer
  Kubelet --> Runtime
  KubeProxy --> Kubelet
```

---

**Kubernetes: The Operating System for the Cloud!**
