# Software-Defined Radio (SDR) Tools Landscape for SIGINT and EM Research (2025-2026)

## Introduction

The software-defined radio (SDR) ecosystem for signals intelligence (SIGINT) and electromagnetic (EM) research has matured significantly by 2025-2026. Driven by advancements in RF semiconductor technology, open-source software, and the integration of artificial intelligence, modern SDR platforms offer unprecedented accessibility, performance, and analytical capability. This article provides a comprehensive, technical survey of the hardware, software, and methodologies defining the field, focusing on tools relevant to security research, side-channel analysis, and spectrum monitoring.

## Hardware Survey

The hardware landscape is stratified by performance, frequency range, and cost, catering to applications from educational experimentation to professional SIGINT collection.

### Entry-Level & Educational Devices

**RTL-SDR Blog V4**
The ubiquitous entry point, the V4, represents a significant evolution from earlier RTL2832U-based dongles.
*   **RF Frontend:** Rafael Micro R860 tuner (≈0.5 – 1766 MHz, gaps at certain ranges).
*   **ADC:** 12-bit, 20.48 MS/s (maximum usable sample rate typically 10 MS/s for stable operation).
*   **Features:** Built-in HF upconverter via Q-branch mixer (covers 500 kHz – 30 MHz), TCXO, bias-tee, SMA connector, and improved EMI shielding. Notably includes a direct sampling mode for VHF.
*   **Price:** ~$40 USD.
*   **Primary Use:** Wideband spectrum monitoring, ADS-B, AIS, DVB-T, FM/AM broadcast, and introductory TEMPEST research.

**Analog Devices ADALM-Pluto SDR (PlutoSDR)**
A portable, full-duplex transceiver built around the AD9363 RFIC.
*   **RF Frontend:** AD9363 (325 – 3800 MHz, tunable). TX output power adjustable up to +7 dBm.
*   **ADC/DAC:** 12-bit, 61.44 MS/s (max complex sample rate).
*   **Features:** ARM Cortex-A9 processor runs Linux, allowing standalone operation. MIMO expansion port. Open-source hardware and firmware.
*   **Price:** ~$250 USD.
*   **Primary Use:** Communications prototyping, radar simulation, two-way link experiments, and educational labs.

### Mid-Range/Hacker Platforms

**Great Scott Gadgets HackRF 2.0**
The long-awaited successor to the HackRF One, released in late 2024, addresses key limitations.
*   **RF Frontend:** Covers 1 MHz – 8 GHz continuously. Improved LNA and filter stages.
*   **ADC/DAC:** 16-bit, 160 MS/s (maximum sample rate). 80 MHz of instantaneous bandwidth.
*   **Features:** Full-duplex operation, 2x2 MIMO capability with a second unit, USB 3.2 SuperSpeed interface for sustained high-bandwidth streaming, and a more robust clock system.
*   **Price:** ~$600 USD.
*   **Primary Use:** Wideband spectrum analysis, vulnerability research on wireless protocols (e.g., Bluetooth, Zigbee, proprietary ISM), and SIGINT collection.

**Lime Microsystems LimeSDR 2.0**
A high-performance, FPGA-based platform emphasizing flexibility and MIMO.
*   **RF Frontend:** LMS7002M field-programmable RF (FPRF) IC (100 kHz – 3.8 GHz, 2x2 MIMO). TX power up to +10 dBm.
*   **ADC/DAC:** 12-bit, 160 MS/s. 80+ MHz of instantaneous bandwidth per channel.
*   **Features:** Altera Cyclone V FPGA for custom DSP pipelines. PCIe and USB 3.0 interfaces. 7×7 MIMO expansion capability via FMC connector.
*   **Price:** ~$900 USD.
*   **Primary Use:** Massive MIMO research, cellular network experimentation (4G/5G small cells), and advanced waveform generation/analysis.

### Professional & Research-Grade Systems

