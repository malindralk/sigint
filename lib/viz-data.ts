// Static data extracted from wiki content for visualizations

export const MARKET_GROWTH = [
  { year: '2022', emSca: 120, sigint: 6800 },
  { year: '2023', emSca: 160, sigint: 7500 },
  { year: '2024', emSca: 210, sigint: 8200 },
  { year: '2025', emSca: 280, sigint: 9400 },
  { year: '2026', emSca: 380, sigint: 10800 },
  { year: '2027', emSca: 450, sigint: 12000 },
  { year: '2030', emSca: 620, sigint: 16000 },
  { year: '2035', emSca: 870, sigint: 24000 },
];

export const EMSCA_SEGMENTS = [
  { name: 'Equipment', value: 45, color: '#39d353' },
  { name: 'Services', value: 35, color: '#58a6ff' },
  { name: 'Software', value: 20, color: '#bc8cff' },
];

export const EMSCA_GEOGRAPHY = [
  { name: 'N. America', value: 45, color: '#39d353' },
  { name: 'Europe', value: 30, color: '#58a6ff' },
  { name: 'Asia-Pacific', value: 20, color: '#bc8cff' },
  { name: 'Other', value: 5, color: '#f0883e' },
];

export const COMPANIES = [
  // EM-SCA Tier 1
  { name: 'Lockheed Martin', tier: 1, sector: 'sigint', revenue: 68600, hq: 'Bethesda, USA', focus: 'Airborne & space SIGINT/EW' },
  { name: 'Raytheon (RTX)', tier: 1, sector: 'sigint', revenue: 74200, hq: 'Arlington, USA', focus: 'Radar, EW, space sensors' },
  { name: 'Northrop Grumman', tier: 1, sector: 'sigint', revenue: 39600, hq: 'Falls Church, USA', focus: 'Space & cyber SIGINT' },
  { name: 'BAE Systems', tier: 1, sector: 'sigint', revenue: 32000, hq: 'London, UK', focus: 'Naval & airborne SIGINT' },
  { name: 'L3Harris', tier: 2, sector: 'sigint', revenue: 19800, hq: 'Melbourne, USA', focus: 'Full-spectrum SIGINT' },
  { name: 'Elbit Systems', tier: 2, sector: 'sigint', revenue: 6100, hq: 'Haifa, Israel', focus: 'Tactical SIGINT & EW' },
  { name: 'HENSOLDT', tier: 2, sector: 'sigint', revenue: 2300, hq: 'Taufkirchen, Germany', focus: 'Radar & EW' },
  { name: 'Rohde & Schwarz', tier: 2, sector: 'sigint', revenue: 2800, hq: 'Munich, Germany', focus: 'RF test & SIGINT' },
  { name: 'Rambus', tier: 1, sector: 'em-sca', revenue: 465, hq: 'Sunnyvale, USA', focus: 'DPA/EM IP licensing' },
  { name: 'Riscure', tier: 1, sector: 'em-sca', revenue: 15, hq: 'Delft, Netherlands', focus: '#1 SCA testing & tools' },
  { name: 'BrightSight (UL)', tier: 1, sector: 'em-sca', revenue: 20, hq: 'Delft, Netherlands', focus: 'Security certification' },
  { name: 'Secure-IC', tier: 2, sector: 'em-sca', revenue: 10, hq: 'France', focus: 'Security IP & testing' },
  { name: 'FortifyIQ', tier: 2, sector: 'em-sca', revenue: 5, hq: 'Santa Clara, USA', focus: 'AI-driven SCA automation' },
  { name: 'NewAE Technology', tier: 2, sector: 'em-sca', revenue: 3, hq: 'Halifax, Canada', focus: 'Open-source SCA platform' },
  { name: 'Keysight', tier: 3, sector: 'em-sca', revenue: 5400, hq: 'Santa Rosa, USA', focus: 'Test & measurement' },
  { name: 'Langer EMV', tier: 3, sector: 'em-sca', revenue: 20, hq: 'Aachen, Germany', focus: 'Near-field EM probes' },
  { name: 'HawkEye 360', tier: 2, sector: 'space-sigint', revenue: 80, hq: 'Herndon, USA', focus: 'Commercial RF geolocation' },
  { name: 'Unseenlabs', tier: 3, sector: 'space-sigint', revenue: 30, hq: 'France', focus: 'Maritime RF SIGINT' },
  { name: 'Spire Global', tier: 2, sector: 'space-sigint', revenue: 110, hq: 'San Francisco, USA', focus: 'Multi-mission constellation' },
];

