# State-of-the-Art Multimodal Models and Benchmarking

## Overview
The landscape of Large Multimodal Models (LMMs) has shifted rapidly in 2024, characterized by the emergence of "omni-capable" models like **GPT-4o** and the narrowing gap between proprietary and open-source models. **InternVL 2.5** and **LLaVA-NeXT** now rival or exceed leading proprietary systems on key benchmarks like **MMMU** and **MathVista**, signaling a democratization of high-tier multimodal intelligence.

---

## 1. Leading Proprietary Models

Proprietary models remain the gold standard for integrated "omni" capabilities (text, audio, vision, video) and ease of use via API.

### Key Findings
- **GPT-4o (OpenAI):** Currently leads many general multimodal benchmarks, achieving **69.1% on MMMU** (the highest among major proprietary models) [OpenAI GPT-4o](https://openai.com/index/hello-gpt-4o/).
- **Claude 3.5 Sonnet (Anthropic):** Recognized for superior performance in complex visual reasoning and coding, scoring **67.7% on MathVista** and **94.7% on AI2D** [Anthropic News](https://www.anthropic.com/news/claude-3-5-sonnet).
- **Gemini 1.5 Pro (Google):** Features a massive 2-million-token context window, making it the leader for "Long-Context Multimodal" tasks (e.g., searching hours of video). It scores **62.2% on MMMU** [Gemini 1.5 Report](https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/).

### Details
**GPT-4o** is a natively multimodal model trained across text, audio, and vision simultaneously. This allows it to handle real-time interaction with much lower latency than previous pipelined models. **Claude 3.5 Sonnet** has shown a specialized edge in technical diagrams and document understanding (DocVQA), often surpassing GPT-4o in specific visual reasoning tasks despite slightly lower general MMMU scores. **Gemini 1.5 Pro** remains the most capable for video analysis and large-scale document processing due to its architectural focus on long-range dependencies.

---

## 2. Open-Source Advancements

The "open-source" (or open-weights) ecosystem has made unprecedented leaps, with InternVL 2.5 currently claiming the title of the world's most capable open-source LMM.

### Key Findings
- **InternVL 2.5 (OpenGVLab):** Claims parity with GPT-4o, scoring **70.3% on MMMU** and a record **71.2% on MathVista** [InternVL 2.5 Blog](https://internvl.github.io/blog/2024-12-05-InternVL-2.5/).
- **LLaVA-NeXT (LLaVA-VL):** Uses "stronger LLMs" (like Qwen-1.5 72B) to supercharge multimodal reasoning. It has demonstrated performance surpassing Gemini Pro on certain benchmarks like **MathVista** [LLaVA-NeXT Blog](https://llava-vl.github.io/blog/2024-05-10-llava-next-stronger-llms/).
- **Yi-VL / Yi-Vision (01.AI):** Integrated into the Yi-1.5 series, these models focus on efficiency and high-resolution visual processing (up to 1024x1024), providing strong competition in the 6B-34B parameter range.

### Details
**InternVL 2.5** introduces several innovations: **dynamic high-resolution** (splitting images into 448x448 patches based on aspect ratio) and **Test-Time Scaling**, which allows the model to "think longer" about complex visual tasks. **LLaVA-NeXT** focuses on a cost-effective training recipe that leverages existing high-quality LLM backbones (LLaMA-3, Qwen) and high-quality instruction-following data to bridge the gap with proprietary systems.

---

## 3. Performance on Multimodal Benchmarks

Benchmarks have evolved to move past simple object recognition into "expert-level" reasoning and multidisciplinary knowledge.

### Key Findings
- **MMMU (Massive Multi-discipline Multimodal Understanding):** The primary benchmark for "Expert AGI," covering college-level problems. Top models are now hitting the **70% mark**, approaching human expert levels [MMMU Benchmark](https://mmmu-benchmark.github.io/).
- **MathVista:** Specifically evaluates mathematical reasoning in visual contexts (e.g., geometry, charts). **InternVL 2.5** currently leads with **71.2%** [InternVL 2.5 Report](https://huggingface.co/papers/2412.05271).
- **Seed-Bench:** A comprehensive benchmark for both image and video understanding. It is often used to test spatial reasoning and temporal understanding in videos.

### Details
The industry is moving toward **MMMU-Pro**, a more robust version of MMMU designed to prevent data leakage and provide a cleaner assessment of model reasoning [MMMU-Pro arXiv](https://arxiv.org/html/2409.02813v2). Another notable trend is the use of **VISTA** (Scale AI), a rubric-based assessment that evaluates the "process" of visual reasoning rather than just the final answer accuracy [Scale AI VISTA](https://scale.com/leaderboard/visual_language_understanding).

---

## Cross-Cutting Insights
- **The "Dynamic Resolution" Trend:** Almost all top models (InternVL, LLaVA-NeXT, Claude 3.5) have moved away from fixed-size image resizing in favor of dynamic patching, which preserves fine-grained details in documents and charts.
- **Open-Source Parity:** For the first time, open-source models like InternVL 2.5 are reporting scores (70%+ on MMMU) that are statistically indistinguishable from or better than the leading proprietary models (GPT-4o at 69.1%).
- **Shift to Reasoning:** Pure "perception" is considered solved; current benchmarking focus is heavily skewed toward **Math reasoning** (MathVista) and **Scientific knowledge** (MMMU), where models still struggle with multi-step logic.

---

## Sources Summary
- [InternVL 2.5: Expanding Performance Boundaries](https://internvl.github.io/blog/2024-12-05-InternVL-2.5/) - Authority: High (Creators of InternVL), Dec 2024.
- [MMMU Benchmark Leaderboard](https://mmmu-benchmark.github.io/) - Authority: Academic Standard (Ohio State/Waterloo), 2024.
- [Anthropic: Claude 3.5 Sonnet Announcement](https://www.anthropic.com/news/claude-3-5-sonnet) - Authority: High (Anthropic), June 2024.
- [OpenAI: Hello GPT-4o](https://openai.com/index/hello-gpt-4o/) - Authority: High (OpenAI), May 2024.
- [LLaVA-NeXT: Stronger LLMs Blog](https://llava-vl.github.io/blog/2024-05-10-llava-next-stronger-llms/) - Authority: High (Research community), May 2024.

## Research Notes
- **Total sources reviewed:** 15+
- **Most authoritative source:** MMMU Benchmark official site and InternVL 2.5 Technical Report.
-