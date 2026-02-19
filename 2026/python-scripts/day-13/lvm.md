# Day 13 – Linux Volume Management (LVM)

---

## 📌 Challenge: Tasks Overview

**Goal:**  
Learn LVM to manage storage flexibly – create, extend, and mount volumes.

**Before You Start:**  
- **Switch to root user:**  
  ```
  sudo -i
  # or
  sudo su
  ```
- **No spare disk? Create a virtual one:**  
  ```sh
  dd if=/dev/zero of=/tmp/disk1.img bs=1M count=1024
  losetup -fP /tmp/disk1.img
  losetup -a   # Note the device name (e.g., /dev/loop0)
  ```

**Challenge Tasks:**
1. **Check Current Storage:**  
   Run: `lsblk`, `pvs`, `vgs`, `lvs`, `df -h`
2. **Create Physical Volume:**  
   `pvcreate /dev/sdb` (or your loop device), then `pvs`
3. **Create Volume Group:**  
   `vgcreate devops-vg /dev/sdb`, then `vgs`
4. **Create Logical Volume:**  
   `lvcreate -L 500M -n app-data devops-vg`, then `lvs`
5. **Format and Mount:**  
   `mkfs.ext4 /dev/devops-vg/app-data`,  
   `mkdir -p /mnt/app-data`,  
   `mount /dev/devops-vg/app-data /mnt/app-data`,  
   `df -h /mnt/app-data`
6. **Extend the Volume:**  
   `lvextend -L +200M /dev/devops-vg/app-data`,  
   `resize2fs /dev/devops-vg/app-data`,  
   `df -h /mnt/app-data`

---

## 📝 Definitions & Explanations

- **LVM (Logical Volume Manager):**  
  A tool for flexible disk space management in Linux. You can create, resize, and remove storage volumes without worrying about fixed partitions.
  - **Why?**: Lets you grow/shrink/move storage on the fly for real-world needs.

- **Physical Volume (PV):**  
  The raw disk or disk-like device (can be real disk or a file via loopback) you add to LVM.
  - **Command:** `pvcreate`
- **Volume Group (VG):**  
  Pool of storage made from one or more PVs.  
  - **Command:** `vgcreate`
- **Logical Volume (LV):**  
  “Virtual partition” cut from a VG; you mount & use this like a real disk or partition.
  - **Command:** `lvcreate`
- **Why LVM?**  
  - Resize storage without downtime
  - Combine multiple disks into one logical pool
  - Take snapshots and flexible backups

---

## 🚀 Task-by-Task Steps, Commands & Sample Outputs

---

### **Task 1: Check Current Storage**

```sh
lsblk
```
_Example Output:_
```
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda           8:0    0   20G  0 disk
├─sda1        8:1    0   20G  0 part /
loop0         7:0    0    1G  0 loop
```

```sh
pvs
# Usually empty: No physical volume found, if LVM not yet set up.
```

```sh
vgs
# No volume group found.
```

```sh
lvs
# No logical volume found.
```

```sh
df -h
# Shows all mounted filesystems and usage.
```

---

### **Task 2: Create Physical Volume**

```sh
pvcreate /dev/loop0
```
_Output:_
```
  Physical volume "/dev/loop0" successfully created.
```

```sh
pvs
```
_Output:_
```
  PV         VG   Fmt  Attr PSize   PFree
  /dev/loop0      lvm2 ---  1.00g  1.00g
```

---

### **Task 3: Create Volume Group**

```sh
vgcreate devops-vg /dev/loop0
```
_Output:_
```
  Volume group "devops-vg" successfully created
```

```sh
vgs
```
_Output:_
```
  VG        #PV #LV #SN Attr   VSize  VFree
  devops-vg   1   0   0 wz--n- 1.00g 1.00g
```

---

### **Task 4: Create Logical Volume**

```sh
lvcreate -L 500M -n app-data devops-vg
```
_Output:_
```
  Logical volume "app-data" created.
```

```sh
lvs
```
_Output:_
```
  LV       VG        Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  app-data devops-vg -wi-a----- 500.00m
```

---

### **Task 5: Format and Mount**

```sh
mkfs.ext4 /dev/devops-vg/app-data
```
_Output:_
```
mke2fs 1.45.5 (07-Jan-2020)
Creating filesystem with 512000 1k blocks and 128016 inodes
...
```

```sh
mkdir -p /mnt/app-data
mount /dev/devops-vg/app-data /mnt/app-data
df -h /mnt/app-data
```
_Output:_
```
Filesystem                      Size  Used Avail Use% Mounted on
/dev/mapper/devops--vg-app--data 488M  1.6M  452M   1% /mnt/app-data
```

---

### **Task 6: Extend the Volume**

```sh
lvextend -L +200M /dev/devops-vg/app-data
```
_Output:_
```
  Size of logical volume devops-vg/app-data changed from 500.00 MiB (128 extents) to 700.00 MiB (179 extents).
  Logical volume devops-vg/app-data successfully resized.
```

```sh
resize2fs /dev/devops-vg/app-data
```
_Output:_
```
resize2fs 1.45.5 (07-Jan-2020)
Resizing the filesystem on /dev/devops-vg/app-data to 716800 (1k) blocks.
The filesystem on /dev/devops-vg/app-data is now 716800 (1k) blocks long.
```

```sh
df -h /mnt/app-data
```
_Output:_
```
Filesystem                      Size  Used Avail Use% Mounted on
/dev/mapper/devops--vg-app--data 683M  2.1M  647M   1% /mnt/app-data
```

---

## 💡 Checklist & Best Practices

- Always ensure you’re working as root for LVM operations.
- Use `lsblk`, `lvs`, `vgs`, `pvs` to view current storage state.
- Remember to `umount` before removing a logical volume (not covered here).
- Growing volumes is non-destructive; shrinking is **dangerous** (back up first).

---

## ✨ What I Learned

- LVM lets you allocate, use, and grow storage without downtime.
- You can layer PV → VG → LV for real-world flexibility.
- LVM commands (`pvcreate`, `vgcreate`, `lvcreate`, `lvextend`, `resize2fs`) are fast and powerful for DevOps.
- Practice with a loopback device if you don’t have “real” spare disks.

---
