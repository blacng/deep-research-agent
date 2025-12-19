/**
 * AgentActivityTracker - Tracks multi-agent system activity using SDK hooks
 *
 * This class monitors agent lifecycle events and tool calls across the entire
 * agent swarm, enabling real-time visibility into agent activities.
 *
 * Integrated with logging, cost tracking, and memory monitoring.
 */

import { logger } from "../../logging/logger";
import { UsageCalculator } from "../../costs/usage-calculator";
import { MemoryMonitor } from "../../monitoring/memory-monitor";
import { generateMarkdownLog, generateQuickSummary, type SessionSummary } from "../../logging/markdown-logger";
import type { MemorySnapshot } from "../../monitoring/memory-monitor";

export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: string;
  startTime: Date;
  endTime?: Date;
  success: boolean;
}

export interface AgentActivity {
  agentId: string;
  agentRole: "orchestrator" | "searcher" | "analyzer" | "writer";
  agentTask: string;
  toolCalls: ToolCall[];
  startTime: Date;
  endTime?: Date;
  status: "active" | "completed" | "failed";
}

export interface AgentEvent {
  type: "agent_started" | "agent_completed" | "tool_started" | "tool_completed";
  agentId: string;
  role?: "orchestrator" | "searcher" | "analyzer" | "writer";
  task?: string;
  toolName?: string;
  input?: Record<string, unknown>;
  success?: boolean;
  status?: "completed" | "failed";
  duration?: number;
  timestamp: Date;
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  completedAgents: number;
  failedAgents: number;
  totalToolCalls: number;
  searchCalls: number;
  contentFetches: number;
}

interface PreToolUseArgs {
  tool_use_id: string;
  tool_name: string;
  input: Record<string, unknown>;
  parent_tool_use_id?: string;
}

interface PostToolUseArgs {
  tool_use_id: string;
  tool_name: string;
  output: unknown;
  success: boolean;
  parent_tool_use_id?: string;
}

/**
 * Main agent activity tracking class
 *
 * Uses SDK hooks to automatically capture tool calls and agent lifecycle events.
 * Emits events that can be streamed to the frontend for real-time visualization.
 */
export class AgentActivityTracker {
  private agents: Map<string, AgentActivity> = new Map();
  private currentToolCalls: Map<string, ToolCall> = new Map();
  private eventCallbacks: Array<(event: AgentEvent) => void> = [];
  private usageCalculator: UsageCalculator;
  private memoryMonitor: MemoryMonitor;
  private sessionId: string;
  private topic: string = "";
  private startTime: Date;
  private endTime?: Date;
  private status: "completed" | "failed" = "completed";

  constructor(sessionId: string, topic?: string) {
    this.sessionId = sessionId;
    this.topic = topic || "";
    this.startTime = new Date();
    this.usageCalculator = new UsageCalculator();
    this.memoryMonitor = new MemoryMonitor();

    // Setup session-specific logging
    logger.addSessionTransport(sessionId);

    // Start memory monitoring (every 10 seconds)
    this.memoryMonitor.startMonitoring(10000);

    logger.info("Agent activity tracker initialized", { sessionId, topic });
  }

  /**
   * Register a new agent in the tracker
   */
  registerAgent(
    agentId: string,
    role: AgentActivity["agentRole"],
    task: string
  ): void {
    this.agents.set(agentId, {
      agentId,
      agentRole: role,
      agentTask: task,
      toolCalls: [],
      startTime: new Date(),
      status: "active"
    });

    // Record memory baseline for this agent
    this.memoryMonitor.recordAgentStart(agentId);

    logger.info("Agent registered", {
      sessionId: this.sessionId,
      agentId,
      agentRole: role,
      agentTask: task
    });

    this.emitEvent({
      type: "agent_started",
      agentId,
      role,
      task,
      timestamp: new Date()
    });
  }

  /**
   * SDK Hook: Called before a tool is used
   * Tracks tool call initiation and associates it with the correct agent
   */
  preToolUseHook = (args: PreToolUseArgs & { agentId?: string }): void => {
    const agentId = args.agentId || this.inferAgentId(args.parent_tool_use_id);

    const toolCall: ToolCall = {
      id: args.tool_use_id,
      toolName: args.tool_name,
      input: args.input,
      startTime: new Date(),
      success: false
    };

    this.currentToolCalls.set(args.tool_use_id, toolCall);

    const agent = this.agents.get(agentId);
    if (agent) {
      agent.toolCalls.push(toolCall);
    }

    logger.debug("Tool started", {
      sessionId: this.sessionId,
      agentId,
      toolName: args.tool_name,
      toolInput: JSON.stringify(args.input).slice(0, 200) // Truncate
    });

    this.emitEvent({
      type: "tool_started",
      agentId,
      toolName: args.tool_name,
      input: args.input,
      timestamp: new Date()
    });
  };

