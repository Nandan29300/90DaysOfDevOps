# Day 11 – File Ownership Challenge (chown & chgrp)

---

## 📌 Challenge: All Tasks

### Task 1: Understanding Ownership (10 minutes)
Run `ls -l` in your home directory  
Identify the owner and group columns  
Check who owns your files  
Format: `-rw-r--r-- 1 owner group size date filename`

**Document:** What's the difference between owner and group?

---

### Task 2: Basic chown Operations (20 minutes)
Create file `devops-file.txt`  
Check current owner: `ls -l devops-file.txt`  
Change owner to `tokyo` (create user if needed)  
Change owner to `berlin`  
Verify the changes  
Try:  
`sudo chown tokyo devops-file.txt`

---

### Task 3: Basic chgrp Operations (15 minutes)
Create file `team-notes.txt`  
Check current group: `ls -l team-notes.txt`  
Create group: `sudo groupadd heist-team`  
Change file group to `heist-team`  
Verify the change

---

### Task 4: Combined Owner & Group Change (15 minutes)
Using chown you can change both owner and group together:  
Create file `project-config.yaml`  
Change owner to `professor` AND group to `heist-team` (one command)  
Create directory `app-logs/`  
Change its owner to `berlin` and group to `heist-team`  
Syntax: `sudo chown owner:group filename`

---

### Task 5: Recursive Ownership (20 minutes)
Create directory structure:  
`mkdir -p heist-project/vault`  
`mkdir -p heist-project/plans`  
`touch heist-project/vault/gold.txt`  
`touch heist-project/plans/strategy.conf`  
Create group planners: `sudo groupadd planners`

Change ownership of entire `heist-project/` directory:  
Owner: professor  
Group: planners  
Use recursive flag `(-R)`  
Verify all files and subdirectories changed: `ls -lR heist-project/`

---

### Task 6: Practice Challenge (20 minutes)
Create users: tokyo, berlin, nairobi (if not already created)  
Create groups: vault-team, tech-team  
Create directory: bank-heist/

Create 3 files inside:  
`touch bank-heist/access-codes.txt`  
`touch bank-heist/blueprints.pdf`  
`touch bank-heist/escape-plan.txt`

Set different ownership:  
access-codes.txt → owner: tokyo, group: vault-team  
blueprints.pdf → owner: berlin, group: tech-team  
escape-plan.txt → owner: nairobi, group: vault-team  
Verify: `ls -l bank-heist/`

---

## 💡 Hints
- Most chown/chgrp operations need sudo
- Use -R flag for recursive directory changes
- Always verify with ls -l after changes
- User must exist before using in chown
- Group must exist before using in chgrp/chown

---

## ✔️ Definitions & Why

- **File Ownership:** In Linux every file has an owner (user) and a group.  
  _Why:_ Controls who can modify/read/delete files and who can share file access.
- **Owner:** The user that owns the file. Can usually do anything with the file.
- **Group:** A set of users that share permission to access the file. Useful for teams.
- **chown:** Changes the owner (and optionally group) of a file/directory.
- **chgrp:** Changes only the group ownership.

---

## 🚀 Commands, Expected Outputs & Explanations

### Task 1: Understanding Ownership

```sh
ls -l ~
```
_Output Example:_
```
-rw-r--r-- 1 nandan nandan   0 Feb 13 10:25 notes.txt
drwxr-xr-x 2 nandan nandan 4096 Feb 13 10:27 project/
```
- _Owner:_ `nandan`
- _Group:_ `nandan`
> **Owner** is the person who created or owns the file.  
> **Group** is who else (by group membership) can access the file.


### Task 2: Basic chown Operations

```sh
touch devops-file.txt
ls -l devops-file.txt
# -rw-r--r-- 1 nandan nandan ... devops-file.txt

# Create user tokyo
sudo useradd -m tokyo

# Change owner to tokyo
sudo chown tokyo devops-file.txt
ls -l devops-file.txt
# -rw-r--r-- 1 tokyo nandan ... devops-file.txt

# Change owner to berlin
sudo useradd -m berlin
sudo chown berlin devops-file.txt
ls -l devops-file.txt
# -rw-r--r-- 1 berlin nandan ... devops-file.txt
```

---

### Task 3: Basic chgrp Operations

```sh
touch team-notes.txt
ls -l team-notes.txt
# -rw-r--r-- 1 nandan nandan ... team-notes.txt

# Create group
sudo groupadd heist-team

# Change group to heist-team
sudo chgrp heist-team team-notes.txt
ls -l team-notes.txt
# -rw-r--r-- 1 nandan heist-team ... team-notes.txt
```

---

### Task 4: Combined Owner & Group Change

```sh
touch project-config.yaml
sudo useradd -m professor
sudo chown professor:heist-team project-config.yaml
ls -l project-config.yaml
# -rw-r--r-- 1 professor heist-team ... project-config.yaml

mkdir app-logs
sudo chown berlin:heist-team app-logs
ls -ld app-logs
# drwxr-xr-x 2 berlin heist-team ... app-logs
```

---

### Task 5: Recursive Ownership

```sh
mkdir -p heist-project/vault
mkdir -p heist-project/plans
touch heist-project/vault/gold.txt
touch heist-project/plans/strategy.conf
sudo groupadd planners

# Set owner/group recursively
sudo useradd -m professor
sudo chown -R professor:planners heist-project/
ls -lR heist-project/
# See all files/dirs now owned by professor:planners
```

---

### Task 6: Practice Challenge

```sh
sudo useradd -m tokyo
sudo useradd -m berlin
sudo useradd -m nairobi
sudo groupadd vault-team
sudo groupadd tech-team

mkdir bank-heist
touch bank-heist/access-codes.txt
touch bank-heist/blueprints.pdf
touch bank-heist/escape-plan.txt

# Set individual owners/groups
sudo chown tokyo:vault-team bank-heist/access-codes.txt
sudo chown berlin:tech-team bank-heist/blueprints.pdf
sudo chown nairobi:vault-team bank-heist/escape-plan.txt

ls -l bank-heist/
# Output:
# -rw-r--r-- 1 tokyo    vault-team ... access-codes.txt
# -rw-r--r-- 1 berlin   tech-team  ... blueprints.pdf
# -rw-r--r-- 1 nairobi  vault-team ... escape-plan.txt
```

---

## 🛠️ Key Commands Reference

```sh
ls -l filename                # View ownership
sudo chown newowner filename  # Change owner only
sudo chgrp newgroup filename  # Change group only
sudo chown owner:group file   # Change owner & group
sudo chown -R owner:group dir # Recursive change
sudo chown :groupname file    # Change only group with chown
```

---

## 🧩 What You Should Know

- chown changes owner and group at once.
- chgrp changes only the group.
- Always check results with ls -l.
- Recursive (-R) applies changes to all files/subdirs.
- User/group must exist before you assign ownership.

---

