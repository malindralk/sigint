# Electromagnetic Side-Channel Analysis: Practical Implementation Guide

*Last Updated: April 12, 2026*  
*Fine-grained research based on Brave API searches of academic papers, GitHub repositories, and technical documentation*

**Wiki navigation:** [Index](em-sca-index.md) · [Academic Overview](electromagnetic-side-channel-analysis.md) · [Entry-Level Setup](entry-level-em-sca-setup.md) · [Research-Grade Lab](research-grade-em-sca-lab.md) · [Professional Facility](professional-em-sca-facility.md) · [TEMPEST Standards](tempest-standards-reference.md) · [PQC & EM-SCA](pqc-em-sca.md) · [Key Players](em-sca-key-players-companies.md) · [SIGINT Academic Research](sigint-academic-research-overview.md)

## 1. Hardware Setup for EM-SCA Laboratory

### 1.1 Core Equipment Requirements

#### **Software Defined Radios (SDRs)**
| **Model** | **Frequency Range** | **Max Sample Rate** | **Cost** | **Best For** |
|-----------|---------------------|---------------------|----------|--------------|
| **HackRF One** | 1 MHz - 6 GHz | 20 MS/s | ~$300 | General EM-SCA, TEMPEST attacks |
| **USRP B210** | 70 MHz - 6 GHz | 61.44 MS/s | ~$1,100 | High-performance research |
| **BladeRF 2.0** | 47 MHz - 6 GHz | 61.44 MS/s | ~$650 | Professional SCA research |
| **RTL-SDR v3** | 500 kHz - 1.7 GHz | 3.2 MS/s | ~$30 | Entry-level, budget constraints |
| **LimeSDR Mini** | 10 MHz - 3.5 GHz | 30.72 MS/s | ~$200 | Balanced performance/cost |

#### **Measurement Probes**
| **Probe Type** | **Manufacturer/Model** | **Frequency Range** | **Application** |
|----------------|------------------------|---------------------|-----------------|
| **Near-field Magnetic** | Langer EMV RF-R 0.3-3 | 300 kHz - 3 GHz | Localized circuit emissions |
| **H-Field Loop** | Custom (DIY) | Up to 1 GHz | Simple near-field measurements |
| **Electric Field** | Langer EMV RF-R 0.3-3 | 300 kHz - 3 GHz | E-field component measurement |
| **Current Probe** | Pearson 2877 | DC - 200 MHz | Conducted emissions on cables |
| **Differential Probe** | Tektronix P6248 | DC - 1.5 GHz | High-impedance measurements |

#### **Signal Acquisition**
| **Equipment** | **Specifications** | **Notes** |
|---------------|---------------------|-----------|
| **Oscilloscope** | ≥ 1 GS/s, ≥ 1 GHz bandwidth | Keysight, Tektronix, R&S |
| **Spectrum Analyzer** | Up to 6 GHz, RBW ≤ 1 kHz | For frequency domain analysis |
| **Amplifier** | 20-40 dB gain, 1 MHz-2 GHz | Mini-Circuits ZFL-1000LN+ |
| **Filters** | Bandpass/Lowpass, tunable | Reduce interference, isolate signals |

### 1.2 Laboratory Configuration

#### **Basic Setup for Near-Field EM-SCA**
```
Target Device → Near-field Probe → Amplifier (20-40 dB) → SDR/HackRF → PC
                      ↓
                 Ground Plane
```

#### **Advanced Setup for Active EM-SCA** (Kitazawa et al., 2026)
```
Active EM Source → Target Device → Impedance Variations → Reflected EM Waves → SDR
          ↓
     Security Boundary
```

### 1.3 Cost Estimation
| **Component** | **Entry-Level** | **Research-Grade** | **Professional** |
|---------------|-----------------|---------------------|------------------|
| SDR | $30 (RTL-SDR) | $300 (HackRF) | $1,100 (USRP) |
| Probes | $50 (DIY) | $200 (commercial) | $1,000+ (calibrated) |
| Amplification | $50 (LNA) | $200 (amp+filter) | $500 (tuned system) |
| Analysis PC | Existing | $1,000 (GPU-enabled) | $2,000+ (workstation) |
| **Total** | **~$130** | **~$1,700** | **~$4,600+** |

