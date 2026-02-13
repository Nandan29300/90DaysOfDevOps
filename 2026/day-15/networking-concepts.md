# Day 15 – Networking Concepts: DNS, IP, Subnets & Ports

---

## 📌 Challenges & Tasks Overview

**Goal:**  
Build on Day 14 by understanding the core networking components every DevOps engineer must know.

---

### **Task 1: DNS – How Names Become IPs**

#### **Definition & Explanation**
- **DNS (Domain Name System):**  
  Converts human-readable names (like google.com) into IP addresses devices can use.  
  It’s the Internet’s "address book".

#### **Challenge Steps**

**Q: What happens when you type google.com in a browser?**  
1. Browser asks the OS to resolve the domain.
2. OS checks the local DNS cache, then queries a DNS resolver if needed.
3. Resolver gets IP address (A record) from authoritative DNS servers.
4. Browser uses this IP to contact the web server.

**DNS Record Types (one line each):**
- **A:** Maps a domain to an IPv4 address.
- **AAAA:** Maps a domain to an IPv6 address.
- **CNAME:** Canonical name – points a domain to another domain (alias).
- **MX:** Specifies mail exchange servers for email.
- **NS:** Nameserver – indicates which DNS server is authoritative for the domain.

**Command:**
```sh
dig google.com
```
_Example output (snippet):_
```
;; ANSWER SECTION:
google.com.   247     IN      A       142.250.183.78
```
- **A record:** 142.250.183.78
- **TTL:** 247 seconds

---

### **Task 2: IP Addressing**

#### **Definition & Explanation**

- **IPv4 address:**  
  32-bit numeric address, typically shown as four numbers separated by dots (e.g., 192.168.1.10).

- **Structure:**  
  Each part is a byte (0–255), e.g., 192.168.1.10.

- **Public IP:** Routable over the internet. Example: 8.8.8.8 (Google DNS)
- **Private IP:** Only used inside local networks, not routable publicly.
  - Example: 192.168.1.23 (home LAN)

- **Private IP ranges:**
  - 10.0.0.0 – 10.255.255.255
  - 172.16.0.0 – 172.31.255.255
  - 192.168.0.0 – 192.168.255.255

**Command:**
```sh
ip addr show
```
_Example output:_
```
inet 192.168.1.23/24 brd 192.168.1.255 scope global wlan0
inet 127.0.0.1/8 scope host lo
```
- **Private IP:** 192.168.1.23  
- Any public IP would usually be found on an ethernet interface attached directly to the Internet.

---

### **Task 3: CIDR & Subnetting**

#### **Definition & Explanation**
- **CIDR (Classless Inter-Domain Routing):**  
  Compact way to show IP range & subnet size, e.g., 192.168.1.0/24.

- **Subnetting:**  
  Divides a network into smaller networks, supports organization, security, and reduces broadcast traffic.

**Q: What does /24 mean in 192.168.1.0/24?**  
- /24 means subnet mask is 255.255.255.0 – last 8 bits for hosts.

**Usable hosts:**
- /24: 254 (total 256, minus network and broadcast)
- /16: 65534
- /28: 14

**Why subnet?**  
- To isolate groups/devices, improve security, and better utilize address space.

**Table: CIDR, Subnet Mask, Total IPs, Usable Hosts**

| CIDR | Subnet Mask   | Total IPs | Usable Hosts |
|------|---------------|-----------|--------------|
| /24  | 255.255.255.0 | 256       | 254          |
| /16  | 255.255.0.0   | 65,536    | 65,534       |
| /28  | 255.255.255.240 | 16      | 14           |

---

### **Task 4: Ports – The Doors to Services**

#### **Definition & Explanation**
- **Port:**  
  Logical endpoint for communication; helps OS direct data to the correct application/service.
- **Why important?**  
  Allows multiple services to run over one IP by using different ports (SSH: 22, web: 80).

**Common Ports:**

| Port | Service         |
|------|-----------------|
| 22   | SSH             |
| 80   | HTTP            |
| 443  | HTTPS           |
| 53   | DNS             |
| 3306 | MySQL Database  |
| 6379 | Redis           |
| 27017| MongoDB         |

**Command:**
```sh
ss -tulpn
```
_Example output:_
```
Netid State   Local Address:Port  Peer Address:Port   Process
tcp   LISTEN  0.0.0.0:22         0.0.0.0:*           users:(("sshd",pid=592,fd=3))
tcp   LISTEN  0.0.0.0:80         0.0.0.0:*           users:(("nginx",pid=700,fd=6))
```
- 22 (SSH), 80 (HTTP/Nginx)

---

### **Task 5: Putting It Together**

**Q: You run `curl http://myapp.com:8080` — what networking concepts from today are involved?**  
- DNS resolves myapp.com to an IP (DNS, Application Layer)
- The client connects via TCP to port 8080 (Transport Layer & Ports)
- If port 8080 is open, HTTP request goes over TCP/IP

**Q: Your app can't reach database at 10.0.1.50:3306 — what would you check first?**  
1. Is 10.0.1.50 reachable? (ping for basic connectivity)
2. Is port 3306 open and the database service running? (`ss -tulpn`)
3. Are firewalls blocking the connection?

---

## 🔧 Example Commands & Outputs

### **DNS (dig)**
```sh
dig google.com
;; ANSWER SECTION:
google.com.  247 IN  A 142.250.183.78
```
- **A record:** 142.250.183.78  
- **TTL:** 247

### **Port Check (ss)**
```sh
ss -tulpn
Netid State  Local Address:Port  Peer Address:Port   Process
tcp   LISTEN 0.0.0.0:22         0.0.0.0:*           users:(("sshd",pid=592,fd=3))
tcp   LISTEN 0.0.0.0:80         0.0.0.0:*           users:(("nginx",pid=700,fd=6))
```

---

## ✨ What I Learned

1. **DNS translates domain names to IP addresses automatically, using various record types and TTLs.**
2. **IP addresses are structured numbers with public/private distinctions; subnetting with CIDR helps manage network size and security.**
3. **Ports are crucial for allowing multiple services on one IP—knowing which port is used helps troubleshoot connectivity instantly.**

---
