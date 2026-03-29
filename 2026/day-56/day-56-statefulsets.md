# Day 56 – Kubernetes: StatefulSets

---

## Overview

Deployments work great for stateless apps, but what about databases? You need stable pod names, ordered startup, and persistent storage per replica. Today you learn **StatefulSets** — the workload designed for stateful applications like MySQL, PostgreSQL, and Kafka.

---

## Why StatefulSets?

### The Problem with Deployments

Deployments are great for stateless applications:
- Pods get random names (`app-xyz-abc`)
- Pods can be created/destroyed in any order
- Pods share the same PVC (or have no storage)
- No stable network identity

This works for web servers, APIs, and microservices. But it breaks for:
- **Databases**: Need stable identity for replication (primary/replica)
- **Message queues**: Need ordered startup (Kafka brokers)
- **File systems**: Need per-pod storage (distributed file systems)
- **Clustering**: Need stable DNS for peer discovery

### The Solution: StatefulSets

StatefulSets provide:
- **Stable pod names**: `app-0`, `app-1`, `app-2` (not random)
- **Ordered creation**: Pods start in order (0, then 1, then 2)
- **Ordered termination**: Pods stop in reverse order (2, then 1, then 0)
- **Stable storage**: Each pod gets its own PVC
- **Stable network**: Each pod gets a stable DNS name

---

## Deployment vs StatefulSet

| Feature | Deployment | StatefulSet |
|---------|------------|-------------|
| **Pod names** | Random (`app-xyz-abc`) | Stable, ordered (`app-0`, `app-1`) |
| **Startup order** | All at once | Ordered: pod-0, then pod-1, then pod-2 |
| **Termination order** | Any order | Reverse: pod-2, then pod-1, then pod-0 |
| **Storage** | Shared PVC or none | Each pod gets its own PVC |
| **Network identity** | No stable hostname | Stable DNS per pod |
| **Use case** | Stateless apps (web servers) | Stateful apps (databases) |

**Think of it like this:**
- Deployment = A team of workers who can swap desks anytime
- StatefulSet = A team of workers with assigned desks and phone numbers

---

## Key Concepts

### Headless Service

A **Headless Service** is a Service with `clusterIP: None`. Instead of load-balancing to one IP, it creates individual DNS entries for each pod.

**Why StatefulSets need it:**
- StatefulSet pods need stable DNS names
- Headless Service creates DNS entries like: `pod-0.service.namespace.svc.cluster.local`
- Without it, pods can't find each other by name

### volumeClaimTemplates

A **volumeClaimTemplate** is a PVC template in the StatefulSet. Each pod gets its own PVC created from this template.

**Why StatefulSets need it:**
- Each pod needs its own storage
- PVCs are created automatically when pods are created
- PVCs are named: `<template-name>-<pod-name>`
- Example: `data-web-0`, `data-web-1`, `data-web-2`

### Stable Network Identity

Each StatefulSet pod gets:
- **Stable hostname**: `web-0`, `web-1`, `web-2`
- **Stable DNS**: `web-0.service.namespace.svc.cluster.local`
- **Stable IP**: IP changes on restart, but DNS name stays the same

---

## Step-by-Step: Creating a StatefulSet

### Step 1: Understand the Problem

Create a Deployment to see the issue:

```bash
kubectl create deployment test-deployment --image=nginx --replicas=3
kubectl get pods
```

**Expected output:**
```
NAME                               READY   STATUS    RESTARTS   AGE
test-deployment-xxxxx-yyyyy        1/1     Running   0          10s
test-deployment-xxxxx-zzzzz        1/1     Running   0          10s
test-deployment-xxxxx-aaaaa        1/1     Running   0          10s
```

**Notice:** Pod names are random. Delete one and it gets a different name:
```bash
kubectl delete pod test-deployment-xxxxx-yyyyy
kubectl get pods
```

**The replacement pod has a different random name.** This is fine for web servers but not for databases.

Clean up:
```bash
kubectl delete deployment test-deployment
```

---

### Step 2: Create a Headless Service

Create `headless-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
  labels:
    app: web
spec:
  clusterIP: None
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 80
```

