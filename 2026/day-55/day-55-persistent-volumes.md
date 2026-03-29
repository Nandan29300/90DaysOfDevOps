# Day 55 – Kubernetes: Persistent Volumes (PV) & Persistent Volume Claims (PVC)

---

## Overview

Containers are ephemeral — when a Pod dies, everything inside it disappears. That is a serious problem for databases and anything that needs to survive a restart. Today you fix this with **Persistent Volumes (PV)** and **Persistent Volume Claims (PVC)**.

---

## Why Persistent Storage?

### The Problem: Data Loss with Ephemeral Storage

When a Pod is deleted, all data inside it is lost forever. This is fine for stateless applications (web servers, APIs) but terrible for:
- Databases (MySQL, PostgreSQL, MongoDB)
- File storage (uploads, logs)
- Caching (Redis, Memcached)
- Any data that needs to survive Pod restarts

### The Solution: Persistent Volumes

**Persistent Volumes (PV)** provide durable storage that survives Pod deletion. Think of it like this:
- A Pod is like a hotel room — when you check out, everything is cleaned
- A PV is like a storage unit — your stuff stays there even when you're not using it

---

## Key Concepts

### PersistentVolume (PV)

A **PV** is a piece of storage in the cluster that has been provisioned by an administrator or dynamically by StorageClasses.

**Characteristics:**
- Cluster-wide resource (not namespaced)
- Has a lifecycle independent of any Pod
- Can be provisioned statically (by admin) or dynamically (by StorageClass)
- Contains details about the storage implementation (NFS, iSCSI, cloud storage, etc.)

### PersistentVolumeClaim (PVC)

A **PVC** is a request for storage by a user. It's similar to a Pod consuming node resources — PVCs consume PV resources.

**Characteristics:**
- Namespaced resource
- Requests specific size and access modes
- Binds to a PV that satisfies the request
- Used by Pods to access the storage

### The Relationship

```
Pod → uses → PVC → binds to → PV → backed by → Actual Storage
```

**Think of it like this:**
- PV = A parking spot (the actual space)
- PVC = A parking permit (request for a spot)
- Pod = A car (uses the parking spot via the permit)

---

## Access Modes

Access modes determine how the volume can be accessed:

| Mode | Description | Use Case |
|------|-------------|----------|
| **ReadWriteOnce (RWO)** | Read-write by a single node | Databases, single-instance apps |
| **ReadOnlyMany (ROX)** | Read-only by many nodes | Shared configuration, static content |
| **ReadWriteMany (RWX)** | Read-write by many nodes | Shared file systems, collaborative apps |

**Important:** Not all storage types support all access modes. For example:
- `hostPath`: Only supports RWO
- `NFS`: Supports all three
- `AWS EBS`: Only supports RWO
- `AWS EFS`: Supports all three

---

## Reclaim Policies

When a PVC is deleted, what happens to the PV?

| Policy | Behavior | Use Case |
|--------|----------|----------|
| **Retain** | PV is kept, data preserved | Production databases |
| **Delete** | PV and underlying storage are deleted | Temporary storage |
| **Recycle** | Basic scrub (deprecated, use Delete) | Legacy systems |

**Recommendation:** Use `Retain` for production data, `Delete` for temporary/test data.

---

## Step-by-Step: Static Provisioning

### Step 1: See the Problem — Data Lost on Pod Deletion

Create `emptydir-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: emptydir-pod
spec:
  containers:
  - name: app
    image: busybox:latest
    command: ["sh", "-c", "echo \"Data written at $(date)\" > /data/message.txt && sleep 3600"]
    volumeMounts:
    - name: data-volume
      mountPath: /data
  volumes:
  - name: data-volume
    emptyDir: {}
```

**What this does:**
- Creates a Pod with an `emptyDir` volume
- `emptyDir` is ephemeral — it lives as long as the Pod
- Writes a timestamped message to `/data/message.txt`

