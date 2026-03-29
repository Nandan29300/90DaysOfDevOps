# Day 60 – Kubernetes Capstone: WordPress + MySQL

---

## Overview

Ten days of Kubernetes — clusters, Pods, Deployments, Services, ConfigMaps, Secrets, storage, StatefulSets, resource management, autoscaling, and Helm. Today you put it all together. Deploy a real **WordPress + MySQL** application using every major concept you have learned.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    capstone namespace                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  WordPress Deployment                    │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │ wordpress-0 │  │ wordpress-1 │  │ wordpress-2 │    │   │
│  │  │ (Pod)       │  │ (Pod)       │  │ (Pod)       │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │         │                │                │              │   │
│  │         └────────────────┼────────────────┘              │   │
│  │                          │                               │   │
│  │                  ┌───────▼───────┐                      │   │
│  │                  │ WordPress     │                      │   │
│  │                  │ Service       │                      │   │
│  │                  │ (NodePort)    │                      │   │
│  │                  │ Port: 30080   │                      │   │
│  │                  └───────────────┘                      │   │
│  │                          │                               │   │
│  │                  ┌───────▼───────┐                      │   │
│  │                  │ HPA           │                      │   │
│  │                  │ min: 2        │                      │   │
│  │                  │ max: 10       │                      │   │
│  │                  │ CPU: 50%      │                      │   │
│  │                  └───────────────┘                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          │ (connects to)                         │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  MySQL StatefulSet                       │   │
│  │  ┌─────────────┐                                        │   │
│  │  │ mysql-0     │                                        │   │
│  │  │ (Pod)       │                                        │   │
│  │  └─────────────┘                                        │   │
│  │         │                                                │   │
│  │  ┌──────▼──────┐                                        │   │
│  │  │ PVC         │                                        │   │
│  │  │ 1Gi storage │                                        │   │
│  │  └─────────────┘                                        │   │
│  │                                                          │   │
│  │  ┌─────────────┐                                        │   │
│  │  │ Headless    │                                        │   │
│  │  │ Service     │                                        │   │
│  │  │ Port: 3306  │                                        │   │
│  │  └─────────────┘                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Resources Used:                                                 │
│  - Namespace (Day 52)                                           │
│  - Secret (Day 54)                                              │
│  - ConfigMap (Day 54)                                           │
│  - PVC (Day 55)                                                 │
│  - StatefulSet (Day 56)                                         │
│  - Headless Service (Day 56)                                    │
│  - Deployment (Day 52)                                          │
│  - NodePort Service (Day 53)                                    │
│  - Resource Limits (Day 57)                                     │
│  - Probes (Day 57)                                              │
│  - HPA (Day 58)                                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Step 1: Create the Namespace (Day 52)

Create `namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: capstone
  labels:
    project: wordpress
    environment: production
```

Apply and set as default:
```bash
kubectl apply -f namespace.yaml
kubectl config set-context --current --namespace=capstone
```

---

### Step 2: Deploy MySQL (Days 54-56)

#### Create MySQL Secret

Create `mysql-secret.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
  namespace: capstone
  labels:
    app: mysql
type: Opaque
stringData:
  MYSQL_ROOT_PASSWORD: "rootpassword123"
  MYSQL_DATABASE: "wordpress"
  MYSQL_USER: "wordpress"
  MYSQL_PASSWORD: "wordpress123"
```

**Note:** `stringData` allows plain text (automatically base64 encoded).

#### Create MySQL Headless Service

Create `mysql-headless-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
  namespace: capstone
  labels:
    app: mysql
spec:
  clusterIP: None
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
```

#### Create MySQL StatefulSet