**Field explanations:**
- `clusterIP: None` — Makes this a Headless Service
- `selector.app: web` — Matches pods with label `app: web`
- `port: 80` — Service port

Apply and verify:
```bash
kubectl apply -f headless-service.yaml
kubectl get services
```

**Expected output:**
```
NAME   TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
web    ClusterIP   None         <none>        80/TCP    10s
```

**CLUSTER-IP shows `None`** — this is a Headless Service.

---

### Step 3: Create a StatefulSet

Create `statefulset.yaml`:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: "web"
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: nginx
        image: nginx:latest
        ports:
        - containerPort: 80
        volumeMounts:
        - name: data
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 100Mi
```

**Field explanations:**
- `serviceName: "web"` — Must match the Headless Service name
- `replicas: 3` — Create 3 pods
- `volumeClaimTemplates` — Template for creating PVCs
  - Each pod gets its own PVC
  - PVC name: `data-web-0`, `data-web-1`, `data-web-2`

Apply and watch:
```bash
kubectl apply -f statefulset.yaml
kubectl get pods -l app=web -w
```

**Expected output (watch pods create in order):**
```
NAME   READY   STATUS    RESTARTS   AGE
web-0  0/1     Pending   0          0s
web-0  0/1     ContainerCreating   0          1s
web-0  1/1     Running             0          2s
web-1  0/1     Pending             0          0s
web-1  0/1     ContainerCreating   0          1s
web-1  1/1     Running             0          2s
web-2  0/1     Pending             0          0s
web-2  0/1     ContainerCreating   0          1s
web-2  1/1     Running             0          2s
```

**Pods create in order:** web-0 first, then web-1 after web-0 is Ready, then web-2.

Check PVCs:
```bash
kubectl get pvc
```

**Expected output:**
```
NAME           STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
data-web-0     Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   100Mi      RWO            standard       1m
data-web-1     Bound    pvc-yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy   100Mi      RWO            standard       1m
data-web-2     Bound    pvc-zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz   100Mi      RWO            standard       1m
```

**Each pod has its own PVC!** Named: `data-web-0`, `data-web-1`, `data-web-2`.

---

### Step 4: Stable Network Identity

Each StatefulSet pod gets a DNS name: `<pod-name>.<service-name>.<namespace>.svc.cluster.local`

Test DNS resolution:
```bash
kubectl run dns-test --image=busybox:latest --rm -it --restart=Never -- sh

# Inside the pod:
nslookup web-0.web.default.svc.cluster.local
nslookup web-1.web.default.svc.cluster.local
nslookup web-2.web.default.svc.cluster.local
exit
```

**Expected output:**
```
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local

Name:      web-0.web.default.svc.cluster.local
Address 1: 10.244.0.5 web-0.web.default.svc.cluster.local
```

**The DNS name resolves to the pod's IP address.**

Verify IPs match:
```bash
kubectl get pods -l app=web -o wide
```

**The IPs from nslookup match the pod IPs.**

---

### Step 5: Stable Storage — Data Survives Pod Deletion

Write unique data to each pod:
```bash
kubectl exec web-0 -- sh -c "echo 'Data from web-0' > /usr/share/nginx/html/index.html"
kubectl exec web-1 -- sh -c "echo 'Data from web-1' > /usr/share/nginx/html/index.html"
kubectl exec web-2 -- sh -c "echo 'Data from web-2' > /usr/share/nginx/html/index.html"
```

Verify data:
```bash
kubectl exec web-0 -- cat /usr/share/nginx/html/index.html
kubectl exec web-1 -- cat /usr/share/nginx/html/index.html
kubectl exec web-2 -- cat /usr/share/nginx/html/index.html
```

Delete web-0:
```bash
kubectl delete pod web-0
kubectl get pods -l app=web -w
```

Wait for web-0 to come back, then check data:
```bash
kubectl exec web-0 -- cat /usr/share/nginx/html/index.html
```

**Expected output:**
```
Data from web-0
```

**The data is still there!** The new pod reconnected to the same PVC.

---

### Step 6: Ordered Scaling

Scale up to 5:
```bash
kubectl scale statefulset web --replicas=5
kubectl get pods -l app=web -w
```

**Pods create in order:** web-3, then web-4 (after web-3 is Ready).

Scale down to 3:
```bash
kubectl scale statefulset web --replicas=3
kubectl get pods -l app=web -w
```

**Pods terminate in reverse order:** web-4, then web-3.

Check PVCs:
```bash
kubectl get pvc
```

**Expected output:**
```
NAME           STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
data-web-0     Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   100Mi      RWO            standard       5m
data-web-1     Bound    pvc-yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy   100Mi      RWO            standard       5m
data-web-2     Bound    pvc-zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz   100Mi      RWO            standard       5m
data-web-3     Bound    pvc-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa   100Mi      RWO            standard       2m
data-web-4     Bound    pvc-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb   100Mi      RWO            standard       2m
```

**All 5 PVCs still exist!** Kubernetes keeps them on scale-down so data is preserved if you scale back up.

---

### Step 7: Clean Up

```bash
# Delete StatefulSet
kubectl delete statefulset web

