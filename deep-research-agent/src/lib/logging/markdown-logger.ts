/**
 * Markdown Log Formatter
 *
 * Creates human-readable markdown log files with visual aids like tables and graphs.
 * Supplements the structured JSON/TOON logs with readable session summaries.
 */

import { writeFile } from "fs/promises";
import { join } from "path";
import { logger } from "./logger";

export interface AgentSummary {
  agentId: string;
  role: string;
  task: string;
  status: string;
  duration: number;
  toolCallCount: number;
  memoryDelta?: string;
}

export interface ToolUsageSummary {
  toolName: string;
  callCount: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
}

export interface CostSummary {
  llmCost: number;
  toolCost: number;
  totalCost: number;
  breakdown: Array<{
    agentId: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }>;
}

export interface SessionSummary {
  sessionId: string;
  topic: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: "completed" | "failed";
  agents: AgentSummary[];
  tools: ToolUsageSummary[];
  costs: CostSummary;
  peakMemory: string;
}

/**
 * Generate a progress bar for visualizing percentages
 */
function progressBar(percentage: number, width: number = 20): string {
  // Clamp percentage to 0-100 range
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const filled = Math.round((clampedPercentage / 100) * width);
  const empty = Math.max(0, width - filled); // Ensure empty is never negative
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${percentage.toFixed(1)}%`;
}

/**
 * Generate a markdown table from data
 */
function createTable(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const dataRows = rows.map(row => `| ${row.join(" | ")} |`).join("\n");

  return `${headerRow}\n${separator}\n${dataRows}`;
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Create a visual cost breakdown chart using text
 */
function createCostChart(costs: CostSummary): string {
  const maxCost = Math.max(costs.llmCost, costs.toolCost);
  const llmBar = progressBar((costs.llmCost / costs.totalCost) * 100, 30);
  const toolBar = progressBar((costs.toolCost / costs.totalCost) * 100, 30);

  return `
### Cost Breakdown

\`\`\`
LLM Costs:  ${llmBar} $${costs.llmCost.toFixed(4)}
Tool Costs: ${toolBar} $${costs.toolCost.toFixed(4)}

Total:      [${"█".repeat(30)}] $${costs.totalCost.toFixed(4)}
\`\`\`
`;
}

/**
 * Generate markdown log file for a research session
 */
export async function generateMarkdownLog(summary: SessionSummary): Promise<string> {
  const { sessionId, topic, startTime, endTime, duration, status, agents, tools, costs, peakMemory } = summary;

  const markdown = `# Research Session Report

## Session Information

- **Session ID**: \`${sessionId}\`
- **Topic**: ${topic}
- **Status**: ${status === "completed" ? "✅ Completed" : "❌ Failed"}
- **Duration**: ${formatDuration(duration)}
- **Start Time**: ${startTime.toISOString()}
- **End Time**: ${endTime.toISOString()}
- **Peak Memory**: ${peakMemory}

---

## Agent Activity

${createTable(
  ["Agent ID", "Role", "Status", "Duration", "Tools Used", "Memory Δ"],
  agents.map(a => [
    a.agentId,
    a.role,
    a.status === "completed" ? "✅" : "❌",
    formatDuration(a.duration),
    String(a.toolCallCount),
    a.memoryDelta || "N/A"
  ])
)}

### Agent Timeline

\`\`\`
${agents.map((a, i) => {
  const indent = "  ".repeat(i);
  const bar = "█".repeat(Math.round(a.duration / 10000)); // Scale for visualization
  return `${a.agentId.padEnd(15)} ${indent}${bar} ${formatDuration(a.duration)}`;
}).join("\n")}
\`\`\`

---

## Tool Usage Statistics

${createTable(
  ["Tool Name", "Calls", "Success Rate", "Avg Duration", "Cost"],
  tools.map(t => [
    t.toolName,
    String(t.callCount),
    `${t.successRate.toFixed(1)}%`,
    formatDuration(t.avgDuration),
    `$${t.totalCost.toFixed(4)}`
  ])
)}

### Top Tools by Usage

${tools.length > 0 ? tools.slice(0, 5).map((t, i) => {
  const maxCalls = tools[0].callCount || 1; // Prevent division by zero
  const bar = progressBar((t.callCount / maxCalls) * 100, 20);
  return `${i + 1}. **${t.toolName}**: ${bar}`;
}).join("\n") : "*No tool usage data available*"}

---

${createCostChart(costs)}

### Cost Per Agent

${createTable(
  ["Agent ID", "Input Tokens", "Output Tokens", "Cost"],
  costs.breakdown.map(b => [
    b.agentId,
    String(b.inputTokens),
    String(b.outputTokens),
    `$${b.cost.toFixed(4)}`
  ])
)}

---

## Summary

- **Total Agents**: ${agents.length}
- **Successful Agents**: ${agents.filter(a => a.status === "completed").length}
- **Total Tool Calls**: ${tools.reduce((sum, t) => sum + t.callCount, 0)}
- **Overall Success Rate**: ${((tools.reduce((sum, t) => sum + t.successRate * t.callCount, 0) / tools.reduce((sum, t) => sum + t.callCount, 0)) || 0).toFixed(1)}%
- **Total Cost**: $${costs.totalCost.toFixed(4)}
- **Cost per Minute**: $${(costs.totalCost / (duration / 60000)).toFixed(4)}/min

---

*Generated on ${new Date().toISOString()}*
`;

  // Save markdown file
  const filename = `session_${sessionId}_${startTime.toISOString().replace(/:/g, "-")}.md`;
  const filepath = join(process.cwd(), "logs/sessions/markdown", filename);

  try {
    await writeFile(filepath, markdown);
    logger.info("Markdown log generated", { sessionId, filepath });
  } catch (error) {
    logger.error("Failed to generate markdown log", error as Error, { sessionId });
  }

  return filepath;
}

/**
 * Generate a quick summary markdown (for console output)
 */
export function generateQuickSummary(summary: SessionSummary): string {
  return `
📊 Session Complete: ${summary.topic}
├─ Duration: ${formatDuration(summary.duration)}
├─ Agents: ${summary.agents.length} (${summary.agents.filter(a => a.status === "completed").length} successful)
├─ Tool Calls: ${summary.agents.reduce((sum, a) => sum + a.toolCallCount, 0)}
└─ Total Cost: $${summary.costs.totalCost.toFixed(4)}
`;
}
