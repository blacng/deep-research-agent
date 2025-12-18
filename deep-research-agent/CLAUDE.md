# Deep Research Agent - Claude Instructions

## Project Overview

This is a multi-agent research system built with Next.js, React, and the Claude Agent SDK. It demonstrates advanced agentic patterns including hierarchical task delegation, parallel execution, and comprehensive observability.

**Tech Stack:**
- Next.js 16 (App Router)
- React 19
- Claude Agent SDK v0.1.69
- Exa-JS for search
- Winston for logging
- TypeScript

## Architecture

### Multi-Agent Hierarchy

1. **Orchestrator Agent** - Main coordinator (orchestrator.ts:33-244)
   - Breaks research topic into 3-5 subtopics
   - Spawns Searcher agents in parallel
   - Coordinates Analyzer and Writer sequentially
   - Uses custom SDK MCP server for spawn tools

2. **Searcher Agents** - Parallel workers (searcher.ts:33-164)
   - Research specific subtopics using Exa tools
   - Multiple instances run simultaneously
   - Save findings to `files/research_notes/`

3. **Analyzer Agent** - Synthesis (analyzer.ts:32-138)
   - Reads all Searcher findings
   - Cross-references and synthesizes
   - Saves analysis to `files/analysis/`

4. **Writer Agent** - Report generation (writer.ts:31-154)
   - Creates final markdown report
   - Includes citations and structure
   - Saves to `files/reports/`

### Communication Patterns

- **Tool-Based Delegation**: Orchestrator uses `spawn_*` tools to create subagents
- **File-Based State**: Agents share data via markdown files in `files/` directory
- **SDK Hooks**: Track tool usage via PreToolUse/PostToolUse hooks
- **Streaming**: Real-time updates via Server-Sent Events (SSE)

## Development Guidelines

### Logging System

**IMPLEMENTED**: TOON (Token-Optimized Object Notation) format is now active for all file logs.
- Reference: https://github.com/toon-format/toon
- Package: `@toon-format/toon` installed
- Reduces token usage by ~40% vs standard JSON
- File logs use TOON format (combined.log, errors.log, session logs)
- Console output remains human-readable for development
- See `docs/toon-format-example.md` for examples and comparisons

**Logging Locations:**
- `logs/combined.log` - All logs with rotation (10MB, 5 files)
- `logs/errors.log` - Error logs only
- `logs/sessions/session_{id}_{timestamp}.log` - Per-session logs

**Logging Levels:**
- `error` - Agent failures, tool errors, exceptions
- `warn` - High memory usage (>75%), retries, deprecations
- `info` - Agent lifecycle, tool completions, session summaries
- `debug` - Tool inputs, intermediate states (set LOG_LEVEL=debug)

**Required Context:**
```typescript
logger.info("Agent started", {
  sessionId: string,
  agentId: string,
  agentRole: "orchestrator" | "searcher" | "analyzer" | "writer",
  agentTask: string
});
```

### SDK Hook Structure

**CRITICAL**: SDK hooks must follow this exact pattern (SDK v0.1.69+):

```typescript
hooks: {
  PreToolUse: [{
    hooks: [async (input) => {
      if (input.hook_event_name === 'PreToolUse') {
        // Track tool usage
      }
      return { continue: true };
    }]
  }],
  PostToolUse: [{
    hooks: [async (input) => {
      if (input.hook_event_name === 'PostToolUse') {
        // Track tool completion
      }
      return { continue: true };
    }]
  }]
}
```

**DO NOT** use arrow function arrays directly: `PreToolUse: [(args) => {...}]` ❌

### Custom Tools via SDK

Custom tools must be wrapped in an SDK MCP server:

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

const customServer = createSdkMcpServer({
  name: "deep-research",
  version: "1.0.0",
  tools: [myTool1, myTool2]
});

query({
  prompt: "...",
  options: {
    mcpServers: { "deep-research": customServer },
    allowedTools: [
      "mcp__deep-research__tool_name"
    ]
  }
});
```

### Import Path Conventions

From `src/lib/agent/agents/`:
- Logging: `import { logger } from "../../logging/logger"`
- Costs: `import { UsageCalculator } from "../../costs/usage-calculator"`
- Monitoring: `import { MemoryMonitor } from "../../monitoring/memory-monitor"`

From `src/lib/agent/coordination/`:
- Same pattern: `../../logging/logger`, `../../costs/usage-calculator`

### Cost Tracking

Track real token usage, not estimates:

```typescript
// In API route or agent
if ((message as any).usage) {
  tracker.trackUsage(agentId, "claude-sonnet-4-5", (message as any).usage);
}

