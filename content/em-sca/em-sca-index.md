# Electromagnetic Side-Channel Analysis — Wiki Index

*Last Updated: April 12, 2026*

Central hub for all EM-SCA and SIGINT knowledge in this wiki. Follow the map below from foundational concepts through practical implementation, applied research, and market context.

---

## Knowledge Map

```
                    [coursera-sigint.md]
                     Prerequisites & Learning Path
                              │
                              ▼
         ┌────────────────────────────────────────────────┐
         │  electromagnetic-side-channel-analysis.md      │
         │  Theory, history, attack taxonomy,             │
         │  countermeasures, 2024-2026 overview           │
         └──────────────┬─────────────────────────────────┘
                        │
                        │   ┌──────────────────────────────┐
                        │   │  em-sca-2026-developments.md │
                        ├──►│  IEEE S&P/CCS/USENIX/CHES    │
                        │   │  EMFormer, TEMA, TPU attacks  │
                        │   └──────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────────────────────────┐
         │  electromagnetic-side-channel-practical-guide.md     │
         │  Hardware setup, signal processing pipeline,         │
         │  CEMA code, TempestSDR, DL-based attack examples     │
         └──────┬──────────────┬──────────────┬─────────────────┘
                │              │              │
                ▼              ▼              ▼
    ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐
    │ entry-level-  │  │ research-     │  │ professional-    │
    │ em-sca-       │  │ grade-em-sca- │  │ em-sca-          │
    │ setup.md      │  │ lab.md        │  │ facility.md      │
    │ <$200         │  │ $300–$1,500   │  │ $100k–$500k+     │
    │ RTL-SDR v3/v4 │  │ HackRF/Blade  │  │ USRP X410/X440   │
    └───────┬───────┘  └───────┬───────┘  └──────────────────┘
            │                  │
            └──────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │  sdr-tools-landscape-    │
    │  2026.md                 │
    │  RTL-SDR v4, HackRF 2.0, │
    │  USRP X440, GNU Radio    │
    │  3.11, AI/ML SDR tools   │
    └──────────────────────────┘

──────────────── Standards & PQC ─────────────────

    ┌──────────────────────────┐   ┌───────────────────────────┐
    │ tempest-standards-       │   │ pqc-em-sca.md             │
    │ reference.md             │   │ Post-quantum crypto &     │
    │ NSTISSAM, NATO, FIPS     │   │ CRYSTALS-Kyber attacks    │
    │ zone classification      │   │                           │
    └──────────────────────────┘   └──────────┬────────────────┘
                                              │
                                              ▼
                                ┌─────────────────────────────┐
                                │ pqc-implementation-         │
                                │ security-2026.md            │
                                │ Attacks on ML-KEM, ML-DSA,  │
                                │ SLH-DSA, FN-DSA; pqm4,     │
                                │ liboqs, CIRCL mitigations   │
                                └─────────────────────────────┘

──────────────── Market Layer ────────────────────

    ┌──────────────────────────────────────────────────────┐
    │  em-sca-market-analysis-overview.md                  │
    │  $200-500M market (2026), segments, growth to 2035   │
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

──────────────── SIGINT Layer ────────────────────

    ┌─────────────────────────────────────────────────┐
    │  sigint-academic-research-overview.md            │
    │  AMC, SEI, TDOA/AOA geolocation, ELINT,         │
    │  cognitive EW, CEMA doctrine, RadioML datasets   │
    └──────────────┬──────────────┬───────────────────┘
                   │              │
                   ▼              ▼
    ┌──────────────────┐  ┌──────────────────────────┐
    │ rf-fingerprint-  │  │ sigint-machine-learning- │
    │ ing-device-      │  │ pipeline.md              │
    │ identification   │  │ IQ→spectrogram→AMC→edge  │
    │ .md              │  │ RadioGPT, TensorRT/ONNX  │
    │ SEI, few-shot,   │  │                          │
    │ adversarial RF   │  │                          │
    └──────────────────┘  └──────────────────────────┘
                   │
                   ▼
    ┌────────────────────────────────────────┐
    │  sigint-private-companies-em-          │
    │  intelligence.md                       │
    │  Lockheed, L3Harris, HawkEye 360,     │
    │  HENSOLDT, space-based SIGINT          │
    └────────────────────────────────────────┘
```

