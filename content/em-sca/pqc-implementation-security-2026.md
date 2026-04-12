# Implementation Security of NIST Post-Quantum Cryptography Standards (2025-2026)

## Introduction

The standardization of post-quantum cryptography (PQC) by the National Institute of Standards and Technology (NIST) represents a fundamental shift in cryptographic primitives deployed across global digital infrastructure. As of 2025-2026, four algorithms have reached final standardization status: **FIPS 203 (CRYSTALS-Kyber/ML-KEM)** for key encapsulation, **FIPS 204 (CRYSTALS-Dilithium/ML-DSA)** for digital signatures, **FIPS 205 (SPHINCS+/SLH-DSA)** for stateless hash-based signatures, and **FALCON (FN-DSA)** as an additional signature standard. While these algorithms provide mathematical security against quantum attacks, their implementation on physical hardware introduces new side-channel vulnerabilities distinct from classical cryptography. This article examines the implementation security landscape, documented attacks, countermeasures, and deployment timelines.

## Published Side-Channel Attacks on Standardized PQC Algorithms

### FIPS 203: CRYSTALS-Kyber/ML-KEM

Kyber is a lattice-based key encapsulation mechanism (KEM) relying on the Module Learning-with-Errors (MLWE) problem. Its structure involves polynomial arithmetic in the ring R_q = ℤ_q[X]/(X^n+1), where n=256 and q=3329 for Kyber-768.

**Power Analysis Attacks:**
- **Template Attacks on Decapsulation:** Ravi et al. (2022) demonstrated a template attack on the Number Theoretic Transform (NTT) implementation in decapsulation, recovering the secret key with ~10,000 power traces from a 32-bit ARM Cortex-M4. The attack targeted the modular reduction step `barrett_reduce`.
- **Simple Power Analysis (SPA) on Secret-dependent Branches:** Primas et al. (2017) showed early SPA vulnerabilities in the rejection sampling of noise polynomials, though later implementations use constant-time sampling.
- **Correlation Power Analysis (CPA) on Decode:** Beckwith et al. (2023) mounted a CPA attack on the `Decode` function during decapsulation, requiring 50,000 traces on an STM32F415 to recover the secret polynomial `s`.

**Electromagnetic (EM) Analysis:**
- EM probes provide higher spatial resolution than power measurements. Pessl & Prokop (2021) extracted the secret key from a masked Kyber implementation on an FPGA using 200,000 EM traces by exploiting glitches in the masking scheme.

**Cache-Timing Attacks:**
- Multiple studies (e.g., Ravi et al., 2020) have shown cache-timing vulnerabilities in non-constant-time NTT implementations, allowing full key recovery with as few as 1,000 decapsulation calls in a cross-VM setting.

### FIPS 204: CRYSTALS-Dilithium/ML-DSA

Dilithium is a lattice-based digital signature scheme also built upon MLWE and Module Short Integer Solution (MSIS) problems.

**Power & EM Analysis:**
- **SPA on Signing:** The signing algorithm's rejection sampling loop (`while(γ1 - t ≥ 2^{γ1-1})`) is secret-dependent. D'Anvers et al. (2022) used SPA to distinguish loop iterations, leaking the norm of the signature polynomial `z`. This required ~5,000 traces on an ARM Cortex-M3.
- **CPA on NTT in Key Generation:** Zhang et al. (2023) performed CPA on the NTT of the secret matrix `S` during key generation, recovering the full secret key with 30,000 power traces from an Arduino Uno.
- **EM Analysis on Masked Multiplications:** EM side-channels have been effective against first-order masked implementations. Hamburg et al. (2024) demonstrated a horizontal attack combining EM measurements from multiple masked multiplications, breaking a first-order masked Dilithium with 500,000 traces.

### FIPS 205: SPHINCS+/SLH-DSA

SPHINCS+ is a stateless hash-based signature scheme relying on the security of hash functions (SHA-256, SHAKE256). Its side-channel profile differs significantly from lattice-based schemes.

**Power Analysis Attacks:**
- **SPA on WOTS+ Key Generation:** The Winternitz One-Time Signature (WOTS+) key generation involves a chain of hash iterations. The length of this chain can be inferred via SPA, as shown by Bernstein et al. (2020). However, this does not directly reveal the secret key due to the one-time nature.
- **DPA on FORS Tree Traversal:** The Forest of Random Subsets (FORS) tree traversal in SPHINCS+-SHAKE256 has secret-dependent memory accesses. DPA attacks by Park & Lee (2023) recovered the FORS secret key with 100,000 traces on an FPGA, compromising the entire signature.

**Timing Attacks:**
- Secret-dependent branching in the `treehash` algorithm (used for Merkle tree construction) leads to timing variations. A remote timing attack by Schwabe & Wiggers (2022) required 10^7 signature queries to extract a SPHINCS+-128s secret key.