// Exa tools tracked automatically in postToolUseHook
if (toolName.startsWith("mcp__exa-search__")) {
  usageCalculator.trackToolCost(toolName);
}
```

**Model Pricing (as of implementation):**
- Claude Sonnet 4.5: $3/M input, $15/M output
- Claude Opus 4.5: $15/M input, $75/M output
- Claude Haiku 4: $0.80/M input, $4/M output

**Exa Pricing:**
- Search: $0.50/1000 calls
- Get Contents: $3/1000 calls
- Find Similar: $0.50/1000 calls

### Memory Monitoring

- Starts automatically when AgentActivityTracker is initialized
- Records baseline at agent start
- Calculates delta at agent end
- Warnings at >75% heap usage, critical at >90%

### Testing

**Manual Test:**
```bash
npm run dev
# Open http://localhost:3000
# Submit query: "Multi-agent AI systems architectures"
# Check logs/sessions/ for output
```

**Verify:**
- [ ] All agents register and complete
- [ ] Tool calls tracked with correct agentId
- [ ] Real costs calculated (not $0.015 estimate)
- [ ] Memory deltas recorded
- [ ] Session log file created
- [ ] Final report generated

## File Structure

```
src/lib/agent/
├── agents/                    # Agent implementations
│   ├── orchestrator.ts       # Main coordinator with spawn tools
│   ├── searcher.ts           # Parallel research agents
│   ├── analyzer.ts           # Synthesis agent
│   ├── writer.ts             # Report generation
│   └── types.ts              # Shared types
├── coordination/             # Multi-agent coordination
│   └── agent-tracker.ts      # Activity tracking, hooks
├── prompts/                  # Agent system prompts
│   ├── orchestrator-agent.md
│   ├── searcher-agent.md
│   ├── analyzer-agent.md
│   └── writer-agent.md
├── logging/                  # Logging infrastructure
│   └── logger.ts             # Winston logger (TOON format)
├── costs/                    # Cost tracking
│   └── usage-calculator.ts   # Token and tool costs
├── monitoring/               # Resource monitoring
│   └── memory-monitor.ts     # Memory profiling
├── config.ts                 # Configuration
└── tools.ts                  # Exa search tools

files/                        # Runtime output (gitignored)
├── research_notes/           # Searcher findings
├── analysis/                 # Analyzer synthesis
└── reports/                  # Final reports

logs/                         # Log files (gitignored)
├── combined.log
├── errors.log
└── sessions/
```

## Environment Variables

Required in `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
EXA_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=info  # debug, info, warn, error
```

## Common Issues

### Build Errors

1. **"Can't resolve '../logging/logger'"**
   - Fix: Use `../../logging/logger` from agent files

2. **"Type 'SdkMcpToolDefinition' not assignable to 'string'"**
   - Fix: Wrap tools in `createSdkMcpServer()`, pass via `mcpServers`

3. **"Type '(args) => void' not assignable to 'HookCallbackMatcher'"**
   - Fix: Use correct hook structure with `hooks: [async (input) => {...}]`

### Runtime Issues

1. **Hooks not firing**
   - Check hook structure matches SDK v0.1.69+ format
   - Verify `return { continue: true }` in hook callbacks

2. **Cost tracking shows $0**
   - Ensure usage extraction in API route: `(message as any).usage`
   - Check `tracker.trackUsage()` called with SDK message usage

3. **Memory monitoring not working**
   - Verify `memoryMonitor.startMonitoring()` called in tracker constructor
   - Check `stopMonitoring()` called in `finalizeSession()`

## Code Patterns

### Never Do
- ❌ Pass tool objects directly to `tools` parameter
- ❌ Use old hook format: `PreToolUse: [(args) => {...}]`
- ❌ Hardcode costs: use `usageCalculator.getTotalCost()`
- ❌ Use `console.log()`: use `logger.info()` instead
- ❌ Forget to call `tracker.finalizeSession()` at end

### Always Do
- ✅ Wrap custom tools in `createSdkMcpServer()`
- ✅ Use correct hook structure with `HookCallbackMatcher`
- ✅ Extract real usage data from SDK messages
- ✅ Log with structured context (sessionId, agentId, etc.)
- ✅ Use TOON format for log output
- ✅ Call `tracker.registerAgent()` before agent starts
- ✅ Call `tracker.completeAgent()` when agent finishes

## Portfolio Showcase Points

This project demonstrates:
- ✨ Multi-agent coordination with hierarchical delegation
- ✨ True parallel execution (multiple Searchers)
- ✨ Tool-based agent spawning
- ✨ Real-time activity tracking via SDK hooks
- ✨ Comprehensive observability (logs, costs, memory)
- ✨ File-based state sharing between agents
- ✨ Streaming updates to frontend via SSE
- ✨ Production-ready error handling
- ✨ Token-optimized logging with TOON format
- ✨ Accurate cost tracking per agent and tool

## Future Enhancements

- [x] Implement TOON format transformer for Winston ✅
- [ ] Dynamic agent scaling based on topic complexity
- [ ] Critic agent for quality assurance
- [ ] Fact-checker agent for validation
- [ ] Mixed models (Haiku for simple tasks, Opus for critical thinking)
- [ ] Agent swarm visualization (interactive graph)
- [ ] Persistent memory across sessions
- [ ] Resume failed sessions
- [ ] Cost budgeting and alerts
