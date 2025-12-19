# 🔬 Deep Research Agent

> Multi-agent AI research system with real-time dashboard visualization

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Claude SDK](https://img.shields.io/badge/Claude-Agent%20SDK-CC785C)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)

A sophisticated multi-agent research system that orchestrates specialized AI agents to conduct comprehensive research on any topic. Features a real-time dashboard with interactive visualizations, live activity streaming, and automated report generation.

---

## 🔬 Features

- 🤖 **Multi-Agent Orchestration** - Hierarchical agent system with automatic task delegation
- 📊 **Real-Time Dashboard** - Interactive charts, metrics, and agent visualization
- 🔍 **Parallel Web Search** - Multiple searcher agents working simultaneously
- 📝 **Automated Reports** - Comprehensive markdown reports with citations
- 💰 **Cost Tracking** - Real-time token usage and API cost monitoring
- 🌊 **Live SSE Streaming** - Watch agents work in real-time
- 📈 **Activity Timeline** - Visualize tool calls and agent activity over time
- 🎯 **Agent Node Graph** - Interactive visualization of agent hierarchy and connections

---

## 🏗️ Architecture

The system uses a hierarchical multi-agent architecture where specialized agents collaborate to complete research tasks:

```
                    ┌─────────────────┐
                    │  🎯 Orchestrator │
                    │    (Coordinator) │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │ 🔍 Searcher │   │ 🔍 Searcher │   │ 🔍 Searcher │
    │  (Topic 1)  │   │  (Topic 2)  │   │  (Topic 3)  │
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                    ┌────────▼────────┐
                    │  📊 Analyzer    │
                    │  (Synthesis)    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  ✍️ Writer      │
                    │ (Report Gen)    │
                    └─────────────────┘
```

### Agent Roles

| Agent | Color | Responsibility |
|-------|-------|----------------|
| 🎯 **Orchestrator** | Violet | Breaks down topics, spawns agents, coordinates workflow |
| 🔍 **Searcher** | Blue | Researches specific subtopics using Exa search |
| 📊 **Analyzer** | Emerald | Cross-references findings, synthesizes insights |
| ✍️ **Writer** | Orange | Generates comprehensive markdown reports |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework with App Router |
| React 19 | UI library |
| Tailwind CSS 4 | Utility-first styling |
| shadcn/ui | Component library |
| Framer Motion | Animations and transitions |
| Recharts | Data visualization charts |
| React Flow | Interactive agent node graph |

### Backend
| Technology | Purpose |
|------------|---------|
| Claude Agent SDK | Multi-agent orchestration |
| Exa Search API | Web search and content retrieval |
| Winston | Structured logging with TOON format |
| Server-Sent Events | Real-time streaming |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key
- Exa API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd deep-research-agent

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

```bash
ANTHROPIC_API_KEY=sk-ant-...
EXA_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=info  # debug, info, warn, error
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 📊 Dashboard Features

### Metrics Grid
Real-time animated statistics showing:
- 🔍 Total searches performed
- 📄 Sources discovered
- 🤖 Active agents
- 💵 API costs

### Agent Node Graph
Interactive visualization powered by React Flow:
- Hierarchical agent layout
- Animated edges showing data flow
- Color-coded by agent role
- Click nodes for details

### Live Activity Feed
Auto-scrolling event stream showing:
- Tool calls with parameters
- Agent status updates
- Search results
- Error notifications

### Cost Breakdown Chart
Pie chart visualization of costs by:
- Agent role
- Tool type
- Model usage

### Activity Timeline
Area chart showing tool calls over time during research.

### Report Viewer
Enhanced markdown rendering with:
- Table of contents sidebar
- Syntax highlighting
- Citation formatting

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/research/      # SSE streaming endpoint
│   ├── page.tsx           # Main dashboard
│   └── globals.css        # Global styles
├── components/
│   ├── agents/            # Agent visualization
│   ├── dashboard/         # Header, query panel
│   ├── metrics/           # Stats, charts
│   ├── report/            # Report viewer
│   ├── stream/            # Live activity feed
│   └── ui/                # Base components
├── hooks/
│   ├── useResearch.ts     # Research state management
│   ├── useAgentGraph.ts   # Node/edge transformations
│   └── useTypewriter.ts   # Text animation
├── lib/
│   ├── agent/             # Multi-agent system
│   │   ├── agents/        # Agent implementations
│   │   ├── coordination/  # Activity tracking
│   │   ├── logging/       # Winston logger
│   │   ├── costs/         # Usage calculator
│   │   └── monitoring/    # Memory profiler
│   ├── animations.ts      # Framer Motion variants
│   └── chart-config.ts    # Recharts config
└── types/
    └── research.ts        # TypeScript types
```

---

## ⚙️ Configuration

### Logging

Logs are written in TOON format for token efficiency:
- `logs/combined.log` - All logs (10MB rotation)
- `logs/errors.log` - Errors only
- `logs/sessions/` - Per-session logs

### Model Pricing

| Model | Input | Output |
|-------|-------|--------|
| Claude Sonnet 4.5 | $3/M tokens | $15/M tokens |
| Claude Opus 4.5 | $15/M tokens | $75/M tokens |
| Claude Haiku 4 | $0.80/M tokens | $4/M tokens |

### Exa Pricing

| API | Cost |
|-----|------|
| Search | $0.50/1000 calls |
| Get Contents | $3/1000 calls |
| Find Similar | $0.50/1000 calls |

---

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

Built with Claude Agent SDK and Next.js
