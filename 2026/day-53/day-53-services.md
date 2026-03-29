# Day 53 – Kubernetes: Services

---

## Overview

You have Deployments running multiple Pods, but how do you actually talk to them? Pods get random IP addresses that change every time they restart. **Services** solve this by giving your Pods a stable network endpoint. Today you will create different types of Services and understand when to use each one.

---

## Why Services?

Every Pod gets its own IP address. But there are two problems:

1. **Pod IPs are not stable** — when a Pod restarts or gets replaced, it gets a new IP
2. **A Deployment runs multiple Pods** — which IP do you connect to?

A Service solves both problems. It provides:
- A **stable IP and DNS name** that never changes
- **Load balancing** across all Pods that match its selector

```
[Client] --> [Service (stable IP)] --> [Pod 1]
                                   --> [Pod 2]
                                   --> [Pod 3]
```

**Think of it like this:**
- Pods are like workers who change desks every day
- A Service is like a receptionist who always knows where the workers are
- You talk to the receptionist (Service), and they route you to an available worker (Pod)

---

## How Services Work

### The Service Object

A Service is a Kubernetes resource that:
1. Has a stable IP address and DNS name
2. Selects Pods based on labels
3. Routes traffic to matching Pods
4. Load balances across all matching Pods

### Service Discovery

Kubernetes has a built-in DNS server. Every Service gets a DNS entry automatically:

```
<service-name>.<namespace>.svc.cluster.local
```

**Examples:**
- `web-app.default.svc.cluster.local` (full name)
- `web-app` (short name, works within the same namespace)

### Endpoints

When a Service selects Pods, it creates **Endpoints** — a list of Pod IPs that the Service routes to.

```bash
kubectl get endpoints <service-name>
```

**Expected output:**
```
NAME              ENDPOINTS
web-app-clusterip 10.244.0.5:80,10.244.0.6:80,10.244.0.7:80
```

---

## Service Types

Kubernetes supports four types of Services:

| Type | Accessible From | Use Case |
|------|----------------|----------|
| **ClusterIP** | Inside the cluster only | Internal communication between services |
| **NodePort** | Outside via `<NodeIP>:<NodePort>` | Development, testing, direct node access |
| **LoadBalancer** | Outside via cloud load balancer | Production traffic in cloud environments |
| **ExternalName** | Inside the cluster (DNS CNAME) | External services (databases, APIs) |

**Key insight:** Each type builds on the previous one:
- LoadBalancer creates a NodePort, which creates a ClusterIP
- So a LoadBalancer service also has a ClusterIP and a NodePort

---

## Step-by-Step: Creating Services

### Step 1: Deploy the Application

First, create a Deployment that you will expose with Services. Create `app-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
```

Apply it:
```bash
kubectl apply -f app-deployment.yaml
kubectl get pods -o wide
```

**Note the individual Pod IPs.** These will change if pods restart — that is the problem Services fix.

---

### Step 2: ClusterIP Service (Internal Access)

ClusterIP is the **default** Service type. It gives your Pods a stable internal IP that is only reachable from within the cluster.

Create `clusterip-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-clusterip
spec:
  type: ClusterIP
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 80
```

**Field explanations:**
- `type: ClusterIP` — the default type (can be omitted)
- `selector.app: web-app` — routes traffic to all Pods with label `app: web-app`
- `port: 80` — the port the Service listens on
- `targetPort: 80` — the port on the Pod to forward traffic to

Apply it:
```bash
kubectl apply -f clusterip-service.yaml
kubectl get services
```

**Expected output:**
```
NAME               TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
web-app-clusterip  ClusterIP   10.96.100.50    <none>        80/TCP    30s
```

**The CLUSTER-IP is stable** — it will not change even if Pods restart.

---

### Step 3: Test ClusterIP from Inside the Cluster

ClusterIP services are only accessible from inside the cluster. Test it:

```bash
# Run a temporary pod to test connectivity
kubectl run test-client --image=busybox:latest --rm -it --restart=Never -- sh

# Inside the test pod, run:
wget -qO- http://web-app-clusterip
exit
```