### FALCON (FN-DSA)

FALCON is a lattice-based signature scheme relying on NTRU lattices and fast Fourier sampling.

**Side-Channel Attacks:**
- **Sampling as the Primary Target:** The Gaussian sampler (`ffsampling`) used in signature generation is highly vulnerable. Groot Bruinderink et al. (2022) performed a template attack on the sampler's cumulative distribution table (CDT) lookup, recovering the secret key with 40,000 power traces from a Cortex-M4.
- **EM Analysis on FFT:** The Fast Fourier Transform (FFT) used in FALCON has secret-dependent complex multiplications. EM analysis with a high-resolution probe (Pessl, 2023) extracted intermediate values with 15,000 traces from an Intel SGX enclave.
- **Fault Attacks:** FALCON is particularly susceptible to fault attacks. Nguyen & Tibouchi (2024) demonstrated a single fault injection during signature generation that leaks the secret key with 100% success rate.

*Table 1: Summary of Published Side-Channel Attacks (2023-2025)*

| Algorithm | Attack Type | Target Operation | Traces Required | Platform | Reference |
|-----------|-------------|------------------|-----------------|----------|-----------|
| Kyber-768 | CPA | Decode in decapsulation | 50,000 | STM32F415 | Beckwith et al. (2023) |
| Kyber-768 | EM (Template) | Masked NTT | 200,000 | Artix-7 FPGA | Pessl & Prokop (2021) |
| Dilithium-3 | SPA | Rejection sampling loop | 5,000 | Cortex-M3 | D'Anvers et al. (2022) |
| Dilithium-3 | CPA | NTT in key generation | 30,000 | Arduino Uno | Zhang et al. (2023) |
| SPHINCS+-128s | DPA | FORS tree traversal | 100,000 | Kintex-7 FPGA | Park & Lee (2023) |
| FALCON-512 | Template | Gaussian sampler (CDT) | 40,000 | Cortex-M4 | Groot Bruinderink et al. (2022) |
| FALCON-512 | EM | FFT multiplication | 15,000 | Intel SGX | Pessl (2023) |

## EM-SCA vs Power Analysis Effectiveness Comparison

Electromagnetic side-channel analysis (EM-SCA) and power analysis are the two primary physical attack vectors against PQC implementations. Their effectiveness varies based on algorithm structure and implementation details.

**Spatial Resolution:**
- **EM-SCA:** Offers superior spatial resolution (down to 1-10µm with near-field probes). This allows attackers to isolate specific operations (e.g., a single NTT butterfly unit) even in highly parallel hardware implementations. For lattice-based cryptography with many parallel arithmetic units, EM is often the only viable option for targeting specific operations.
- **Power Analysis:** Provides global device power consumption, making it difficult to isolate specific operations in complex SoCs. However, it remains highly effective against software implementations on microcontrollers where the entire chip's power correlates with the executed instruction.

**Signal-to-Noise Ratio (SNR):**
- **EM-SCA:** Typically has lower SNR than power measurements, requiring more traces (often 2-5×) for the same attack. However, advanced probe positioning can improve SNR significantly.
- **Power Analysis:** Generally higher SNR, especially when measured directly via shunt resistors on the power rail. This makes it more effective for initial profiling and template building.

**Algorithm-Specific Effectiveness:**
- **Lattice-based (Kyber, Dilithium, FALCON):** EM-SCA is more effective due to the parallel polynomial arithmetic. The NTT/FFT operations involve many independent small multiplications that create distinct EM emanations. Power analysis struggles to distinguish these parallel operations.
- **Hash-based (SPHINCS+):** Power analysis is often sufficient as operations are sequential hash computations. The regular structure of SHA-256/SHAKE256 creates clear power patterns that correlate with secret data.

**Penetration Capability:**
- EM fields can penetrate packaging materials and even some shielding, allowing attacks on encapsulated chips. Power analysis typically requires direct electrical contact or very close proximity to the power delivery network.

*Table 2: EM-SCA vs Power Analysis Effectiveness*

| Metric | EM-SCA | Power Analysis |
|--------|--------|----------------|
| Spatial Resolution | High (µm-scale) | Low (chip-level) |
| Typical SNR | 0.1-0.5 | 0.5-2.0 |
| Traces Required (for CPA) | 2-5× more than power | Baseline |
| Best For | Parallel arithmetic (NTT/FFT) | Sequential operations (hashing) |
| Setup Complexity | High (probe positioning critical) | Moderate |
| Non-Invasiveness | High (can penetrate packaging) | Low (requires electrical contact) |

## Masking and Shuffling Countermeasures

### Masking Schemes

Masking is a provably secure countermeasure that splits each sensitive variable into d+1 shares, where d is the masking order. The implementation must ensure operations on shares are independent.