  /**
   * SDK Hook: Called after a tool completes
   * Updates tool call with results and success status
   */
  postToolUseHook = (args: PostToolUseArgs & { agentId?: string }): void => {
    const toolCall = this.currentToolCalls.get(args.tool_use_id);
    const startTime = toolCall?.startTime;

    if (toolCall) {
      toolCall.endTime = new Date();
      toolCall.success = args.success;
      toolCall.output = JSON.stringify(args.output).slice(0, 200);

      this.currentToolCalls.delete(args.tool_use_id);
    }

    const agentId = args.agentId || this.inferAgentId(args.parent_tool_use_id);
    const duration = startTime ? new Date().getTime() - startTime.getTime() : undefined;

    // Track tool cost if it's an Exa search tool
    if (args.tool_name.startsWith("mcp__exa-search__")) {
      this.usageCalculator.trackToolCost(args.tool_name);
    }

    logger.info("Tool completed", {
      sessionId: this.sessionId,
      agentId,
      toolName: args.tool_name,
      success: args.success,
      durationMs: duration
    });

    this.emitEvent({
      type: "tool_completed",
      agentId,
      toolName: args.tool_name,
      success: args.success,
      timestamp: new Date()
    });
  };

  /**
   * Mark an agent as completed or failed
   */
  completeAgent(agentId: string, status: "completed" | "failed"): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.endTime = new Date();
      agent.status = status;

      // Record memory delta for this agent
      const memoryDelta = this.memoryMonitor.recordAgentEnd(agentId);

      logger.info("Agent completed", {
        sessionId: this.sessionId,
        agentId,
        status,
        memoryDelta: memoryDelta ? (memoryDelta / 1024 / 1024).toFixed(2) + " MB" : "N/A"
      });