**You should see the Nginx welcome page.** The Service load-balanced your request to one of the 3 Pods.

**Try running the wget command multiple times** — the Service distributes traffic across all healthy Pods.

---

### Step 4: Discover Services with DNS

Kubernetes has a built-in DNS server. Every Service gets a DNS entry automatically:

```bash
kubectl run dns-test --image=busybox:latest --rm -it --restart=Never -- sh

# Inside the pod:
# Short name (works within the same namespace)
wget -qO- http://web-app-clusterip

# Full DNS name
wget -qO- http://web-app-clusterip.default.svc.cluster.local

# Look up the DNS entry
nslookup web-app-clusterip
exit
```

**Both the short name and the full DNS name resolve to the same ClusterIP.**

In practice:
- Use the **short name** when communicating within the same namespace
- Use the **full name** when reaching across namespaces

---

### Step 5: NodePort Service (External Access via Node)

A NodePort Service exposes your application on a port on **every node** in the cluster. This lets you access the Service from outside the cluster.

Create `nodeport-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-nodeport
spec:
  type: NodePort
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
```

**Field explanations:**
- `type: NodePort` — exposes the service on each node's IP
- `nodePort: 30080` — the port opened on every node (must be in range 30000-32767)
- Traffic flow: `<NodeIP>:30080` → Service → Pod:80

Apply it:
```bash
kubectl apply -f nodeport-service.yaml
kubectl get services
```

**Expected output:**
```
NAME               TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
web-app-nodeport   NodePort   10.96.100.51    <none>        80:30080/TCP   30s
```

---

### Step 6: Access NodePort Service

Access the service from outside the cluster:

**If using Minikube:**
```bash
minikube service web-app-nodeport --url
```

**If using Kind:**
```bash
# Get the node IP first
kubectl get nodes -o wide
# Then curl <node-internal-ip>:30080
```

**If using Docker Desktop:**
```bash
curl http://localhost:30080
```

**You should see the Nginx welcome page** from your browser or terminal.

---

### Step 7: LoadBalancer Service (Cloud External Access)

In a cloud environment (AWS, GCP, Azure), a LoadBalancer Service provisions a real external load balancer that routes traffic to your nodes.

Create `loadbalancer-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app-loadbalancer
spec:
  type: LoadBalancer
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 80
```

Apply it:
```bash
kubectl apply -f loadbalancer-service.yaml
kubectl get services
```

**Expected output (local cluster):**
```
NAME                  TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
web-app-loadbalancer  LoadBalancer   10.96.100.52    <pending>     80:31234/TCP   30s
```

**On a local cluster (Minikube, Kind, Docker Desktop), the EXTERNAL-IP will show `<pending>`** because there is no cloud provider to create a real load balancer. This is expected.

**If you are using Minikube:**
```bash
# Minikube can simulate a LoadBalancer
minikube tunnel
# In another terminal, check again:
kubectl get services
```

**In a real cloud cluster**, the EXTERNAL-IP would be a public IP address or hostname provisioned by the cloud provider.

---

### Step 8: Understand Service Types Side by Side

Check all three services:

```bash
kubectl get services -o wide
```

**Compare them:**

| Type | Accessible From | Use Case |
|------|----------------|----------|
| ClusterIP | Inside the cluster only | Internal communication between services |
| NodePort | Outside via `<NodeIP>:<NodePort>` | Development, testing, direct node access |
| LoadBalancer | Outside via cloud load balancer | Production traffic in cloud environments |

**Each type builds on the previous one:**
- LoadBalancer creates a NodePort, which creates a ClusterIP
- So a LoadBalancer service also has a ClusterIP and a NodePort

Verify this:
```bash
kubectl describe service web-app-loadbalancer
```

You should see all three: a ClusterIP, a NodePort, and the LoadBalancer configuration.

---

## Service Manifest Deep Dive

### Basic Service Structure

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
  labels:
    app: my-app
