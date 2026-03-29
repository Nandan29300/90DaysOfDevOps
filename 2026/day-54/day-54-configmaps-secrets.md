# Day 54 – Kubernetes: ConfigMaps & Secrets

---

## Overview

Your application needs configuration — database URLs, feature flags, API keys. Hardcoding these into container images means rebuilding every time a value changes. Kubernetes solves this with **ConfigMaps** for non-sensitive config and **Secrets** for sensitive data.

---

## Why ConfigMaps and Secrets?

### The Problem with Hardcoded Config

```yaml
# BAD: Hardcoded configuration
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: my-app:latest
    env:
    - name: DB_HOST
      value: "localhost"  # Hardcoded!
    - name: DB_PASSWORD
      value: "password123"  # Hardcoded and insecure!
```

**Problems:**
- Changing config requires rebuilding the image
- Sensitive data is visible in the manifest
- Different environments need different images
- No separation between code and configuration

### The Solution

**ConfigMaps**: Store non-sensitive configuration (URLs, feature flags, settings)
**Secrets**: Store sensitive data (passwords, API keys, certificates)

**Benefits:**
- Change config without rebuilding images
- Separate configuration from code
- Different configs for different environments
- Secrets are base64-encoded (not encrypted, but separated)

---

## ConfigMaps

### What is a ConfigMap?

A ConfigMap is a Kubernetes resource that stores non-sensitive configuration data as key-value pairs.

**Think of it like this:**
- A ConfigMap is like a settings file
- Pods can read from it as environment variables or mounted files
- Changing the ConfigMap can update running Pods (if mounted as volume)

### Creating ConfigMaps

#### Method 1: From Literals (Command Line)

```bash
kubectl create configmap app-config \
  --from-literal=APP_ENV=production \
  --from-literal=APP_DEBUG=false \
  --from-literal=APP_PORT=8080
```

**Verify:**
```bash
kubectl describe configmap app-config
kubectl get configmap app-config -o yaml
```

**Expected output:**
```
Name:         app-config
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
APP_DEBUG:
----
false
APP_ENV:
----
production
APP_PORT:
----
8080
```

---

#### Method 2: From a File

Create a file `app.properties`:
```properties
APP_NAME=MyApplication
APP_VERSION=1.0.0
LOG_LEVEL=info
MAX_CONNECTIONS=100
```

Create ConfigMap from file:
```bash
kubectl create configmap app-properties --from-file=app.properties
```

**Or with a custom key name:**
```bash
kubectl create configmap app-properties --from-file=config=app.properties
```

**Verify:**
```bash
kubectl get configmap app-properties -o yaml
```

---

#### Method 3: From a Directory

Create a directory with multiple config files:
```bash
mkdir config
echo "APP_NAME=MyApp" > config/app.conf
echo "LOG_LEVEL=debug" > config/logging.conf
```

Create ConfigMap from directory:
```bash
kubectl create configmap app-configs --from-file=config/
```

Each file becomes a key in the ConfigMap.

---

#### Method 4: Using YAML Manifest

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  APP_ENV: "production"
  APP_DEBUG: "false"
  APP_PORT: "8080"
  app.properties: |
    APP_NAME=MyApplication
    APP_VERSION=1.0.0
    LOG_LEVEL=info
```

Apply it:
```bash
kubectl apply -f configmap.yaml
```

---

### Using ConfigMaps in Pods

#### Method 1: Environment Variables (envFrom)

Inject **all** keys from a ConfigMap as environment variables:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-env-pod
spec:
  containers:
  - name: app
    image: busybox:latest
    command: ["sh", "-c", "echo APP_ENV=$APP_ENV && echo APP_DEBUG=$APP_DEBUG && sleep 3600"]
    envFrom:
    - configMapRef:
        name: app-config
```

**What this does:**
- All keys from `app-config` become environment variables
- `APP_ENV`, `APP_DEBUG`, `APP_PORT` are available in the container

**Verify:**
```bash
kubectl apply -f configmap-env-pod.yaml
kubectl logs configmap-env-pod
```

**Expected output:**
```
APP_ENV=production
APP_DEBUG=false
```

---

#### Method 2: Individual Environment Variables (env)