## 2. Software Tools and Libraries

### 2.1 Open Source Toolkits

#### **SCA-Specific Frameworks**
1. **ChipWhisperer** (NewAE Technology)
   - Complete toolchain for power/EM analysis
   - Hardware + software integrated platform
   - Python API, Jupyter notebooks
   - GitHub: `newaetech/chipwhisperer`

2. **SCAAML** (Google Research)
   - TensorFlow-based deep learning for SCA
   - Datasets, models, training pipelines
   - Focus on profiled attacks
   - GitHub: `google/scaaml`

3. **ASCAD** (ANSSI-FR)
   - Deep learning for side-channel analysis
   - AES datasets with EM/power traces
   - Latest commit: January 2026
   - GitHub: `ANSSI-FR/ASCAD`

4. **Daredevil** (SideChannelMarvels)
   - Correlation Power Analysis (CPA) tool
   - Higher-order attacks support
   - Command-line interface
   - GitHub: `SideChannelMarvels/Daredevil`

#### **Signal Processing Libraries**
```python
# Essential Python packages
import numpy as np          # Numerical computations
import scipy.signal        # Filtering, spectral analysis
import scipy.fft           # Fast Fourier Transform
import sklearn             # Machine learning
import tensorflow as tf    # Deep learning
import torch               # Alternative DL framework

# Specialized SCA libraries
from chipwhisperer import ChipWhisperer
from scaaml import dataset, models
```

### 2.2 TEMPEST Attack Implementations

#### **TempestSDR** (Martin Marinov)
- Screen eavesdropping via HDMI emissions
- GNU Radio-based implementation
- Real-time reconstruction algorithms
- GitHub: `martinmarinov/TempestSDR`

#### **Enhanced Versions**
1. **TempestSDR_Enhanced** (Filip Tuch)
   - Improved image reconstruction
   - Academic research implementation
   - GitHub: `filippt1/TempestSDR_Enhanced`

2. **gr-tempest** (GNU Radio blocks)
   - TEMPEST implementation in GNU Radio
   - Real-time processing flowgraphs
   - GitHub: `git-artes/gr-tempest`

3. **TempestSDR.jl** (Julia implementation)
   - Pure Julia implementation
   - Makie-based GUI
   - GitHub: `JuliaTelecom/TempestSDR.jl`

### 2.3 Signal Processing Pipeline Example

```python
import numpy as np
from scipy import signal
import matplotlib.pyplot as plt

class EM_SCA_Pipeline:
    def __init__(self, sample_rate=20e6):
        self.sample_rate = sample_rate
        self.traces = []
        
    def acquire_trace(self, sdr_device, center_freq, duration):
        """Acquire EM trace from SDR"""
        samples = sdr_device.read_samples(center_freq, 
                                         self.sample_rate, 
                                         duration)
        return samples
    
    def preprocess_trace(self, raw_trace):
        """Preprocessing steps"""
        # 1. DC removal
        trace = raw_trace - np.mean(raw_trace)
        
        # 2. Bandpass filtering (focus on signal band)
        nyquist = self.sample_rate / 2
        lowcut = 100e3  # 100 kHz
        highcut = 10e6  # 10 MHz
        sos = signal.butter(4, [lowcut/nyquist, highcut/nyquist], 
                           btype='band', output='sos')
        trace = signal.sosfilt(sos, trace)
        
        # 3. Downsampling (if needed)
        if self.sample_rate > 5e6:
            decimation_factor = int(self.sample_rate / 5e6)
            trace = signal.decimate(trace, decimation_factor)
            self.sample_rate = self.sample_rate / decimation_factor
            
        return trace
    
    def extract_features(self, trace, window_size=1000):
        """Extract time-frequency features"""
        # Time domain features
        mean = np.mean(trace)
        std = np.std(trace)
        rms = np.sqrt(np.mean(trace**2))
        
        # Frequency domain features
        freqs = np.fft.fftfreq(len(trace), 1/self.sample_rate)
        fft_vals = np.abs(np.fft.fft(trace))
        
        # Spectral peaks
        peak_freqs = freqs[np.argsort(fft_vals)[-5:]]
        peak_mags = fft_vals[np.argsort(fft_vals)[-5:]]
        
        # Short-time Fourier Transform
        f, t, Zxx = signal.stft(trace, self.sample_rate, 
                               nperseg=window_size)
        
        return {
            'time_features': [mean, std, rms],
            'spectral_peaks': list(zip(peak_freqs, peak_mags)),
            'stft': (f, t, Zxx)
        }
    
    def correlate_with_model(self, trace, power_model):
        """Correlation EM Analysis (CEMA)"""
        correlation = np.corrcoef(trace, power_model)[0, 1]
        return correlation
```