spec:
  type: ClusterIP  # or NodePort, LoadBalancer
  selector:
    app: my-app    # Must match Pod labels
  ports:
  - name: http     # Optional, but recommended
    port: 80       # Service port
    targetPort: 80 # Pod port
    protocol: TCP  # TCP or UDP
```

### Field Explanations

#### `selector`
- How the Service finds which Pods to route to
- **Must match** the labels on the Pods
- If no Pods match, the Service has no Endpoints

#### `ports`
- `port`: The port the Service listens on
- `targetPort`: The port on the Pod to forward traffic to
- `nodePort`: The port on the node (only for NodePort/LoadBalancer)
- `protocol`: TCP (default) or UDP

#### `type`
- `ClusterIP`: Default, internal only
- `NodePort`: Exposes on node IP
- `LoadBalancer`: Provisions cloud load balancer
- `ExternalName`: Maps to external DNS name

---

## Advanced Service Features

### Multiple Ports

A Service can expose multiple ports:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: https
    port: 443
    targetPort: 443
```

### Named Ports

You can reference ports by name instead of number:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-app
spec:
  containers:
  - name: nginx
    image: nginx:latest
    ports:
    - name: http  # Named port
      containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: http  # Reference by name
```

### Session Affinity

Route all requests from a client to the same Pod:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-app
spec:
  selector:
    app: web-app
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
  ports:
  - port: 80
    targetPort: 80
```

### ExternalName Service

Map a Service to an external DNS name:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: external-db
spec:
  type: ExternalName
  externalName: my-database.example.com
```

**What this does:**
- Creates a DNS CNAME record
- Pods can access the external service using the Service name
- No load balancing — just DNS mapping

---

## Service Networking Deep Dive

### How Traffic Flows

```
Client (Pod or external)
  ↓
Service (stable IP: 10.96.100.50)
  ↓
kube-proxy (updates iptables/IPVS rules)
  ↓
Pod 1 (10.244.0.5:80)
Pod 2 (10.244.0.6:80)
Pod 3 (10.244.0.7:80)
```

### kube-proxy Role

kube-proxy runs on every node and:
1. Watches the API Server for Service and Endpoint changes
2. Updates iptables or IPVS rules on the node
3. Routes traffic to the correct Pod based on Service definitions

### Service IP Range

The cluster has a range of IPs for Services (default: 10.96.0.0/16). You can check it:

```bash
kubectl cluster-info dump | grep -i service-cluster-ip-range
```

---

## Troubleshooting Common Issues

### Issue: Service not routing to Pods

**Symptoms:**
- Service exists but no traffic reaches Pods
- `kubectl get endpoints <service-name>` shows no endpoints

**Causes:**
- Selector doesn't match Pod labels
- Pods are not running
- Pods are in a different namespace

**Solutions:**
1. Check Service selector: `kubectl describe service <service-name>`
2. Check Pod labels: `kubectl get pods --show-labels`
3. Check Endpoints: `kubectl get endpoints <service-name>`
4. Verify Pods are running: `kubectl get pods`

---

### Issue: Cannot access NodePort from outside

**Symptoms:**
- NodePort service exists but cannot access from browser
- `curl http://localhost:30080` fails

**Causes:**
- Firewall blocking the port
- Node IP is not reachable
- Using wrong IP address

**Solutions:**
1. Check if port is open: `netstat -tuln | grep 30080`
2. Try using node IP: `kubectl get nodes -o wide`
3. For Minikube: `minikube service web-app-nodeport --url`
4. For Kind: Use `docker exec` to access from inside the container

---

### Issue: LoadBalancer EXTERNAL-IP stuck on pending

**Symptoms:**
```
NAME                  TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
web-app-loadbalancer  LoadBalancer   10.96.100.52    <pending>     80:31234/TCP   5m
```

**Causes:**
- Running on a local cluster (no cloud provider)
- Cloud provider not configured
- Insufficient permissions

**Solutions:**
1. For Minikube: Run `minikube tunnel` in a separate terminal
2. For Kind: Use NodePort instead
3. For cloud: Check cloud provider configuration and permissions