**Ettus Research/USRP X440**
A flagship device from National Instruments, designed for cutting-edge research.
*   **RF Frontend:** Covers 1 MHz – 7.2 GHz (extendable with daughterboards). 4 TX, 4 RX channels with phase coherence.
*   **ADC/DAC:** 16-bit, 500 MS/s. Up to 400 MHz of instantaneous bandwidth.
*   **Features:** Integrated Intel Agilex FPGA for real-time, sample-rate signal processing. 100GbE network interface. Supports RFNoC for deploying custom IP directly on the FPGA.
*   **Price:** Starting at ~$18,000 USD.
*   **Primary Use:** Multichannel direction-finding, radar research, spectrum monitoring systems, and high-fidelity signal capture for forensic analysis.

### Hardware Comparison Table

| Device | Approx. Price (USD) | Frequency Range | Max. Instantaneous BW | ADC Bits | Interfaces | Key Feature for Research |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RTL-SDR v4** | $40 | 500 kHz – 1766 MHz* | 10 MHz | 12-bit | USB 2.0 | Integrated HF upconverter, ultra-low cost |
| **PlutoSDR** | $250 | 325 – 3800 MHz | 20 MHz | 12-bit | USB 2.0 | Standalone Linux operation, full-duplex |
| **HackRF 2.0** | $600 | 1 MHz – 8 GHz | 80 MHz | 16-bit | USB 3.2 | 8 GHz range, full-duplex, MIMO expandable |
| **LimeSDR 2.0** | $900 | 100 kHz – 3.8 GHz | 80+ MHz | 12-bit | USB 3.0 / PCIe | FPGA-based, large MIMO arrays |
| **USRP X440** | $18,000+ | 1 MHz – 7.2 GHz+ | 400 MHz | 16-bit | 100GbE | Phase-coherent 4x4, high-BW, RFNoC FPGA |

*With upconverter; direct sampling range is more limited.

## Software Ecosystem

The software stack for SDRs has evolved beyond basic receivers into integrated analysis and reverse-engineering environments.

### Flow Graph & DSP Frameworks

**GNU Radio 3.11**
The cornerstone open-source DSP framework. Version 3.11 (released 2025) focuses on modernization and performance.
*   **Key Updates:** Native Qt6 GUI, improved asynchronous message passing, enhanced support for GPU acceleration (via CUDA and Vulkan Compute blocks), and a revamped "GRC" block repository with versioning. The `gr-ettus` and `gr-osmosdr` drivers provide hardware abstraction for most devices.
*   **Use Case:** Building custom, real-time signal processing pipelines for protocol analysis, signal generation, and research system prototyping.

### Desktop Analysers

**SDR# (SDRSharp)**
A popular, Windows-centric application known for its extensive plugin ecosystem.
*   **2025 State:** Maintained by the community, with critical updates for new hardware (HackRF 2.0 drivers). Plugins for ADS-B, DMR, TETRA, and TEMPEST visualizations remain vital.
*   **Use Case:** Interactive, user-friendly spectrum scanning and monitoring, particularly for hobbyist and introductory SIGINT work.

**GQRX**
The standard SDR receiver for Linux, built on GNU Radio and Qt.
*   **2025 State:** Stable, with improved device input abstraction and audio output options. Serves as a reliable, no-frills tool for basic signal inspection and audio demodulation across a wide range of hardware.

**SigDigger**
A cross-platform, professional-grade signal analyzer from the developer of `libbladeRF`.
*   **Features:** Real-time waterfall with persistent history, advanced demodulators (including digital like FSK), and a built-in "signal snooper" for automated capture of transient signals. Its "wideband spectrogram" view is invaluable for spotting intermittent transmissions.
*   **Use Case:** Forensic signal analysis and long-duration spectrum surveillance.

### Reverse Engineering Suites

**Universal Radio Hacker (URH) v4.0**
A critical tool for security researchers, URH has integrated deep signal analysis with protocol reverse engineering.
*   **Features:** Combines a powerful digital demodulator, a heuristic protocol analyzer that suggests encoding (NRZ, Manchester), and a simulation/attack environment for replay and fuzzing. Version 4.0 added native integration of `scapy`-like packet crafting and AI-assisted field boundary prediction.
*   **Use Case:** Decoding and attacking proprietary RF protocols (garage doors, key fobs, industrial sensors).

## AI/ML Integration

Machine learning has moved from academic proof-of-concept to integrated tooling, automating complex analytical tasks.

