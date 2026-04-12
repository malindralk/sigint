# Electromagnetic Side-Channel Analysis — Wiki Index

*Last Updated: April 12, 2026*

This page is the central hub for all EM-SCA knowledge in this wiki. Follow the map below to navigate from foundational concepts through practical implementation, market context, and career development.

---

## Knowledge Map

```
                    [coursera-sigint.md]
                     Prerequisites & Learning Path
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  electromagnetic-side-channel-         │
         │  analysis.md                           │
         │  Theory, history, attack taxonomy,     │
         │  countermeasures, research 2024-2026   │
         └──────────────┬─────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────────────────┐
         │  electromagnetic-side-channel-               │
         │  practical-guide.md                          │
         │  Hardware setup, software stack, CEMA code, │
         │  TEMPEST attacks, signal processing pipeline│
         └──────┬──────────────┬──────────────┬─────────┘
                │              │              │
                ▼              ▼              ▼
    ┌───────────────┐  ┌───────────────┐  ┌───────────────────┐
    │ entry-level-  │  │ research-     │  │ professional-     │
    │ em-sca-       │  │ grade-em-sca- │  │ em-sca-           │
    │ setup.md      │  │ lab.md        │  │ facility.md       │
    │ <$200         │  │ $300–$1,500   │  │ $5k–$50k+         │
    │ RTL-SDR       │  │ HackRF/Blade  │  │ USRP X410         │
    └───────────────┘  └───────────────┘  └───────────────────┘
                                │
                   ┌────────────┴────────────┐
                   │                         │
                   ▼                         ▼
    ┌──────────────────────┐   ┌───────────────────────────┐
    │ tempest-standards-   │   │ pqc-em-sca.md             │
    │ reference.md         │   │ Post-quantum crypto &     │
    │ NSTISSAM, NATO, zone │   │ CRYSTALS-Kyber attacks    │
    │ classification       │   │                           │
    └──────────────────────┘   └───────────────────────────┘

─────────────────────── Market Layer ────────────────────────

    ┌──────────────────────────────────────────────────────┐
    │  em-sca-market-analysis-overview.md                  │
    │  $280M market (2026), segments, growth to 2035       │
    └───────────────────┬──────────────────────────────────┘
                        │
              ┌─────────┴──────────┐
              ▼                    ▼
    ┌─────────────────┐   ┌────────────────────────┐
    │ em-sca-key-     │   │ em-sca-consumer-       │
    │ players-        │   │ applications.md        │
    │ companies.md    │   │ IoT, automotive,       │
    │ Riscure, NewAE, │   │ forensics, smart home  │
    │ FortifyIQ…      │   │                        │
    └─────────────────┘   └────────────────────────┘
              │
              ▼
    ┌────────────────────────────────────────┐
    │  sigint-private-companies-em-          │
    │  intelligence.md                       │
    │  Defense contractors, commercial SIGINT│
    │  HawkEye 360, L3Harris, HENSOLDT…     │
    └────────────────────────────────────────┘
```

---

## File Descriptions & Connections

### Foundational Theory

| File | Summary | Links to |
|------|---------|---------|
| [electromagnetic-side-channel-analysis.md](electromagnetic-side-channel-analysis.md) | Academic research overview: TEMPEST history, attack taxonomy (SEMA/CEMA/DL), countermeasures, 2024–2026 breakthroughs (Kitazawa active EM-SCA, ECDSA on smartphones) | Practical guide, equipment tiers, PQC page, TEMPEST reference |
| [tempest-standards-reference.md](tempest-standards-reference.md) | NSTISSAM TEMPEST/1-92, NATO SDIP-27 zone classification, FIPS 140-3 EM requirements, history from Cold War to present | Academic overview, professional facility |
| [pqc-em-sca.md](pqc-em-sca.md) | Post-quantum crypto (CRYSTALS-Kyber, Dilithium) side-channel vulnerabilities, EM attack vectors, current countermeasures | Academic overview, practical guide |

### Implementation & Equipment

| File | Budget | Key Hardware | Links to |
|------|--------|-------------|---------|
| [electromagnetic-side-channel-practical-guide.md](electromagnetic-side-channel-practical-guide.md) | Any | HackRF, RTL-SDR, Langer probes | All equipment tiers, tools (ChipWhisperer, SCAAML, ASCAD) |
| [entry-level-em-sca-setup.md](entry-level-em-sca-setup.md) | < $200 | RTL-SDR v3, DIY probes | Practical guide, research-grade (upgrade path), Coursera path |
| [research-grade-em-sca-lab.md](research-grade-em-sca-lab.md) | $300–$1,500 | HackRF One, BladeRF 2.0, Langer probes | Entry-level (upgrade from), professional (upgrade to), key players (NewAE, Nuand) |
| [professional-em-sca-facility.md](professional-em-sca-facility.md) | $5k–$50k+ | USRP X410, Keysight oscilloscopes, anechoic chamber | Key players (Riscure, Keysight, Langer EMV), market analysis, TEMPEST standards |

### Market & Industry