      this.emitEvent({
        type: "agent_completed",
        agentId,
        status,
        duration: agent.endTime.getTime() - agent.startTime.getTime(),
        timestamp: new Date()
      });
    }
  }

  /**
   * Register a callback to receive agent events
   * Used for streaming events to the frontend via SSE
   */
  onEvent(callback: (event: AgentEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  /**
   * Emit an event to all registered callbacks
   */
  private emitEvent(event: AgentEvent): void {
    this.eventCallbacks.forEach(cb => {
      try {
        cb(event);
      } catch (error) {
        console.error("Error in event callback:", error);
      }
    });
  }

  /**
   * Infer which agent made a tool call based on parent_tool_use_id
   *
   * When the Orchestrator spawns a subagent via spawn_* tools,
   * that tool_use_id becomes the parent_tool_use_id for the subagent's calls.
   */
  private inferAgentId(parentToolUseId?: string): string {
    // If no parent, assume it's the orchestrator
    if (!parentToolUseId) {
      return "ORCHESTRATOR";
    }

    // Check if we can find an agent by matching parent tool use ID
    // This is a simplified implementation - in production you'd want
    // more robust tracking of parent-child relationships
    for (const [agentId, activity] of this.agents.entries()) {
      const hasMatchingToolCall = activity.toolCalls.some(
        tc => tc.id === parentToolUseId
      );
      if (hasMatchingToolCall) {
        return agentId;
      }
    }

    return "ORCHESTRATOR";
  }

  /**
   * Get all agent activities
   */
  getAgentActivities(): AgentActivity[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get aggregated statistics across all agents
   */
  getStatistics(): AgentStats {
    const activities = this.getAgentActivities();

    return {
      totalAgents: activities.length,
      activeAgents: activities.filter(a => a.status === "active").length,
      completedAgents: activities.filter(a => a.status === "completed").length,
      failedAgents: activities.filter(a => a.status === "failed").length,
      totalToolCalls: activities.reduce((sum, a) => sum + a.toolCalls.length, 0),
      searchCalls: activities.reduce((sum, a) =>
        sum + a.toolCalls.filter(t =>
          t.toolName.includes("search") && !t.toolName.includes("get_contents")
        ).length, 0
      ),
      contentFetches: activities.reduce((sum, a) =>
        sum + a.toolCalls.filter(t => t.toolName.includes("get_contents")).length, 0
      )
    };
  }

  /**
   * Track LLM usage from SDK message
   *
   * @param agentId - ID of the agent
   * @param model - Model being used (e.g., "claude-sonnet-4-5")
   * @param usage - Usage data from SDK response
   */
  trackUsage(agentId: string, model: string, usage: { input_tokens?: number; output_tokens?: number } | undefined): void {
    this.usageCalculator.trackLLMUsage(agentId, model, usage);
  }

  /**
   * Get comprehensive session statistics with costs and memory
   */
  getEnhancedStatistics(): {
    agents: AgentStats;
    costs: ReturnType<UsageCalculator["getTotalCost"]>;
    memory: MemorySnapshot | null;
  } {
    return {
      agents: this.getStatistics(),
      costs: this.usageCalculator.getTotalCost(),
      memory: this.memoryMonitor.getPeakMemory()
    };
  }

  /**
   * Finalize session and log summary
   * Call this when research session completes
   */
  async finalizeSession(): Promise<void> {
    this.endTime = new Date();
    this.memoryMonitor.stopMonitoring();
    this.usageCalculator.logSessionSummary(this.sessionId);
    this.memoryMonitor.logMemoryReport(this.sessionId);

    // Generate markdown log with visual aids
    await this.generateMarkdownSummary();

    logger.info("Session finalized", { sessionId: this.sessionId });
  }

  /**
   * Generate markdown summary with tables and visual aids
   */
  private async generateMarkdownSummary(): Promise<void> {
    const agents = Array.from(this.agents.values());
    const costs = this.usageCalculator.getTotalCost();
    const costBreakdown = this.usageCalculator.getAgentBreakdown();
    const peakMemory = this.memoryMonitor.getPeakMemory();

    // Calculate tool usage statistics
    const toolStats = new Map<string, { count: number; success: number; durations: number[] }>();

    agents.forEach(agent => {
      agent.toolCalls.forEach(tool => {
        const existing = toolStats.get(tool.toolName) || { count: 0, success: 0, durations: [] };
        existing.count++;
        if (tool.success) existing.success++;
        if (tool.endTime) {
          const duration = tool.endTime.getTime() - tool.startTime.getTime();
          existing.durations.push(duration);
        }
        toolStats.set(tool.toolName, existing);
      });
    });

    const toolSummaries = Array.from(toolStats.entries()).map(([toolName, stats]) => ({
      toolName,
      callCount: stats.count,
      successRate: (stats.success / stats.count) * 100,
      avgDuration: stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length || 0,
      totalCost: 0 // Will be populated from usage calculator
    }));

    const sessionSummary: SessionSummary = {
      sessionId: this.sessionId,
      topic: this.topic,
      startTime: this.startTime,
      endTime: this.endTime || new Date(),
      duration: (this.endTime || new Date()).getTime() - this.startTime.getTime(),
      status: this.status,
      agents: agents.map(a => ({
        agentId: a.agentId,
        role: a.agentRole,
        task: a.agentTask,
        status: a.status,
        duration: (a.endTime || new Date()).getTime() - a.startTime.getTime(),
        toolCallCount: a.toolCalls.length,
        memoryDelta: a.endTime ? this.memoryMonitor.recordAgentEnd(a.agentId)?.toString() : undefined
      })),
      tools: toolSummaries,
      costs: {
        llmCost: costs.llmCost,
        toolCost: costs.toolCost,
        totalCost: costs.totalCost,
        breakdown: costBreakdown.map(b => ({
          agentId: b.agentId,
          inputTokens: b.inputTokens,
          outputTokens: b.outputTokens,
          cost: b.cost
        }))
      },
      peakMemory: peakMemory ? `${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)} MB` : "N/A"
    };

    // Generate markdown log file
    await generateMarkdownLog(sessionSummary);

    // Log quick summary to console
    const quickSummary = generateQuickSummary(sessionSummary);
    logger.info(quickSummary);
  }

  /**
   * Reset all tracking data
   * Useful for starting a new research session
   */
  reset(): void {
    this.agents.clear();
    this.currentToolCalls.clear();
  }
}
