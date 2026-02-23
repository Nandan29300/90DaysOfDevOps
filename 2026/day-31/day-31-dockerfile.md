# Day 31 – Dockerfile: Build Your Own Images

## Task 1: Your First Dockerfile

**Folder:** `my-first-image/`  
**Dockerfile contents:**
```dockerfile name=2026/day-31/my-first-image/Dockerfile
FROM ubuntu:latest
RUN apt-get update && apt-get install -y curl
CMD echo "Hello from my custom image!"
```

**Build & run:**
```sh
cd my-first-image
docker build -t my-ubuntu:v1 .
docker run --rm my-ubuntu:v1
```
**Expected output:**  
```
Hello from my custom image!
```

---

## Task 2: Dockerfile Instructions

**Dockerfile using all core instructions:**
```dockerfile name=2026/day-31/sample-all-instructions/Dockerfile
# Use official Python as a parent image
FROM python:3.11-slim

# Set work directory in the container
WORKDIR /app

# Copy local code to the container
COPY main.py .

# Install additional packages if required (none in this simple case)
# RUN pip install flask

# Document the port app runs on (not actually used unless running a server)
EXPOSE 5000

# Set default command
CMD ["python", "main.py"]
```
**main.py** (for demonstration):
```python name=2026/day-31/sample-all-instructions/main.py
print("Hello from a Dockerfile using all instructions!")
```

**Build & run:**
```sh
cd sample-all-instructions
docker build -t all-instructions:v1 .
docker run --rm all-instructions:v1
```
**Expected output:**  
```
Hello from a Dockerfile using all instructions!
```

**What each Dockerfile line does:**
- `FROM`: Sets the base image to build from.
- `WORKDIR`: Sets the working folder for following instructions and at container runtime.
- `COPY`: Adds files from the host to the image.
- `RUN`: Executes shell commands at build-time (used here in template, not in this file).
- `EXPOSE`: Declares the port your app would use/document.
- `CMD`: Sets the default command when the container starts.

---

## Task 3: CMD vs ENTRYPOINT

### Example 1: Using CMD

```dockerfile name=2026/day-31/cmd-test/Dockerfile
FROM alpine
CMD ["echo", "hello"]
```
**Build & run:**
```sh
cd cmd-test
docker build -t cmdtest:latest .
docker run --rm cmdtest:latest         # Output: hello
docker run --rm cmdtest:latest echo world   # Output: world
```
*When you supply a command to `docker run`, it replaces `CMD` entirely.*

---

### Example 2: Using ENTRYPOINT

```dockerfile name=2026/day-31/entrypoint-test/Dockerfile
FROM alpine
ENTRYPOINT ["echo"]
```
**Build & run:**
```sh
cd entrypoint-test
docker build -t entrytest:latest .
docker run --rm entrytest:latest hello       # Output: hello
docker run --rm entrytest:latest world foo   # Output: world foo
```
*Anything you add after the image name is passed as an argument to ENTRYPOINT, not as a replacement.*

---

### CMD vs ENTRYPOINT — When to use which?

- **CMD:** Use for the *default* command, where the user might want to override it. Great for base images or more flexibility.
- **ENTRYPOINT:** Use when you always want a certain app executed, and everything else is input (e.g., wrapper scripts, the main process).

---

## Task 4: Build a Simple Web App Image

Create a folder `simple-website/` with:

**index.html**
```html name=2026/day-31/simple-website/index.html
<!DOCTYPE html>
<html>
  <head><title>My Website</title></head>
  <body><h1>Welcome to my custom Dockerized website!</h1></body>
</html>
```

**Dockerfile:**
```dockerfile name=2026/day-31/simple-website/Dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
```

**Build, run & test:**
```sh
cd simple-website
docker build -t my-website:v1 .
docker run --rm -p 8080:80 my-website:v1
```
- Open `http://localhost:8080` to see your page.

---

## Task 5: .dockerignore

**In any build folder (e.g., simple-website/):**

`.dockerignore` contents:
```
node_modules
.git
*.md
.env
```

**Build your image:**
```sh
docker build -t ignore-test:v1 .
```
- Check that `.md`, `.env`, `.git`, and `node_modules` are *not* in the image.

*How to check*:  
```sh
docker run --rm ignore-test:v1 find /usr/share/nginx/html/
```
- There should be no README.md, .env, .git, or node_modules listed (if present in your source folder).

---

## Task 6: Build Optimization & Cache

**1. Build the image:**
```sh
docker build -t myweb-cached:v1 .
```
- Change a line high up (like `RUN` or `COPY`) and rebuild — see cache invalidated early, slows build.

**2. Reorder Dockerfile so that lines that change least go first. Example:**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```
- This way, dependency install is cached. Only the last two lines change if you update code.

### **Write in your notes: Why does layer order matter for build speed?**
- If the code that changes most often is at the end of the Dockerfile, Docker can cache all previous build steps/layers. The build is re-used, only the last layer is reapplied—faster builds and deployments.

---

## Useful Commands Cheat Sheet

| Command | What it does |
|---|---|
| `docker build -t name:tag .` | Build an image from Dockerfile in current dir |
| `docker run image` | Run container from image |
| `docker run --rm image` | Run and auto-remove after exit |
| `CMD` vs `ENTRYPOINT` | CMD = default, ENTRYPOINT = always used |
| `.dockerignore` | Exclude files/folders from build context |

---

## Key Points

- Dockerfiles automate, document, and reproduce how you build images.
- Each instruction creates a new layer; ordering instructions carefully speeds up builds using cache.
- `.dockerignore` is vital for clean, secure, small builds!
- CMD lets users override the command; ENTRYPOINT does not.


## Key Takeaways

- **Dockerfiles are the blueprint for images:** Reproducible, automatable, and portable.
- **Each instruction creates a cached layer:** Order matters. Put frequently-changing commands at the end for faster rebuilds.
- **CMD vs ENTRYPOINT:**  
  - Use CMD for a default (can be overridden).  
  - Use ENTRYPOINT when you always want the same main entry, even if the user adds additional arguments.
- **.dockerignore is like .gitignore:** Keeps unneeded/secret files OUT of your image. Always use it!
- **Small images are better:** Start with slim/minimal bases (e.g., Alpine, Python slim).
- **Practice makes perfect:** Try customizing, breaking, and rebuilding images to truly learn Docker!


> **Today’s skill separates Docker “users” from developers who can *ship* production-ready containers!**


---