export const SDR_HARDWARE = [
  { name: 'RTL-SDR v4', price: 40, bwMhz: 3.2, adcBits: 12, freqGhz: 1.766, txCapable: false, tier: 'entry' },
  { name: 'PlutoSDR', price: 250, bwMhz: 56, adcBits: 12, freqGhz: 3.8, txCapable: true, tier: 'entry' },
  { name: 'HackRF 2.0', price: 600, bwMhz: 80, adcBits: 16, freqGhz: 8, txCapable: true, tier: 'mid' },
  { name: 'LimeSDR 2.0', price: 900, bwMhz: 80, adcBits: 12, freqGhz: 3.8, txCapable: true, tier: 'mid' },
  { name: 'BladeRF 2.0', price: 480, bwMhz: 61, adcBits: 12, freqGhz: 6, txCapable: true, tier: 'mid' },
  { name: 'USRP X410', price: 18000, bwMhz: 400, adcBits: 14, freqGhz: 7.2, txCapable: true, tier: 'pro' },
  { name: 'USRP X440', price: 25000, bwMhz: 400, adcBits: 16, freqGhz: 7.2, txCapable: true, tier: 'pro' },
];

export const RESEARCH_PAPERS = [
  { year: 2021, venue: 'TCHES', title: 'Masked Kyber EM (FPGA)', attack: 'EM Template', target: 'Kyber-768', traces: 200000 },
  { year: 2022, venue: 'CHES', title: 'FALCON CDT Template', attack: 'Template', target: 'FALCON', traces: 40000 },
  { year: 2022, venue: 'IEEE', title: 'Dilithium SPA Rejection', attack: 'SPA', target: 'Dilithium-3', traces: 5000 },
  { year: 2023, venue: 'IEEE', title: 'Kyber CPA Decode', attack: 'CPA', target: 'Kyber-768', traces: 50000 },
  { year: 2023, venue: 'IEEE', title: 'Dilithium CPA NTT', attack: 'CPA', target: 'Dilithium-3', traces: 30000 },
  { year: 2024, venue: 'IEEE', title: 'Dilithium Horizontal EM', attack: 'Horizontal EM', target: 'Dilithium (masked)', traces: 500000 },
  { year: 2024, venue: 'IEEE', title: 'FALCON Fault Attack', attack: 'Fault', target: 'FALCON', traces: 1 },
  { year: 2025, venue: 'IEEE S&P', title: 'Multi-channel Spatial EM', attack: 'MIMO Beamforming', target: 'ARM Cortex-M4', traces: 500 },
  { year: 2025, venue: 'IEEE S&P', title: 'EM Rowhammer Flash', attack: 'EM Fault', target: 'STM32H7', traces: 1 },
  { year: 2025, venue: 'TCHES', title: 'TEMA Transient EM', attack: 'Transient EM', target: 'Secure Element', traces: 30000 },
  { year: 2025, venue: 'CHES', title: 'PQC Survey 12 Targets', attack: 'NTT Single-Trace', target: 'Kyber (various)', traces: 1 },
  { year: 2025, venue: 'USENIX', title: 'RISC-V Scalar-Crypto EM', attack: 'CEMA', target: 'SiFive X280', traces: 10000 },
  { year: 2026, venue: 'CCS', title: 'EMFormer ViT', attack: 'DL (Transformer)', target: 'ATmega328P ×10', traces: 500 },
  { year: 2026, venue: 'IEEE S&P', title: 'CEML Contrastive Learning', attack: 'Self-supervised DL', target: 'AES-256', traces: 100 },
  { year: 2026, venue: 'IEEE S&P', title: 'Edge TPU Model Extraction', attack: 'Broad-spectrum EM', target: 'Edge TPU', traces: 5000 },
  { year: 2026, venue: 'USENIX', title: 'EM-Sight Fault Injection', attack: 'Precision EM Fault', target: 'Various', traces: 1 },
  { year: 2026, venue: 'USENIX', title: 'EM-Probe Microarch.', attack: 'Microarch. Inference', target: 'x86 (shielded)', traces: 1000 },
  { year: 2026, venue: 'TCHES', title: 'Automotive CAN EM Leak', attack: 'CEMA Cross-domain', target: 'NXP S32G / RH850', traces: 20000 },
];

