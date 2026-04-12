# Post-Quantum Cryptography & Electromagnetic Side-Channel Analysis

*Last Updated: April 12, 2026*

**Wiki navigation:** [Index](em-sca-index.md) · [EM-SCA Academic Overview](electromagnetic-side-channel-analysis.md) · [Practical Guide](electromagnetic-side-channel-practical-guide.md) · [TEMPEST Standards](tempest-standards-reference.md) · [Market Analysis](em-sca-market-analysis-overview.md) · [Key Players](em-sca-key-players-companies.md) · [SIGINT Academic Research](sigint-academic-research-overview.md) · [Entry-Level Setup](entry-level-em-sca-setup.md) · [Research-Grade Lab](research-grade-em-sca-lab.md) · [Professional Facility](professional-em-sca-facility.md)

## Overview

The NIST post-quantum cryptography (PQC) standardization process concluded in 2024, selecting four algorithms for standardization. However, unlike traditional cryptographic algorithms designed with side-channel resistance as an afterthought, PQC algorithms introduce **new EM leakage characteristics** due to their mathematical operations (polynomial arithmetic, lattice operations, Gaussian sampling). This is an active and urgent research area because PQC is being deployed now — before its side-channel resistance is fully understood.

---

## NIST PQC Standardized Algorithms (2024)

| Algorithm | Type | Standard | Primary Use | EM-SCA Status |
|-----------|------|----------|------------|---------------|
| **CRYSTALS-Kyber** (ML-KEM) | Key Encapsulation | FIPS 203 | Key exchange | **Vulnerable** — multiple published attacks |
| **CRYSTALS-Dilithium** (ML-DSA) | Digital Signature | FIPS 204 | Signatures | **Vulnerable** — lattice leakage demonstrated |
| **SPHINCS+** (SLH-DSA) | Digital Signature | FIPS 205 | Signatures | **Lower risk** — hash-based, simpler leakage profile |
| **FALCON** (FN-DSA) | Digital Signature | FIPS 206 | Signatures | **High risk** — Gaussian sampling is extremely leaky |

---

## CRYSTALS-Kyber (ML-KEM): EM Attack Landscape

Kyber is the sole NIST-standardized KEM (Key Encapsulation Mechanism) and is already being deployed in TLS 1.3, SSH, and hardware security modules. It has received the most side-channel research attention.

### Attack Vectors

#### 1. Number Theoretic Transform (NTT) Leakage
- Kyber's core operation is polynomial multiplication via NTT (similar to FFT)
- NTT operations produce **data-dependent switching activity** directly proportional to coefficient values
- EM leakage from NTT correlates with intermediate polynomial coefficients, leaking the secret key

#### 2. Message Decoding Leakage
- The decapsulation routine compares a recomputed ciphertext with the received one
- This comparison leaks timing and EM information about the secret key bits
- Power/EM traces show distinguishable patterns for 0-bit vs. 1-bit decoding decisions

#### 3. Gaussian/Centered Binomial Sampling Leakage
- Kyber uses centered binomial distribution (CBD) for noise generation
- CBD sampling involves conditional operations that create EM-distinguishable patterns
- This is the same vulnerability vector as FALCON's Gaussian sampler, but milder

### Published Attacks (2023–2026)

**Hardware Implementation Attacks:**
- *Springer JCEN (2025)*: "A side-channel attack on a masked hardware implementation of CRYSTALS-Kyber" — demonstrated key recovery against first-order masked implementations using combined power/EM analysis. Required ~50,000 traces.
- *ASIACCS 2023*: First EM attack on hardware Kyber, recovered full secret key with ~10,000 traces on unprotected implementation.

**Software Implementation Attacks:**
- *MDPI Cryptography (2024)*: Analyzed Kyber vulnerabilities, identified CBD sampling and polynomial multiplication as primary EM leakage sources.
- *IEEE Xplore (2026)*: "Revisiting the Masking Strategy" — demonstrated attack on first-order masked Kyber by exploiting higher-order leakage from NTT operations.

**Novel Framework:**
- *ScienceDirect (2026)*: PSESV (Physically-Sensed Error Signature Verification) — hybrid framework combining real-time thermal and EM monitoring for both attack detection and side-channel-resistant Kyber implementation.

### Attack Complexity vs. Traditional AES

| Algorithm | Unprotected (traces) | 1st-order masked (traces) | 2nd-order masked |
|-----------|---------------------|--------------------------|-----------------|
| AES-128 (SW) | ~1,000 | ~50,000 | ~5,000,000+ |
| AES-256 (HW) | ~10,000 | ~100,000+ | Very difficult |
| Kyber-512 (HW) | ~10,000 | ~50,000–200,000 | Research ongoing |
| Kyber-768 (HW) | ~15,000 | ~100,000+ | Research ongoing |