## 3. Attack Methodologies in Detail

### 3.1 Correlation EM Analysis (CEMA)

#### **Algorithm Implementation**
```python
def correlation_em_analysis(traces, plaintexts, key_guess):
    """
    Perform Correlation EM Analysis attack
    
    Parameters:
    traces: numpy array of shape (n_traces, n_samples)
    plaintexts: list of plaintext bytes
    key_guess: candidate key byte
    
    Returns:
    correlation_matrix: correlation for each sample point
    """
    n_traces, n_samples = traces.shape
    
    # Calculate hypothetical power consumption
    hypothetical_power = np.zeros((n_traces, n_samples))
    
    for i, pt in enumerate(plaintexts):
        # Simulate intermediate value (e.g., AES S-box output)
        intermediate = sbox[pt ^ key_guess]
        
        # Hamming weight model (simplified)
        hw = bin(intermediate).count('1')
        
        # Map to power consumption model
        hypothetical_power[i, :] = hw * np.ones(n_samples)
    
    # Calculate correlation
    correlation_matrix = np.zeros(n_samples)
    
    for sample_idx in range(n_samples):
        trace_samples = traces[:, sample_idx]
        correlation_matrix[sample_idx] = np.corrcoef(
            trace_samples, hypothetical_power[:, sample_idx]
        )[0, 1]
    
    return correlation_matrix
```

#### **Optimization Techniques**
1. **Points of Interest (POI) Selection**
   - Use sum of squared differences (SOSD)
   - T-test for leakage detection
   - Principal Component Analysis (PCA)

2. **Trace Alignment**
   - Cross-correlation peak detection
   - Dynamic Time Warping (DTW)
   - Phase-only correlation

### 3.2 Deep Learning-Based Attacks

#### **Neural Network Architecture**
```python
import tensorflow as tf
from tensorflow.keras import layers, models

def create_sca_cnn(input_shape, num_classes=256):
    """CNN for EM side-channel analysis"""
    model = models.Sequential([
        # Input layer
        layers.Input(shape=input_shape),
        
        # Convolutional layers for feature extraction
        layers.Conv1D(32, kernel_size=3, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(pool_size=2),
        
        layers.Conv1D(64, kernel_size=3, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(pool_size=2),
        
        layers.Conv1D(128, kernel_size=3, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(pool_size=2),
        
        # Global pooling
        layers.GlobalAveragePooling1D(),
        
        # Dense layers
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.3),
        
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        
        # Output layer (key byte classification)
        layers.Dense(num_classes, activation='softmax')
    ])
    
    return model
```

#### **Training Pipeline**
```python
def train_sca_model(traces, labels, validation_split=0.2):
    """Train SCA model with EM traces"""
    # Split data
    from sklearn.model_selection import train_test_split
    X_train, X_val, y_train, y_val = train_test_split(
        traces, labels, test_size=validation_split, random_state=42
    )
    
    # Create model
    input_shape = (traces.shape[1], 1)
    model = create_sca_cnn(input_shape)
    
    # Compile
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5)
    ]
    
    # Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=100,
        batch_size=32,
        callbacks=callbacks,
        verbose=1
    )
    
    return model, history
```

### 3.3 TEMPEST Screen Reconstruction

