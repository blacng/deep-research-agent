# Architectures and Frameworks of Agentic GraphRAG

## Overview
Agentic GraphRAG represents the convergence of Knowledge Graphs (KGs) with Agentic reasoning. While traditional RAG retrieves static text chunks based on vector similarity, Agentic GraphRAG employs autonomous agents to navigate, query, and reason over structured graph data. This field is currently dominated by two distinct architectural paradigms: **Microsoft's GraphRAG** (focused on pre-computed hierarchical summarization) and **LangGraph/LangChain** implementations (focused on dynamic, multi-hop reasoning loops).

## 1. Microsoft GraphRAG Architecture

Microsoft’s GraphRAG is designed to solve "global" queries (e.g., "What are the main themes in this dataset?") which traditional vector RAG struggles to answer. It relies heavily on an intensive **indexing phase** to pre-compute knowledge.

### Key Findings
- **Hierarchical Leveled Summaries**: The core innovation is the creation of community summaries at multiple levels of granularity. The system uses the **Leiden algorithm** to detect communities of closely related entities [Welcome to GraphRAG](https://microsoft.github.io/graphrag/).
- **Two-Step Pipeline**:
    1.  **Indexing (ETL)**: Turns raw text into a graph, detects communities, and generates natural language summaries for every community.
    2.  **Querying**: Supports "Global Search" (using summaries) and "Local Search" (using entity neighbors).
- **Performance**: Microsoft research indicates this method significantly outperforms baseline RAG on comprehensive Q&A tasks involving entire datasets.

### Detailed Architecture
The Microsoft GraphRAG architecture flows as follows:
1.  **Text Chunking**: Source documents are split into chunks.
2.  **Element Extraction**: An LLM extracts entities and relationships from each chunk to form a graph.
3.  **Community Detection**: The graph is clustered using the Leiden algorithm to find hierarchical communities (e.g., Level 0: "Tech Industry", Level 1: "Microsoft", "Apple").
4.  **Community Summarization**: An LLM generates a summary for every community node.
5.  **Global Search**: When a user asks a high-level question, the system aggregates relevant community summaries rather than retrieving raw text chunks, ensuring a holistic answer.

## 2. LangGraph and LangChain Implementations

Unlike Microsoft’s pre-computation focus, LangGraph (built on LangChain) focuses on **runtime orchestration**. It models the RAG process itself as a graph (StateGraph), where nodes are agents or tools and edges are control flow conditions.

### Key Findings
- **StateGraph Architecture**: LangGraph allows developers to build "cyclic" graphs where an agent can loop back to a previous state (e.g., *Retrieve -> Grade -> Re-write -> Retrieve again*) [Built with LangGraph! #18](https://medium.com/codetodeploy/built-with-langgraph-18-rag-agents-b1c0bb0832f6).
- **Human-in-the-Loop**: The architecture supports breakpoints where the agent pauses for human approval before executing a graph query or generating a final answer.
- **Dynamic Query Construction**: Agents in this framework often use tools like `GraphCypherQAChain` to translate natural language into Cypher queries (for Neo4j) dynamically at runtime.

### Detailed Implementation
A typical LangGraph Agentic RAG workflow involves:
*   **Router Node**: Decides whether the query requires a vector search (for semantic similarity) or a graph search (for structural relationships).
*   **Retrieval Node**: Executes the search. In a graph context, this might be a "neighbor expansion" (finding all nodes connected to entity X).
*   **Grader Node**: An LLM evaluates the retrieved documents/triples. If they are insufficient, the flow cycles back to the Retrieval Node with a rewritten query.

## 3. Agent Reasoning Loops on Knowledge Graphs

Agentic reasoning transforms the Knowledge Graph from a static database into an environment for exploration. This is often referred to as "Multi-Hop Reasoning" or "Chain-of-Thought on Graphs."

### Key Findings
- **Iterative Exploration (INRAExplorer)**: Recent research demonstrates agents that perform "multi-hop" retrieval. The agent retrieves a node, analyzes its neighbors, and decides which path to follow next, mimicking human research behavior [Agentic RAG with Knowledge Graphs](https://arxiv.org/html/2507.16507v1).
- **Plan-Execute-Observe**:
    1.  **Plan**: Agent breaks a complex question (e.g., "Who co-authored with the inventor of X?") into sub-steps.
    2.  **Execute**: Agent queries the graph for "Inventor of X".
    3.  **Observe**: Agent gets "Person A".
    4.  **Loop**: Agent generates a new query for "Co-authors of Person A".
- **Self-Correction**: If a graph path leads to a dead end (no relevant connections), the agent can backtrack and try a different relationship type.

## 4. Graph Construction Methodologies

The quality of Agentic GraphRAG depends entirely on the quality of the underlying graph. Construction has moved from manual ontology engineering to LLM-driven pipelines.

### Key Findings
- **LLM-Based Extraction**: The standard approach now involves prompting an LLM to extract triplets (`Subject`, `Predicate`, `Object`) from unstructured text.
- **Ontology Mapping vs. Schema-Free**:
    -