Kyber's attack complexity is **comparable to AES at the same protection level** — meaning it is not intrinsically more resistant to EM-SCA than traditional crypto.

---

## CRYSTALS-Dilithium (ML-DSA): EM Attack Landscape

Dilithium is a lattice-based signature scheme (CRYSTALS family, same as Kyber). Its signing algorithm leaks differently than Kyber.

### Key Leakage Point: Rejection Sampling
- Dilithium's signing loop performs **rejection sampling**: it generates candidate values and discards them if they exceed a threshold
- The number of rejected samples (and the sample values themselves) leaks information about the signing key
- EM timing and amplitude analysis can detect rejection events, enabling lattice reduction attacks
- This is analogous to the nonce reuse vulnerability in ECDSA, but harder to exploit

### Published Work
- *IACR ePrint 2025/1754*: "Machine Learning and Side-Channel Attacks on Post-Quantum Cryptography" — systematic study of DL-based attacks on Kyber, Dilithium, and SPHINCS+. Demonstrated that ML significantly reduces trace requirements for all three algorithms.

---

## FALCON (FN-DSA): Highest EM-SCA Risk

FALCON uses **discrete Gaussian sampling** — generating random values from a Gaussian distribution. This operation is inherently variable in execution time and power, making it the most EM-leaky of the NIST PQC algorithms.

### Why FALCON is Especially Vulnerable
1. **Variable loop iterations**: Gaussian sampling uses rejection sampling with variable number of iterations
2. **Branch-dependent operations**: Conditional acceptance/rejection creates EM-distinguishable traces
3. **Floating-point arithmetic**: FALCON uses floating-point NTT, which leaks differently than integer NTT (Kyber/Dilithium)
4. **Fast Fourier Sampling**: The core signing operation involves a tree structure that produces highly structured, recoverable EM patterns

### Current Status
- FALCON hardware implementations without countermeasures are considered **straightforwardly attackable** by any researcher with [research-grade EM-SCA equipment](research-grade-em-sca-lab.md) (HackRF + Langer probes)
- Several labs have demonstrated full signing key recovery; research into countermeasures is active but no fully side-channel-resistant FALCON implementation has been standardized

---

## SPHINCS+ (SLH-DSA): Lower Risk Profile

SPHINCS+ is a hash-based signature scheme. Its side-channel profile is more similar to SHA-2/SHA-3 than to lattice operations.

### Why It's More Resistant
- Hash function evaluations produce relatively uniform EM profiles (constant-time implementations are straightforward)
- No polynomial arithmetic or Gaussian sampling
- The "few times" signing property (stateless, no reuse vulnerabilities) eliminates certain attack classes

### Remaining Risks
- EM leakage from the Winternitz OTS (one-time signature) chains can still reveal key material
- Large signature size makes it impractical for constrained IoT devices where EM-SCA risk is highest

---

## Countermeasures for PQC Implementations

### 1. Masking (Most Deployed)
Split secret polynomial coefficients into multiple shares. An attacker must exploit all shares simultaneously (higher-order attack), exponentially increasing trace requirements.

- **1st-order masking**: ~10× increase in required traces
- **2nd-order masking**: ~1,000× increase
- **Challenge**: Masking of NTT is costly — 3–5× performance overhead; masking of Gaussian sampling (FALCON) is exceptionally complex

### 2. Multiplicative Masking (Novel, 2025)
*Telecom Paris / HAL research (2025)*: Proposed multiplicative masking as a countermeasure specifically for Kyber — previously overlooked because additive masking was standard. Multiplicative masking provides better protection for polynomial coefficient operations.

### 3. PSESV Framework (2026)
*ScienceDirect (2026)*: Physically-Sensed Error Signature Verification — combines:
- Real-time EM monitoring as a detection layer
- Side-channel-resistant implementation as the defense layer
- Error signature verification to detect tampering

Claims to provide dual-layer protection: both resistance to SCA and active detection of ongoing attacks.

### 4. Algorithmic Countermeasures
- **Shuffling**: Randomize operation order in NTT butterfly stages
- **Noise injection**: Add fake operations to obscure real ones
- **Constant-time CBD sampling**: Remove data-dependent branches in noise generation

### 5. Hardware Countermeasures
- Dedicated co-processors with built-in masking (e.g., ARM TrustZone, RISC-V with security extensions)
- Shielding at IC package level (same as for AES — see [Practical Guide §4](electromagnetic-side-channel-practical-guide.md))
- Active monitoring circuits (see [Practical Guide §4.3](electromagnetic-side-channel-practical-guide.md))

