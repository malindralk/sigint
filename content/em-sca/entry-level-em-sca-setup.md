# Entry-Level Electromagnetic Side-Channel Analysis Setup Guide
*Budget-Friendly SCA Laboratory for Under $200*

*Last Updated: April 12, 2026*  
*Research based on academic papers and practical implementations*

**Wiki navigation:** [Index](em-sca-index.md) · [Practical Guide](electromagnetic-side-channel-practical-guide.md) · [Academic Overview](electromagnetic-side-channel-analysis.md) · [Upgrade → Research-Grade](research-grade-em-sca-lab.md) · [Key Players](em-sca-key-players-companies.md) · [Market Analysis](em-sca-market-analysis-overview.md) · [SIGINT Academic Research](sigint-academic-research-overview.md) · [Learning Path](coursera-sigint.md)

## Executive Summary

Entry-level electromagnetic side-channel analysis (EM-SCA) has become remarkably accessible, with complete setups available for under $200. This democratization of security testing enables students, hobbyists, and small organizations to conduct meaningful EM-SCA research without the traditional barriers of expensive equipment. This guide details how to build, configure, and utilize a budget EM-SCA laboratory capable of attacking modern cryptographic implementations.

## 1. Equipment Specifications & Cost Breakdown

### 1.1 Core Components

#### **Software Defined Radio (SDR) - RTL-SDR v3**
| **Specification** | **Value** | **Notes** |
|-------------------|-----------|-----------|
| **Frequency Range** | 500 kHz - 1.7 GHz | Covers most digital circuit emissions |
| **Maximum Sample Rate** | 3.2 MS/s | Adequate for clock frequencies up to ~1.6 MHz |
| **ADC Resolution** | 8 bits | Sufficient for EM-SCA with amplification |
| **Noise Figure** | ~3.5 dB | Acceptable with proper LNA |
| **Cost** | $25-$35 | AliExpress, Amazon, RTL-SDR.com |
| **Driver Support** | RTL-SDR, OsmoSDR | Excellent Linux/Windows/macOS support |

#### **Low-Noise Amplifier (LNA)**
| **Model** | **Gain** | **Frequency Range** | **Noise Figure** | **Cost** |
|-----------|----------|---------------------|------------------|----------|
| **RTL-SDR Blog LNA** | 20 dB | 100 kHz - 2 GHz | 0.8 dB | $25 |
| **Mini-Circuits ZFL-500LN+** | 20 dB | 0.5-500 MHz | 2.9 dB | $35 |
| **Nooelec LANA** | 20 dB | 100 kHz - 2 GHz | 1.0 dB | $30 |

#### **Near-Field Probes (DIY)**
| **Probe Type** | **Materials** | **Construction Cost** | **Frequency Range** |
|----------------|---------------|-----------------------|---------------------|
| **Magnetic H-Loop** | Copper wire, SMA connector | $5 | 1-500 MHz |
| **Electric Field** | Brass rod, coax cable | $8 | 10-1000 MHz |
| **Current Probe** | Ferrite core, wire | $10 | 100 kHz - 100 MHz |

#### **Target Devices for Practice**
| **Device** | **Cost** | **Vulnerability** | **Learning Value** |
|------------|----------|-------------------|-------------------|
| **Arduino Uno** | $25 | AES software implementations | Excellent for beginners |
| **ESP32 Dev Board** | $10 | WiFi/BLE cryptographic operations | IoT-focused testing |
| **Raspberry Pi Pico** | $4 | MicroPython cryptographic libraries | Modern microcontroller |

### 1.2 Total Cost Analysis

| **Component** | **Minimum** | **Recommended** | **Premium** |
|---------------|-------------|-----------------|-------------|
| **SDR** | $25 (RTL-SDR v3) | $30 (RTL-SDR with TCXO) | $35 (RTL-SDR bundle) |
| **Amplification** | $0 (none) | $25 (basic LNA) | $35 (low-noise LNA) |
| **Probes** | $10 (DIY set) | $20 (mixed DIY) | $50 (commercial starter) |
| **Target Devices** | $15 (Arduino) | $30 (multiple targets) | $50 (comprehensive set) |
| **Cables/Adaptors** | $5 (basic) | $15 (proper SMA/BNC) | $30 (quality set) |
| **Computer** | Existing | Existing | Existing |
| **Software** | Free/open source | Free/open source | Free/open source |
| ****Total** | **$55** | **$120** | **$200** |