Apply and verify:
```bash
kubectl apply -f emptydir-pod.yaml
kubectl exec emptydir-pod -- cat /data/message.txt
```

**Expected output:**
```
Data written at Sun Mar 29 16:00:00 UTC 2026
```

Now delete and recreate:
```bash
kubectl delete pod emptydir-pod
kubectl apply -f emptydir-pod.yaml
kubectl exec emptydir-pod -- cat /data/message.txt
```

**The timestamp is different!** The old data is gone. This is the problem Persistent Volumes solve.

---

### Step 2: Create a PersistentVolume (Static Provisioning)

Create `pv.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: my-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
  - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /tmp/k8s-pv-data
```

**Field explanations:**
- `capacity.storage`: Size of the volume (1Gi)
- `accessModes`: How the volume can be accessed (ReadWriteOnce)
- `persistentVolumeReclaimPolicy`: What happens when PVC is deleted (Retain)
- `hostPath`: Path on the node where data is stored (for learning only!)

Apply and verify:
```bash
kubectl apply -f pv.yaml
kubectl get pv
```

**Expected output:**
```
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM   STORAGECLASS   REASON   AGE
my-pv  1Gi        RWO            Retain           Available                           10s
```

**Status is `Available`** — the PV is ready to be claimed.

---

### Step 3: Create a PersistentVolumeClaim

Create `pvc.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi
```

**Field explanations:**
- `accessModes`: Must match the PV (ReadWriteOnce)
- `resources.requests.storage`: How much storage to request (500Mi)
- Kubernetes finds a PV that satisfies this request

Apply and verify:
```bash
kubectl apply -f pvc.yaml
kubectl get pvc
kubectl get pv
```

**Expected output for PVC:**
```
NAME     STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
my-pvc   Bound    my-pv    1Gi        RWO                           10s
```

**Expected output for PV:**
```
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM            STORAGECLASS   REASON   AGE
my-pv  1Gi        RWO            Retain           Bound    default/my-pv                             1m
```

**Both show `Bound`** — Kubernetes matched them by capacity and access mode.

---

### Step 4: Use the PVC in a Pod — Data That Survives

Create `pv-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pv-pod
spec:
  containers:
  - name: app
    image: busybox:latest
    command: ["sh", "-c", "echo \"Data from first pod at $(date)\" >> /data/message.txt && cat /data/message.txt && sleep 3600"]
    volumeMounts:
    - name: persistent-storage
      mountPath: /data
  volumes:
  - name: persistent-storage
    persistentVolumeClaim:
      claimName: my-pvc
```

**What this does:**
- Mounts the PVC at `/data`
- Writes data to `/data/message.txt`
- Data is stored on the PV, not in the Pod

Apply and verify:
```bash
kubectl apply -f pv-pod.yaml
kubectl exec pv-pod -- cat /data/message.txt
```

**Expected output:**
```
Data from first pod at Sun Mar 29 16:05:00 UTC 2026
```

Now delete and recreate:
```bash
kubectl delete pod pv-pod
kubectl apply -f pv-pod.yaml
kubectl exec pv-pod -- cat /data/message.txt
```

**Expected output:**
```
Data from first pod at Sun Mar 29 16:05:00 UTC 2026
Data from first pod at Sun Mar 29 16:10:00 UTC 2026
```

**The data from both Pods is there!** The PV preserved the data across Pod deletion.

---

## Step-by-Step: Dynamic Provisioning

### Step 5: StorageClasses

StorageClasses allow dynamic provisioning of PVs. Instead of creating PVs manually, you create a PVC and Kubernetes automatically creates a PV.

Check available StorageClasses:
```bash
kubectl get storageclass
kubectl describe storageclass
```

**Expected output (varies by cluster):**
```
NAME                 PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE   ALLOWVOLUMEEXPANSION   AGE
standard (default)   rancher.io/local-path   Delete          WaitForFirstConsumer   false               1d
```