---

## File Descriptions & Connections

### Foundational Theory

| File | Summary | Links to |
|------|---------|---------|
| [electromagnetic-side-channel-analysis.md](electromagnetic-side-channel-analysis.md) | Attack taxonomy (SEMA/CEMA/DL), TEMPEST history, countermeasures, 2024–2026 breakthroughs | Practical guide, equipment tiers, PQC pages, TEMPEST reference, 2026 developments |
| [tempest-standards-reference.md](tempest-standards-reference.md) | NSTISSAM TEMPEST/1-92, NATO SDIP-27 zone classification, FIPS 140-3 EM requirements | Academic overview, professional facility, PQC implementation security |
| [pqc-em-sca.md](pqc-em-sca.md) | EM-SCA vulnerability overview for CRYSTALS-Kyber, Dilithium, FALCON — countermeasures survey | Academic overview, practical guide, pqc-implementation-security-2026 |

### 2026 Research Updates

| File | Summary | Links to |
|------|---------|---------|
| [em-sca-2026-developments.md](em-sca-2026-developments.md) | IEEE S&P/CCS/USENIX/CHES 2025–2026: EMFormer (ViT), TEMA transient analysis, RISC-V/TPU/automotive attacks, active EM fault injection, metasurface countermeasures | Foundational theory, all equipment tiers, PQC pages, SDR tools |
| [pqc-implementation-security-2026.md](pqc-implementation-security-2026.md) | Published SCA attacks on all four NIST standards (ML-KEM, ML-DSA, SLH-DSA, FN-DSA) with trace counts, platforms, and open-source mitigations (pqm4, liboqs, CIRCL) | pqc-em-sca.md, practical guide, TEMPEST standards, key players |
| [sdr-tools-landscape-2026.md](sdr-tools-landscape-2026.md) | Hardware survey (RTL-SDR v4 to USRP X440), GNU Radio 3.11, SigDigger, AI/ML SDR integration, cloud SDR platforms, regulatory considerations | All equipment tiers, practical guide, SIGINT ML pipeline, RF fingerprinting |

### Implementation & Equipment

| File | Budget | Key Hardware | Links to |
|------|--------|-------------|---------|
| [electromagnetic-side-channel-practical-guide.md](electromagnetic-side-channel-practical-guide.md) | Any | HackRF, RTL-SDR, Langer probes | All equipment tiers, SDR tools, ChipWhisperer, SCAAML, ASCAD |
| [entry-level-em-sca-setup.md](entry-level-em-sca-setup.md) | < $200 | RTL-SDR v3/v4, DIY probes | Practical guide, research-grade (upgrade path), SDR tools landscape, Coursera path |
| [research-grade-em-sca-lab.md](research-grade-em-sca-lab.md) | $300–$1,500 | HackRF One, BladeRF 2.0, Langer probes | Entry-level, professional (upgrade to), key players (NewAE, Nuand), SDR tools |
| [professional-em-sca-facility.md](professional-em-sca-facility.md) | $100k–$500k+ | USRP X410, Keysight, anechoic chamber | Key players, market analysis, TEMPEST standards, FIPS 140-3 |

### Market & Industry

| File | Summary | Links to |
|------|---------|---------|
| [em-sca-market-analysis-overview.md](em-sca-market-analysis-overview.md) | Market sizing ($200-500M 2026 → $750-900M 2035), segments by geography/vertical, growth catalysts (UN R155, NIST PQC, CHIPS Act) | Key players, consumer apps, SIGINT companies |
| [em-sca-key-players-companies.md](em-sca-key-players-companies.md) | 13 companies across 3 tiers: Riscure, BrightSight, Rambus, NewAE, FortifyIQ, Keysight, R&S, Langer EMV, startups | Market overview, consumer apps, equipment guides, PQC implementation security |
| [em-sca-consumer-applications.md](em-sca-consumer-applications.md) | Consumer verticals: IoT ($45M), automotive ($35M), smartphone forensics ($25M), smart home ($15M) | Key players, standards (ETSI EN 303 645, UN R155) |
| [sigint-private-companies-em-intelligence.md](sigint-private-companies-em-intelligence.md) | Defense contractors (Lockheed, Northrop, RTX) and commercial SIGINT (HawkEye 360, SNC). Defense↔commercial EM technology transfer | EM-SCA market, professional facility, SIGINT academic, RF fingerprinting |