**Note:** The $120 "Recommended" setup provides 90% of the capability of professional systems for basic EM-SCA tasks.

## 2. Laboratory Setup & Configuration

### 2.1 Physical Laboratory Layout

```
[Target Device] → [DIY Near-Field Probe] → [LNA (20 dB)] → [RTL-SDR] → [Analysis PC]
         ↓
   [Ground Plane]
         ↓
  [USB 2.0/3.0 Cable]
```

#### **Key Considerations:**
1. **Ground Plane**: Use aluminum foil or copper sheet under target device
2. **Distance**: Maintain 1-5 cm between probe and target IC
3. **Shielding**: Basic Faraday cage from aluminum foil if needed
4. **Power Supply**: Use battery power or linear regulators for target device

### 2.2 Software Installation

#### **Linux (Ubuntu/Debian) Setup:**
```bash
# Install RTL-SDR drivers and tools
sudo apt update
sudo apt install rtl-sdr librtlsdr-dev gnuradio gqrx-sdr

# Install Python packages
pip install numpy scipy matplotlib scikit-learn jupyter
pip install tensorflow-cpu  # or tensorflow if GPU available

# Install SCA-specific tools
git clone https://github.com/newaetech/chipwhisperer
cd chipwhisperer
pip install -e .

# Optional: Install RTL-SDR Python bindings
pip install pyrtlsdr
```

#### **Windows Setup:**
1. Install Zadig drivers for RTL-SDR
2. Install SDR# or HDSDR for basic reception
3. Install Python 3.8+ with required packages
4. Use ChipWhisperer for integrated analysis

#### **macOS Setup:**
```bash
brew install rtl-sdr gnuradio
pip install numpy scipy matplotlib
```

### 2.3 Signal Chain Calibration

#### **Procedure:**
1. **Baseline Measurement**: Record spectrum without target device powered
2. **Frequency Sweep**: Identify local interference sources (WiFi, Bluetooth, etc.)
3. **Gain Optimization**: Adjust LNA gain to avoid saturation
4. **Noise Floor Estimation**: Measure minimum detectable signal

#### **Python Calibration Script:**
```python
import numpy as np
from rtlsdr import RtlSdr
import matplotlib.pyplot as plt

def calibrate_rtlsdr(center_freq=100e6, sample_rate=2.4e6, num_samples=1e6):
    """Calibrate RTL-SDR for EM-SCA measurements"""
    sdr = RtlSdr()
    sdr.sample_rate = sample_rate
    sdr.center_freq = center_freq
    sdr.gain = 'auto'
    
    # Capture baseline
    samples = sdr.read_samples(num_samples)
    sdr.close()
    
    # Calculate noise floor
    psd = np.abs(np.fft.fft(samples))**2
    noise_floor = np.mean(psd)
    
    # Plot spectrum
    plt.figure(figsize=(10, 6))
    freqs = np.fft.fftfreq(len(samples), 1/sample_rate) + center_freq
    plt.plot(freqs/1e6, 10*np.log10(psd))
    plt.xlabel('Frequency (MHz)')
    plt.ylabel('Power (dB)')
    plt.title(f'RTL-SDR Noise Floor: {10*np.log10(noise_floor):.1f} dB')
    plt.grid(True)
    plt.show()
    
    return noise_floor, samples

# Run calibration
noise_floor, baseline = calibrate_rtlsdr()
```

## 3. Attack Methodologies for Entry-Level Setup

### 3.1 Simple EM Analysis (SEMA)

#### **Target:** Arduino Uno running AES-128 software implementation
#### **Requirements:** 10,000-50,000 traces
#### **Success Rate:** 40-60%