| File | Summary | Links to |
|------|---------|---------|
| [em-sca-market-analysis-overview.md](em-sca-market-analysis-overview.md) | Market sizing ($280M 2026 → $750-900M 2035), segments by geography/vertical, growth catalysts (UN R155, NIST PQC, CHIPS Act) | Key players, consumer apps, SIGINT companies |
| [em-sca-key-players-companies.md](em-sca-key-players-companies.md) | 12 companies across 3 tiers: Riscure, BrightSight, Rambus, NewAE, FortifyIQ, Keysight, R&S, Langer EMV, startups | Market overview, consumer apps, equipment guides |
| [em-sca-consumer-applications.md](em-sca-consumer-applications.md) | Consumer verticals: IoT ($45M), automotive ($35M), smartphone forensics ($25M), smart home ($15M) | Key players (Riscure, UL/BrightSight, FortifyIQ), standards (ETSI EN 303 645, UN R155) |
| [sigint-private-companies-em-intelligence.md](sigint-private-companies-em-intelligence.md) | Defense contractors (Lockheed, Northrop, RTX) and commercial SIGINT (HawkEye 360, SNC). Defense→commercial EM technology transfer | EM-SCA market (ELINT/TEMPEST overlap), professional facility, academic research |
| [sigint-academic-research-overview.md](sigint-academic-research-overview.md) | Deep academic survey: AMC, SEI/RF fingerprinting, TDOA/AOA geolocation, ELINT (radar recognition, LPI/LPD), cognitive EW, CEMA doctrine, commercial space SIGINT, datasets (RadioML, ASCAD) | SIGINT companies, EM-SCA academic, Coursera path |

### Education & Learning

| File | Summary | Links to |
|------|---------|---------|
| [coursera-sigint.md](coursera-sigint.md) | 6-month learning path (Gantt chart): DSP → Hardware Security → RF Engineering → ML for Signals. 333 total hours across 17 courses | Entry-level setup (first practical step after Phase 2), academic overview |

### Infrastructure (Homelab)

| File | Summary | Links to |
|------|---------|---------|
| [proxmox-homelab.md](proxmox-homelab.md) | Hub for Proxmox/Docker homelab infrastructure notes | community-scripts-org.md, malindra-lxc-setup.md |
| [community-scripts-org.md](community-scripts-org.md) | community-scripts.org — 400+ Proxmox VE automation scripts, Docker/HAOS installs | malindra-lxc-setup.md (uses docker.sh script), proxmox-homelab.md |
| [malindra-lxc-setup.md](malindra-lxc-setup.md) | LXC container setup for malindra portfolio platform (FastAPI + Next.js + TimescaleDB + MongoDB) | community-scripts-org.md (docker.sh), proxmox-homelab.md |

---

## Cross-Topic Connections

### Equipment Tier Upgrade Path
`entry-level-em-sca-setup.md` → `research-grade-em-sca-lab.md` → `professional-em-sca-facility.md`

Each file explicitly documents the upgrade path to the next tier. Key transition points:
- Entry → Research: RTL-SDR → HackRF One (transmit capability unlocks active EM-SCA)
- Research → Professional: HackRF → USRP X410 (MIMO, 400 MHz bandwidth, 14-bit ADC)

### Tools Referenced Across Multiple Files

| Tool | Entry | Research | Professional | Practical Guide |
|------|-------|----------|-------------|----------------|
| ChipWhisperer | ✓ | ✓ | – | ✓ |
| GNU Radio | ✓ | ✓ | – | ✓ |
| SCAAML (Google) | ✓ | ✓ | – | ✓ |
| ASCAD (ANSSI) | ✓ | ✓ | – | ✓ |
| TempestSDR | – | ✓ | – | ✓ |
| Langer EMV probes | – | ✓ | ✓ | ✓ |
| USRP platforms | – | – | ✓ | ✓ |

### Standards Referenced Across Files

| Standard | Academic | Practical | Consumer Apps | Professional | Market |
|----------|---------|-----------|--------------|-------------|--------|
| FIPS 140-3 | ✓ | – | – | ✓ | ✓ |
| TEMPEST/NSTISSAM | ✓ | ✓ | – | ✓ | – |
| Common Criteria (EAL) | – | – | – | ✓ | ✓ |
| UN R155 / ISO 21434 | – | – | ✓ | ✓ | ✓ |
| ETSI EN 303 645 | – | – | ✓ | – | ✓ |
| NIST PQC standards | ✓ | – | – | – | ✓ |
| ISO/IEC 17825 | – | – | – | ✓ | – |

### Company ↔ Equipment File Alignment

| Company | Entry | Research | Professional |
|---------|-------|----------|-------------|
| NewAE (ChipWhisperer) | ✓ | ✓ | – |
| Great Scott Gadgets (HackRF) | – | ✓ | – |
| Nuand (BladeRF) | – | ✓ | – |
| Ettus/NI (USRP) | – | – | ✓ |
| Langer EMV | – | ✓ | ✓ |
| Riscure | – | ✓ | ✓ |
| Keysight | – | – | ✓ |

---

## Coursera Path → Practical Prerequisite Map

```
Phase 1: DSP Foundations
  └→ electromagnetic-side-channel-practical-guide.md §2 (Signal Processing Pipeline)
  └→ entry-level-em-sca-setup.md §2.3 (Signal Chain Calibration)

Phase 2: Hardware Security + Cryptography
  └→ electromagnetic-side-channel-analysis.md §3–5 (Attack Methods, Case Studies)
  └→ pqc-em-sca.md (Post-quantum vulnerabilities)

Phase 3: RF Engineering
  └→ research-grade-em-sca-lab.md §1 (SDR Platform Comparison)
  └→ professional-em-sca-facility.md §2 (Equipment Suite)
  └→ tempest-standards-reference.md (RF emissions & zones)

Phase 4: ML for Signals
  └→ electromagnetic-side-channel-practical-guide.md §3.2 (DL-based attacks)
  └→ research-grade-em-sca-lab.md §3.4 (ML pipeline)
```

---

*This index is auto-maintained. When adding new files, update the knowledge map and tables above.*