Create `mysql-statefulset.yaml`:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: capstone
spec:
  serviceName: "mysql"
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
        envFrom:
        - secretRef:
            name: mysql-secret
        resources:
          requests:
            cpu: "250m"
            memory: "512Mi"
          limits:
            cpu: "500m"
            memory: "1Gi"
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 1Gi
```

Apply and verify:
```bash
kubectl apply -f mysql-secret.yaml
kubectl apply -f mysql-headless-service.yaml
kubectl apply -f mysql-statefulset.yaml
kubectl get pods -n capstone
kubectl get pvc -n capstone
```

Verify MySQL works:
```bash
kubectl exec -it mysql-0 -n capstone -- mysql -u wordpress -pwordpress123 -e "SHOW DATABASES;"
```

**Expected output:**
```
+--------------------+
| Database           |
+--------------------+
| information_schema |
| wordpress          |
+--------------------+
```

---

### Step 3: Deploy WordPress (Days 52, 54, 57)

#### Create WordPress ConfigMap

Create `wordpress-configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: wordpress-config
  namespace: capstone
  labels:
    app: wordpress
data:
  WORDPRESS_DB_HOST: "mysql-0.mysql.capstone.svc.cluster.local:3306"
  WORDPRESS_DB_NAME: "wordpress"
```

#### Create WordPress Deployment

Create `wordpress-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
  namespace: capstone
  labels:
    app: wordpress
spec:
  replicas: 2
  selector:
    matchLabels:
      app: wordpress
  template:
    metadata:
      labels:
        app: wordpress
    spec:
      containers:
      - name: wordpress
        image: wordpress:latest
        ports:
        - containerPort: 80
        envFrom:
        - configMapRef:
            name: wordpress-config
        env:
        - name: WORDPRESS_DB_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_USER
        - name: WORDPRESS_DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_PASSWORD
        resources:
          requests:
            cpu: "200m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /wp-login.php
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /wp-login.php
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 5
```

Apply and verify:
```bash
kubectl apply -f wordpress-configmap.yaml
kubectl apply -f wordpress-deployment.yaml
kubectl get pods -n capstone
```

**Wait until both pods show `1/1 Running`.**

---

### Step 4: Expose WordPress (Day 53)

Create `wordpress-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: wordpress
  namespace: capstone
  labels:
    app: wordpress
spec:
  type: NodePort
  selector:
    app: wordpress
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
```

Apply and access:
```bash
kubectl apply -f wordpress-service.yaml
kubectl get services -n capstone
```

Access WordPress:
```bash
# Minikube
minikube service wordpress -n capstone

# Kind
kubectl port-forward svc/wordpress 8080:80 -n capstone
# Then open http://localhost:8080
```

Complete the setup wizard and create a blog post.

---

### Step 5: Test Self-Healing and Persistence

#### Test WordPress Self-Healing

```bash
# Delete a WordPress pod
kubectl delete pod <wordpress-pod-name> -n capstone

# Watch it recreate
kubectl get pods -n capstone -w
```

**The Deployment recreates the pod within seconds.** Refresh the site — it's still working.

#### Test MySQL Persistence

```bash
# Delete MySQL pod
kubectl delete pod mysql-0 -n capstone

# Watch it recreate
kubectl get pods -n capstone -w
```

**The StatefulSet recreates the pod and reconnects to the same PVC.**

After MySQL recovers, refresh WordPress — your blog post should still be there.

---

### Step 6: Set Up HPA (Day 58)

Create `wordpress-hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: wordpress-hpa
  namespace: capstone
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: wordpress
  minReplicas: 2
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

Apply and verify:
```bash
kubectl apply -f wordpress-hpa.yaml
kubectl get hpa -n capstone
kubectl get all -n capstone
```

---

### Step 7: (Bonus) Compare with Helm (Day 59)

Install WordPress using Helm:
```bash
helm install wp-helm bitnami/wordpress -n helm-demo --create-namespace
```

Compare resources:
```bash
kubectl get all -n capstone
kubectl get all -n helm-demo
```

**Observations:**
- Manual approach: More control, more files
- Helm approach: Faster, less control, more abstraction