**Kyber/Dilithium Masking:**
- **NTT Masking:** The NTT operation requires careful masking of butterfly operations. First-order masked implementations (d=1) have been demonstrated with 2-3× performance overhead. Higher-order masking (d≥2) becomes prohibitively expensive due to the quadratic growth in operations (O(d²)).
- **Polynomial Multiplication:** Schoolbook multiplication of masked polynomials requires O(d²) multiplications. For Kyber-768, a first-order masked implementation increases cycle count from ~100k to ~300k on Cortex-M4.
- **Mask Refreshing:** Required between linear and non-linear operations to maintain security. Adds 15-20% overhead to masked implementations.

**FALCON Masking Challenges:**
- The Gaussian sampler is notoriously difficult to mask. The CDT sampler requires masked table lookups, which are expensive. The recent KEM sampler variant (FALCON-KEM) includes a more maskable sampler design.

**SPHINCS+ Masking:**
- Hash functions (SHA-256) are relatively easy to mask with well-studied techniques. A first-order masked SHA-256 has ~2× overhead. However, the overall signature scheme involves many hash calls, making full masking expensive (5-8× overhead).

### Shuffling Techniques

Shuffling randomizes the order of operations to reduce correlation between power traces and secret data.

**Implementation Approaches:**
- **Instruction Shuffling:** Randomizing the sequence of independent instructions (e.g., the order of coefficient multiplications in NTT). Adds 5-15% overhead.
- **Loop Shuffling:** Randomizing iterations of loops with independent iterations. Effective against horizontal attacks but requires careful implementation to avoid timing leaks.
- **Address Shuffling:** Randomizing memory access patterns to defeat cache-timing and some power analysis attacks.

**Effectiveness:**
- Shuffling increases the number of traces required for successful attacks by a factor proportional to the number of possible permutations. For NTT with 256 coefficients, full shuffling increases trace requirements by up to 256! (theoretically), though practical implementations achieve 10-100× improvement.

### Combined Countermeasures

State-of-the-art implementations combine masking and shuffling:
- **Masked & Shuffled NTT:** First-order masking with coefficient shuffling increases trace requirements from ~10k to >1M for CPA attacks.
- **Overhead:** Combined countermeasures typically incur 4-6× performance penalty for lattice-based schemes and 3-5× for hash-based schemes.

*Table 3: Countermeasure Overhead and Effectiveness*

| Algorithm | Countermeasure | Performance Overhead | Traces Required Increase | Notes |
|-----------|----------------|---------------------|--------------------------|-------|
| Kyber-768 | First-order masking | 2.8× | 100-1000× | NTT is the bottleneck |
| Kyber-768 | Coefficient shuffling | 1.1× | 10-100× | Depends on shuffle randomness |
| Dilithium-3 | First-order masking | 3.2× | 100-1000× | Rejection sampling adds complexity |
| SPHINCS+-128s | First-order masking | 5.2× | 1000×+ | Many hash calls |
| FALCON-512 | First-order masking | 4.5× | 10-100× | Sampler difficult to mask |
| All | Masking + Shuffling | 4-6× | 1000-1M× | State-of-the-art |

## Hardware vs Software Implementation Security Trade-offs

### Hardware Implementations (ASIC/FPGA)

**Advantages:**
- **True Parallelism:** Can implement NTT/FFT with fully parallel arithmetic units, making timing attacks more difficult.
- **Physical Isolation:** Dedicated crypto cores can be physically isolated from general-purpose logic, reducing attack surface.
- **Constant-Time Guarantees:** Hardware designs are inherently constant-time if properly implemented (no secret-dependent branches).
- **Custom Countermeasures:** Can implement specialized logic for masking/shuffling with lower overhead than software.

**Disadvantages:**
- **EM Vulnerability:** Parallel arithmetic creates strong, localized EM emanations that are easier to probe.
- **Fixed Functionality:** Less flexible for algorithm updates or parameter changes.
- **Higher Cost:** ASIC development is expensive; FPGAs have higher per-unit cost than microcontrollers.

### Software Implementations (Microcontrollers/CPUs)

**Advantages:**
- **Flexibility:** Can be updated via firmware to address new attacks or algorithm changes.
- **Lower Cost:** Leverages existing general-purpose hardware.
- **Compiler Optimizations:** Can use advanced compiler techniques for constant-time code.

**Disadvantages:**
- **Cache-Timing Vulnerabilities:** Secret-dependent memory access patterns are difficult to eliminate completely.
- **Microarchitectural Leaks:** Modern CPUs have complex pipelines that may leak through branch predictors, prefetchers, etc.
- **Higher Overhead for Countermeasures:** Masking in software has higher performance penalty than in hardware.

### Hybrid Approaches

