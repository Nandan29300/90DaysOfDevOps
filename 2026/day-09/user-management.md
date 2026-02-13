# Day 09 – Linux User & Group Management

## 📋 Overview
Today you'll get hands-on experience with **Linux users, groups, and permissions** for real-world team collaboration.

---

## ✔️ Key Concepts

- **User:** Account to access system resources.  
  _Why:_ Tracks who did what; secures team data.
- **Group:** Collection of users for shared access.
  _Why:_ Manage permissions for groups instead of one user at a time.
- **Permission:** Controls who can read/write/execute files.
  _Why:_ Protect data; enable safe collaboration.

---

## 🚦 Commands & Example Outputs

### 1. **Create Users**

```sh
sudo useradd -m tokyo
sudo passwd tokyo
sudo useradd -m berlin
sudo passwd berlin
sudo useradd -m professor
sudo passwd professor
```

_Confirm:_
```sh
cat /etc/passwd | grep -E 'tokyo|berlin|professor'
```
```
tokyo:x:1001:1001::/home/tokyo:/bin/bash
berlin:x:1002:1002::/home/berlin:/bin/bash
professor:x:1003:1003::/home/professor:/bin/bash
```

---

### 2. **Create Groups**

```sh
sudo groupadd developers
sudo groupadd admins
```
_Confirm:_  
`cat /etc/group | grep -E 'developers|admins'`

---

### 3. **Assign Users to Groups**

```sh
sudo usermod -aG developers tokyo
sudo usermod -aG developers,admins berlin
sudo usermod -aG admins professor
```

_Check group memberships:_
```sh
groups tokyo
# tokyo : tokyo developers
groups berlin
# berlin : berlin developers admins
groups professor
# professor : professor admins
```

---

### 4. **Shared Directory for Group**

```sh
sudo mkdir -p /opt/dev-project
sudo chgrp developers /opt/dev-project
sudo chmod 775 /opt/dev-project
sudo -u tokyo touch /opt/dev-project/tokyofile
sudo -u berlin touch /opt/dev-project/berlinfile
```
_Check permissions:_
```sh
ls -ld /opt/dev-project
# drwxrwxr-x 2 root developers 4096 Feb 13  /opt/dev-project
```
_Check files:_
```sh
ls -l /opt/dev-project
# -rw-r--r-- 1 tokyo    developers ... tokyofile
# -rw-r--r-- 1 berlin   developers ... berlinfile
```

---

### 5. **Team Workspace Directory**

```sh
sudo useradd -m nairobi
sudo passwd nairobi
sudo groupadd project-team
sudo usermod -aG project-team nairobi
sudo usermod -aG project-team tokyo
sudo mkdir -p /opt/team-workspace
sudo chgrp project-team /opt/team-workspace
sudo chmod 775 /opt/team-workspace
sudo -u nairobi touch /opt/team-workspace/nairobi.txt
```
_Verify:_
```sh
ls -ld /opt/team-workspace
# drwxrwxr-x 2 root project-team 4096 Feb 13 /opt/team-workspace
ls -l /opt/team-workspace
# -rw-r--r-- 1 nairobi project-team ... nairobi.txt
```

---

## 📊 Summary Table

| User      | Groups                     | Home            |
|-----------|----------------------------|-----------------|
| tokyo     | tokyo, developers, project-team | /home/tokyo    |
| berlin    | berlin, developers, admins | /home/berlin    |
| professor | professor, admins          | /home/professor |
| nairobi   | nairobi, project-team      | /home/nairobi   |

| Directory             | Group        | Permissions |
|-----------------------|-------------|-------------|
| /opt/dev-project      | developers  | 775         |
| /opt/team-workspace   | project-team| 775         |

---

## 🧩 What You Should Know

- Use `sudo` for system/user/group changes.
- Always verify with `groups <user>`, `ls -ld <dir>`.
- Group permissions make teamwork smooth & secure.

---

<!-- Add your screenshots below this line as per submission requirements -->
