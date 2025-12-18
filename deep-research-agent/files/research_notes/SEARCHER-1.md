# Multimodal LLM Architectures and Training Methodologies

## Overview
Recent advancements in Multimodal Large Language Models (MLLMs) have shifted from simple connector-based architectures to sophisticated native designs and sparse mixtures of experts. While initial models relied on static projection layers to bridge pre-trained vision encoders with LLMs, the field is moving towards **native multimodal training** (e.g., Emu3, Chameleon) where a single transformer processes interleaved sequences of discrete visual and textual tokens. This evolution is supported by innovations in **visual tokenization** (like MAGVIT-v2) and **Mixture of Experts (MoE)** architectures (e.g., MoE-LLaVA, MoME), which scale parameter counts efficiently while reducing inference costs. Additionally, **audio-visual fusion** has matured from simple feature concatenation to complex cross-modal attention mechanisms and token-based generation strategies like VITA-Audio, enabling real-time, interleaved communication.

## 1. Native Multimodal Training vs. Adapters

### Key Findings
*   **Native Training (Unified Architectures)**: Models like **Emu3.5** and **Chameleon** are trained from scratch (or extensively pre-trained) on interleaved sequences of text and visual tokens using a unified next-token prediction objective. This allows the model to "think" in multimodal concepts rather than translating between them.
*   **Adapter-Based Approaches**: The dominant paradigm (e.g., LLaVA, BLIP-2) uses a **projection layer** (Linear, MLP, or Q-Former) to align features from a frozen visual encoder (like CLIP or SigLIP) into the LLM's input space.
*   **Performance Trade-off**: Native models excel at fine-grained multimodal reasoning and generation (interleaved text-image output) but require massive compute (10T+ tokens). Adapter models are far more efficient to train but often struggle with fine-grained visual details due to the information bottleneck at the projection layer.

### Details
The distinction between native and adapter-based architectures defines the current landscape of MLLMs. 
**Adapter-based architectures** treat the LLM as a "reasoning engine" and the Vision Encoder as a "sensory organ." The adapter (or connector) acts as a translator. For instance, **MAGMA** and **LLaVA** use learnable projection layers to map continuous visual embeddings into the LLM's word embedding space. While computationally efficient, this approach often freezes the core LLM, limiting its ability to deeply integrate visual semantics.

**Native architectures**, represented by **Emu3.5**, treat images and text as dialects of the same language. By tokenizing images (via VQ-VAE or similar) into discrete tokens, the model is trained with a single objective: `P(next_token | context)`, where the token could be text or an image patch. Emu3.5, for example, trains on over 10 trillion interleaved tokens, achieving "world model" capabilities where it can simulate video sequences or reason about physics directly, rather than just describing static images.

## 2. Visual Tokenization Techniques

### Key Findings
*   **Discrete Visual Tokens**: Essential for native multimodal generation (e.g., **MAGVIT-v2**). These tokenizers map continuous pixel data into a finite codebook of discrete tokens (integers), allowing standard LLM transformers to process and generate images.
*   **Continuous Feature Alignment**: Used primarily for understanding (e.g., CLIP-ViT). Here, the "tokens" are continuous vector embeddings from image patches, not discrete integers.
*   **Hybrid Approaches (Transfusion)**: A new methodology that bypasses discrete tokenization for generation. **Transfusion** combines next-token prediction for text with diffusion losses for continuous image data within a single transformer, avoiding the compression artifacts of VQ-VAEs.

### Details
The choice of tokenizer dictates whether a model can *generate* images or merely *understand* them.
**MAGVIT-v2** represents the state-of-the-art in discrete tokenization. It uses a 3D-VQ-VAE to tokenize videos and images into a shared vocabulary. A key innovation is its "lookup-free" quantization, which improves the quality of reconstructed images, making it feasible for an LLM to generate high-fidelity visual content by predicting visual tokens.

In contrast, **Transfusion** argues that discrete tokenization is suboptimal for visual data because it discards too much information. Instead of forcing images into discrete codes, the Transfusion architecture modifies the LLM's attention mechanism to handle continuous latent vectors for images (trained via diffusion loss) while keeping discrete tokens for text. This results in a "best of both worlds" architecture: the discrete reasoning of an LLM with the high-fidelity generation of a diffusion model.

## 3. Mixture of Experts (MoE) in Multimodal Models

### Key Findings
*   **Sparse Activation**: MoE architectures (e.g., **MoE-LLaVA**) significantly reduce training and inference costs by activating only a subset of parameters (experts) for each token. MoE-LLaVA-1.8B achieves performance comparable to dense 7B models.
*   **Modality-Specific Experts**: **MoME** (Mixture of Multimodal Experts) introduces the concept of splitting experts by role: "Mixture of Vision Experts" (MoVE) to handle visual encoding and "Mixture of Language Experts" (MoLE) for reasoning, reducing interference between modalities.
*   **MoE-Tuning**: A specialized three-stage training strategy (found in MoE-LLaVA) that turns a dense model into a sparse MoE model, stabilizing the typically volatile MoE training process.

### Details
Scaling dense multimodal models is computationally prohibitive. **MoE-LLaVA** addresses this by employing a sparse router that directs tokens to the top-k most relevant experts. This allows the model to have a massive total parameter count (high capacity) while keeping the "active" parameters low (fast inference). 

A critical insight from **MoME** is that generalist MLLMs often suffer from **task interference**—where improving visual capability degrades text reasoning. MoME solves this by decoupling the experts. It uses adaptively gated vision experts to process visual features before they even reach the LLM, effectively allowing the model to switch its "vision processing strategy" dynamically based on the input image type (e.g., document vs. natural scene).

## 4. Audio-Visual Fusion Strategies

### Key Findings
*   **Interleaved Generation**: **VITA-Audio** introduces a "Multiple Cross-modal Token Prediction" (MCTP) module. Instead of generating one audio token at a time (slow), it predicts multiple future audio tokens in parallel alongside text, enabling near-instantaneous speech response.
*   **Clue Aggregation**: **CAT** (Clue Aggregator Transformer) moves beyond simple concatenation. It uses a query-based aggregator to extract relevant "clues" from dynamic audio-visual streams, reducing ambiguity when audio and video contain conflicting or complementary information.
*   **Early vs. Late Fusion**: While text-vision models often favor late fusion (adapter-based), high-performance audio-visual models increasingly favor **early or intermediate fusion** to capture the tight temporal synchronization required for tasks like speaker diarization or emotion analysis.

### Details
Audio-visual fusion presents unique challenges due to the temporal nature of both signals.
**VITA-Audio** represents a breakthrough in "interactive" fusion. It treats audio not just as an input to be understood, but as a first-class citizen for generation. Its architecture allows the LLM to output "audio tokens" interleaved with text. The MCTP module addresses the latency bottleneck by predicting a block of audio tokens at once, making real-time spoken conversation with the AI possible.

**CAT** focuses on