# Delete Headless Service
kubectl delete service web

# Check PVCs - they're still there!
kubectl get pvc

# Delete PVCs manually
kubectl delete pvc data-web-0 data-web-1 data-web-2 data-web-3 data-web-4

# Verify
kubectl get pods
kubectl get pvc
```

**Important:** Deleting a StatefulSet does NOT delete PVCs. This is a safety feature to prevent accidental data loss.

---

## StatefulSet Use Cases

### 1. Databases

**MySQL Primary-Replica:**
- Primary: `mysql-0` (handles writes)
- Replica: `mysql-1`, `mysql-2` (handle reads)
- Each has its own PVC for data
- Stable DNS for replication configuration

### 2. Message Queues

**Kafka Brokers:**
- Brokers: `kafka-0`, `kafka-1`, `kafka-2`
- Each broker has its own storage
- Ordered startup for cluster formation
- Stable DNS for broker discovery

### 3. Distributed Systems

**Elasticsearch Cluster:**
- Nodes: `es-0`, `es-1`, `es-2`
- Each node has its own data
- Stable network identity for cluster membership
- Ordered operations for shard allocation

---

## Advanced Topics

### Pod Management Policy

Control how pods are created:

```yaml
spec:
  podManagementPolicy: OrderedReady  # Default: create in order
  # podManagementPolicy: Parallel    # Create all at once
```

**OrderedReady**: Pods create one at a time, waiting for each to be Ready
**Parallel**: All pods create simultaneously (faster, but less safe)

### Update Strategies

```yaml
spec:
  updateStrategy:
    type: RollingUpdate  # Default: update pods one by one
    rollingUpdate:
      partition: 0       # Only update pods with ordinal >= partition
```

**RollingUpdate**: Update pods one by one in reverse order
**OnDelete**: Only update pods when manually deleted

### Pod Anti-Affinity

Spread pods across nodes:

```yaml
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: web
              topologyKey: kubernetes.io/hostname
