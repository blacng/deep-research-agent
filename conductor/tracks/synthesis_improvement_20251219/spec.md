# Spec: Enhanced Synthesis Agent

**Track:** Enhance the research agent's ability to synthesize information from multiple sources more effectively, providing a concise and coherent final report.

## 1. Overview

The current research agent produces a final report, but the synthesis of information from various sources can be improved. The goal of this track is to enhance the synthesis process to produce reports that are more coherent, well-structured, and directly answer the user's initial query.

## 2. Functional Requirements

1.  **Improved Coherence:** The final report should read as a single, cohesive document, not a collection of disjointed summaries.
2.  **Source Attribution:** While maintaining coherence, the report must still provide clear attribution to the original sources.
3.  **Directly Address Query:** The synthesis process should be guided by the initial user query, ensuring the final report is focused and relevant.
4.  **Handling Conflicting Information:** The synthesis agent should be able to identify and note conflicting information between sources.

## 3. Technical Requirements

1.  **New or Updated Synthesis Agent:** A new agent (`SynthesisAgent-v2`) will be created, or the existing synthesis/analyzer agent will be significantly updated.
2.  **Refined Prompt Engineering:** The prompt for the synthesis agent will be re-engineered to focus on narrative flow, critical analysis, and direct query relevance.
3.  **Evaluation Framework:** A basic evaluation framework will be created to compare the output of the old and new synthesis processes. This will likely involve running a set of benchmark queries and comparing the resulting reports.

## 4. Out of Scope

*   Major changes to the UI/UX of the report viewer.
*   Changes to the search or data extraction agents.
*   Real-time collaborative editing of the report.
