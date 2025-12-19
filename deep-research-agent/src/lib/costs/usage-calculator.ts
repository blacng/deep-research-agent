/**
 * Usage Calculator - Token tracking and cost calculation
 *
 * Tracks real token usage from Claude Agent SDK and calculates accurate costs
 * based on current Anthropic pricing and Exa API pricing.
 *
 * Replaces hardcoded cost estimates with real usage data.
 */

import { logger } from "../logging/logger";

// Model pricing (as of January 2025)
const MODEL_PRICING = {
  // Anthropic Claude models
  "claude-sonnet-4-20250514": {
    inputTokens: 3.00 / 1_000_000,   // $3 per million input tokens
    outputTokens: 15.00 / 1_000_000, // $15 per million output tokens
  },
  "claude-opus-4-5-20251101": {
    inputTokens: 15.00 / 1_000_000,
    outputTokens: 75.00 / 1_000_000,
  },
  "claude-haiku-4-5-20251001": {
    inputTokens: 0.80 / 1_000_000,
    outputTokens: 4.00 / 1_000_000,
  },
  "claude-sonnet-4-5": {
    inputTokens: 3.00 / 1_000_000,
    outputTokens: 15.00 / 1_000_000,
  },
  "claude-opus-4-5": {
    inputTokens: 15.00 / 1_000_000,
    outputTokens: 75.00 / 1_000_000,
  },
  "claude-haiku-4": {
    inputTokens: 0.80 / 1_000_000,
    outputTokens: 4.00 / 1_000_000,
  },
  // Google Gemini models (see: https://ai.google.dev/pricing)
  "gemini-3-pro-preview": {
    inputTokens: 1.25 / 1_000_000,   // $1.25 per million input tokens (same as gemini-1.5-pro)
    outputTokens: 5.00 / 1_000_000,  // $5.00 per million output tokens
  },
  "gemini-3-flash-preview": {
    inputTokens: 0.10 / 1_000_000,   // $0.10 per million input tokens (very cheap!)
    outputTokens: 0.40 / 1_000_000,  // $0.40 per million output tokens
  },
  "gemini-3-flash": {
    inputTokens: 0.10 / 1_000_000,
    outputTokens: 0.40 / 1_000_000,
  },
  "gemini-2.0-flash": {
    inputTokens: 0.10 / 1_000_000,
    outputTokens: 0.40 / 1_000_000,
  },
  "gemini-1.5-flash": {
    inputTokens: 0.075 / 1_000_000,
    outputTokens: 0.30 / 1_000_000,
  },
  "gemini-1.5-pro": {
    inputTokens: 1.25 / 1_000_000,
    outputTokens: 5.00 / 1_000_000,
  }
};

// Exa API pricing
const EXA_PRICING = {
  search: 0.50 / 1000,           // $0.50 per 1000 searches
  get_contents: 3.00 / 1000,     // $3 per 1000 content fetches
  getContents: 3.00 / 1000,      // Alternative naming
  find_similar: 0.50 / 1000,
  findSimilar: 0.50 / 1000,      // Alternative naming
  search_papers: 0.50 / 1000,
  searchPapers: 0.50 / 1000,     // Alternative naming
  search_news: 0.50 / 1000,
  searchNews: 0.50 / 1000,       // Alternative naming
};

export interface UsageMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
}

export interface ToolCostMetrics {
  toolName: string;
  callCount: number;
  cost: number;
}

export class UsageCalculator {
  private sessionUsage: Map<string, UsageMetrics> = new Map(); // agentId -> usage
  private toolCosts: Map<string, ToolCostMetrics> = new Map(); // toolName -> costs