---

## Implications for EM-SCA Practitioners

### Testing PQC Implementations
The same equipment used for AES EM-SCA is applicable to PQC:
- Entry-level RTL-SDR + DIY probes: sufficient for unprotected Kyber/Dilithium
- HackRF + Langer probes: sufficient for first-order masked implementations
- Professional USRP + calibrated probes: required for second-order masked implementations

See [Equipment Tier Guide](em-sca-index.md) for equipment selection.

### Key Differences from AES Analysis
1. **Longer operations**: PQC signing/encapsulation involves more operations than one AES block → longer traces, larger files
2. **Different frequency profile**: Lattice operations may have different dominant frequencies than AES S-box operations — calibration required
3. **Algorithm-specific leakage models**: The Hamming weight model used for AES must be adapted (lattice coefficient values, CBD distribution shapes)
4. **NTT alignment challenges**: NTT operations are iterative; trace alignment requires detecting the NTT butterfly structure

### Testing Checklist for PQC Devices
- [ ] Identify PQC algorithm(s) implemented (Kyber, Dilithium, FALCON, SPHINCS+)
- [ ] Determine implementation type: software, hardware, or hybrid
- [ ] Check for masking: unprotected, 1st-order, 2nd-order
- [ ] Measure leakage during: key generation, encapsulation/signing, decapsulation/verification
- [ ] Apply leakage models specific to NTT operations
- [ ] Test for rejection sampling timing leakage (Dilithium, FALCON)
- [ ] Verify constant-time implementation of CBD/Gaussian sampling

---

## Regulatory & Certification Implications

### FIPS 203/204/205/206 and Side-Channel
The NIST PQC FIPs standards specify the algorithms but **do not yet include SCA resistance requirements**. This is expected to be addressed in future revisions and in the CMVP (Cryptographic Module Validation Program) testing requirements. As of 2026:

- FIPS 140-3 testing labs are beginning to develop PQC-specific SCA test vectors
- No certified PQC hardware module with formal SCA resistance validation exists yet
- The field is in the same state as AES SCA testing was in ~2000: known vulnerabilities, no standardized test methodology

### Market Opportunity
The gap between PQC deployment and PQC SCA resistance validation represents a significant market opportunity for testing labs and tool providers (see [Market Analysis](em-sca-market-analysis-overview.md) §Growth Catalysts and [Key Players](em-sca-key-players-companies.md) §FortifyIQ).

---

## Further Reading

### Key Papers
1. *IACR ePrint 2025/1754* — "Machine Learning and Side-Channel Attacks on Post-Quantum Cryptography" — systematic ML-based attacks on NIST PQC algorithms
2. *Springer JCEN (2025)* — "A side-channel attack on a masked hardware implementation of CRYSTALS-Kyber"  
3. *IEEE Xplore (2026)* — "Revisiting the Masking Strategy: A Side-Channel Attack on CRYSTALS-Kyber"  
4. *MDPI Cryptography 8(2) (2024)* — "Investigating CRYSTALS-Kyber Vulnerabilities: Attack Analysis and Mitigation"  
5. *HAL/Telecom Paris (2025)* — "Side-channel Analysis of CRYSTALS-Kyber and A Novel Low-Overhead Countermeasure"  
6. *ScienceDirect (2026)* — "PSESV: A hybrid post-quantum encryption framework with real-time thermal and EM side-channel attack detection"

### Standards
- FIPS 203 (ML-KEM / Kyber), FIPS 204 (ML-DSA / Dilithium), FIPS 205 (SLH-DSA / SPHINCS+), FIPS 206 (FN-DSA / FALCON)
- NIST IR 8413: Status report on the third round of PQC standardization

---

*Created to fill the gap identified across the EM-SCA wiki: post-quantum cryptography is mentioned as a future direction in several files but had no dedicated analysis page. This page synthesizes 2024–2026 research gathered via Brave API search.*

---

## Related: Implementation Attack Details

> **See [pqc-implementation-security-2026.md](pqc-implementation-security-2026.md)** for a deep technical breakdown of published attacks on all four NIST standards — Kyber/ML-KEM, Dilithium/ML-DSA, SPHINCS+/SLH-DSA, and FALCON/FN-DSA — with trace counts, platforms, and open-source mitigation libraries (pqm4, liboqs, CIRCL).
>
> **See [em-sca-2026-developments.md](em-sca-2026-developments.md)** for 2026 EM attack advances including NTT single-trace attacks, AI accelerator model extraction, and hybrid SCA+fault injection techniques.