**Key fields:**
- `PROVISIONER`: Who creates the storage (e.g., AWS EBS, GCE PD, local-path)
- `RECLAIMPOLICY`: What happens when PVC is deleted (Delete or Retain)
- `VOLUMEBINDINGMODE`: When to bind (Immediate or WaitForFirstConsumer)

---

### Step 6: Dynamic Provisioning

Create `dynamic-pvc.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: standard  # Use your cluster's default StorageClass
  resources:
    requests:
      storage: 200Mi
```

**What this does:**
- Requests 200Mi of storage
- Uses the `standard` StorageClass
- Kubernetes automatically creates a PV

Apply and verify:
```bash
kubectl apply -f dynamic-pvc.yaml
kubectl get pvc
kubectl get pv
```

**Expected output:**
```
NAME          STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
dynamic-pvc   Bound    pvc-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   200Mi      RWO            standard       10s
```

**A new PV was created automatically!** This is dynamic provisioning.

Use it in a Pod:
```bash
kubectl run dynamic-pod --image=busybox:latest --rm -it --restart=Never -- sh -c 'echo "Dynamic data" > /data/test.txt && cat /data/test.txt'
```

---

## PV Lifecycle

### States

1. **Available**: PV is ready to be claimed
2. **Bound**: PV is bound to a PVC
3. **Released**: PVC is deleted, but PV is not yet reclaimed
4. **Failed**: Automatic reclamation failed

### Lifecycle Flow

```
Create PV → Available
    ↓
Create PVC → Bound (PV ↔ PVC)
    ↓
Delete PVC → Released (if Retain policy)
    ↓
Manual cleanup → Available (or Delete policy removes it)
```

---

## Advanced Topics

### Volume Binding Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| **Immediate** | Bind as soon as PVC is created | Storage is always available |
| **WaitForFirstConsumer** | Wait until a Pod uses the PVC | Zone-aware storage (cloud) |

**Example:**
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: slow
provisioner: kubernetes.io/gce-pd
volumeBindingMode: WaitForFirstConsumer
```

### Volume Expansion

Some StorageClasses allow expanding volumes:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: expandable
provisioner: kubernetes.io/aws-ebs
allowVolumeExpansion: true
```

Then edit the PVC to request more storage:
```bash
kubectl edit pvc my-pvc
# Change resources.requests.storage from 500Mi to 1Gi
```

### SubPath

Mount a specific directory within a volume:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: subpath-pod
spec:
  containers:
  - name: app
    image: nginx:latest
    volumeMounts:
    - name: data
      mountPath: /usr/share/nginx/html
      subPath: html  # Mount only the html subdirectory
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: my-pvc
```

---

## Common Issues & Troubleshooting

### Issue: PVC stuck in Pending

**Symptoms:**
```
NAME     STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
my-pvc   Pending                                                      5m
```

**Causes:**
- No PV available that matches the request
- Access mode mismatch
- StorageClass doesn't exist
- Storage provisioner not available

**Solutions:**
1. Check PVC events: `kubectl describe pvc my-pvc`
2. Check available PVs: `kubectl get pv`
3. Check StorageClasses: `kubectl get storageclass`
4. Verify access modes match

---

### Issue: PV shows Released but not Available

**Symptoms:**
```
NAME   CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM            STORAGECLASS   AGE
my-pv  1Gi        RWO            Retain           Released    default/my-pv                             10m
```

**Causes:**
- PVC was deleted
- Reclaim policy is Retain
- Manual cleanup needed

**Solutions:**
1. Delete the PV: `kubectl delete pv my-pv`
2. Or clear the claim reference: `kubectl patch pv my-pv -p '{"spec":{"claimRef": null}}'`

---

### Issue: Data not persisting

**Symptoms:**
- Data is lost after Pod restart
- File system is empty

**Causes:**
- Using `emptyDir` instead of PVC
- PVC not mounted correctly
- PV is on a different node (hostPath)

**Solutions:**
1. Verify volume type: `kubectl describe pod <pod-name>`
2. Check PVC is bound: `kubectl get pvc`
3. For hostPath, ensure Pod is on the same node

---

## Tips and Tricks

### 1. Use kubectl describe for Debugging
```bash
kubectl describe pv my-pv
kubectl describe pvc my-pvc
kubectl describe pod my-pod
```

### 2. Use kubectl get with Custom Columns
```bash
kubectl get pv -o custom-columns='NAME:.metadata.name,CAPACITY:.spec.capacity.storage,STATUS:.status.phase,CLAIM:.spec.claimRef.name'
```

### 3. Check PV-PVC Binding
```bash
kubectl get pv my-pv -o jsonpath='{.spec.claimRef.name}'
kubectl get pvc my-pvc -o jsonpath='{.spec.volumeName}'
```

### 4. Use kubectl edit for Quick Changes
```bash
kubectl edit pvc my-pvc
kubectl edit pv my-pv
```

### 5. Use kubectl wait for Conditions
```bash
kubectl wait --for=condition=Bound pvc/my-pvc --timeout=60s
```

---

## Clean Up

```bash
# Delete Pods first
kubectl delete pod emptydir-pod
kubectl delete pod pv-pod
kubectl delete pod dynamic-pod