Inject **specific** keys from a ConfigMap:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-env-specific-pod
spec:
  containers:
  - name: app
    image: busybox:latest
    command: ["sh", "-c", "echo APP_ENV=$APP_ENV && sleep 3600"]
    env:
    - name: APP_ENV
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: APP_ENV
```

**What this does:**
- Only injects the `APP_ENV` key from `app-config`
- Useful when you only need specific values

---

#### Method 3: Volume Mounts

Mount a ConfigMap as a file in the container:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: configmap-volume-pod
spec:
  containers:
  - name: nginx
    image: nginx:latest
    ports:
    - containerPort: 80
    volumeMounts:
    - name: config-volume
      mountPath: /etc/nginx/conf.d
  volumes:
  - name: config-volume
    configMap:
      name: nginx-config
```

**What this does:**
- Each key in the ConfigMap becomes a file
- File content is the value of the key
- Useful for config files (nginx.conf, application.properties, etc.)

**Verify:**
```bash
kubectl exec configmap-volume-pod -- ls /etc/nginx/conf.d
kubectl exec configmap-volume-pod -- cat /etc/nginx/conf.d/default.conf
```

---

### ConfigMap Update Propagation

**Important:** ConfigMap updates propagate differently depending on how they're used:

| Usage | Update Propagation |
|-------|-------------------|
| Environment variables | ❌ No update (set at pod startup) |
| Volume mounts | ✅ Auto-update (kubelet syncs periodically) |

**Test this:**
1. Create a ConfigMap with a value
2. Mount it as a volume in a Pod
3. Update the ConfigMap
4. Wait 30-60 seconds
5. Check if the Pod sees the new value

```bash
# Create ConfigMap
kubectl create configmap live-config --from-literal=message=hello

# Create Pod that reads the value in a loop
kubectl run config-test --image=busybox:latest --rm -it --restart=Never -- sh -c 'while true; do cat /etc/config/message; sleep 5; done'

# In another terminal, update the ConfigMap
kubectl patch configmap live-config --type merge -p '{"data":{"message":"world"}}'

# Watch the Pod output - it should change to "world" after 30-60 seconds
```

---

## Secrets

### What is a Secret?

A Secret is a Kubernetes resource that stores sensitive data as base64-encoded key-value pairs.

**Important:** Base64 is **encoding**, not **encryption**. Anyone with cluster access can decode Secrets.

**Why use Secrets then?**
- RBAC separation: Different permissions for Secrets vs ConfigMaps
- tmpfs storage: Secrets are stored in memory on nodes, not on disk
- Optional encryption at rest: Can be enabled in etcd
- Separation of concerns: Sensitive data is clearly marked

### Creating Secrets

#### Method 1: From Literals (Command Line)

```bash
kubectl create secret generic db-credentials \
  --from-literal=DB_USER=admin \
  --from-literal=DB_PASSWORD=s3cureP@ssw0rd
```

**Verify:**
```bash
kubectl get secret db-credentials -o yaml
```

**Expected output:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  DB_USER: YWRtaW4=
  DB_PASSWORD: czNjdXJlUEBzc3cwcmQ=
```

**Notice:** Values are base64-encoded.

**Decode a value:**
```bash
echo 'YWRtaW4=' | base64 --decode
# Output: admin
```

---

#### Method 2: From a File

Create a file `password.txt`:
```
s3cureP@ssw0rd
```

Create Secret from file:
```bash
kubectl create secret generic db-password --from-file=password.txt
```

**Or with a custom key name:**
```bash
kubectl create secret generic db-password --from-file=DB_PASSWORD=password.txt
```

---

#### Method 3: Using YAML Manifest

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  DB_USER: YWRtaW4=        # echo -n 'admin' | base64
  DB_PASSWORD: czNjdXJlUEBzc3cwcmQ=  # echo -n 's3cureP@ssw0rd' | base64
```

**Important:** Use `echo -n` to avoid encoding a trailing newline.

Apply it:
```bash
kubectl apply -f secret.yaml
```

---

### Using Secrets in Pods

#### Method 1: Environment Variables (env)

Inject **specific** keys from a Secret:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-env-pod
spec:
  containers:
  - name: app
    image: busybox:latest
    command: ["sh", "-c", "echo DB_USER=$DB_USER && echo DB_PASSWORD=$DB_PASSWORD && sleep 3600"]
    env:
    - name: DB_USER
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: DB_USER
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: DB_PASSWORD
```

**Verify:**
```bash
kubectl apply -f secret-env-pod.yaml
kubectl logs secret-env-pod
```

**Expected output:**
```
DB_USER=admin
DB_PASSWORD=s3cureP@ssw0rd
```

**Notice:** The values are **plaintext** in the Pod, not base64-encoded.

---

#### Method 2: Volume Mounts

Mount a Secret as a file in the container:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secret-volume-pod
spec:
  containers:
  - name: app
    image: busybox:latest
    command: ["sh", "-c", "ls /etc/secrets && cat /etc/secrets/DB_USER && sleep 3600"]
    volumeMounts:
    - name: secrets-volume
      mountPath: /etc/secrets
      readOnly: true
  volumes:
  - name: secrets-volume
    secret:
      secretName: db-credentials
```