### Real-Time Signal Classification & AMR

*   **Architecture:** Convolutional Neural Networks (CNNs) and Vision Transformers (ViTs) trained on synthetic and captured I/Q datasets (RML2016.10a/b extensions) are now standard. Models are optimized for deployment on edge devices (Jetson, Coral TPU) or within GNU Radio using the `gr-inference` toolkit.
*   **Performance:** State-of-the-art models achieve >98% accuracy on common digital modulations (BPSK, QPSK, 16-QAM, etc.) at SNR levels as low as 0 dB in constrained scenarios. Real-time classification is feasible on a mid-range GPU for bandwidths up to 10 MHz.
*   **Integration:** Tools like **DeepSig's OmniSIG** (commercial) and the open-source **Orion AMR** library provide drop-in blocks for GNU Radio and APIs for SigDigger/UHR, enabling automated labeling of signals in wideband captures and triggering recording on signals of interest.

### Anomaly Detection & Unknown Signal Discovery

*   **Application:** Unsupervised and self-supervised learning models are deployed to identify deviations from "normal" spectrum activity. This is crucial for detecting novel emissions, intermittent beacons, or low-probability-of-intercept (LPI) waveforms that lack a known modulation fingerprint.
*   **Tooling:** The **SCATTER** (Spectral Characterization and Anomaly Tracking Tool for EM Research) open-source framework, developed by DARPA's "RFMLS" program alumni, provides a pipeline for feature extraction (cyclostationary, higher-order statistics) and clustering of unknown signals.

## TempestSDR and TEMPEST Monitoring

Research into compromising emanations (TEMPEST) has been democratized by SDRs.

*   **Hardware Requirements:** Monitoring subtle, unintentional RF emissions from electronic devices requires high dynamic range and sensitivity. The **HackRF 2.0** (16-bit ADC) and **USRP** devices are preferred. Critical accessories include:
    *   **Low-Noise Amplifiers (LNAs):** < 0.5 dB noise figure for VHF/UHF.
    *   **High-Gain Antennas:** Log-periodic, Yagi, or parabolic dishes for directional reception.
    *   **Shielded Enclosures:** Faraday cages or tents to isolate the device-under-test (DUT) from ambient RFI.
*   **Software:** The **TempestSDR** suite (forked and updated) remains the primary tool. It implements the classical "van Eck" phreaking methodology for video display unit (VDU) eavesdropping. Modern forks include support for non-standard sync frequencies and adaptive equalization filters to reconstruct signals from noisy captures.
*   **2025-2026 Threat Landscape:** Research has expanded beyond VDUs to include:
    *   **USB Data Lines:** Eavesdropping on differential data pairs (D+/D-) at GHz frequencies.
    *   **Processor Cache Activity:** Correlating specific EM spectral signatures with CPU instruction execution (a side-channel attack vector).
    *   **LED Status Indicators:** Recovering data from flickering router/switch LEDs via photonic emissions.

## ChipWhisperer Firmware 6.x

The ChipWhisperer platform, a tool for hardware security research, has seen substantial firmware and software updates.

*   **New Hardware Support:** Firmware 6.x natively supports the **ChipWhisperer Husky**, a device combining a 1 GS/s oscilloscope, a programmable power supply for glitching, and a multi-interface target port (UART, SPI, I2C, GPIO) in one unit.
*   **Advanced Analysis Features:**
    *   **Real-Time Correlation Traces:** On-the-fly computation of Pearson correlation during power trace capture, speeding up attack iteration.
    *   **Integrated EM Probe Support:** Direct interfacing with Langer and near-field EM probes, allowing synchronized capture of power and EM side-channels. The software includes templates for profiling EM "hot spots" on target ICs.
    *   **AI-Assisted Glitch Parameterization:** A machine learning model suggests initial voltage and timing parameters for voltage/clock glitching attacks based on the target microcontroller's known characteristics, reducing setup time from days to hours.
*   **Use Case:** Automated side-channel analysis (SCA) and fault injection attacks on embedded cryptographic implementations.

## Cloud-Based SDR Platforms and Remote Access

The "SDR-as-a-Service" model has gained traction for collaborative research and education.

