# Day 38 – YAML Basics

---

## What is YAML? (Definition)

**YAML** (YAML Ain't Markup Language) is a **human-readable data serialisation format** used to write configuration files. It is the backbone of virtually every DevOps tool — Docker Compose, Kubernetes manifests, GitHub Actions pipelines, Ansible playbooks, Helm charts, and more.

> Think of YAML as a way to write structured data (like JSON) but designed to be read and written by humans — no curly braces, no quotes on every value, just clean indented text.

### Why YAML Matters in DevOps

| Tool | Where YAML Appears |
|------|--------------------|
| Docker Compose | `docker-compose.yml` — service definitions |
| Kubernetes | Pod, Deployment, Service manifests |
| GitHub Actions | `.github/workflows/*.yml` — CI/CD pipelines |
| Ansible | Playbooks and inventory files |
| Helm | `values.yaml` — chart configuration |
| GitLab CI | `.gitlab-ci.yml` — pipeline definitions |

**One wrong indentation can break an entire deployment.** Understanding YAML deeply is non-negotiable for a DevOps engineer.

### The Golden Rules

1. **Spaces only — NEVER tabs** (tabs cause parse errors)
2. **Indentation defines structure** — 2 spaces is the standard
3. **Case-sensitive** — `Name` and `name` are different keys
4. **Comments start with `#`**
5. **Colons must be followed by a space** — `key: value` not `key:value`

---

## Task 1: Key-Value Pairs

### `person.yaml` — Task 1 Section

```yaml
name: Nandan
role: DevOps Engineer
experience_years: 2
learning: true
```

### Data Types in YAML

| Value | Type | Notes |
|-------|------|-------|
| `Nandan` | String | No quotes needed for plain strings |
| `"Hello: World"` | String | Quotes needed — contains `:` |
| `2` | Integer | Plain number |
| `3.14` | Float | Decimal number |
| `true` / `false` | Boolean | No quotes — with quotes it becomes a string |
| `null` / `~` | Null | Represents absence of a value |
| `2026-03-05` | Date | ISO 8601 format parsed automatically |

### When Do Strings Need Quotes?

```yaml
# ✅ No quotes needed
name: Nandan
city: Bangalore

# ✅ Quotes REQUIRED — value contains special characters
message: "Error: connection refused"   # contains :
comment: "# this is not a comment"    # starts with #
flag: "true"                           # want the string, not boolean
version: "1.0"                         # prevent float parsing
path: "C:\\Users\\nandan"              # backslashes
```

### Verify

```sh
cat person.yaml   # check it looks clean — no tabs
```

---

## Task 2: Lists

### `person.yaml` — Task 2 Section (added)

```yaml
# Block style — each item on its own indented line with a dash
tools:
  - Docker
  - Kubernetes
  - Git
  - Linux
  - Terraform

# Inline (flow) style — all items on one line in square brackets
hobbies: [coding, reading, open-source, hiking, gaming]
```

### Two Ways to Write a List in YAML

| Style | Syntax | When to Use |
|-------|--------|-------------|
| **Block style** | Each item on a new line starting with `- ` | Long lists, lists with nested objects, readability |
| **Inline (flow) style** | `[item1, item2, item3]` | Short lists of simple values, compact sections |

```yaml
# Block style — readable, preferred for most cases
fruits:
  - apple
  - banana
  - cherry

# Inline style — compact, great for short simple lists
fruits: [apple, banana, cherry]

# Both are 100% equivalent — parsers treat them identically
```

### List of Objects (common in CI/CD)

```yaml
# Each list item is itself an object (key-value pairs)
servers:
  - name: web-01
    ip: 10.0.0.1
  - name: db-01
    ip: 10.0.0.2
```

---

## Task 3: Nested Objects

### `server.yaml` — Task 3 Section

```yaml
server:
  name: prod-web-01
  ip: 192.168.1.100
  port: 443

database:
  host: db.internal
  name: appdb
  credentials:
    user: appuser
    password: "s3cr3t!pass"
```

### How Nesting Works

Each level of nesting = 2 more spaces of indentation:

```
database:              ← level 0 (root key)
  host: db.internal    ← level 1 (2 spaces)
  credentials:         ← level 1
    user: appuser      ← level 2 (4 spaces)
    password: secret   ← level 2
```

**Mental model:** Think of it like a folder structure:
```
database/
  host
  name
  credentials/
    user
    password
```

### What Happens If You Use a Tab?

```yaml
server:
  name: prod-web-01
	port: 443          ← TAB used here instead of spaces
```

**Error:**
```
yaml.scanner.ScannerError: mapping values are not allowed here
  in "server.yaml", line 3, column 9
```

YAML parsers **refuse to parse** files with tabs. Always configure your editor to insert spaces when you press Tab (VS Code does this automatically for `.yaml` files).

---

## Task 4: Multi-line Strings

### `server.yaml` — Task 4 Section

```yaml
# | (literal block) — preserves newlines exactly
startup_script: |
  #!/bin/bash
  set -euo pipefail
  echo "Starting server..."
  systemctl start nginx
  systemctl start postgresql
  echo "All services started."

# > (folded block) — folds newlines into spaces
server_description: >
  This is the primary production web server.
  It handles all inbound HTTPS traffic,
  terminates TLS, and proxies requests to the backend API pool.
```

### `|` vs `>` — When to Use Each

| | `|` Literal Block | `>` Folded Block |
|--|-------------------|-----------------|
| **Newlines** | Preserved exactly | Folded into a single space |
| **Result** | Multi-line string | Single long line |
| **Use for** | Shell scripts, SQL, config files, anything line-sensitive | Long descriptions, prose, URLs, anything where line breaks are cosmetic |

```yaml
# | result (newlines kept):
# "#!/bin/bash\nset -euo pipefail\necho Starting...\n"

# > result (newlines become spaces):
# "This is the primary production web server. It handles all inbound..."
```

### Trailing Newline Control (advanced)

```yaml
# | — adds one trailing newline (default)
script: |
  echo hello

# |- — strips ALL trailing newlines (chomping indicator)
script: |-
  echo hello

# |+ — keeps ALL trailing newlines
script: |+
  echo hello

```

**In practice:** Use `|-` inside Kubernetes manifests and GitHub Actions when you don't want an extra blank line at the end of a script block.

---

## Task 5: Validate Your YAML

### Install `yamllint`

```sh
# Ubuntu/Debian
sudo apt install yamllint

# macOS
brew install yamllint

# pip
pip install yamllint
```

### Validate Both Files

```sh
yamllint person.yaml
yamllint server.yaml
# No output = no errors ✅
```

### Intentionally Break Indentation

```yaml
# Broken server.yaml
database:
  host: db.internal
   name: appdb       ← 3 spaces instead of 2 — inconsistent indentation
```

**Error from yamllint:**
```
server.yaml
  4:4   error  wrong indentation: expected 2 but found 3  (indentation)
```

**Error from a strict parser (like Kubernetes):**
```
error: error converting YAML to JSON: yaml: line 4:
  did not find expected key
```

### Fix and Re-validate

```sh
# After fixing the indentation:
yamllint server.yaml
# (no output — clean) ✅
```

### Online Validators

- **yamllint.com** — paste YAML, get instant errors
- **onlineyamltools.com** — validate + format
- **VS Code** — install the `YAML` extension (Red Hat) for real-time validation with red underlines

---

## Task 6: Spot the Difference

### Block 1 — Correct ✅

```yaml
name: devops
tools:
  - docker
  - kubernetes
```

### Block 2 — Broken ❌

```yaml
name: devops
tools:
- docker
  - kubernetes
```

### What's Wrong with Block 2?

**Two problems:**

1. **`- docker` is not indented under `tools:`** — it's at the root level (0 indent), making it look like a new root-level key, not an item of the `tools` list.

2. **`  - kubernetes` is indented more than `- docker`** — if `- docker` were the list (incorrect as-is), `- kubernetes` would be parsed as a nested list *inside* the docker item, not a sibling. The inconsistent indentation makes this completely ambiguous.

**What the parser sees in Block 2:**
```
name: "devops"
tools: null            ← "tools:" has no value (nothing properly indented under it)
- docker               ← unexpected token at root level → PARSE ERROR
  - kubernetes         ← never reached
```

**The fix:**

```yaml
name: devops
tools:          # ← colon, then items indented 2 spaces below
  - docker      # ← 2 spaces
  - kubernetes  # ← 2 spaces (same level as docker)
```

---

## Complete YAML Files (Final Versions)

### `person.yaml`

```yaml
name: Nandan
role: DevOps Engineer
experience_years: 2
learning: true

tools:
  - Docker
  - Kubernetes
  - Git
  - Linux
  - Terraform

hobbies: [coding, reading, open-source, hiking, gaming]
```

### `server.yaml`

```yaml
server:
  name: prod-web-01
  ip: 192.168.1.100
  port: 443

database:
  host: db.internal
  name: appdb
  credentials:
    user: appuser
    password: "s3cr3t!pass"

startup_script: |
  #!/bin/bash
  set -euo pipefail
  echo "Starting server..."
  systemctl start nginx
  systemctl start postgresql
  echo "All services started."

server_description: >
  This is the primary production web server.
  It handles all inbound HTTPS traffic,
  terminates TLS, and proxies requests to the backend API pool.
```

---

## YAML vs JSON — Same Data, Different Format

```json
{
  "server": {
    "name": "prod-web-01",
    "port": 443
  },
  "tools": ["Docker", "Kubernetes", "Git"]
}
```

```yaml
server:
  name: prod-web-01
  port: 443
tools:
  - Docker
  - Kubernetes
  - Git
```

Both represent the identical data structure. YAML is a **superset of JSON** — valid JSON is valid YAML. YAML is preferred for human-authored files because:
- No curly braces or brackets needed
- No quotes on every string
- Comments are supported (`#`)
- Much less visual noise

---

## YAML in the Real World — DevOps Examples

### GitHub Actions Pipeline

```yaml
name: CI Pipeline

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: nandan29300/my-app:v1
          ports:
            - containerPort: 3000
```

### Docker Compose

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
```

Notice how all three tools use the **same YAML concepts** — key-value pairs, nested objects, and lists.

---

## Points to Remember 📌

1. **Tabs will always break your YAML** — set your editor to "insert spaces" for `.yaml`/`.yml` files. This is the #1 mistake beginners make.

2. **Indentation IS structure** — YAML has no brackets or braces. Two extra spaces changes the meaning completely. Be consistent (2 spaces throughout).

3. **`true`/`false` without quotes = boolean; with quotes = string** — `enabled: true` vs `enabled: "true"` are different types. In Kubernetes, passing the wrong type silently breaks configs.

4. **`|` preserves newlines, `>` folds them** — use `|` for scripts and config blocks, `>` for long prose descriptions.

5. **Quotes are needed when values contain `:`, `#`, `{`, `}`, `[`, `]`, `,`** — these characters have special meaning in YAML and will cause parse errors if unquoted.

6. **Both block and inline list syntax are identical to parsers** — use block style for readability in long files, inline for short lists.

7. **YAML is a superset of JSON** — if you understand JSON objects and arrays, you already understand the data model. YAML just removes the noise.

8. **Always validate before deploying** — a broken YAML file in a Kubernetes manifest or GitHub Actions workflow causes cryptic errors. Run `yamllint` or use VS Code's YAML extension.

9. **Comments (`#`) are your best tool for documentation** — unlike JSON, YAML supports comments. Use them to explain why a value is set, especially for infrastructure configs.

10. **Anchors and aliases (`&` and `*`) reduce repetition** in large YAML files — an advanced feature worth knowing for Kubernetes and CI/CD at scale:
    ```yaml
    defaults: &defaults
      retries: 3
      timeout: 30s

    job1:
      <<: *defaults   # merge defaults in
      name: build

    job2:
      <<: *defaults
      name: test
    ```

---

## Tips 💡

- Install the **Red Hat YAML extension** in VS Code — it gives real-time validation, auto-completion, and schema support for Kubernetes and Docker Compose files.
- Use `python3 -c "import yaml, sys; yaml.safe_load(sys.stdin)"` as a quick one-liner YAML validator: `cat server.yaml | python3 -c "import yaml,sys; yaml.safe_load(sys.stdin); print('Valid ✅')"`.
- Use `yq` (a `jq`-like tool for YAML) to query and transform YAML from the command line:
  ```sh
  yq '.database.credentials.user' server.yaml   # outputs: appuser
  yq '.tools[]' person.yaml                      # lists each tool
  ```
- In GitHub Actions, use `yamllint` as a step in your CI pipeline to catch YAML errors before they reach production:
  ```yaml
  - name: Lint YAML files
    run: yamllint .
  ```
- Configure `yamllint` with a `.yamllint` file in your repo root to set rules (line length, indentation width, etc.) consistently across the team.

---

## Summary

| Task | Done | Key Learning |
|------|------|-------------|
| 1 | ✅ Key-value pairs with string, int, boolean types | `true`/`false` are booleans; quotes change type |
| 2 | ✅ Block and inline list styles | Both are identical to parsers; block = readable, inline = compact |
| 3 | ✅ Nested objects up to 3 levels deep | Each nesting level = 2 more spaces; mental model = folder structure |
| 4 | ✅ `\|` and `>` multi-line string blocks | `\|` preserves newlines (scripts); `>` folds (descriptions) |
| 5 | ✅ Validated with `yamllint`; broke and fixed indentation | Tabs cause immediate parse errors; always validate before deploying |
| 6 | ✅ Spotted and explained broken YAML | Inconsistent indentation makes items ambiguous — parser rejects the file |