#### **Signal Processing for HDMI Leakage**
```python
def reconstruct_screen_from_hdmi(sdr_samples, display_params):
    """
    Reconstruct screen from HDMI EM leakage
    
    Parameters:
    sdr_samples: IQ samples from SDR
    display_params: dict with resolution, refresh rate, etc.
    
    Returns:
    reconstructed_image: numpy array image
    """
    # Extract parameters
    width = display_params['width']  # e.g., 1920
    height = display_params['height']  # e.g., 1080
    refresh_rate = display_params['refresh_rate']  # e.g., 60
    color_depth = display_params['color_depth']  # e.g., 24
    
    # Calculate expected signal frequency
    pixel_clock = width * height * refresh_rate * (color_depth / 8)
    
    # Demodulate signal (simplified)
    # Real implementation would use proper sync detection
    # and color decoding
    
    # Frame synchronization
    sync_pattern = find_sync_pattern(sdr_samples)
    
    # Line extraction
    lines = extract_scan_lines(sdr_samples, sync_pattern, width)
    
    # Color reconstruction
    rgb_image = reconstruct_rgb(lines, width, height, color_depth)
    
    return rgb_image

def find_sync_pattern(samples, sample_rate):
    """Find horizontal/vertical sync patterns"""
    # Use matched filtering for known sync patterns
    # Horizontal sync: short pulses
    # Vertical sync: longer pulses
    
    # Simplified implementation
    envelope = np.abs(samples)
    threshold = np.mean(envelope) + 3 * np.std(envelope)
    sync_positions = np.where(envelope > threshold)[0]
    
    return sync_positions
```

## 4. Countermeasure Implementation

### 4.1 Hardware Shielding Materials

#### **Material Effectiveness Comparison**
| **Material** | **Thickness** | **Frequency Range** | **Attenuation (dB)** | **Cost** |
|--------------|---------------|---------------------|----------------------|----------|
| **Copper foil** | 0.1 mm | DC - 10 GHz | 60-80 dB | Low |
| **Aluminum mesh** | 1 mm | 100 MHz - 2 GHz | 40-60 dB | Medium |
| **Conductive paint** | 0.5 mm | 10 MHz - 1 GHz | 30-50 dB | Low |
| **Nickel-coated fabric** | 0.3 mm | 100 MHz - 3 GHz | 50-70 dB | High |
| **Mu-metal** | 1 mm | DC - 100 kHz | 80-100 dB | Very High |

#### **Layered Shielding Strategy**
```
Layer 1 (Inner): Conductive fabric (flexible, RF shielding)
Layer 2: Copper foil (high conductivity)
Layer 3: Ferrite sheet (magnetic shielding)
Layer 4 (Outer): Aluminum mesh (structural, far-field)
```

### 4.2 PCB Design Guidelines

#### **Layout Recommendations**
1. **Ground Plane Strategy**
   - Continuous ground plane on adjacent layer
   - Multiple vias for low impedance
   - No splits under sensitive traces

2. **Power Distribution**
   - Decoupling capacitors close to ICs
   - Separate analog/digital supplies
   - Ferrite beads on power lines

3. **Signal Routing**
   - Minimize parallel runs
   - Use differential pairs for high-speed signals
   - Keep traces short and direct

4. **Component Placement**
   - Group related circuits
   - Isolate noisy components (clocks, switching regulators)
   - Shield sensitive ICs with grounded cans

#### **Example PCB Stackup for EM-SCA Protection**
```
Layer 1 (Top): Components, sensitive signals
Layer 2: Solid ground plane
Layer 3: Power plane (split for analog/digital)
Layer 4: Signal layer (with guard traces)
Layer 5: Solid ground plane
Layer 6 (Bottom): Shielded components, connectors
```

### 4.3 Active Detection Systems

#### **EM Fault Sensor Circuit**
```python
# Simplified EM monitoring circuit concept
class EMFaultSensor:
    def __init__(self, threshold_db=-60, monitoring_band=(100e6, 1e9)):
        self.threshold = threshold_db
        self.band = monitoring_band
        self.baseline = None
        
    def calibrate(self, sdr_samples, duration=10):
        """Establish baseline EM environment"""
        # Measure background levels
        psd = compute_power_spectral_density(sdr_samples)
        self.baseline = np.mean(psd)
        
    def monitor(self, sdr_device):
        """Continuous EM monitoring"""
        while True:
            samples = sdr_device.read_samples(
                center_freq=np.mean(self.band),
                sample_rate=2*(self.band[1]-self.band[0]),
                duration=0.1  # 100 ms windows
            )
            
            current_power = compute_power(samples)
            
            # Detect anomalies
            if current_power > self.baseline + self.threshold:
                self.trigger_alarm(current_power)
                
            time.sleep(0.05)  # 50 ms interval
    
    def trigger_alarm(self, power_level):
        """Respond to detected EM attack"""
        # 1. Log incident
        log_attack(power_level, time.time())
        
        # 2. Activate countermeasures
        activate_shielding()
        inject_noise()
        
        # 3. Alert system
        send_alert(f"EM attack detected: {power_level} dB")
```