**What this does:**
- Each key in the Secret becomes a file
- File content is the **decoded plaintext** value
- Files are read-only

**Verify:**
```bash
kubectl apply -f secret-volume-pod.yaml
kubectl exec secret-volume-pod -- ls /etc/secrets
kubectl exec secret-volume-pod -- cat /etc/secrets/DB_USER
```

**Expected output:**
```
DB_PASSWORD
DB_USER
admin
```

**Notice:** The file content is **plaintext**, not base64-encoded.

---

### Secret Types

Kubernetes supports several built-in Secret types:

| Type | Use Case |
|------|----------|
| `Opaque` | Arbitrary user-defined data (default) |
| `kubernetes.io/tls` | TLS certificates and keys |
| `kubernetes.io/dockerconfigjson` | Docker registry credentials |
| `kubernetes.io/basic-auth` | Basic authentication credentials |
| `kubernetes.io/ssh-auth` | SSH credentials |

#### TLS Secret Example

```bash
kubectl create secret tls my-tls \
  --cert=tls.crt \
  --key=tls.key
```

#### Docker Registry Secret Example

```bash
kubectl create secret docker-registry my-registry \
  --docker-server=DOCKER_REGISTRY_SERVER \
  --docker-username=DOCKER_USER \
  --docker-password=DOCKER_PASSWORD \
  --docker-email=DOCKER_EMAIL
```

Use in a Pod:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: private-image-pod
spec:
  containers:
  - name: app
    image: my-private-registry/my-app:latest
  imagePullSecrets:
  - name: my-registry
```

---

## ConfigMaps vs Secrets

| Feature | ConfigMap | Secret |
|---------|-----------|--------|
| **Purpose** | Non-sensitive config | Sensitive data |
| **Encoding** | Plain text | Base64 |
| **Storage** | etcd (plain) | etcd (base64) + optional encryption |
| **Node storage** | Disk | tmpfs (memory) |
| **RBAC** | Standard | Can be restricted separately |
| **Use case** | URLs, flags, settings | Passwords, keys, certificates |

**Rule of thumb:** If it's sensitive, use a Secret. If it's not, use a ConfigMap.

---

## Best Practices

### 1. Use envFrom for Bulk Injection
```yaml
envFrom:
- configMapRef:
    name: app-config
```
Instead of listing each variable individually.

### 2. Use Volume Mounts for Config Files
```yaml
volumeMounts:
- name: config-volume
  mountPath: /etc/config
```
Instead of copying files into the container image.

### 3. Use Secrets for Sensitive Data
Never put passwords in ConfigMaps or environment variables in plain text.

### 4. Enable Encryption at Rest
For production, enable encryption at rest for Secrets in etcd.

### 5. Use RBAC to Restrict Access
Limit who can read Secrets using Role-Based Access Control.

### 6. Use External Secret Managers
For production, consider using external secret managers:
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Secret Manager

### 7. Rotate Secrets Regularly
Change passwords and keys regularly, especially after team member departures.

### 8. Use readOnly for Secret Volumes
```yaml
volumeMounts:
- name: secrets-volume
  mountPath: /etc/secrets
  readOnly: true