  /**
   * Extract token usage from SDK message and track costs
   *
   * @param agentId - ID of the agent making the request
   * @param model - Model being used (e.g., "claude-sonnet-4-5")
   * @param usage - Usage data from SDK response
   */
  trackLLMUsage(
    agentId: string,
    model: string,
    usage: { input_tokens?: number; output_tokens?: number } | undefined
  ): void {
    if (!usage) return;

    const inputTokens = usage.input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // Normalize model name (handle variations)
    let normalizedModel = model.toLowerCase().trim();

    // Try exact match first
    let pricing = MODEL_PRICING[normalizedModel as keyof typeof MODEL_PRICING];

    // If not found, try to find a match by prefix
    if (!pricing) {
      const modelKeys = Object.keys(MODEL_PRICING);
      const matchedKey = modelKeys.find(key =>
        normalizedModel.includes(key) || key.includes(normalizedModel)
      );
      if (matchedKey) {
        pricing = MODEL_PRICING[matchedKey as keyof typeof MODEL_PRICING];
      }
    }

    // Use default Gemini pricing if still not found
    if (!pricing) {
      logger.warn("Unknown model for cost calculation, using Gemini default pricing", {
        model,
        normalizedModel,
        availableModels: Object.keys(MODEL_PRICING)
      });
      pricing = MODEL_PRICING["gemini-3-pro-preview"]; // Default to Gemini Pro pricing
    }

    const cost = (inputTokens * pricing.inputTokens) + (outputTokens * pricing.outputTokens);

    const existing = this.sessionUsage.get(agentId);
    if (existing) {
      existing.inputTokens += inputTokens;
      existing.outputTokens += outputTokens;
      existing.totalTokens += totalTokens;
      existing.cost += cost;
    } else {
      this.sessionUsage.set(agentId, {
        inputTokens,
        outputTokens,
        totalTokens,
        cost,
        model
      });
    }

    logger.info("LLM usage tracked", {
      agentId,
      model,
      inputTokens,
      outputTokens,
      cost: cost.toFixed(4)
    });
  }

  /**
   * Track Exa tool costs
   *
   * @param toolName - Name of the tool (e.g., "mcp__exa-search__search")
   */
  trackToolCost(toolName: string): void {
    // Extract base tool name (remove mcp__exa-search__ prefix)
    const baseTool = toolName.replace("mcp__exa-search__", "");
    const pricing = EXA_PRICING[baseTool as keyof typeof EXA_PRICING];

    if (!pricing) return;

    const cost = pricing;
    const existing = this.toolCosts.get(toolName);

    if (existing) {
      existing.callCount++;
      existing.cost += cost;
    } else {
      this.toolCosts.set(toolName, { toolName, callCount: 1, cost });
    }

    logger.debug("Tool cost tracked", { toolName, cost });
  }

  /**
   * Get total session cost breakdown
   */
  getTotalCost(): { llmCost: number; toolCost: number; totalCost: number } {
    const llmCost = Array.from(this.sessionUsage.values())
      .reduce((sum, usage) => sum + usage.cost, 0);

    const toolCost = Array.from(this.toolCosts.values())
      .reduce((sum, tool) => sum + tool.cost, 0);

    return {
      llmCost,
      toolCost,
      totalCost: llmCost + toolCost
    };
  }

  /**
   * Get usage breakdown per agent
   */
  getAgentBreakdown(): Array<UsageMetrics & { agentId: string }> {
    return Array.from(this.sessionUsage.entries()).map(([agentId, usage]) => ({
      agentId,
      ...usage
    }));
  }

  /**
   * Get tool cost breakdown
   */
  getToolBreakdown(): ToolCostMetrics[] {
    return Array.from(this.toolCosts.values());
  }

  /**
   * Log final session summary with costs and token usage
   */
  logSessionSummary(sessionId: string): void {
    const { llmCost, toolCost, totalCost } = this.getTotalCost();
    const agentBreakdown = this.getAgentBreakdown();
    const toolBreakdown = this.getToolBreakdown();

    logger.info("Session cost summary", {
      sessionId,
      llmCost: llmCost.toFixed(4),
      toolCost: toolCost.toFixed(4),
      totalCost: totalCost.toFixed(4),
      agentCount: agentBreakdown.length,
      totalTokens: agentBreakdown.reduce((sum, a) => sum + a.totalTokens, 0)
    });

    agentBreakdown.forEach(agent => {
      logger.debug("Agent cost breakdown", {
        sessionId,
        agentId: agent.agentId,
        inputTokens: agent.inputTokens,
        outputTokens: agent.outputTokens,
        cost: agent.cost.toFixed(4)
      });
    });

    toolBreakdown.forEach(tool => {
      logger.debug("Tool cost breakdown", {
        sessionId,
        toolName: tool.toolName,
        callCount: tool.callCount,
        cost: tool.cost.toFixed(4)
      });
    });
  }
}
