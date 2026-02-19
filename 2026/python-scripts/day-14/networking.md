# Day 14 – Networking Fundamentals & Hands-on Checks

---

## 📚 Quick Concepts

- **OSI Layers (L1–L7):**
  - **L1**: Physical (cables, NICs)
  - **L2**: Data Link (Ethernet, MAC addresses)
  - **L3**: Network (IP, routing)
  - **L4**: Transport (TCP/UDP, ports)
  - **L5–L7**: Session, Presentation, Application (SSL/TLS, HTTP, DNS, SSH)

- **TCP/IP Stack:**
  - **Link**: L1/L2 (Ethernet)
  - **Internet**: L3 (IP)
  - **Transport**: L4 (TCP/UDP)
  - **Application**: L7 and above (HTTP, DNS, SSH, etc.)

- **Protocol Locations:**
  - **IP**: Internet layer
  - **TCP/UDP**: Transport layer
  - **DNS, HTTP, HTTPS**: Application layer

- **Example:**  
  `curl https://example.com` = Application (HTTP) over Transport (TCP) over Internet (IP)

---

## 🖥️ Hands-on Checklist & Command Outputs

### 1. **Identify: IP Address**

```sh
hostname -I
# Output: 192.168.1.23
```
or
```sh
ip addr show
# Look for inet address under your network device.
```

---

### 2. **Reachability: Ping**

```sh
ping -c 3 google.com
# Output:
# 64 bytes from ...: icmp_seq=1 ttl=117 time=10.8 ms
# 64 bytes from ...: icmp_seq=2 ttl=117 time=10.1 ms
# 64 bytes from ...: icmp_seq=3 ttl=117 time=10.5 ms
# --- google.com ping statistics ---
# 3 packets transmitted, 3 received, 0% packet loss, avg = 10.5 ms

# Observation: No packet loss, latency around 10 ms.
```

---

### 3. **Path: Traceroute**

```sh
traceroute google.com
# Output (partial):
# 1  192.168.1.1 (192.168.1.1)  1.312 ms  1.243 ms  1.226 ms
# 2  100.65.0.1 (100.65.0.1)    5.724 ms  5.462 ms  5.418 ms
# ...
# 12 172.217.160.78 (172.217.160.78)  14.544 ms  14.078 ms  14.476 ms

# Observation: No major timeouts, normal hop times.
```

---

### 4. **Ports: Listening Services**

```sh
ss -tulpn
# Output (single service example):
# Netid State   Recv-Q  Send-Q     Local Address:Port    Peer Address:Port    Process
# tcp   LISTEN  0       128        0.0.0.0:22            0.0.0.0:*           users:(("sshd",pid=592,fd=3))
# Example found: SSH listening on port 22.
```

---

### 5. **Name Resolution: DNS Check**

```sh
dig +short google.com
# Output: 142.250.183.78
```
or
```sh
nslookup google.com
# Output: Name: google.com, Address: 142.250.183.78
```

---

### 6. **HTTP Check: Status Code**

```sh
curl -I https://google.com
# Output:
# HTTP/2 200
# Server: gws
# ...

# Observation: Got HTTP 200, site up.
```

---

### 7. **Connections Snapshot**

```sh
netstat -an | head -10
# Output (sample):
# tcp   0   0 0.0.0.0:22 0.0.0.0:*   LISTEN
# tcp   0   0 127.0.0.1:631 0.0.0.0:* LISTEN
# ...
# Count ESTABLISHED vs LISTEN lines:
# Many LISTEN = services waiting for connections
# ESTABLISHED = active client/server traffic
```

---

### 8. **Mini Task: Port Probe & Interpret**

- **Identified Listening Port:** SSH on 22 (from step 4)

```sh
nc -zv localhost 22
# Output: Connection to localhost 22 port [tcp/ssh] succeeded!

# It is reachable. If not, next check would be: is sshd running (`systemctl status sshd`)? Or is firewall blocking the port?
```
or, probe HTTP:
```sh
curl -I http://localhost:80
# HTTP/1.1 200 OK (if web service present)
```

---

## 💡 Reflection

- **Fastest signal when something is broken:**  
  `ping` (loss/latency), or `curl -I` (immediate http error) give a fast red/green.

- **If DNS fails:**  
  I'd inspect the DNS/Name Resolution layer. I'd check `/etc/resolv.conf`, try `dig 8.8.8.8`, check network connectivity (Layers 3-4/Internet & Transport).

- **If HTTP 500 occurs:**  
  Focus is on the Application layer.  
  Next: check server logs, webserver/service health (`systemctl status <websvc>`).

- **Two follow-up checks in a real incident:**  
  1. `systemctl status <service>` or `journalctl -u <service>` to see errors.
  2. Check firewall or routing (`ss -tulpn`, `iptables -L`, `ip route`).

---