```

---

## Troubleshooting Common Issues

### Issue: ConfigMap not found

**Symptoms:**
```
Error from server (NotFound): configmaps "app-config" not found
```

**Causes:**
- ConfigMap doesn't exist
- Wrong namespace
- Typo in name

**Solutions:**
1. List ConfigMaps: `kubectl get configmaps`
2. Check namespace: `kubectl get configmaps -n <namespace>`
3. Verify name in manifest

---

### Issue: Secret values not decoding correctly

**Symptoms:**
- Decoded value has extra characters
- Application can't read the value

**Causes:**
- Used `echo` without `-n` (includes newline)
- Wrong base64 encoding

**Solutions:**
1. Always use `echo -n` for encoding
2. Verify encoding: `echo -n 'value' | base64`
3. Verify decoding: `echo 'encoded-value' | base64 --decode`

---

### Issue: ConfigMap updates not reflected in Pod

**Symptoms:**
- Updated ConfigMap but Pod still has old values
- Environment variables not updating

**Causes:**
- Using environment variables (not volume mounts)
- Pod hasn't been restarted

**Solutions:**
1. Environment variables don't update — restart the Pod
2. Volume mounts update automatically (wait 30-60 seconds)
3. Use `kubectl rollout restart` for Deployments

---

### Issue: Secret visible in manifest

**Symptoms:**
- Secret values visible in `kubectl get secret -o yaml`
- Values are base64-encoded but still readable

**Causes:**
- Base64 is encoding, not encryption
- Anyone with cluster access can decode

**Solutions:**
1. Enable encryption at rest for etcd
2. Use RBAC to restrict Secret access
3. Use external secret managers
4. Never commit Secrets to version control

---

## Tips and Tricks

### 1. Use kubectl create for Quick Creation
```bash
# ConfigMap
kubectl create configmap app-config --from-literal=KEY=VALUE

# Secret
kubectl create secret generic db-creds --from-literal=DB_USER=admin --from-literal=DB_PASSWORD=pass
```

### 2. Use kubectl get with jsonpath
```bash
# Get and decode a Secret value
kubectl get secret db-credentials -o jsonpath='{.data.DB_PASSWORD}' | base64 --decode
```

### 3. Use kubectl edit to Modify
```bash
kubectl edit configmap app-config
kubectl edit secret db-credentials
```

### 4. Use kubectl describe for Details
```bash
kubectl describe configmap app-config
kubectl describe secret db-credentials
```

### 5. Use kubectl apply for Updates
```bash
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
```

### 6. Use kubectl delete and recreate
```bash
kubectl delete configmap app-config
kubectl apply -f configmap.yaml
```

---

## Clean Up

```bash
# Delete Pods
kubectl delete pod configmap-env-pod
kubectl delete pod secret-env-pod
kubectl delete pod secret-volume-pod

# Delete ConfigMaps
kubectl delete configmap app-config
kubectl delete configmap nginx-config

# Delete Secrets
kubectl delete secret db-credentials

# Verify
kubectl get configmaps
kubectl get secrets
```

---

## Notes Section

### What I learned about ConfigMaps:
- ConfigMaps store non-sensitive configuration
- Can be created from literals, files, or directories
- Can be used as environment variables or volume mounts
- Volume mounts auto-update, environment variables don't

### What I learned about Secrets:
- Secrets store sensitive data (passwords, keys, certificates)
- Values are base64-encoded, not encrypted
- Base64 is encoding, not encryption
- Secrets are stored in tmpfs on nodes (memory, not disk)

### What I learned about using them in Pods:
- envFrom: Inject all keys as environment variables
- env with configMapKeyRef/secretKeyRef: Inject specific keys
- Volume mounts: Mount as files in the container
- Volume mounts auto-update, environment variables don't

### What I learned about best practices:
- Use ConfigMaps for non-sensitive config
- Use Secrets for sensitive data
- Enable encryption at rest for Secrets
- Use RBAC to restrict Secret access
- Use external secret managers for production

### What I learned about troubleshooting:
- Check if ConfigMap/Secret exists
- Check namespace
- Use `echo -n` for base64 encoding
- Environment variables don't update automatically
- Volume mounts update automatically

---

## Summary

Today you learned:

1. **ConfigMaps**: Store non-sensitive configuration as key-value pairs
2. **Secrets**: Store sensitive data with base64 encoding
3. **Using in Pods**: Environment variables and volume mounts
4. **Update propagation**: Volume mounts auto-update, env vars don't
5. **Best practices**: When to use each, security considerations
6. **Troubleshooting**: Common issues and solutions

You now know how to manage configuration and sensitive data in Kubernetes. Tomorrow you'll learn about Ingress for HTTP routing!

---

## Next Steps

- Learn about Ingress (HTTP routing)
- Explore Network Policies
- Understand StatefulSets
- Learn about Persistent Volumes
- Practice with real-world applications

---

## Resources

- [Kubernetes ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Using ConfigMaps](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)
- [Using Secrets](https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/)
- [Secret Best Practices](https://kubernetes.io/docs/concepts/configuration/secret/#best-practices)

---

**ConfigMaps and Secrets are essential for managing application configuration!**

Happy Learning!
**TrainWithShubham**
