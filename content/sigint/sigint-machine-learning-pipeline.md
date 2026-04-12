# Machine Learning Pipelines for SIGINT Applications (2025-2026)

## Introduction

Modern Signals Intelligence (SIGINT) systems have undergone a paradigm shift from rule-based, manually crafted processing chains to end-to-end machine learning (ML) pipelines. As of 2025-2026, these pipelines leverage deep learning, foundation models, and optimized edge deployment to handle the complexity, volume, and dynamic nature of the RF spectrum. This article details the architecture, components, and implementation of contemporary ML pipelines for SIGINT, covering signal acquisition to actionable intelligence.

## Signal Preprocessing

Raw RF signals are typically captured as In-phase/Quadrature (IQ) samples by software-defined radios (SDRs) or dedicated hardware. Preprocessing transforms these time-series samples into representations suitable for neural network ingestion.

**IQ Samples**: Complex-valued baseband samples, typically at rates from 1 kHz to 100+ MHz. Preprocessing includes DC removal, normalization, and segmentation into fixed-length windows (e.g., 1024 samples).

**Spectrogram Generation**: A Short-Time Fourier Transform (STFT) converts IQ samples to a time-frequency representation. Common parameters: 256-point FFT, Hann window, 50% overlap, yielding a 128x128 pixel spectrogram. This is the primary input for 2D convolutional neural networks (CNNs).

**Wavelet Transforms**: The Continuous Wavelet Transform (CWT) provides multi-resolution analysis, beneficial for non-stationary signals and pulsed waveforms. The Scalogram (magnitude of CWT) serves as an alternative to spectrograms.

```python
import numpy as np
import torch
import librosa

def preprocess_iq_to_spectrogram(iq_samples, fs=2e6, n_fft=256, hop_length=128):
    """
    Convert complex IQ samples to log-scaled spectrogram.
    iq_samples: np.ndarray, complex, shape (n_samples,)
    Returns: np.ndarray, shape (1, 128, 128) normalized to [0,1]
    """
    # Normalize power
    iq_normalized = iq_samples / np.sqrt(np.mean(np.abs(iq_samples)**2))
    
    # Compute STFT magnitude
    stft = librosa.stft(iq_normalized, n_fft=n_fft, hop_length=hop_length)
    spectrogram = np.abs(stft)
    
    # Log scaling, crop to 128x128
    log_spec = np.log10(spectrogram[:128, :128] + 1e-10)
    
    # Normalize per sample
    log_spec = (log_spec - log_spec.mean()) / (log_spec.std() + 1e-10)
    
    return torch.tensor(log_spec).unsqueeze(0)  # Add channel dim

def generate_cwt_scalogram(iq_samples, fs=2e6, scales=np.arange(1, 128)):
    """
    Generate CWT scalogram using Morlet wavelet.
    Returns: np.ndarray, shape (1, len(scales), time_steps)
    """
    import pywt
    coefficients, frequencies = pywt.cwt(iq_samples.real, scales, 'morl', sampling_period=1/fs)
    scalogram = np.abs(coefficients)
    # Resize to fixed dimensions, e.g., 128x128
    return torch.tensor(scalogram).unsqueeze(0)
```

## Automatic Modulation Classification (AMC)

AMC is a core SIGINT task, identifying modulation schemes (e.g., BPSK, QPSK, 16-QAM, FM, AM) from intercepted signals. Architectures have evolved from CNNs to transformers and hybrids.

**CNN-Based Architectures**: The 2018 RadioML 2018.01A benchmark popularized CNNs like VGG and ResNet variants, achieving >90% accuracy at high SNR. These models process spectrograms, exploiting local time-frequency patterns.

**Transformer-Based Architectures**: Vision Transformers (ViTs) applied to spectrograms capture long-range dependencies across time and frequency. As of 2025, models like RF-ViT-Base (12 layers, 768 embedding) achieve state-of-the-art (SOTA) on low-SNR (<0 dB) datasets, with 5-8% higher accuracy than CNNs at -10 dB SNR.

**Hybrid CNN-Transformer Architectures**: The dominant architecture in 2025-2026 uses a CNN stem for local feature extraction, followed by transformer blocks for global context. The **RF-Conformer** (CNN + Transformer) reduces misclassification between similar modulations (e.g., QPSK vs. 8-PSK) by 30% compared to pure CNNs.

