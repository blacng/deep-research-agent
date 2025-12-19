# Architectures and Training Techniques for Multimodal LLMs

## Overview
The landscape of Multimodal Large Language Models (MLLMs) in 2023-2024 has shifted from simple "connector" architectures to complex, native integration strategies. While earlier models relied on static adapters to bridge frozen vision encoders with LLMs, recent research (2024) emphasizes **Mixture of Experts (MoE)**, **Mixture of Encoders**, and **Native (Early Fusion)** training to improve efficiency, reduce hallucinations, and handle multiple modalities like audio and video seamlessly.

## 1. Native Multimodal Training vs. Adapters

The fundamental architectural debate in MLLMs centers on how to combine visual/audio perception with text generation.

### Key Findings
*   **Adapter/Late-Fusion Dominance**: Most open-source MLLMs (e.g., LLaVA, classic GPT-4V imitators) use a "Late Fusion" strategy. They connect a pre-trained, frozen vision encoder (like CLIP or SigLIP) to an LLM via a trainable adapter (Linear Projection, MLP, or Q-Former).
*   **Shift to Native (Early Fusion)**: Recent research challenges the adapter approach. "Native" models are trained from scratch on mixed multimodal data (images + text tokens interleaved) without relying on a separate, pre-trained frozen vision encoder.
*   **Scaling Laws Favor Early Fusion**: Native "Early Fusion" models demonstrate stronger performance at lower parameter counts compared to adapter-based models. They are more efficient to train and easier to deploy because they eliminate the need for managing separate vision encoders.

### Details
In the **Adapter** paradigm, the visual encoder compresses images into feature embeddings, which the adapter then projects into the LLM's token space. While efficient (the LLM remains frozen or LoRA-tuned), this often results in a loss of fine-grained visual detail.
In contrast, **Native** models (exemplified by recent "Early Fusion" studies and proprietary models like GPT-4o) treat image patches as just another language token from the start. A 2024 study on "Scaling Laws for Native Multimodal Models" suggests that this approach allows the model to learn modality-specific weights more effectively, avoiding the bottleneck of a frozen visual encoder.

## 2. Visual and Audio Encoders Integration

Researchers are moving beyond single-encoder architectures to "Mixtures of Encoders" to capture diverse visual and audio features.

### Key Findings
*   **Mixture of Vision Encoders (Eagle)**: A single vision encoder (e.g., CLIP) often limits performance. The **Eagle** architecture (2024) demonstrates that using a set of complementary vision encoders (e.g., CLIP + ConvNeXt + SAM) significantly boosts performance.
*   **Concatenation Efficacy**: Surprisingly, Eagle found that simply *concatenating* the visual tokens from these different encoders is as effective as complex fusion strategies.
*   **Audio-Language Integration (Qwen2-Audio)**: For audio, models like **Qwen2-Audio** (2024) utilize natural language prompts to manage different