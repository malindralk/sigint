# community-scripts.org - Proxmox VE Helper Scripts

**Wiki navigation:** [Proxmox Homelab Hub](proxmox-homelab.md) · [Malindra LXC Setup](malindra-lxc-setup.md)

## Overview

**community-scripts.org** is a community-driven platform providing automation scripts for Proxmox Virtual Environment (PVE). Originally created by **tteck**, the project is now maintained and expanded by the community in memory of its founder.

## Purpose

The platform simplifies Proxmox VE setup with one-command installations for popular services and containers, offering:
- **Simple mode** for beginners
- **Advanced options** for power users
- **Built-in update mechanisms** to keep installations current
- **Post-install scripts** for configuration and troubleshooting

## Key Features

### 1. **Extensive Script Library**
- **400+ scripts** to help manage homelabs
- Covers popular services like:
  - Home Assistant
  - Docker
  - Media servers (Plex, Jellyfin)
  - Network tools
  - Security applications
  - Development environments

### 2. **Multiple Installation Methods**

#### **Web Interface (Fastest)**
1. Visit [community-scripts.org](https://community-scripts.org/)
2. Search for desired script (e.g., "Home Assistant", "Docker")
3. Copy the bash command displayed
4. Paste in Proxmox Shell and follow interactive prompts

#### **Script Manager (Proxmox UI Integration)**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/ct/pve-scripts-local.sh)"
```
- Adds menu to Proxmox interface
- Easy script access without visiting website
- Based on [ProxmoxVE-Local Repository](https://github.com/community-scripts/ProxmoxVE-Local)

### 3. **Compatibility**
- **Proxmox VE Versions:** 8.4.x | 9.0.x | 9.1.x
- **Base System:** Debian-based with Proxmox Tools
- **Requirement:** Internet connection

## Example Scripts

### **Home Assistant OS VM**
```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/vm/haos-vm.sh)"
```

### **Post-PVE Installation Setup**
```bash
bash -c "$(wget -qLO - https://github.com/community-scripts/ProxmoxVE/raw/main/misc/post-pve-install.sh)"
```
- Automated configuration of repos
- System updates
- System optimization

### **LXC Template Creation**
- Creates free LXC templates for system containers
- Generates `*.creds` file in Proxmox root directory with passwords

## Community & Support

### **Communication Channels**
- **Discord:** [discord.gg/3AnUqsXnmK](https://discord.gg/3AnUqsXnmK) - Real-time chat and support
- **GitHub Discussions:** Feature requests, Q&A, and ideas
- **GitHub Issues:** Bug reports and issue tracking

### **Contributions**
The community welcomes:
1. **New scripts** or improvements to existing ones
2. **Documentation:** Guides, README improvements, translations
3. **Testing:** Script compatibility testing and reporting
4. **Feature suggestions:** Workflow improvements

## Project Status & Legacy

### **In Memory of tteck**
The project is maintained by volunteers in memory of the original creator. The community continues his work with:
- Regular security updates
- Best practices implementation
- Optimized configurations for performance
- Comprehensive guides and support

### **Funding & Donations**
- **Platform:** [Ko-fi](https://ko-fi.com/community_scripts)
- **Allocation:** 30% of donations go to cancer research and hospice care
- **Purpose:** Maintain infrastructure, improve documentation, support meaningful causes

## Technical Details

### **Repository Structure**
- **Main Repository:** [github.com/community-scripts/ProxmoxVE](https://github.com/community-scripts/ProxmoxVE)
- **Local Version:** [github.com/community-scripts/ProxmoxVE-Local](https://github.com/community-scripts/ProxmoxVE-Local)
- **License:** MIT License - free to use, modify, and distribute

### **Related Resources**
- **GitHub Organization:** [github.com/community-scripts](https://github.com/community-scripts)
- **Documentation:** Comprehensive guides in repository
- **Changelog:** Regular updates tracked in CHANGELOG.md

## Usage Recommendations

### **For Beginners**
1. Start with the web interface at [community-scripts.org](https://community-scripts.org/)
2. Use simple mode for basic installations
3. Follow interactive prompts carefully

### **For Advanced Users**
1. Consider the script manager for Proxmox UI integration
2. Review script source code before execution
3. Customize scripts for specific needs

### **Security Best Practices**
1. Always review scripts before execution
2. Run in test environments first when possible
3. Keep Proxmox and scripts updated
4. Monitor community discussions for security advisories

## Conclusion

**community-scripts.org** represents the collaborative spirit of the Proxmox community. It provides:
- ✅ **Time-saving automation** for common tasks
- ✅ **Community-vetted solutions** 
- ✅ **Ongoing maintenance** and updates
- ✅ **Educational resource** for Proxmox best practices
- ✅ **Meaningful legacy** supporting important causes

The platform continues to grow through community contributions, maintaining the vision of its founder while adapting to new technologies and user needs.

---

*Last Updated: 2026-04-11*  
*Source: GitHub repository, community documentation, and web research*  
*Note: Proxmox® is a registered trademark of Proxmox Server Solutions GmbH*