```python
import torch.nn as nn
import torch.nn.functional as F
from transformers import ViTModel

class RFConformer(nn.Module):
    """
    Hybrid CNN-Transformer for AMC.
    Input: (batch, 1, 128, 128) spectrogram
    Output: (batch, n_classes) logits
    """
    def __init__(self, n_classes=24, embed_dim=768, num_heads=12):
        super().__init__()
        # CNN stem
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(3, stride=2),
            nn.Conv2d(64, embed_dim, kernel_size=1)  # Project to transformer dim
        )
        
        # Transformer encoder (ViT backbone)
        self.transformer = ViTModel.from_pretrained('google/vit-base-patch16-224-in21k')
        # Replace patch embedding with identity (we already have features)
        self.transformer.embeddings.patch_embeddings = nn.Identity()
        
        # Classifier
        self.classifier = nn.Linear(embed_dim, n_classes)
        
    def forward(self, x):
        # CNN feature extraction
        features = self.cnn(x)  # (batch, embed_dim, H', W')
        batch, dim, h, w = features.shape
        features = features.flatten(2).transpose(1, 2)  # (batch, seq_len, embed_dim)
        
        # Transformer
        transformer_out = self.transformer(inputs_embeds=features)
        pooled = transformer_out.last_hidden_state[:, 0, :]  # CLS token
        
        return self.classifier(pooled)
```

## Geolocation

ML enhances traditional geolocation techniques (AOA, TDOA, FDOA) by fusing multi-sensor data and correcting for environmental effects.

**AOA/TDOA/FDOA Fusion**: Deep neural networks fuse measurements from distributed sensors. A 2025 SOTA model, **GeoFusionNet**, uses a graph neural network (GNN) over sensor nodes, incorporating signal strength, time differences, and Doppler shifts. It reduces median geolocation error to <50 meters in urban environments, compared to >200 meters for Kalman filter fusion.

**Satellite-Based SIGINT**: Low Earth Orbit (LEO) constellations (e.g., SpaceX Starlink, BlackSky) provide persistent RF monitoring. ML pipelines on-board satellites perform initial signal detection and characterization, downlinking only features to ground stations. A 2026 implementation uses quantized models (INT8) running on NVIDIA Jetson Orin modules in space, achieving 95% detection probability for emitters with >10 W ERP.

```python
import torch
import torch_geometric.nn as geom_nn

class GeoFusionNet(torch.nn.Module):
    """
    GNN for AOA/TDOA/FDOA fusion.
    Input: Graph with nodes=sensors, edges=measurement pairs
    Node features: [sensor_lat, sensor_lon, AOA_measurement, SNR]
    Edge features: [TDOA, FDOA]
    Output: Emitter (lat, lon) estimate
    """
    def __init__(self, node_dim=4, edge_dim=2, hidden_dim=128):
        super().__init__()
        self.node_encoder = nn.Sequential(
            nn.Linear(node_dim, hidden_dim),
            nn.ReLU()
        )
        self.edge_encoder = nn.Sequential(
            nn.Linear(edge_dim, hidden_dim),
            nn.ReLU()
        )
        # Graph convolution layers
        self.conv1 = geom_nn.GATConv(hidden_dim, hidden_dim, edge_dim=hidden_dim)
        self.conv2 = geom_nn.GATConv(hidden_dim, hidden_dim, edge_dim=hidden_dim)
        
        # Global pooling and regression
        self.pool = geom_nn.global_mean_pool
        self.regressor = nn.Sequential(
            nn.Linear(hidden_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 2)  # lat, lon
        )
        
    def forward(self, data):
        x, edge_index, edge_attr = data.x, data.edge_index, data.edge_attr
        x = self.node_encoder(x)
        edge_attr = self.edge_encoder(edge_attr)
        
        x = self.conv1(x, edge_index, edge_attr)
        x = F.relu(x)
        x = self.conv2(x, edge_index, edge_attr)
        
        # Global mean pooling over sensor nodes
        x = self.pool(x, data.batch)
        return self.regressor(x)
```

## Anomaly Detection for Spectrum Monitoring

Unsupervised and self-supervised ML models identify anomalous signals (e.g., unauthorized transmissions, interference, new waveforms) in wideband spectrum data.

**Architectures**: Autoencoders (AEs) and Variational Autoencoders (VAEs) learn compressed representations of "normal" spectrum activity. The **Spectrum-VQVAE** (Vector Quantized VAE) from MIT Lincoln Lab (2025) achieves 0.95 AUC-ROC on detecting rogue LTE signals in 20 MHz bandwidth captures. Transformer-based models like **RF-AnomalyTransformer** use attention mechanisms to flag temporal irregularities in spectrum occupancy.