Clean up Helm deployment:
```bash
helm uninstall wp-helm -n helm-demo
kubectl delete namespace helm-demo
```

---

### Step 8: Clean Up and Reflect

Final look:
```bash
kubectl get all -n capstone
```

Count the concepts used:
1. Namespace (Day 52)
2. Secret (Day 54)
3. ConfigMap (Day 54)
4. PVC (Day 55)
5. StatefulSet (Day 56)
6. Headless Service (Day 56)
7. Deployment (Day 52)
8. NodePort Service (Day 53)
9. Resource Limits (Day 57)
10. Probes (Day 57)
11. HPA (Day 58)
12. Helm (Day 59)

**Twelve concepts in one deployment!**

Clean up:
```bash
kubectl delete namespace capstone
kubectl config set-context --current --namespace=default
```

**Deleting the namespace removes everything inside it.**

---

## Troubleshooting

### MySQL won't start

```bash
kubectl logs mysql-0 -n capstone
kubectl describe pod mysql-0 -n capstone
```

**Common issues:**
- Secret not found: Check secret exists
- PVC stuck: Check StorageClass
- Image pull error: Check image name

### WordPress can't connect to MySQL

```bash
kubectl logs <wordpress-pod> -n capstone
kubectl exec -it <wordpress-pod> -n capstone -- env | grep WORDPRESS
```

**Common issues:**
- Wrong DB host: Check ConfigMap
- Wrong credentials: Check Secret
- MySQL not ready: Wait for mysql-0 to be Running

### Probes failing

```bash
kubectl describe pod <wordpress-pod> -n capstone
```

**Common issues:**
- Initial delay too short: Increase `initialDelaySeconds`
- Wrong path: Check `/wp-login.php` exists
- Port mismatch: Check container port

---

## Notes Section

### What I learned about the capstone:
- Combined 12 Kubernetes concepts in one deployment
- WordPress uses Deployment (stateless)
- MySQL uses StatefulSet (stateful)
- Secrets for sensitive data, ConfigMaps for non-sensitive
- HPA for automatic scaling

### What I learned about architecture:
- WordPress connects to MySQL via headless service DNS
- DNS format: mysql-0.mysql.capstone.svc.cluster.local
- Each component has its own resource limits
- Probes ensure health and readiness

### What I learned about self-healing:
- Deployment recreates WordPress pods automatically
- StatefulSet recreates MySQL pod with same PVC
- Data persists across pod deletions
- HPA scales based on CPU usage

### What I learned about troubleshooting:
- Check logs: kubectl logs
- Check events: kubectl describe
- Check environment variables: kubectl exec env
- Check services: kubectl get endpoints

---

## Summary

Today you completed the Kubernetes capstone by deploying WordPress + MySQL using:

1. **Namespace**: Resource isolation
2. **Secret**: Database credentials
3. **ConfigMap**: WordPress configuration
4. **PVC**: MySQL persistent storage
5. **StatefulSet**: MySQL with stable identity
6. **Headless Service**: MySQL DNS
7. **Deployment**: WordPress with replicas
8. **NodePort Service**: External access
9. **Resource Limits**: CPU and memory management
10. **Probes**: Health checks
11. **HPA**: Automatic scaling
12. **Helm**: Package management

You've completed the 10-day Kubernetes journey!

---

## Next Steps

- Explore Kubernetes networking (CNI, Network Policies)
- Learn about Ingress controllers
- Understand RBAC and security
- Practice with cloud-managed Kubernetes (EKS, GKE, AKS)
- Prepare for CKA/CKAD certification

---

## Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [WordPress on Kubernetes](https://kubernetes.io/docs/tutorials/stateful-application/mysql-wordpress-persistent-volume/)
- [Helm Charts](https://artifacthub.io/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/overview/)

---

**Congratulations on completing the Kubernetes capstone!**

Happy Learning!
**TrainWithShubham**