```

---

## Common Issues & Troubleshooting

### Issue: StatefulSet pods stuck in Pending

**Symptoms:**
```
NAME   READY   STATUS    RESTARTS   AGE
web-0  0/1     Pending   0          5m
```

**Causes:**
- PVC not bound (no PV available)
- StorageClass not available
- Insufficient resources

**Solutions:**
1. Check PVC status: `kubectl get pvc`
2. Check PVC events: `kubectl describe pvc data-web-0`
3. Check StorageClass: `kubectl get storageclass`
4. Check node resources: `kubectl describe nodes`

---

### Issue: Pods not creating in order

**Symptoms:**
- All pods create at once
- Pods create in random order

**Causes:**
- `podManagementPolicy` set to `Parallel`
- Headless Service not found

**Solutions:**
1. Check StatefulSet spec: `kubectl describe statefulset web`
2. Verify `podManagementPolicy: OrderedReady`
3. Verify `serviceName` matches Headless Service

---

### Issue: DNS resolution failing

**Symptoms:**
- `nslookup web-0.web.default.svc.cluster.local` fails
- Pods can't find each other

**Causes:**
- Headless Service not created
- CoreDNS not running
- Wrong service name

**Solutions:**
1. Check Headless Service: `kubectl get service web`
2. Verify `clusterIP: None`
3. Check CoreDNS: `kubectl get pods -n kube-system | grep coredns`
4. Test with full DNS name

---

### Issue: Data not persisting

**Symptoms:**
- Data lost after pod deletion
- File system is empty

**Causes:**
- Using `emptyDir` instead of PVC
- PVC not mounted correctly
- PV is on a different node (hostPath)

**Solutions:**
1. Check volume type: `kubectl describe pod web-0`
2. Verify PVC is bound: `kubectl get pvc`
3. Check volumeMounts in pod spec

---

## Tips and Tricks

### 1. Use kubectl get with Custom Columns
```bash
kubectl get statefulset -o custom-columns='NAME:.metadata.name,READY:.status.readyReplicas,REPLICAS:.spec.replicas'
```

### 2. Use kubectl describe for Details
```bash
kubectl describe statefulset web
kubectl describe pod web-0
```

### 3. Use kubectl rollout for Updates
```bash
kubectl rollout status statefulset/web
kubectl rollout history statefulset/web
kubectl rollout undo statefulset/web
```

### 4. Use kubectl exec for Testing
```bash
kubectl exec web-0 -- cat /usr/share/nginx/html/index.html
kubectl exec web-0 -- nslookup web-1.web.default.svc.cluster.local
```

### 5. Use kubectl wait for Conditions
```bash
kubectl wait --for=condition=Ready pod/web-0 --timeout=60s
```

---

## Clean Up

```bash
# Delete StatefulSet
kubectl delete statefulset web

# Delete Headless Service
kubectl delete service web

# Delete PVCs
kubectl delete pvc data-web-0 data-web-1 data-web-2

# Verify
kubectl get pods
kubectl get pvc
kubectl get services
```

---

## Notes Section

### What I learned about StatefulSets:
- StatefulSets provide stable identity for pods
- Pods have stable names: app-0, app-1, app-2
- Pods create in order and terminate in reverse order
- Each pod gets its own PVC
- Used for stateful applications (databases, message queues)

### What I learned about Headless Services:
- Headless Services have `clusterIP: None`
- Create individual DNS entries for each pod
- DNS format: pod-0.service.namespace.svc.cluster.local
- Required for StatefulSets

### What I learned about volumeClaimTemplates:
- Template for creating PVCs in StatefulSets
- Each pod gets its own PVC
- PVC name: template-name-pod-name
- PVCs are not deleted when StatefulSet is deleted

### What I learned about ordered operations:
- Pods create in order: 0, 1, 2
- Pods terminate in reverse: 2, 1, 0
- Each pod waits for previous to be Ready
- Ensures proper initialization order

### What I learned about troubleshooting:
- Check PVC status for storage issues
- Verify Headless Service exists
- Check DNS resolution for network issues
- Use `kubectl describe` for detailed information

---

## Summary

Today you learned:

1. **Why StatefulSets are needed**: Stable identity for stateful apps
2. **Headless Services**: Create individual DNS entries for pods
3. **volumeClaimTemplates**: Each pod gets its own PVC
4. **Stable network identity**: Pods have stable DNS names
5. **Ordered operations**: Pods create/terminate in order
6. **Data persistence**: Data survives pod deletion
7. **Scaling**: Ordered scale up and down

You now know how to deploy stateful applications like databases in Kubernetes!

---

## Next Steps

- Learn about Ingress (HTTP routing)
- Explore Network Policies
- Understand Helm (package manager)
- Learn about Operators
- Practice with real databases

---

## Resources

- [Kubernetes StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)
- [Headless Services](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services)
- [Volume Claim Templates](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/#stable-storage)
- [StatefulSet Basics](https://kubernetes.io/docs/tutorials/stateful-application/basic-stateful-set/)

---

**StatefulSets are essential for stateful applications!**

Happy Learning!
**TrainWithShubham**
