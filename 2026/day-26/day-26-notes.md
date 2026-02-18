# Day 26 — GitHub CLI: Manage GitHub from Your Terminal

---

## Task 1: Install and Authenticate

### 1. Install the GitHub CLI

- **macOS (Homebrew):**
    ```bash
    brew install gh
    ```
- **Ubuntu/Debian:**
    ```bash
    sudo apt install gh
    ```
- **Windows (Scoop/Chocolatey):**
    ```bash
    scoop install gh
    # or
    choco install gh
    ```

See: https://cli.github.com/manual/installation

---

### 2. Authenticate with your GitHub account

```bash
gh auth login
```
- It prompts for **GitHub.com or GitHub Enterprise**, **SSH/HTTPS**, and opens a browser to complete authentication.

---

### 3. Verify and check active account

```bash
gh auth status
```
**Output Example:**
```
github.com
  ✓ Logged in as nandan29300 (user)
```

---

**Q: What authentication methods does gh support?**

- Web-based authentication (OAuth via browser).
- SSH key-based authentication.
- GitHub CLI supports HTTPS (with stored credentials) and SSH for repo operations.

---

## Task 2: Working with Repositories

### 1. Create a new GitHub repo from terminal (**public with README**):

```bash
gh repo create gh-test-repo --public --readme
```
**Explanation:**  
- Creates a repo named `gh-test-repo` in your account, public, auto-inits with a README.

---

### 2. Clone a repo using gh

```bash
gh repo clone nandan29300/gh-test-repo
```
*This creates a local folder `gh-test-repo` and clones your code.*

---

### 3. View repo details

```bash
gh repo view nandan29300/gh-test-repo
```
*Shows full description, topics, URL, and README.*

---

### 4. List all your repositories

```bash
gh repo list nandan29300 --limit 100
```
*(Lists all repos under your GitHub account; adjust limit as needed.)*

---

### 5. Open repo in browser

```bash
gh repo view --web
```
*(Opens your current directory’s GitHub repo page in your browser.)*

---

### 6. Delete the test repo

```bash
gh repo delete nandan29300/gh-test-repo
```
- You will be prompted to confirm.  
- **CAUTION:** This is irreversible!

---

## Task 3: Issues

### 1. Create an issue from terminal

```bash
gh issue create --title "Bug: CLI does not install" --body "Setup fails with error X." --label "bug"
```

---

### 2. List all open issues

```bash
gh issue list
```
*Shows all open issues, with number, title, assignee, and labels.*

---

### 3. View a specific issue

```bash
gh issue view 1
```

---

### 4. Close an issue

```bash
gh issue close 1
```

---

**Q: How could you use gh issue in a script or automation?**

- You can automate bug reporting, feature requests, or tracking CI errors. 
- Example:  
    ```bash
    gh issue create --title "Build Failure" --body "Tests failed on $CI_COMMIT" --label "ci"
    ```
- Can use with `--json` for scripting responses or analyzing issues.

---

## Task 4: Pull Requests

### 1. Create a branch, make a change, push it, and create a PR **from terminal**

```bash
git checkout -b feature-branch
echo "GH CLI test" >> README.md
git add README.md
git commit -m "Test: Added a line via CLI"
git push -u origin feature-branch
gh pr create --fill
```
- The `--fill` flag uses your last commit as PR title/body.

---

### 2. List all open PRs

```bash
gh pr list
```

---

### 3. View PR details

```bash
gh pr view <pr-number>
```
- Output includes status (open/merged), reviewers, and checks.

---

### 4. Merge a PR

```bash
gh pr merge <pr-number>
```
- Options:
    - `--merge` (default): regular merge commit
    - `--squash`: squash into one commit
    - `--rebase`: rebase then merge

---

#### Q: What merge methods does gh pr merge support?

- **Merge commit** (`--merge`)
- **Squash merge** (`--squash`)
- **Rebase and merge** (`--rebase`)

---

#### Q: How would you review someone else's PR using gh?

- List PRs: `gh pr list --repo owner/repo`
- View PR: `gh pr view <pr-number> --web` (or just to read details)
- Checkout: `gh pr checkout <pr-number>`
- Leave review/comment: `gh pr review <pr-number> --approve --body "LGTM!"`

---

## Task 5: GitHub Actions & Workflows (Preview)

### 1. List workflow runs on a public repo

```bash
gh run list --repo owner/repo
```
*(Shows latest GitHub Actions workflow runs.)*

---

### 2. View status of a specific workflow run

```bash
gh run view <run-id> --repo owner/repo
```

---

**Q: How could gh run and gh workflow be useful in a CI/CD pipeline?**

- Automate checks from your terminal (trigger/view pipeline runs)
- View status, logs, rerun/test without browser
- Integrate "pass/fail", status, or deployment feedback into bash scripts or dashboards

---

## Task 6: Useful gh Tricks

- `gh api`: Make raw REST API requests to GitHub
    ```bash
    gh api /user/repos --paginate --jq '.[] | .full_name'
    ```
- `gh gist`: Create/manage gists
    ```bash
    gh gist create hello.py
    ```
- `gh release`: Manage releases from terminal
    ```bash
    gh release create v1.0.0 --notes "First production release"
    ```
- `gh alias`: Create command shortcuts
    ```bash
    gh alias set co 'pr checkout'
    gh co 42
    ```
- `gh search repos`: Search repos from terminal
    ```bash
    gh search repos github/cli --limit 5
    ```

---

## Tips & Observations

- Use `gh help` and `gh <command> --help` to explore functionality.
- `--repo owner/repo` lets you target any repo, no matter your current shell directory.
- Add `--json` to get output for scripts/automation.
- gh can do almost everything you do in the browser — from repo creation to merging PRs!
---

# Summary Table

| Task              | Command(s) Example | What it Does / When to Use |
|-------------------|--------------------|----------------------------|
| Install/Authenticate | `gh auth login`, `gh auth status` | Set up and verify GH CLI |
| Create repo      | `gh repo create ...` | Make a repo w/o browser   |
| Clone repo       | `gh repo clone ...` | Like git clone but smarter|
| Issue management | `gh issue create/list/view/close` | Manage issues easily     |
| PR management    | `gh pr create/list/view/merge` | Review/code merge from CLI|
| Actions/Workflows| `gh run list/view` | CI/CD build/pipeline info |
| Advanced         | `gh api`, `gh alias`, `gh release` | Deep integration, scripting |

---