# Delete PVCs
kubectl delete pvc my-pvc
kubectl delete pvc dynamic-pvc

# Check PV status
kubectl get pv

# Delete PVs manually (if Retain policy)
kubectl delete pv my-pv

# Verify
kubectl get pv
kubectl get pvc
```

---

## Notes Section

### What I learned about Persistent Storage:
- Containers are ephemeral — data is lost on Pod deletion
- PVs provide durable storage that survives Pod deletion
- PVCs are requests for storage by users
- PVs are cluster-wide, PVCs are namespaced

### What I learned about PVs:
- PVs are the actual storage resources
- Can be provisioned statically (by admin) or dynamically (by StorageClass)
- Have access modes: ReadWriteOnce, ReadOnlyMany, ReadWriteMany
- Have reclaim policies: Retain, Delete

### What I learned about PVCs:
- PVCs are requests for storage
- Bind to PVs that satisfy the request
- Used by Pods to access storage
- Can request specific size and access modes

### What I learned about StorageClasses:
- Enable dynamic provisioning of PVs
- Define provisioner, reclaim policy, and binding mode
- Developers create PVCs, StorageClass creates PVs
- Different storage types (NFS, AWS EBS, GCE PD)

### What I learned about troubleshooting:
- PVC stuck in Pending: Check PV availability and access modes
- PV Released: Manual cleanup needed for Retain policy
- Data not persisting: Check volume type and PVC binding
- Use `kubectl describe` for detailed information

---

## Summary

Today you learned:

1. **Why persistent storage is needed**: Containers are ephemeral
2. **PVs and PVCs**: How they work together
3. **Access modes**: ReadWriteOnce, ReadOnlyMany, ReadWriteMany
4. **Reclaim policies**: Retain vs Delete
5. **Static provisioning**: Admin creates PVs manually
6. **Dynamic provisioning**: StorageClass creates PVs automatically
7. **Troubleshooting**: Common issues and solutions

You now know how to provide durable storage for your applications. Tomorrow you'll learn about StatefulSets for stateful applications!

---

## Next Steps

- Learn about StatefulSets (Day 56)
- Explore NFS for shared storage
- Understand cloud storage (AWS EBS, GCE PD)
- Learn about backup and restore strategies
- Practice with real databases

---

## Resources

- [Kubernetes Persistent Volumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Storage Classes](https://kubernetes.io/docs/concepts/storage/storage-classes/)
- [Persistent Volume Claims](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistentvolumeclaims)
- [Volume Binding Modes](https://kubernetes.io/docs/concepts/storage/storage-classes/#volume-binding-mode)

---

**Persistent Volumes are essential for stateful applications!**

Happy Learning!
**TrainWithShubham**
