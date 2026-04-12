# Proxmox Homelab Infrastructure

*Last Updated: April 12, 2026*

**Wiki navigation:** [Community Scripts](community-scripts-org.md) · [Malindra LXC Setup](malindra-lxc-setup.md)

## Overview

This page is the hub for homelab infrastructure notes running on Proxmox VE. The homelab is used for self-hosted services and development environments, currently hosting the **malindra** portfolio management platform via Docker in an LXC container.

---

## Infrastructure Map

```
Proxmox VE Host
├── vmbr0 (network bridge)
│   └── subnet: 192.168.1.0/24
│       └── gateway: 192.168.1.1
│
├── LXC: malindra (Docker)
│   ├── IP: 192.168.1.177
│   ├── MAC: bc:24:11:4c:17:d7
│   ├── OS: Debian 13
│   ├── CPU: 2 cores (expandable to 4)
│   └── Docker services:
│       ├── FastAPI backend    :8000
│       ├── Next.js frontend   :3000
│       ├── PostgreSQL/TimescaleDB :5432 (internal)
│       └── MongoDB            :27017 (internal)
│
└── [future LXCs / VMs as needed]
```

---

## Key Documents

### [community-scripts-org.md](community-scripts-org.md)
The community-scripts.org platform provides the automation scripts used to build containers. Key facts:
- **400+ scripts** for Proxmox VE 8.4.x, 9.0.x, 9.1.x
- The `docker.sh` script was used to create the malindra container
- Script manager can be installed directly into the Proxmox web UI
- Project maintained in memory of original creator tteck

**Quick install command for Docker LXC:**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/docker.sh)"
```

### [malindra-lxc-setup.md](malindra-lxc-setup.md)
Step-by-step guide for creating and configuring the malindra container with a specific static IP and MAC address. Covers:
- Single-command creation with MAC/IP pre-set
- Manual post-creation network configuration
- Application startup and health verification
- Troubleshooting common issues

---

## Common Operations

### Create a new Docker LXC with static IP
```bash
var_mac="<MAC>" var_net="<IP/CIDR>" var_gateway="<GW>" \
  bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/docker.sh)"
```

### Edit an existing container's network config
```bash
pct stop <CTID>
nano /etc/pve/lxc/<CTID>.conf
# modify net0 line
pct start <CTID>
```

### Post-PVE installation optimization
```bash
bash -c "$(wget -qLO - https://github.com/community-scripts/ProxmoxVE/raw/main/misc/post-pve-install.sh)"
```

---

## Malindra Application

The **malindra** platform is a portfolio management application for tracking investments and financial analysis.

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://192.168.1.177:3000 | Next.js |
| Backend API | http://192.168.1.177:8000 | FastAPI |
| API Docs | http://192.168.1.177:8000/docs | Swagger UI |
| Portainer | https://192.168.1.177:9443 | Docker management |

**GitHub:** https://github.com/malindralk/malindra  
**Required env vars:** `APP_EMAIL`, `APP_PASSWORD`, `MALINDRA_ANTHROPIC_API_KEY`, `MALINDRA_SECRET_KEY`

---

## Network Reservations

| IP | Service | MAC | Notes |
|----|---------|-----|-------|
| 192.168.1.177 | malindra LXC | bc:24:11:4c:17:d7 | Exclude from DHCP range |

---

## References

- Proxmox VE Docs: https://pve.proxmox.com/wiki/Main_Page  
- Community Scripts: https://community-scripts.org/  
- Community Scripts GitHub: https://github.com/community-scripts/ProxmoxVE