### SIGINT

| File | Summary | Links to |
|------|---------|---------|
| [sigint-academic-research-overview.md](sigint-academic-research-overview.md) | AMC, SEI/RF fingerprinting, TDOA/AOA/FDOA geolocation, ELINT (radar recognition, LPI/LPD), cognitive EW, CEMA doctrine, RadioML datasets | RF fingerprinting, ML pipeline, SDR tools, SIGINT companies, Coursera path |
| [rf-fingerprinting-device-identification.md](rf-fingerprinting-device-identification.md) | Physical-layer SEI: IQ imbalance, CFO, transient features; CNN/LSTM/Transformer architectures; few-shot learning; adversarial RF attacks; GDPR/ECPA framework | SIGINT academic, ML pipeline, SDR tools, SIGINT companies |
| [sigint-machine-learning-pipeline.md](sigint-machine-learning-pipeline.md) | End-to-end ML pipeline: IQ→spectrogram→AMC→geolocation→anomaly detection; RadioGPT/SpectrumFM foundation models; TensorRT/ONNX edge deployment; CORES dataset | SIGINT academic, RF fingerprinting, SDR tools, Coursera path |

### Education & Learning

| File | Summary | Links to |
|------|---------|---------|
| [coursera-sigint.md](coursera-sigint.md) | 6-month learning path (Gantt chart): DSP → Hardware Security → RF Engineering → ML for Signals. 333 hours, 17 courses | Entry-level setup, SIGINT academic, ML pipeline, RF fingerprinting |

### Reference Directories

| File | Summary | Links to |
|------|---------|---------|
| [contacts.md](contacts.md) | All researchers, paper authors, and key individuals — organized by domain (EM-SCA attacks, PQC, SIGINT/RF, open source) | em-sca-2026-developments, pqc-implementation-security-2026, rf-fingerprinting, sigint-academic, key players, sigint companies |
| [organizations.md](organizations.md) | All companies, research institutions, standards bodies, and open-source projects — with HQ, revenue, focus, and links to detailed profiles | em-sca-key-players-companies, sigint-private-companies, sdr-tools-landscape-2026, tempest-standards, market analysis |

### Infrastructure (Homelab)

| File | Summary | Links to |
|------|---------|---------|
| [proxmox-homelab.md](proxmox-homelab.md) | Hub for Proxmox/Docker homelab infrastructure notes | community-scripts-org.md, malindra-lxc-setup.md |
| [community-scripts-org.md](community-scripts-org.md) | community-scripts.org — 400+ Proxmox VE automation scripts | malindra-lxc-setup.md, proxmox-homelab.md |
| [malindra-lxc-setup.md](malindra-lxc-setup.md) | LXC setup for malindra platform (FastAPI + Next.js + TimescaleDB + MongoDB) | community-scripts-org.md, proxmox-homelab.md |

---

## Cross-Topic Connections

### Equipment Tier Upgrade Path
`entry-level-em-sca-setup.md` → `research-grade-em-sca-lab.md` → `professional-em-sca-facility.md`

See also `sdr-tools-landscape-2026.md` for a unified 2026 hardware comparison across all tiers.

Key transition points:
- **Entry → Research:** RTL-SDR → HackRF One (transmit capability unlocks active EM-SCA)
- **Research → Professional:** HackRF → USRP X410/X440 (MIMO, 400 MHz bandwidth, 14/16-bit ADC)

### PQC Attack Depth Ladder
`pqc-em-sca.md` (overview) → `pqc-implementation-security-2026.md` (attack details & mitigations) → `em-sca-2026-developments.md` (2026 cutting-edge research)

### SIGINT Learning Path
`coursera-sigint.md` (curriculum) → `sigint-academic-research-overview.md` (theory) → `rf-fingerprinting-device-identification.md` + `sigint-machine-learning-pipeline.md` (applied)

### Tools Referenced Across Multiple Files

