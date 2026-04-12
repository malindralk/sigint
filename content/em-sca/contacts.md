# Contacts — Researchers & Key People

*Last Updated: April 12, 2026*

People referenced across the wiki, organized by domain. Cross-linked to relevant articles.

---

## EM Side-Channel Analysis Researchers

### Attack & Analysis Research

| Name | Affiliation | Research Focus | Papers / Work |
|------|------------|----------------|---------------|
| **Kaptanoglu et al.** | (IEEE S&P 2025) | Multi-channel spatial EM analysis, MIMO probe arrays | 8–16 channel beamforming attack on ARM Cortex-M4, 12–18 dB SNR improvement |
| **Lee et al.** | CISPA Helmholtz Center | Microarchitectural EM state inference, RISC-V | EM-Probe: instruction tracing through chassis shielding at 15 cm |
| **Moriyama & Satoh** | NTT Social Informatics Labs | Transient EM emission analysis (TEMA) | TCHES 2025 — asynchronous leakage extraction, 2–6 GHz transients |
| **Zhang et al.** | (CCS 2025) | Vision Transformers for EM trace analysis | EMFormer — 99.2% key rank reduction, 50% fewer profiling traces |
| **Bold et al.** | ETH Zurich (Secure Hardware Lab) | Self-supervised & contrastive learning for SCA | CEML — 99% reduction in labeling effort (IEEE S&P 2026) |
| **Kitazawa et al.** | — | Active EM-SCA | Active EM impedance-based attacks (2026) |
| **Park et al.** | MIT CSAIL | AI accelerator EM attacks, model extraction | IEEE S&P 2026 — Edge TPU DNN extraction via EM, 94% weight accuracy |
| **Kisser & Heyszl** | — | Automotive MCU cross-domain EM attacks | TCHES 2026 — CAN transceiver EM leakage from adjacent ASIL-D domain |
| **Ravi et al.** | — | PQC side-channel analysis (comprehensive) | CHES 2025 — survey of 12 PQC implementations on Cortex-M7, NTT single-trace |
| **Fritzmann et al.** | — | RISC-V `scalar-crypto` extension EM analysis | USENIX Security 2025 — SiFive X280, `sha512sum0` carry chain leakage |
| **Jang et al.** | — | EM-induced Rowhammer on MCU flash | IEEE S&P 2025 — STM32H7 bit flip, secure boot bypass |
| **Oberhansl et al.** | — | EM side-channel on embedded systems | Referenced in practical guide |
| **Collins et al.** | — | EM monitoring and detection | Referenced in practical guide |

### PQC Implementation Security

| Name | Affiliation | Algorithm Target | Attack Type | Reference |
|------|------------|-----------------|-------------|-----------|
| **Ravi et al.** | — | Kyber-768 | Template attack (NTT decapsulation) | ~10K traces on Cortex-M4 |
| **Primas et al.** | — | Kyber | SPA on rejection sampling | Early Kyber implementations |
| **Beckwith et al.** | — | Kyber-768 | CPA on Decode function | 50K traces, STM32F415 (2023) |
| **Pessl & Prokop** | — | Kyber (FPGA, masked) | EM template attack | 200K traces, Artix-7 FPGA (2021) |
| **D'Anvers et al.** | — | Dilithium-3 | SPA on rejection sampling loop | ~5K traces, ARM Cortex-M3 (2022) |
| **Zhang et al.** | — | Dilithium-3 | CPA on NTT (key generation) | 30K traces, Arduino Uno (2023) |
| **Hamburg et al.** | — | Dilithium (1st-order masked) | Horizontal EM attack | 500K traces (2024) |
| **Bernstein et al.** | — | SPHINCS+ / WOTS+ | SPA on hash chain length | Key generation inference (2020) |
| **Park & Lee** | — | SPHINCS+-SHAKE256 | DPA on FORS tree traversal | 100K traces, FPGA (2023) |
| **Schwabe & Wiggers** | — | SPHINCS+-128s | Remote timing attack | 10^7 signature queries (2022) |
| **Groot Bruinderink et al.** | — | FALCON | Template attack on CDT sampler | 40K traces, Cortex-M4 (2022) |
| **Nguyen & Tibouchi** | — | FALCON | Single fault injection | 100% success rate (2024) |
| **Pessl** | — | FALCON (Intel SGX) | EM analysis on FFT | 15K traces (2023) |

### Countermeasures & Formal Methods

