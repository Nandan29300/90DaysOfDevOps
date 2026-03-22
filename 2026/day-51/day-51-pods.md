# Day 51 – Kubernetes: Pods & Manifests

---

## 1. What is a Pod?
- A **Pod** is the smallest deployable unit in Kubernetes. It can hold one or more containers that share storage, network, and a specification for how to run them.
- Most real-world Pods have a single container, but multi-container Pods are possible for tightly coupled workloads.

---

## 2. Anatomy of a Pod Manifest

Every Kubernetes resource is defined in YAML. For a Pod, the required fields are:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: <pod-name>
  labels:
    app: <label>
spec:
  containers:
    - name: <container-name>
      image: <image>
      ports:
        - containerPort: <port>
```

---

## 3. Example Pod Manifests

### 1. Nginx Pod
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod
  labels:
    app: web
spec:
  containers:
    - name: nginx
      image: nginx:latest
      ports:
        - containerPort: 80
```

### 2. Alpine Pod (runs sleep)
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: alpine-pod
  labels:
    app: tools
spec:
  containers:
    - name: alpine
      image: alpine:3.19
      command: ["sleep", "3600"]
```

### 3. Multi-container Pod (nginx + busybox)
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-pod
  labels:
    app: demo
spec:
  containers:
    - name: nginx
      image: nginx:latest
      ports:
        - containerPort: 80
    - name: busybox
      image: busybox
      command: ["sleep", "3600"]
```

---

## 4. Deploying Pods

1. Save each manifest to a file (e.g., `nginx-pod.yaml`).
2. Apply with kubectl:
   ```sh
   kubectl apply -f nginx-pod.yaml
   kubectl apply -f alpine-pod.yaml
   kubectl apply -f multi-pod.yaml
   ```
3. Check status:
   ```sh
   kubectl get pods
   kubectl describe pod <pod-name>
   ```

---

## 6. Key Points
- Every manifest must have `apiVersion`, `kind`, `metadata`, and `spec`.
- Pod names must be unique within a namespace.
- Labels help organize and select resources.
- You can run any public image from Docker Hub.

---

**Pods are the foundation of everything in Kubernetes!**