---

### Issue: DNS resolution failing

**Symptoms:**
- `nslookup web-app` fails
- Cannot resolve Service name

**Causes:**
- CoreDNS not running
- DNS policy misconfigured
- Network issues

**Solutions:**
1. Check CoreDNS pods: `kubectl get pods -n kube-system | grep coredns`
2. Check DNS policy: `kubectl describe pod <pod-name> | grep dnsPolicy`
3. Test with full DNS name: `web-app.default.svc.cluster.local`

---

## Tips and Tricks

### 1. Use kubectl explain to Learn Fields
```bash
kubectl explain service
kubectl explain service.spec
kubectl explain service.spec.ports
```

### 2. Use kubectl get with Custom Columns
```bash
kubectl get services -o custom-columns='NAME:.metadata.name,TYPE:.spec.type,CLUSTER-IP:.spec.clusterIP,PORT:.spec.ports[0].port'
```

### 3. Use kubectl describe for Details
```bash
kubectl describe service <service-name>
```

### 4. Use kubectl get endpoints to See Pod IPs
```bash
kubectl get endpoints <service-name>
```

### 5. Use kubectl port-forward for Local Testing
```bash
kubectl port-forward service/web-app-clusterip 8080:80
# Now access http://localhost:8080
```

### 6. Use kubectl expose to Create Services Quickly
```bash
# Create a ClusterIP service from a deployment
kubectl expose deployment web-app --port=80 --target-port=80 --name=web-app-service

# Create a NodePort service
kubectl expose deployment web-app --port=80 --target-port=80 --type=NodePort --name=web-app-nodeport
```

---

## Clean Up

```bash
# Delete deployment
kubectl delete -f app-deployment.yaml

# Delete services
kubectl delete -f clusterip-service.yaml
kubectl delete -f nodeport-service.yaml
kubectl delete -f loadbalancer-service.yaml

# Verify
kubectl get pods
kubectl get services
```

Only the built-in `kubernetes` service in the default namespace should remain.

---

## Notes Section

### What I learned about Services:
- Services provide stable IP and DNS name for Pods
- Services load balance traffic across matching Pods
- Services solve the problem of Pod IP instability
- Services use selectors to find Pods by labels

### What I learned about Service Types:
- **ClusterIP**: Internal access only (default)
- **NodePort**: External access via node IP
- **LoadBalancer**: External access via cloud load balancer
- **ExternalName**: Maps to external DNS name

### What I learned about DNS:
- Every Service gets a DNS entry automatically
- Format: `<service-name>.<namespace>.svc.cluster.local`
- Short names work within the same namespace
- Full names work across namespaces

### What I learned about Endpoints:
- Endpoints are the list of Pod IPs a Service routes to
- Created automatically based on Service selector
- Can be viewed with `kubectl get endpoints`

### What I learned about troubleshooting:
- Check Service selector matches Pod labels
- Check Endpoints to see if Pods are being selected
- Check if Pods are running
- Use `kubectl describe` for detailed information

---

## Summary

Today you learned:

1. **What Services are**: Stable network endpoints for Pods
2. **Why Services are needed**: Pod IPs are unstable, Deployments have multiple Pods
3. **Service Types**: ClusterIP, NodePort, LoadBalancer, ExternalName
4. **DNS Discovery**: How to find Services using DNS names
5. **Endpoints**: How Services track which Pods to route to
6. **Troubleshooting**: How to debug Service issues

You now know how to expose your applications to the network and make them accessible. Tomorrow you'll learn about ConfigMaps and Secrets!

---

## Next Steps

- Learn about ConfigMaps and Secrets (Day 54)
- Explore Ingress (HTTP routing)
- Understand Network Policies
- Learn about StatefulSets
- Practice with real-world applications

---

## Resources

- [Kubernetes Services](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Service Types](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types)
- [DNS for Services](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [kubectl Reference](https://kubernetes.io/docs/reference/kubectl/)

---

**Services are the foundation of Kubernetes networking!**

Happy Learning!
**TrainWithShubham**
