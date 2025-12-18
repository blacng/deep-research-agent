# TOON Format Logging Example

## What is TOON?

TOON (Token-Oriented Object Notation) is a compact encoding of JSON designed specifically for LLM inputs. It reduces token usage by approximately 40% compared to standard JSON.

**Benefits:**
- 40% fewer tokens for log processing
- Better LLM comprehension with structured tabular data
- Human-readable with indentation-based nesting
- CSV-style rows for uniform arrays

## Log Format Comparison

### Standard JSON Format
```json
{
  "timestamp": "2025-01-15T10:30:00.123Z",
  "level": "info",
  "message": "Agent registered",
  "sessionId": "abc-123-def-456",
  "agentId": "SEARCHER-1",
  "agentRole": "searcher",
  "agentTask": "Research AI safety"
}
```

**Token Count:** ~45 tokens

### TOON Format (Our Implementation)
```
ts: 2025-01-15T10:30:00.123Z
lvl: info
msg: Agent registered
sid: abc-123-def-456
aid: SEARCHER-1
role: searcher
agentTask: Research AI safety
```

**Token Count:** ~27 tokens (40% reduction)

## Key Optimizations

1. **Shortened Keys**
   - `timestamp` → `ts`
   - `level` → `lvl`
   - `message` → `msg`
   - `sessionId` → `sid`
   - `agentId` → `aid`
   - `agentRole` → `role`
   - `toolName` → `tool`
   - `error` → `err`

2. **No Braces or Quotes**
   - TOON uses key-value pairs without JSON braces
   - Simple values don't need quotes

3. **Indentation for Structure**
   - Nested objects use indentation (YAML-style)
   - No closing braces needed

## Real-World Example

### Multiple Tool Calls (Standard JSON)
```json
[
  {
    "timestamp": "2025-01-15T10:30:01.000Z",
    "level": "info",
    "message": "Tool started",
    "sessionId": "abc-123",
    "agentId": "SEARCHER-1",
    "toolName": "mcp__exa-search__search",
    "toolInput": "{\"query\":\"AI safety research\"}"
  },
  {
    "timestamp": "2025-01-15T10:30:02.500Z",
    "level": "info",
    "message": "Tool completed",
    "sessionId": "abc-123",
    "agentId": "SEARCHER-1",
    "toolName": "mcp__exa-search__search",
    "success": true,
    "durationMs": 1500
  }
]
```

**Token Count:** ~120 tokens

### Multiple Tool Calls (TOON Format)
```
logs[2]{ts,lvl,msg,sid,aid,tool,success,durationMs}:
  2025-01-15T10:30:01.000Z,info,Tool started,abc-123,SEARCHER-1,mcp__exa-search__search,,
  2025-01-15T10:30:02.500Z,info,Tool completed,abc-123,SEARCHER-1,mcp__exa-search__search,true,1500
```

**Token Count:** ~72 tokens (40% reduction)

## When TOON Excels

TOON is most effective with:
- **Uniform log entries** (same fields repeated)
- **Tool call sequences** (similar structure)
- **Agent lifecycle events** (consistent format)
- **Time-series data** (metrics, performance)

## Implementation Details

Our Winston logger automatically:
1. Converts log entries to TOON format for file outputs
2. Keeps console output human-readable (colorized, simple)
3. Falls back to JSON if TOON encoding fails
4. Uses shortened keys to maximize token savings

**File Transports using TOON:**
- `logs/combined.log` - All logs in TOON format
- `logs/errors.log` - Error logs in TOON format
- `logs/sessions/*.log` - Session logs in TOON format

**Console Transport:**
- Human-readable simple format (not TOON)
- Colorized for development

## Token Savings Calculator

For a typical research session with:
- 1 Orchestrator
- 4 Searchers (5 tool calls each)
- 1 Analyzer
- 1 Writer
- ~200 log entries

**Standard JSON:** ~9,000 tokens
**TOON Format:** ~5,400 tokens
**Savings:** 3,600 tokens ($0.01 at $3/M input tokens)

Over 100 sessions: **$1.00 saved in API costs**

## References

- TOON Specification: https://github.com/toon-format/spec
- TOON Playground: https://toonformat.dev/playground
- NPM Package: `@toon-format/toon`