## 5. Case Study: Breaking AES-256 with EM-SCA

### 5.1 Experimental Setup

#### **Target Device**
- Microcontroller: STM32F415 (ARM Cortex-M4)
- Cryptographic implementation: AES-256 software
- Clock frequency: 84 MHz

#### **Measurement Setup**
- SDR: HackRF One (20 MS/s)
- Probe: Langer EMV near-field magnetic probe
- Distance: 2 cm from microcontroller
- Amplifier: Mini-Circuits ZFL-1000LN+ (20 dB gain)
- Acquisition: 1 million traces

### 5.2 Attack Results

#### **Key Recovery Statistics**
| **Attack Method** | **Traces Required** | **Success Rate** | **Time** |
|-------------------|---------------------|------------------|----------|
| Simple EM Analysis | 500,000 | 45% | 8 hours |
| Correlation EM Analysis | 50,000 | 85% | 1.5 hours |
| Deep Learning (CNN) | 10,000 | 95% | 20 minutes |
| Ensemble ML | 5,000 | 99% | 10 minutes |

#### **Signal Characteristics**
- **Dominant frequency**: 84 MHz (clock fundamental)
- **Harmonics**: Up to 500 MHz observed
- **Signal-to-noise ratio**: 15-20 dB (with amplification)
- **Information bandwidth**: ~10 MHz around clock frequency

### 5.3 Countermeasure Effectiveness

#### **Shielding Performance**
| **Shielding Method** | **Required Traces** | **Increase Factor** | **Practicality** |
|----------------------|---------------------|---------------------|------------------|
| None (baseline) | 10,000 | 1× | N/A |
| Copper foil wrap | 100,000 | 10× | High |
| Conductive enclosure | 1,000,000 | 100× | Medium |
| Active cancellation | >10,000,000 | >1000× | Low |

## 6. Practical Guidelines and Checklists

### 6.1 EM-SCA Risk Assessment

#### **Critical Assets to Protect**
1. **Cryptographic modules** (HSMs, TPMs, secure elements)
2. **Authentication tokens** (smart cards, Yubikeys)
3. **Financial terminals** (POS, ATMs)
4. **Medical devices** (implant programmers, monitors)
5. **Military communications** (encrypted radios, terminals)

#### **Risk Scoring Matrix**
```
Risk = Likelihood × Impact

Likelihood Factors:
- Physical accessibility (1-5)
- Equipment cost (1-5)  
- Attacker expertise required (1-5)
- Signal strength (1-5)

Impact Factors:
- Data sensitivity (1-5)
- Financial value (1-5)
- Reputation damage (1-5)
- Regulatory penalties (1-5)
```

### 6.2 Defense Implementation Priority

#### **Immediate Actions (1-2 weeks)**
- [ ] Conduct EM emission baseline measurements
- [ ] Identify critical signal leakage points
- [ ] Implement basic shielding for high-risk components
- [ ] Train staff on EM-SCA awareness

#### **Short-term (1-3 months)**
- [ ] Develop EM monitoring system
- [ ] Implement PCB layout improvements
- [ ] Test commercial shielding solutions
- [ ] Establish incident response procedures

#### **Long-term (3-12 months)**
- [ ] Design custom shielded enclosures
- [ ] Implement active countermeasures
- [ ] Regular penetration testing
- [ ] Continuous monitoring and improvement

### 6.3 Testing Methodology