**Deployment**: Real-time anomaly detection runs on edge SDR platforms (e.g., Ettus USRP X410, NVIDIA SDR). A 2026 benchmark shows inference times <5 ms per 10 ms spectrum window on an NVIDIA Jetson AGX Orin.

```python
class SpectrumVQVAE(nn.Module):
    """
    Vector Quantized VAE for spectrum anomaly detection.
    Input: (batch, 1, 128, 128) spectrogram
    Output: Reconstruction, used to compute anomaly score.
    """
    def __init__(self, num_embeddings=512, embedding_dim=64):
        super().__init__()
        # Encoder
        self.encoder = nn.Sequential(
            nn.Conv2d(1, 32, 4, stride=2, padding=1),  # 64x64
            nn.ReLU(),
            nn.Conv2d(32, 64, 4, stride=2, padding=1), # 32x32
            nn.ReLU(),
            nn.Conv2d(64, embedding_dim, 1)            # 32x32, embedding_dim
        )
        
        # Vector quantization
        self.vq = VectorQuantizer(num_embeddings, embedding_dim)
        
        # Decoder
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(embedding_dim, 64, 4, stride=2, padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(64, 32, 4, stride=2, padding=1),
            nn.ReLU(),
            nn.ConvTranspose2d(32, 1, 4, stride=2, padding=1),
            nn.Sigmoid()
        )
        
    def forward(self, x):
        z = self.encoder(x)
        z_q, vq_loss, _ = self.vq(z)
        x_recon = self.decoder(z_q)
        return x_recon, vq_loss
    
    def anomaly_score(self, x):
        """Compute reconstruction error as anomaly score."""
        with torch.no_grad():
            x_recon, _ = self.forward(x)
            score = F.mse_loss(x_recon, x, reduction='none').mean(dim=(1,2,3))
        return score.cpu().numpy()
```

## Foundation Models for RF

Large-scale pre-trained models, analogous to GPT for language, are revolutionizing RF signal processing.

**RFML (Radio Foundation Model)**: A 1.5-billion parameter transformer pre-trained on 10,000 hours of diverse RF signals (communications, radar, IoT). RFML demonstrates >70% accuracy on zero-shot modulation classification across 15 unseen modulations.

**RadioGPT**: A multi-modal model combining RF signal encoders with a large language model (LLM). It accepts natural language queries (e.g., "Find all frequency-hopping signals above 2 GHz") and outputs detection results or synthesized signal descriptions.

**SpectrumFM**: A diffusion model trained on spectrograms, capable of generating realistic RF signals for training data augmentation. In 2026, SpectrumFM-2B generates high-fidelity LTE and 5G NR signals with configurable channel impairments.

```python
from transformers import AutoModel, AutoTokenizer

class RadioGPTInference:
    """
    Interface to RadioGPT for natural language spectrum queries.
    """
    def __init__(self, model_id="mit-ll/RadioGPT-7B"):
        self.rf_encoder = AutoModel.from_pretrained("mit-ll/RFML-1B")
        self.llm = AutoModel.from_pretrained(model_id)
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
        
    def query_spectrum(self, spectrogram, text_query):
        """
        spectrogram: (1, 128, 128) tensor
        text_query: str, e.g., "What modulation is this?"
        Returns: str answer
        """
        # Encode RF input
        rf_features = self.rf_encoder(spectrogram.unsqueeze(0)).last_hidden_state
        
        # Encode text
        text_input = self.tokenizer(text_query, return_tensors="pt")
        
        # Fuse features (simplified)
        fused = torch.cat([rf_features.mean(dim=1), 
                          text_input['input_ids'].float()], dim=1)
        
        # Generate response (pseudocode)
        output_ids = self.llm.generate(inputs_embeds=fused, max_length=50)
        return self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
```

## Edge Deployment

Real-time SIGINT requires optimized inference on size, weight, and power (SWaP)-constrained platforms.

**TensorRT Optimization**: NVIDIA's TensorRT compiles models to optimized engines. A ResNet-50 for AMC sees 4.2x speedup (12 ms to 2.8 ms per inference) on Jetson AGX Orin with FP16 precision.