| Tool | Entry | Research | Pro | Practical | 2026 Dev | SDR Tools |
|------|-------|----------|-----|-----------|----------|-----------|
| ChipWhisperer | ✓ | ✓ | – | ✓ | ✓ | – |
| GNU Radio | ✓ | ✓ | – | ✓ | – | ✓ |
| SCAAML (Google) | ✓ | ✓ | – | ✓ | – | – |
| ASCAD (ANSSI) | ✓ | ✓ | – | ✓ | – | – |
| TempestSDR | – | ✓ | – | ✓ | – | ✓ |
| Langer EMV probes | – | ✓ | ✓ | ✓ | ✓ | – |
| USRP platforms | – | – | ✓ | ✓ | – | ✓ |
| RTL-SDR v4 | ✓ | – | – | – | – | ✓ |
| HackRF 2.0 | – | ✓ | – | – | – | ✓ |
| SigDigger | – | – | – | – | – | ✓ |
| pqm4 / liboqs | – | – | – | – | ✓ | – |

### Standards Referenced Across Files

| Standard | Academic | Practical | Consumer | Pro | Market | PQC Impl |
|----------|---------|-----------|----------|-----|--------|----------|
| FIPS 140-3 | ✓ | – | – | ✓ | ✓ | ✓ |
| FIPS 203/204/205 | ✓ | – | – | – | ✓ | ✓ |
| TEMPEST/NSTISSAM | ✓ | ✓ | – | ✓ | – | – |
| NATO SDIP-27 | ✓ | – | – | ✓ | – | – |
| Common Criteria (EAL) | – | – | – | ✓ | ✓ | – |
| UN R155 / ISO 21434 | – | – | ✓ | ✓ | ✓ | – |
| ETSI EN 303 645 | – | – | ✓ | – | ✓ | – |
| ISO/IEC 17825 | – | – | – | ✓ | – | – |
| GDPR (RF fingerprinting) | – | – | – | – | – | – |

### Company ↔ Equipment File Alignment

| Company | Entry | Research | Professional | Key Players |
|---------|-------|----------|-------------|-------------|
| NewAE (ChipWhisperer) | ✓ | ✓ | – | ✓ |
| Great Scott Gadgets (HackRF) | – | ✓ | – | – |
| Nuand (BladeRF) | – | ✓ | – | – |
| Ettus/NI (USRP) | – | – | ✓ | – |
| Langer EMV | – | ✓ | ✓ | ✓ |
| Riscure | – | ✓ | ✓ | ✓ |
| Keysight | – | – | ✓ | ✓ |
| FortifyIQ | – | – | – | ✓ |
| Secure-IC | – | – | – | ✓ |

---

## Coursera Path → Practical Prerequisite Map

```
Phase 1: DSP Foundations
  └→ electromagnetic-side-channel-practical-guide.md §2 (Signal Processing Pipeline)
  └→ entry-level-em-sca-setup.md §2.3 (Signal Chain Calibration)
  └→ sigint-machine-learning-pipeline.md §Preprocessing (IQ, STFT, CWT)

Phase 2: Hardware Security + Cryptography
  └→ electromagnetic-side-channel-analysis.md §3–5 (Attack Methods, Case Studies)
  └→ pqc-em-sca.md (Post-quantum vulnerabilities overview)
  └→ pqc-implementation-security-2026.md (Attack details & mitigations)

Phase 3: RF Engineering
  └→ research-grade-em-sca-lab.md §1 (SDR Platform Comparison)
  └→ professional-em-sca-facility.md §2 (Equipment Suite)
  └→ sdr-tools-landscape-2026.md (Full 2026 hardware landscape)
  └→ tempest-standards-reference.md (RF emissions & zones)

Phase 4: ML for Signals
  └→ electromagnetic-side-channel-practical-guide.md §3.2 (DL-based attacks)
  └→ research-grade-em-sca-lab.md §3.4 (ML pipeline for EM-SCA)
  └→ sigint-machine-learning-pipeline.md (End-to-end SIGINT ML pipeline)
  └→ rf-fingerprinting-device-identification.md (SEI deep learning)
  └→ em-sca-2026-developments.md §2 (EMFormer, CEML, ProtoEM)
```

---

*When adding new files, update the knowledge map, File Descriptions table, tools/standards matrices, and company alignment table above.*