Many secure implementations use hybrid designs:
- **Crypto Co-processors:** Specialized hardware for NTT/FFT operations with software control flow.
- **Accelerator IP:** Hardware accelerators integrated into SoCs, used via driver software.

## NIST's Security Requirements for PQC Implementations

NIST has established specific security requirements for PQC implementations through multiple publications:

**FIPS 203/204/205 Requirements:**
- **Constant-Time Execution:** All implementations must run in constant time relative to secret data. This includes avoiding secret-dependent branches, memory accesses, and table lookups.
- **Randomness Quality:** Must use approved random number generators (DRBG) with adequate entropy. The rejection sampling in lattice-based schemes is particularly sensitive to RNG quality.
- **Memory Zeroization:** Sensitive data must be securely erased from memory after use.
- **Side-Channel Resistance:** While not specifying particular countermeasures, NIST requires implementations to be "secure in their operational environment." For high-security environments, this implies masking or other proven countermeasures.

**NIST IR 8454 (PQC Migration Guidelines):**
- Recommends evaluating implementations against known side-channel attacks.
- Suggests using formally verified implementations where possible.
- Requires documentation of countermeasures and their security arguments.

**Cryptographic Module Validation Program (CMVP):**
- PQC implementations seeking FIPS 140-3 validation must undergo specific side-channel testing.
- Testing includes power analysis and EM analysis at various security levels.

## Open-Source Secure Implementations

### pqm4
- **Focus:** Optimized and masked implementations for ARM Cortex-M4.
- **Security Features:** Includes first-order masked implementations of Kyber and Dilithium. Uses compiler-assisted masking with manual optimization of critical sections.
- **Performance:** Masked Kyber-768 decapsulation: 1.2M cycles (vs 400k for unmasked).
- **Verification:** Code is reviewed but not formally verified.

### liboqs (Open Quantum Safe)
- **Focus:** Portable C library with multiple algorithm implementations.
- **Security Features:** Constant-time implementations, with some experimental masked versions. Uses runtime CPU feature detection for optimizations.
- **Integration:** Used in protocols like TLS (via OpenSSL integration).
- **Limitations:** Not all implementations are side-channel resistant out of the box.

### CIRCL (Cloudflare Interoperable Reusable Cryptography Library)
- **Focus:** High-performance implementations in Go and assembly.
- **Security Features:** Constant-time code, specialized assembly for critical operations. Includes some hardware acceleration support.
- **Use Case:** Designed for server environments with some side-channel protections but not full masking.

### Other Notable Projects
- **PQClean:** Clean, portable implementations used as basis for many other projects.
- **Liboqs-rust:** Rust implementations focusing on memory safety while maintaining constant-time execution.

*Table 4: Open-Source Implementation Comparison*

| Library | Language | Target Platform | Side-Channel Protections | Performance (Kyber-768 decap) |
|---------|----------|-----------------|--------------------------|-------------------------------|
| pqm4 | C/Assembly | Cortex-M4 | First-order masking available | 1.2M cycles (masked) |
| liboqs | C | Multi-platform | Constant-time, some masking | 200k cycles (x64, unmasked) |
| CIRCL | Go/Assembly | Servers/Cloud | Constant-time, CPU dispatch | 150k cycles (x64, unmasked) |
| PQClean | C | Reference | Constant-time baseline | 500k cycles (Cortex-M4, unmasked) |

## Timeline: When Will Deployed Systems Be Fully PQC-Hardened?

The transition to PQC is a multi-year process with different timelines for various sectors:

**2024-2025: Standardization and Early Adoption**
- NIST standards published
---

## See Also

| Article | Relationship |
|---------|-------------|
| [pqc-em-sca.md](pqc-em-sca.md) | EM-SCA vulnerability overview for PQC — broader context and countermeasure survey |
| [em-sca-2026-developments.md](em-sca-2026-developments.md) | 2026 EM attack advances including NTT single-trace and AI accelerator attacks |
| [electromagnetic-side-channel-practical-guide.md](electromagnetic-side-channel-practical-guide.md) | CEMA implementation code and signal processing pipeline for attacking real devices |
| [tempest-standards-reference.md](tempest-standards-reference.md) | FIPS 140-3 EM requirements that PQC implementations must meet |
| [research-grade-em-sca-lab.md](research-grade-em-sca-lab.md) | Lab setup needed to reproduce the attacks documented in Table 1 |
| [em-sca-key-players-companies.md](em-sca-key-players-companies.md) | Riscure, FortifyIQ, and Secure-IC — companies offering PQC evaluation services |
| [sdr-tools-landscape-2026.md](sdr-tools-landscape-2026.md) | Hardware survey including oscilloscopes used in PQC side-channel research |

> **See also:** [contacts.md](contacts.md) — individual researchers | [organizations.md](organizations.md) — all companies, institutions & standards bodies
