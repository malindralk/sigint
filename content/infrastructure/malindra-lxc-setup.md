# Malindra Repository LXC Setup Guide

**Wiki navigation:** [Proxmox Homelab Hub](proxmox-homelab.md) · [Community Scripts](community-scripts-org.md)

## Overview
This guide explains how to create an LXC container on Proxmox VE to host the malindra portfolio management platform. The container will have Docker installed and will be configured with specific network settings.

## Prerequisites
- Proxmox VE 8.4.x, 9.0.x, or 9.1.x
- Internet connection on Proxmox host
- Sufficient resources (CPU, RAM, storage)

## Network Configuration
- **MAC Address:** `bc:24:11:4c:17:d7`
- **IP Address:** `192.168.1.177/24`
- **Gateway:** `192.168.1.1` (adjust if different in your network)
- **Bridge:** `vmbr0` (default)

## Method 1: Single Command (Recommended)

Run this command in your Proxmox shell (SSH or web shell):

```bash
var_mac="bc:24:11:4c:17:d7" var_net="192.168.1.177/24" var_gateway="192.168.1.1" bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/docker.sh)"
```

### What this does:
1. Creates a Debian 13 LXC container
2. Installs Docker and Portainer
3. Configures the specified MAC address
4. Sets static IP address `192.168.1.177`
5. Configures gateway `192.168.1.1`
6. Uses default bridge `vmbr0`

### Default Container Specifications:
- **CPU:** 2 cores
- **RAM:** 2GB
- **Disk:** 4GB
- **OS:** Debian 13
- **Unprivileged:** Yes (safer)

## Method 2: Customized Command with More Parameters

If you need to customize resources:

```bash
var_mac="bc:24:11:4c:17:d7" \
var_net="192.168.1.177/24" \
var_gateway="192.168.1.1" \
var_cpu=4 \
var_ram=4096 \
var_disk=20 \
var_hostname="malindra" \
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/docker.sh)"
```

### Available Parameters:
| Parameter | Default | Description |
|-----------|---------|-------------|
| `var_mac` | (auto) | MAC address `bc:24:11:4c:17:d7` |
| `var_net` | dhcp | IP/CIDR `192.168.1.177/24` |
| `var_gateway` | (auto) | Gateway `192.168.1.1` |
| `var_cpu` | 2 | CPU cores |
| `var_ram` | 2048 | RAM in MB |
| `var_disk` | 4 | Disk size in GB |
| `var_hostname` | docker | Container hostname |
| `var_os` | debian | OS (debian/ubuntu/alpine) |
| `var_version` | 13 | OS version |
| `var_brg` | vmbr0 | Network bridge |

## Method 3: Manual Configuration After Creation

If the script doesn't accept MAC/IP parameters:

1. **Create basic Docker LXC:**
   ```bash
   bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/docker.sh)"
   ```

2. **Stop the container:**
   ```bash
   pct stop <CTID>
   ```

3. **Edit configuration:**
   ```bash
   nano /etc/pve/lxc/<CTID>.conf
   ```

4. **Add/modify network line:**
   ```
   net0: name=eth0,bridge=vmbr0,firewall=1,hwaddr=bc:24:11:4c:17:d7,ip=192.168.1.177/24,gw=192.168.1.1,type=veth
   ```

5. **Start the container:**
   ```bash
   pct start <CTID>
   ```

## Post-Creation Setup

Once the LXC is running at `192.168.1.177`:

### 1. SSH into the Container
```bash
ssh root@192.168.1.177
# Default password will be shown during creation or check /etc/pve/lxc/<CTID>.conf
```

### 2. Clone Malindra Repository
```bash
git clone https://github.com/malindralk/malindra.git
cd malindra
```

### 3. Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit with your credentials
nano .env
```

**Key environment variables to set:**
```env
APP_EMAIL=your-email@example.com
APP_PASSWORD=secure-password
MALINDRA_ANTHROPIC_API_KEY=your-claude-api-key
MALINDRA_SECRET_KEY=generate-a-secure-secret-key
```

### 4. Start Application with Docker Compose
```bash
# Start all services
docker compose up -d

# Check status
docker ps

# View logs
docker compose logs -f
```

### 5. Verify Services
```bash
# Check API health
curl http://localhost:8000/health

# Check web service
curl -I http://localhost:3000
```

## Accessing the Application

- **Frontend:** http://192.168.1.177:3000
- **Backend API:** http://192.168.1.177:8000
- **API Documentation:** http://192.168.1.177:8000/docs
- **Portainer:** https://192.168.1.177:9443 (if installed)

## Application Architecture

The malindra application consists of:

### 1. **Database Services**
- **PostgreSQL (TimescaleDB):** Port 5432 (internal)
- **MongoDB:** Port 27017 (internal)

### 2. **Application Services**
- **FastAPI Backend:** Port 8000
  - Portfolio analytics
  - Financial statement parsing
  - CFA L1 calculations
- **Next.js Frontend:** Port 3000
  - User interface
  - Portfolio visualization

### 3. **Docker Network**
All services communicate via Docker internal network.

## Troubleshooting

### Common Issues:

1. **Container won't start:**
   ```bash
   # Check logs
   pct status <CTID>
   journalctl -u pve-container@<CTID>
   ```

2. **Network issues:**
   ```bash
   # Check IP configuration
   ip addr show eth0
   ping 192.168.1.1
   ```

3. **Docker compose fails:**
   ```bash
   # Check Docker service
   systemctl status docker
   
   # Check disk space
   df -h
   
   # Check logs
   docker compose logs
   ```

4. **Application not accessible:**
   ```bash
   # Check if ports are bound
   ss -tlnp | grep ':8000\|:3000'
   
   # Check container logs
   docker logs malindra-api
   docker logs malindra-web
   ```

### Resource Monitoring:
```bash
# Inside LXC
htop
df -h
free -h

# From Proxmox host
pct df <CTID>
pct top <CTID>
```

## Security Considerations

1. **Change default passwords** (SSH, database, application)
2. **Configure firewall** on Proxmox host
3. **Regular updates:**
   ```bash
   apt update && apt upgrade -y
   docker compose pull
   docker compose up -d
   ```
4. **Backup strategy:**
   - Proxmox backup for LXC
   - Database dumps
   - Repository backups

## Maintenance

### Updates:
```bash
# Update system
apt update && apt upgrade -y

# Update Docker images
docker compose pull
docker compose up -d

# Clean up
docker system prune -f
```

### Backups:
```bash
# Backup database
docker exec malindra-db pg_dump -U malindra malindra > backup.sql

# Backup important data
tar -czf malindra-backup-$(date +%Y%m%d).tar.gz data/ .env
```

## Additional Resources

- **Malindra Repository:** https://github.com/malindralk/malindra
- **Proxmox VE Documentation:** https://pve.proxmox.com/wiki/Main_Page
- **Community Scripts:** https://community-scripts.org/
- **Docker Documentation:** https://docs.docker.com/
- **Portainer Documentation:** https://docs.portainer.io/

## Notes

1. The MAC address `bc:24:11:4c:17:d7` is reserved for this container
2. IP `192.168.1.177` should be excluded from DHCP range
3. Ensure network connectivity to required APIs (GitHub, Claude API, etc.)
4. Monitor resource usage as the application grows
5. Consider SSL/TLS for production use

---

*Last Updated: 2026-04-11*  
*Created by: Echo (OpenClaw Assistant)*  
*For: Malindra Portfolio Management Platform*