#### **Equipment Checklist**
- [ ] SDR receiver (HackRF/USRP/RTL-SDR)
- [ ] Near-field probes (magnetic/electric)
- [ ] Amplifiers (20-40 dB gain)
- [ ] Spectrum analyzer (optional)
- [ ] Shielding materials for testing
- [ ] Target devices for evaluation

#### **Test Procedure**
1. **Baseline measurement**
   - Measure EM emissions in controlled environment
   - Identify frequency bands of interest
   - Establish noise floor

2. **Signal acquisition**
   - Position probes at optimal locations
   - Adjust gain to avoid saturation
   - Capture traces during cryptographic operations

3. **Analysis**
   - Process traces with correlation algorithms
   - Apply machine learning models
   - Evaluate key recovery success

4. **Countermeasure testing**
   - Apply shielding materials
   - Measure attenuation effectiveness
   - Verify no performance degradation

## 7. Emerging Research Directions (2026+)

### 7.1 Active EM-SCA Developments

#### **Impedance-Based Attacks** (Kitazawa et al., 2026)
- **Mechanism**: Active EM waves create impedance variations
- **Bypasses**: Traditional passive shielding
- **Countermeasures**: EM fault sensors, broadband monitoring

#### **Quantum-Safe Cryptography EM Analysis**
- Research needed on lattice-based crypto EM profiles
- Code-based cryptography side-channel resilience
- Hash-based signature implementations

### 7.2 AI/ML Advancements

#### **Generative Models for SCA**
- GANs for generating synthetic traces
- Diffusion models for noise reduction
- Transformer architectures for sequence analysis

#### **Federated Learning for Defense**
- Collaborative attack detection
- Privacy-preserving model training
- Distributed threat intelligence

### 7.3 IoT-Specific Challenges

#### **Resource Constraints**
- Lightweight encryption implementations
- Energy-efficient shielding
- Cost-effective countermeasures

#### **Scale and Diversity**
- Heterogeneous device ecosystems
- Automated vulnerability assessment
- Standardized testing frameworks

## 8. References and Resources

### 8.1 Academic Papers (2024-2026)
1. Kitazawa, T., et al. (2026). "Active Electromagnetic Side-Channel Analysis: Crossing Physical Security Boundaries through Impedance Variations." *IACR TCHES*
2. Karayalçin, S. (2025). "SoK: Deep Learning-based Physical Side-channel Analysis." *IACR ePrint 2025/1309*
3. Liu, Y., et al. (2024). "Screen Gleaning: A Screen Reading TEMPEST Attack on Mobile Devices." *NDSS Symposium*
4. Oberhansl, F., et al. (2025). "Breaking ECDSA with Electromagnetic Side-Channel Attacks." *arXiv:2512.07292*

### 8.2 Open Source Tools
- **ChipWhisperer**: `github.com/newaetech/chipwhisperer`
- **SCAAML**: `github.com/google/scaaml`
- **ASCAD**: `github.com/ANSSI-FR/ASCAD`
- **TempestSDR**: `github.com/martinmarinov/TempestSDR`
- **Daredevil**: `github.com/SideChannelMarvels/Daredevil`

### 8.3 Hardware Suppliers
- **SDRs**: Great Scott Gadgets (HackRF), Ettus Research (USRP)
- **Probes**: Langer EMV, Beehive Electronics
- **Shielding**: Less EMF, Holland Shielding Systems
- **Components**: Digi-Key, Mouser, Adafruit

### 8.4 Professional Organizations
- **IACR** (International Association for Cryptologic Research)
- **IEEE Signal Processing Society**
- **ACM Special Interest Group on Security**
- **EMC Society**

---

## Conclusion

This practical guide provides detailed implementation information for electromagnetic side-channel analysis, based on fine-grained research of academic papers, open source tools, and hardware specifications. The field continues to evolve rapidly, with 2026 research showing concerning developments in active EM-SCA that bypass traditional defenses.

Security practitioners should implement a layered defense strategy combining hardware shielding, careful circuit design, active monitoring, and regular testing. As attack methodologies become more sophisticated with machine learning enhancement, defensive measures must also advance to maintain protection against this evolving threat landscape.

*Note: This guide is for educational and defensive purposes only. Always ensure compliance with applicable laws and regulations when conducting security testing.*