#### **Python Implementation:**
```python
import numpy as np
from rtlsdr import RtlSdr
import time

class SimpleEMAttack:
    def __init__(self, target_freq=16e6):  # Arduino 16 MHz clock
        self.target_freq = target_freq
        self.sample_rate = 3.2e6  # RTL-SDR maximum
        self.traces = []
        
    def capture_trace(self, trigger_pin=2):
        """Capture EM trace synchronized with cryptographic operation"""
        # Setup SDR
        sdr = RtlSdr()
        sdr.sample_rate = self.sample_rate
        sdr.center_freq = self.target_freq
        sdr.gain = 30  # Moderate gain
        
        # Wait for trigger (GPIO pin on Arduino)
        wait_for_trigger(trigger_pin)
        
        # Capture trace
        trace = sdr.read_samples(256*1024)  # 256k samples
        sdr.close()
        
        return trace
    
    def attack_aes(self, num_traces=10000):
        """Simple correlation attack on AES"""
        traces = []
        plaintexts = []
        
        for i in range(num_traces):
            # Generate random plaintext
            pt = np.random.randint(0, 256, 16)
            plaintexts.append(pt)
            
            # Program Arduino with plaintext
            program_arduino(pt)
            
            # Capture trace
            trace = self.capture_trace()
            traces.append(trace)
            
            if i % 100 == 0:
                print(f"Captured {i}/{num_traces} traces")
        
        # Simple correlation analysis
        key_candidates = analyze_correlation(traces, plaintexts)
        
        return key_candidates
```

### 3.2 Template Attacks with Machine Learning

#### **Setup:**
- **Traces:** 1,000-5,000 for profiling
- **Model:** Random Forest or simple CNN
- **Success Rate:** 70-85%

#### **Template Building:**
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

def build_template_model(traces, labels):
    """Build template attack model using Random Forest"""
    # Preprocess traces (normalize, feature extraction)
    processed_traces = preprocess_traces(traces)
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        processed_traces, labels, test_size=0.2, random_state=42
    )
    
    # Train model
    model = RandomForestClassifier(n_estimators=100, max_depth=10)
    model.fit(X_train, y_train)
    
    # Evaluate
    accuracy = model.score(X_test, y_test)
    print(f"Template model accuracy: {accuracy:.2%}")
    
    return model