*   **Architecture:** Centralized, high-performance USRP or LimeSDR hardware is hosted in RF-shielded server racks with robust network backhaul (10GbE+). Users access a virtualized SDR frontend via a web interface or API.
*   **Leading Platforms:**
    *   **Per Vices CloudSDR:** Offers on-demand rental of high-end USRP devices (X-series) with guaranteed bandwidth and MIMO channels.
    *   **Academic Testbeds:** Platforms like **POWDER-RENEW** and **AERPAW** provide free, grant-supported access to massive MIMO arrays and aerial SDR nodes for approved research proposals.
*   **Advantages:** Eliminates upfront hardware cost, enables access to equipment otherwise unavailable (e.g., 40-channel coherent arrays), and facilitates reproducible research by sharing exact hardware setups.
*   **Disadvantages:** Latency (critical for closed-loop control), ongoing cost, and potential legal/export control restrictions on signal and target of interest.

## Legal and Regulatory Considerations

Operating SDRs, especially for transmission and monitoring, is bound by national regulations.

*   **Transmission:** Unlicensed transmission is strictly limited to certain **ISM bands** (e.g., 433.92 MHz, 915 MHz, 2.4 GHz, 5.8 GHz) with restrictions on power, bandwidth, and duty cycle. Transmitting outside these bands **requires an appropriate license** (e.g., Amateur Radio, Experimental).
*   **Reception:** Laws vary significantly by country (**United States vs. Germany vs. United Kingdom**).
    *   **United States:** Generally permits reception of any signal not intended for public consumption, with notable exceptions: decrypting or aiding in decrypting satellite cable programming or cellular telephone calls is prohibited (ECPA, 18 U.S.C. § 2511, 47 U.S.C. § 605).
    *   **Germany:** **§89 TKG** is highly restrictive. The mere technical capability to receive non-broadcast radio services (e.g., police, military, private mobile radio) may require a permit. Possession of equipment "primarily designed" for such interception can be illegal.
    *   **United Kingdom:** Governed by the **Wireless Telegraphy Act 2006**. It is illegal to listen to any radio communication not intended for the general public without a license from Ofcom.
*   **Best Practices for Researchers:**
    1.  **Operate in a Shielded Environment:** Use a Faraday cage for all TEMPEST and side-channel research to prevent unintended radiation.
    2.  **Use Signal Generators & Attenuators:** For protocol reverse-engineering, create a closed-loop test setup with a transmitter directly connected to a receiver via heavy attenuation; do not radiate.
    3.  **Document Intent:** For academic research, obtain explicit permission from your institution's legal/compliance office and, if necessary, apply for an experimental license from the regulator (e.g., FCC in the US).
    4.  **Stay Informed:** Regulations evolve. Consult official sources like the FCC, Ofcom, or BNetzA for the latest rules.
---

## See Also

| Article | Relationship |
|---------|-------------|
| [entry-level-em-sca-setup.md](entry-level-em-sca-setup.md) | RTL-SDR v3 in practice — DIY probes, calibration, and SEMA case study |
| [research-grade-em-sca-lab.md](research-grade-em-sca-lab.md) | HackRF One and BladeRF 2.0 detailed lab setup and MIMO attack implementation |
| [professional-em-sca-facility.md](professional-em-sca-facility.md) | USRP X410 in a professional facility context with anechoic chamber design |
| [electromagnetic-side-channel-practical-guide.md](electromagnetic-side-channel-practical-guide.md) | Signal processing pipeline, CEMA code, and TempestSDR usage |
| [rf-fingerprinting-device-identification.md](rf-fingerprinting-device-identification.md) | SEI/RF fingerprinting — applications of SDRs for device identification |
| [sigint-academic-research-overview.md](sigint-academic-research-overview.md) | Academic AMC, geolocation, and ELINT research using SDR platforms |
| [sigint-machine-learning-pipeline.md](sigint-machine-learning-pipeline.md) | End-to-end ML pipeline for SIGINT that runs on the SDRs described here |
| [em-sca-2026-developments.md](em-sca-2026-developments.md) | 2026 EM-SCA attack research and the equipment used in top-tier papers |