| Name | Affiliation | Focus | Work |
|------|------------|-------|------|
| **ETH Zurich Secure Hardware Lab** | ETH Zurich, Switzerland | DL for SCA, PQC countermeasures | CEML contrastive learning (IEEE S&P 2026) |
| **CISPA Team (Lee et al.)** | CISPA Helmholtz Center, Germany | Microarchitectural SCA, RISC-V | EM-Probe (USENIX Security 2026) |
| **Georgia Tech SSLab** | Georgia Tech, USA | Active EM/fault injection, AI accelerators | EM-Sight precision fault injection (USENIX Security 2026) |
| **WPI Team** | Worcester Polytechnic Institute, USA | Formal verification vs. EM leakage | ELMO: RTL-level EM formal verification tool (CAV 2025) |
| **NTT SIL Team (Moriyama & Satoh)** | NTT Social Informatics Labs, Japan | Advanced signal processing | TEMA transient analysis (TCHES 2025) |
| **TU Graz IAIK** | Graz University of Technology, Austria | Masking schemes, real-world attacks | 3rd-order attacks on masked Keccak/SHA-3 (CHES 2025) |
| **MIT CSAIL (Park et al.)** | MIT, USA | AI/ML security, model extraction | Edge TPU model extraction via EM (IEEE S&P 2026) |
| **Intel (ISSCC 2026)** | Intel Corporation, USA | On-chip active EM cancellation | 35 dB SNR reduction, 5% die area overhead |

---

## SIGINT & RF Research Community

### RF Fingerprinting / SEI

| Name / Team | Affiliation | Focus | Key Result |
|------------|------------|-------|------------|
| **DeepSig / RadioML team** | DeepSig Inc., USA | AMC benchmarks, RadioML datasets | RadioML 2016.10A, 2018.01A — industry-standard SEI benchmarks |
| **RadioML 2023 contributors** | Distributed / open | RadioML 2023.01A expansion | 2.4M samples, 30 modulations, realistic channel impairments |
| **CORES initiative** | 2025 consortium | Crowdsourced real-world RF dataset | 50+ TB, GPS/ADS-B/LoRa/5G/Starlink signals |

### Space-Based SIGINT

| Name | Company | Role | Notable Work |
|------|---------|------|-------------|
| **HawkEye 360 team** | HawkEye 360, USA | Commercial space RF geolocation | 30+ satellite cluster, TDOA geolocation for maritime/IED detection |
| **Unseenlabs team** | Unseenlabs (Breizh Reconnaissance Orbiter), France | Passive maritime RF SIGINT | BRO-17/20 constellation (Nov 2025), dark vessel detection |

---

## Community & Open Source

| Name | Project | Role | Notes |
|------|---------|------|-------|
| **tteck** (deceased) | community-scripts.org | Founder & primary maintainer | Proxmox VE automation scripts — project continues in his memory; Ko-fi supports cancer research and hospice care |
| **Colin O'Flynn** | NewAE Technology / ChipWhisperer | Founder | ChipWhisperer open-source hardware platform for SCA |

---

## Key Figures Referenced in Standards

| Name / Body | Organization | Standard / Role |
|------------|-------------|-----------------|
| **NIST PQC Team** | NIST, USA | FIPS 203, 204, 205 — PQC standardization |
| **NSA TEMPEST Program** | NSA, USA | NSTISSAM TEMPEST/1-92, TEMPEST/2-95 classification |
| **NATO AC/322** | NATO | SDIP-27 zone classification (Zone 0–2) |
| **ANSSI** | ANSSI, France | ASCAD dataset — EM trace database for AES; PQC evaluation |

---

## See Also

| Article | Relationship |
|---------|-------------|
| [organizations.md](organizations.md) | All companies, standards bodies, and research institutions |
| [em-sca-index.md](em-sca-index.md) | Full wiki index with cross-references |
| [em-sca-key-players-companies.md](em-sca-key-players-companies.md) | EM-SCA company profiles with revenue and market position |
| [sigint-private-companies-em-intelligence.md](sigint-private-companies-em-intelligence.md) | SIGINT defense contractor and commercial intelligence company profiles |
| [em-sca-2026-developments.md](em-sca-2026-developments.md) | 2026 research papers and key researcher contributions |
| [pqc-implementation-security-2026.md](pqc-implementation-security-2026.md) | Published PQC attacks — researchers and trace counts |
| [sigint-academic-research-overview.md](sigint-academic-research-overview.md) | Academic SIGINT community, conferences, and journals |