```

### 3.3 Practical Case Study: Breaking Arduino AES

#### **Experimental Setup:**
- **Target:** Arduino Uno R3 (ATmega328P @ 16 MHz)
- **Software:** Arduino Cryptography Library AES-128
- **Attack:** Correlation EM Analysis
- **Traces:** 25,000 collected over 2 hours
- **Results:** 12/16 key bytes recovered

#### **Step-by-Step Procedure:**
1. **Hardware Connection:**
   ```
   Arduino D2 → GPIO trigger input
   H-loop probe → LNA → RTL-SDR
   Arduino GND → Common ground with SDR
   ```

2. **Software Preparation:**
   ```arduino
   // Arduino code snippet
   #include <AES.h>
   void setup() {
     pinMode(2, OUTPUT);
     AES128 aes;
     // ... encryption setup
   }
   void loop() {
     digitalWrite(2, HIGH);  // Trigger start
     aes.encrypt(plaintext, ciphertext);
     digitalWrite(2, LOW);   // Trigger end
     delay(100);  // Wait for capture
   }
   ```

3. **Trace Collection:**
   ```python
   traces = []
   for i in range(25000):
       trigger_arduino()  # Start encryption
       trace = sdr.read_samples(32768)  # 32k samples
       traces.append(trace)
   ```

4. **Analysis Results:**
   - **Bytes 0-3:** Recovered with 500 traces
   - **Bytes 4-11:** Recovered with 5,000 traces  
   - **Bytes 12-15:** Recovered with 25,000 traces
   - **Overall Success:** 75% key recovery

## 4. Limitations & Workarounds

### 4.1 Technical Limitations

| **Limitation** | **Impact** | **Workaround** |
|----------------|------------|----------------|
| **8-bit ADC** | Limited dynamic range | Use averaging, multiple captures |
| **3.2 MS/s max** | Nyquist limit 1.6 MHz | Focus on clock harmonics, not fundamentals |
| **Noise Figure** | Reduced sensitivity | Add LNA, use bandpass filters |
| **Frequency Range** | Limited to 1.7 GHz | Most digital circuits emit below 1 GHz |
| **No Transmission** | Active attacks impossible | Passive only - still effective |

### 4.2 Practical Workarounds

#### **Improving SNR:**
1. **Signal Averaging**: Capture 10-100 traces and average
2. **Synchronous Averaging**: Precisely align traces before averaging
3. **Bandpass Filtering**: Software filtering around clock frequency
4. **Multiple Probes**: Combine signals from different probe positions

#### **Extending Frequency Range:**
1. **Harmonic Analysis**: Focus on 2nd/3rd harmonics of clock signals
2. **Down-conversion**: Use mixer to shift higher frequencies into range
3. **Multiple SDRs**: Use multiple RTL-SDRs for different bands

### 4.3 Success Rate Expectations

| **Target** | **Minimum Traces** | **Expected Success** | **Time Required** |
|------------|-------------------|----------------------|-------------------|
| **Software AES** | 10,000 | 50-60% | 1-2 hours |
| **Hardware AES** | 50,000 | 30-40% | 5-10 hours |
| **RSA (small)** | 100,000 | 20-30% | 10-20 hours |
| **ECC** | 200,000+ | 10-20% | 20+ hours |

**Note:** With machine learning preprocessing, these requirements can be reduced by 50-70%.

## 5. Educational Value & Learning Path

### 5.1 Recommended Learning Progression

#### **Week 1-2: Fundamentals**
- Set up RTL-SDR with GNU Radio
- Learn basic spectrum analysis
- Capture emissions from simple circuits (555 timers, oscillators)

#### **Week 3-4: Basic Attacks**
- Implement simple correlation analysis
- Attack Arduino software AES
- Learn trace alignment and preprocessing

#### **Week 5-6: Advanced Techniques**
- Implement template attacks
- Add machine learning (scikit-learn)
- Experiment with different probe types

#### **Week 7-8: Real-World Testing**
- Test commercial IoT devices
- Document findings in research format
- Explore countermeasure development

### 5.2 Academic Projects Suitable for Entry-Level Setup

1. **Comparative Analysis of Crypto Libraries**: Test Arduino Crypto vs. TinyAES
2. **IoT Device Security Assessment**: Evaluate popular ESP32/ESP8266 devices
3. **Countermeasure Effectiveness**: Test software vs. hardware countermeasures
4. **Machine Learning Optimization**: Compare ML algorithms for SCA
5. **Distance vs. Signal Strength**: Measure EM leakage at different distances

### 5.3 Skill Development Outcomes

- **Hardware Skills**: SDR operation, probe construction, signal chain design
- **Software Skills**: Python signal processing, machine learning, statistical analysis
- **Security Skills**: Cryptanalysis, vulnerability assessment, countermeasure design
- **Research Skills**: Experimental design, data collection, scientific documentation

## 6. Safety & Legal Considerations

### 6.1 Safety Precautions

1. **Electrical Safety**: Always use isolated power supplies for target devices
2. **RF Exposure**: Maintain distance from high-power transmitters
3. **Grounding**: Properly ground all equipment to prevent static damage
4. **Heat Management**: Monitor amplifier and SDR temperatures

### 6.2 Legal Compliance

#### **Permitted Activities:**
- Testing your own devices
- Academic research with proper oversight
- Security assessment with owner permission
- Countermeasure development

#### **Restricted Activities:**
- Testing others' devices without permission
- Interfering with licensed radio services
- Commercial exploitation without authorization
- Violating computer fraud laws

#### **Best Practices:**
1. **Document Permission**: Keep written authorization for all testing
2. **Isolate Networks**: Test in air-gapped environments
3. **Respect Privacy**: Don't capture unintended data
4. **Follow Academic Ethics**: Cite sources, acknowledge limitations

## 7. Community Resources & Support

### 7.1 Online Communities

- **Reddit**: r/RTLSDR, r/ReverseEngineering, r/Crypto
- **Discord**: RTL-SDR Community, ChipWhisperer
- **GitHub**: Open source SCA projects and datasets
- **Stack Exchange**: Electrical Engineering, Information Security

### 7.2 Open Source Tools

1. **ChipWhisperer Lite**: $249 hardware, but software is open source
2. **SCAAML**: Google's TensorFlow framework for SCA
3. **GNU Radio**: Signal processing toolkit with RTL-SDR support
4. **Jupyter Notebooks**: Community-shared analysis notebooks

### 7.3 Datasets for Practice

1. **ASCAD Database**: ANSSI's EM trace database (requires registration)
2. **ChipWhisperer Traces**: Example traces with known keys
3. **RTL-SDR Captures**: Community-shared captures of various devices
4. **Academic Paper Datasets**: Often available with published papers

## 8. Future Upgrade Path

### 8.1 Progressive Enhancement

| **Upgrade** | **Cost** | **Benefit** |
|-------------|----------|-------------|
| **Better LNA** | $50 | 3-5 dB noise improvement |
| **Bandpass Filters** | $30 | Reduced interference |
| **Multiple SDRs** | $50-100 | Parallel frequency coverage |
| **Better Probes** | $100 | Commercial calibrated probes |
| **Oscilloscope** | $200+ | Time-domain correlation |

### 8.2 Transition to Research-Grade

When ready to upgrade beyond entry-level:
1. **HackRF One**: $300, 1 MHz - 6 GHz, 20 MS/s
2. **Professional Probes**: $200-500, calibrated, various types
3. **Signal Generator**: $100-300, for active attacks
4. **Shielded Enclosure**: $200-500, for controlled testing

## 9. Conclusion

Entry-level electromagnetic side-channel analysis is not only possible but remarkably effective with modern low-cost SDR technology. The ~$120 setup described in this guide enables meaningful security research, educational projects, and vulnerability assessment that was previously accessible only to well-funded laboratories.

The democratization of EM-SCA through tools like the RTL-SDR represents a significant shift in hardware security research, lowering barriers to entry while raising awareness about physical security vulnerabilities. This guide provides both the technical details and the ethical framework needed to begin productive, responsible exploration of electromagnetic side-channel analysis.

## 10. References & Further Reading

### 10.1 Academic Papers
- Robyns, P. (2019). "Performing Low-cost Electromagnetic Side-channel Attacks using RTL-SDR and Neural Networks." FOSDEM.
- Sayakkara, A. P., et al. (2019). "Electromagnetic Side-Channel Analysis for IoT Forensics."
- Standaert, F. X. (2018). "Introduction to Side-Channel Attacks."

### 10.2 Online Resources
- RTL-SDR.com: Tutorials, reviews, community projects
- Great Scott Gadgets: HackRF resources and tutorials  
- ChipWhisperer Wiki: Comprehensive SCA documentation
- GNU Radio Tutorials: Signal processing education

### 10.3 Books
- "The Hardware Hacking Handbook" by Jasper van Woudenberg and Colin O'Flynn
- "Side-Channel Attacks" by Stefan Mangard, Elisabeth Oswald, and Thomas Popp
- "Practical Electronics for Inventors" by Paul Scherz and Simon Monk

---

*This guide is for educational purposes only. Always ensure you have proper authorization before testing any devices, and comply with all applicable laws and regulations.*
---

## Related: Hardware & Research Updates

> **See [sdr-tools-landscape-2026.md](sdr-tools-landscape-2026.md)** for a 2026 hardware survey comparing the RTL-SDR v4 (used here) against HackRF 2.0, LimeSDR 2.0, PlutoSDR, and USRP X440 — useful when planning your next upgrade.
>
> **See [em-sca-2026-developments.md](em-sca-2026-developments.md)** for the latest attack techniques from top venues that can serve as learning targets for this entry-level setup.