export const ATTACK_TAXONOMY = [
  {
    name: 'Passive EM-SCA',
    color: '#39d353',
    children: [
      { name: 'SEMA', desc: 'Simple EM Analysis — visual inspection of single traces' },
      { name: 'DEMA', desc: 'Differential EM — statistical difference between trace sets' },
      { name: 'CEMA', desc: 'Correlation EM — Pearson correlation with leakage model' },
      { name: 'DL-based', desc: 'CNN/LSTM/Transformer neural profiling attacks' },
      { name: 'Template', desc: 'Multivariate Gaussian characterization of leakage' },
      { name: 'TEMA', desc: 'Transient EM — asynchronous 2–6 GHz transients' },
    ],
  },
  {
    name: 'Active EM',
    color: '#f0883e',
    children: [
      { name: 'EM Fault Injection', desc: 'Pulse-induced instruction skip or bit flip' },
      { name: 'EM Rowhammer', desc: 'Tuned EM field induces flash memory bit flips' },
      { name: 'FAUST/EM', desc: 'Combined passive SCA + active fault injection' },
    ],
  },
  {
    name: 'TEMPEST',
    color: '#58a6ff',
    children: [
      { name: 'Screen Gleaning', desc: 'Reconstruct display content from EM emissions' },
      { name: 'Keyboard Logging', desc: 'Infer keystrokes via PS/2 / USB EM' },
      { name: 'Network Tap', desc: 'Reconstruct Ethernet data from cable radiation' },
    ],
  },
];

export const LEARNING_PHASES = [
  {
    phase: 1, title: 'DSP Foundations', weeks: '1–8', hours: 130, courses: 5,
    color: '#39d353',
    topics: ['Digital Signal Processing (Coursera/Duke)', 'Introduction to Fourier Analysis', 'MATLAB/Python for DSP', 'Filter Design', 'Spectral Analysis'],
  },
  {
    phase: 2, title: 'Hardware Security & Crypto', weeks: '9–12', hours: 18, courses: 2,
    color: '#58a6ff',
    topics: ['Hardware Security (Maryland)', 'Cryptography I (Stanford)'],
  },
  {
    phase: 3, title: 'RF Engineering', weeks: '13–19', hours: 70, courses: 2,
    color: '#bc8cff',
    topics: ['RF & mmWave Circuit Design', 'Wireless Communications Fundamentals'],
  },
  {
    phase: 4, title: 'ML for Signals', weeks: '20–24', hours: 30, courses: 2,
    color: '#f0883e',
    topics: ['ML Specialization (deeplearning.ai)', 'Applied ML for RF Systems'],
  },
  {
    phase: 5, title: 'Supplementary', weeks: '25–26', hours: 85, courses: 6,
    color: '#e3b341',
    topics: ['5G & Wireless Networks', 'Satellite Communications', 'IoT Security', 'SDR with GNU Radio', 'Antenna Theory', 'Radar Systems'],
  },
];