**ONNX Quantization**: The Open Neural Network Exchange (ONNX) runtime with quantization (INT8) reduces model size by 75% with <1% accuracy drop. A 2025 deployment on Xilinx RFSoC quantizes the RF-Conformer to 8 MB, enabling 100 inferences per second on 4x4 MIMO streams.

**Real-Time SDR Pipeline**: The GNU Radio framework integrates ML blocks via TensorFlow Lite or ONNX Runtime. A 2026 reference design processes 40 MHz bandwidth in real-time on an Intel i7-12800H with NVIDIA RTX A2000, performing AMC, anomaly detection, and geolocation fusion simultaneously.

```python
# TensorRT deployment pseudocode for AMC
import tensorrt as trt
import pycuda.driver as cuda

def build_trt_engine(onnx_path, engine_path, fp16=True):
    """
    Build TensorRT engine from ONNX model.
    """
    logger = trt.Logger(trt.Logger.WARNING)
    builder = trt.Builder(logger)
    network = builder.create_network(1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))
    parser = trt.OnnxParser(network, logger)
    
    with open(onnx_path, 'rb') as model:
        parser.parse(model.read())
    
    config = builder.create_builder_config()
    if fp16 and builder.platform_has_fast_fp16:
        config.set_flag(trt.BuilderFlag.FP16)
    
    # Optimize for Jetson Orin
    config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 1 << 30)  # 1 GB
    engine = builder.build_engine(network, config)
    
    with open(engine_path, 'wb') as f:
        f.write(engine.serialize())
    
    return engine

# ONNX quantization example
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

def quantize_onnx_model(input_model, output_model):
    """
    Dynamic quantization to INT8.
    """
    quantize_dynamic(
        input_model,
        output_model,
        weight_type=QuantType.QInt8,
        per_channel=True,
        reduce_range=True
    )
```

## Training Datasets

High-quality, diverse datasets are critical for training robust SIGINT ML models.

**RadioML 2023.01A**: An expansion of the classic dataset, containing 2.4 million IQ samples across 30 modulations, SNRs from -20 dB to +30 dB, and realistic channel impairments (multipath, phase offset). It remains the primary benchmark for AMC.

**CORES (Crowdsourced Open RF Signals)**: A 2025 initiative collecting 50+ TB of real-world signals from distributed SDRs. CORES includes GPS, ADS-B, LoRa, 5G, and Starlink signals with precise metadata.

**Synthetic Generation with GNU Radio**: Custom datasets are generated using GNU Radio flowgraphs with controlled parameters. A 2026 workflow uses **GR-ML-Synth** to produce 100,000 signals per hour with randomized modulations, frequencies, and impairments.

```python
# Synthetic dataset generation with GNU Radio companion API
import gr_tools  # Hypothetical GNU Radio Python API

def generate_synthetic_dataset(num_samples=100000, sample_rate=2e6):
    """
    Generate synthetic signals using GNU Radio flowgraph.
    """
    dataset = []
    modulations = ['bpsk', 'qpsk', '16qam', '64qam', 'fm', 'am']
    
    for i in range(num_samples):
        # Random parameters
        mod = np.random
---

## See Also

| Article | Relationship |
|---------|-------------|
| [sigint-academic-research-overview.md](sigint-academic-research-overview.md) | Academic research context — RadioML benchmarks, AMC state-of-the-art, geolocation |
| [rf-fingerprinting-device-identification.md](rf-fingerprinting-device-identification.md) | SEI/RF fingerprinting — a specialized ML task covered here in depth |
| [sdr-tools-landscape-2026.md](sdr-tools-landscape-2026.md) | Hardware (RTL-SDR, HackRF, USRP) that feeds IQ samples into these pipelines |
| [entry-level-em-sca-setup.md](entry-level-em-sca-setup.md) | Entry-level SDR setup for initial signal collection and pipeline experiments |
| [electromagnetic-side-channel-practical-guide.md](electromagnetic-side-channel-practical-guide.md) | DL-based attack pipelines for EM-SCA — complementary ML application |
| [coursera-sigint.md](coursera-sigint.md) | Phase 4 (ML for Signals) in the learning path is the prerequisite for this article |
| [sigint-private-companies-em-intelligence.md](sigint-private-companies-em-intelligence.md) | Defense companies deploying operational versions of the pipelines described here |

> **See also:** [contacts.md](contacts.md) — individual researchers | [organizations.md](organizations.md) — all companies, institutions & standards bodies
