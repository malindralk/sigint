# TEMPEST Standards Reference

*Last Updated: April 12, 2026*

**Wiki navigation:** [Index](em-sca-index.md) · [EM-SCA Academic Overview](electromagnetic-side-channel-analysis.md) · [Practical Guide](electromagnetic-side-channel-practical-guide.md) · [Professional Facility](professional-em-sca-facility.md) · [PQC & EM-SCA](pqc-em-sca.md) · [SIGINT Companies](sigint-private-companies-em-intelligence.md) · [SIGINT Academic Research](sigint-academic-research-overview.md) · [Key Players](em-sca-key-players-companies.md) · [Consumer Applications](em-sca-consumer-applications.md)

## What is TEMPEST?

TEMPEST is a classified U.S. government/NATO codename for **compromising emanations** — unintentional electromagnetic, acoustic, or electrical signals emitted by electronic equipment that can be captured and analyzed to reconstruct the data being processed. The acronym is sometimes backronymed as "Transient Electromagnetic Pulse Emanation STandard," though the original name was simply a codename.

The concept dates to the late 1940s–1950s when Bell Labs and NSA discovered that crypto teletype machines leaked plaintext via RF emissions. This led to the TEMPEST program and the Cold War-era effort to both protect U.S. equipment and exploit adversary emissions.

---

## Key Standards Documents

### NSTISSAM TEMPEST/1-92
**National Security Telecommunications and Information Systems Security Advisory Memorandum**  
*Full title: "Compromising Emanations Laboratory Test Requirements, Electromagnetics"*

- **Published:** 1992, NSA  
- **Classification:** Originally SECRET; partially declassified portions available publicly  
- **Scope:** Defines laboratory test requirements for measuring and evaluating electromagnetic emanations from equipment  
- **Key sections:**
  - Section 6–12: Test chamber specifications, measurement procedures, limits  
  - Requires a shielded test chamber where internal ambient signals fall below applicable TEMPEST limits  
  - Defines measurement distances, frequency ranges, and pass/fail criteria  
- **Current status:** Superseded by NSTISSAM TEMPEST/2-95 and later classified updates, but 1-92 partial text is publicly referenced in DFARS 252.239-7000

### NSTISSAM TEMPEST/2-95
*"Red/Black Installation Guidance"*  
- Covers physical installation separation between classified (RED) and unclassified (BLACK) signal paths  
- Defines minimum separation distances for cables, equipment, and facilities  
- Still referenced in government facility design specifications

### NATO SDIP-27 (formerly AMSG 720B)
**NATO Side-Channel Intelligence Program**  
Three levels of protection based on threat environment:

| Level | Designation | Threat Environment | Typical Use |
|-------|------------|-------------------|-------------|
| **Level A** | NATO Zone 0 | Attacker within 1 meter | Embassies, forward operating bases |
| **Level B** | NATO Zone 1 | Attacker within facility perimeter | NATO HQs, command centers |
| **Level C** | NATO Zone 2 | Attacker outside building | Standard military installations |

Zone 0 has the strictest emissions limits; zone 2 the most relaxed. Equipment must be tested and certified to the appropriate level before deployment in a given zone.

### CNSS Policy No. 7 (CNSSP-7)
*Classified U.S. policy governing TEMPEST countermeasures for national security systems.*  
Not publicly available, but its existence and general scope are unclassified.

### NIST SP 800-53 (Security Controls)
- Control **PE-19** (Information Leakage) requires organizations to protect information systems from electromagnetic signals that could be intercepted  
- Referenced in FedRAMP and DoD cloud certifications  
- Requires periodic TEMPEST testing for high-impact systems

---

## Zone Classification System

The NATO/NSA zone system classifies the security perimeter based on assumed attacker proximity:

```
┌─────────────────────────────────────────────┐
│  ZONE 0 (1 m radius)                        │
│  ┌──────────────────────────────────────┐   │
│  │  ZONE 1 (building perimeter)         │   │
│  │  ┌───────────────────────────────┐   │   │
│  │  │  ZONE 2 (facility grounds)    │   │   │
│  │  │  [Equipment]                  │   │   │
│  │  └───────────────────────────────┘   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

- A device certified to Zone 0 emits so little it cannot be exploited at 1 m distance  
- Zone 2 certified devices are safe when attackers are kept outside the building grounds  
- Certification is equipment-specific; the zone label travels with the device

---

## Commercial & Industry Standards

### FCC Part 15 (USA)
- Governs unintentional radio frequency emissions from consumer electronics  
- Sets emission limits but **not** designed to prevent intelligence exploitation — only to limit interference  
- Class A (commercial/industrial) has looser limits than Class B (residential)  
- **Not sufficient** for TEMPEST security — FCC Part 15 compliance ≠ TEMPEST protection

### CISPR 22 / CISPR 32 (International)
- IEC/CENELEC standards for emissions from information technology equipment  
- Harmonized with FCC Part 15 for international trade  
- Like FCC Part 15: interference control only, not intelligence protection

### IEC 61000 Series (EMC)
- Comprehensive electromagnetic compatibility standards  
- IEC 61000-4-x: Immunity tests (ESD, fast transients, surges)  
- IEC 61000-5-x: Installation and mitigation guidelines including shielding  
- Relevant for understanding shielding effectiveness in EM-SCA countermeasures

### ISO/IEC 17825:2016
*"Testing methods for the mitigation of non-invasive attack classes against cryptographic modules"*  
- Defines test setup and methodology for side-channel analysis (power, EM, timing)  
- Required by many commercial hardware security certifications  
- Complements FIPS 140-3 for side-channel evaluation

---

## FIPS 140-3 and EM Emissions

**FIPS 140-3** (Federal Information Processing Standard Publication 140-3, effective 2019, mandatory by 2026 replacing FIPS 140-2) has specific requirements for EM-SCA resistance:

| Security Level | EM/SCA Requirements |
|---------------|-------------------|
| **Level 1** | No specific EM requirements |
| **Level 2** | Must demonstrate resistance to basic SCA (no key recovery in 1M traces) |
| **Level 3** | Evidence of SCA countermeasures; environmental failure protection |
| **Level 4** | Complete physical security; active EM attack detection required |

**Key testing requirement (Levels 2–4):** No cryptographic key should be recoverable from power or EM measurements within a statistically reasonable number of traces. Labs (Riscure, BrightSight, ATSEC, etc.) perform this testing as part of CMVP (Cryptographic Module Validation Program) validation.

See also: [Professional EM-SCA Facility](professional-em-sca-facility.md) §3.1 for full FIPS 140-3 test methodology.

---

## TEMPEST in Practice: Attack Distances & Shielding Requirements

Based on declassified NSTISSAM TEMPEST/1-92 public portions and published research:

| Scenario | Attack Distance | Equipment Required | Countermeasure |
|----------|----------------|-------------------|---------------|
| Near-field EM-SCA | 1–10 cm | Near-field probe + SDR | IC-level shielding, zone 0 |
| Far-field (Van Eck) | 1–10 m | Directional antenna + receiver | Zone 1 shielding, RF-absorbing paint |
| HDMI/display leakage | 1–30 m | SDR + dipole antenna | Optical fiber output, display shielding |
| Power line coupling | Within building | Current probe on mains | Power line filters, isolation transformers |
| Long-range (classified) | >100 m | High-gain directional systems | Full zone 2/anechoic shielding |

---

## TEMPEST vs. EM-SCA: Relationship

TEMPEST and EM-SCA are closely related but have different historical origins and threat models:

| Aspect | TEMPEST | EM-SCA |
|--------|---------|--------|
| Origin | NSA/Cold War intelligence | Academic cryptanalysis (1990s) |
| Primary goal | Eavesdrop on data/display | Extract cryptographic keys |
| Target | Any electronic equipment | Cryptographic hardware specifically |
| Attack distance | Near and far field | Primarily near-field |
| Attacker | Nation-state, well-resourced | Funded researcher to nation-state |
| Standards | NSTISSAM, NATO SDIP-27 | ISO/IEC 17825, FIPS 140-3 |
| Defense overlap | High — shielding works for both | High |

In modern usage, "TEMPEST testing" and "EM-SCA testing" are often performed by the same labs using overlapping equipment. The [Professional Facility guide](professional-em-sca-facility.md) covers equipment suitable for both.

---

## Practical Shielding Standards (from NSTISSAM)

The NSTISSAM framework defines shielding in terms of attenuation at specific frequencies:

| Zone | Required Attenuation | Typical Implementation |
|------|---------------------|----------------------|
| Zone 0 | 100+ dB (1 MHz–10 GHz) | Full anechoic chamber, copper-welded room |
| Zone 1 | 80–100 dB | Double-wall shielded room, RF-gasketed doors |
| Zone 2 | 60–80 dB | Single-wall shielded enclosure, commercial Faraday cage |
| Commercial (non-TEMPEST) | 40–60 dB | PCB-level copper shielding, conductive enclosures |

For material attenuation values by layer type, see: [Practical Guide](electromagnetic-side-channel-practical-guide.md) §4.1.

---

## Key Resources

- **DFARS 252.239-7000** — U.S. DoD acquisition regulation referencing NSTISSAM TEMPEST/1-92 (publicly available)  
- **NSA/CSS EPL (Evaluated Products List)** — Lists TEMPEST-approved equipment  
- **NIST SP 800-53 PE-19** — Information leakage control requirement  
- **NATO SDIP-27** — Zone classification (partially public through NATO documentation)  
- Academic: Ramsay & Lohuis (2021) AES-256 key recovery via far-field EM at several meters (cited in [academic overview](electromagnetic-side-channel-analysis.md) §5.1)

---

*This page was created to consolidate the TEMPEST standards information referenced across multiple wiki files. For EM-SCA attack implementation see [electromagnetic-side-channel-practical-guide.md](electromagnetic-side-channel-practical-guide.md). For professional facility design see [professional-em-sca-facility.md](professional-em-sca-facility.md).*
