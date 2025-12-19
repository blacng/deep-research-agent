/**
 * Shared types for the multi-agent system
 */

import { AgentActivityTracker } from "../coordination/agent-tracker";

/**
 * Base configuration for all agents
 */
export interface BaseAgentConfig {
  agentId: string;
  tracker: AgentActivityTracker;
  sessionId?: string;
}

/**
 * Configuration for the Orchestrator agent
 */
export interface OrchestratorConfig {
  topic: string;
  sessionId?: string;
  tracker: AgentActivityTracker;
}

/**
 * Configuration for Searcher agents
 */
export interface SearcherConfig extends BaseAgentConfig {
  subtopic: string;
  focusAreas: string[];
}

/**
 * Configuration for the Analyzer agent
 */
export interface AnalyzerConfig extends BaseAgentConfig {
  searcherCount: number;
}

/**
 * Configuration for the Writer agent
 */
export interface WriterConfig extends BaseAgentConfig {
  topic: string;
}

/**
 * Result from a Searcher agent
 */
export interface SearcherResult {
  agentId: string;
  subtopic: string;
  outputPath: string;
  summary: string;
  fullFindings: string;
}

/**
 * Result from the Analyzer agent
 */
export interface AnalyzerResult {
  agentId: string;
  outputPath: string;
  insights: string[];
  themes: string[];
}

/**
 * Result from the Writer agent
 */
export interface WriterResult {
  agentId: string;
  content: string;
  wordCount: number;
  sourceCount: number;
}

/**
 * Agent role types
 */
export type AgentRole = "orchestrator" | "searcher" | "analyzer" | "writer";

/**
 * Agent status types
 */
export type AgentStatus = "active" | "completed" | "failed";

/**
 * Cost breakdown for a research session
 */
export interface CostBreakdown {
  llmCost: number;
  toolCost: number;
  totalCost: number;
}

/**
 * Token usage metrics for an agent
 */
export interface UsageMetrics {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
}

/**
 * Memory metrics for a research session
 */
export interface MemoryMetrics {
  peakHeapUsed: number;
  peakRSS: number;
  agentMemoryDeltas: Record<string, number>;
}

/**
 * Enhanced session statistics with costs and memory
 */
export interface EnhancedSessionStats {
  agents: {
    totalAgents: number;
    activeAgents: number;
    completedAgents: number;
    failedAgents: number;
    totalToolCalls: number;
    searchCalls: number;
    contentFetches: number;
  };
  costs: CostBreakdown;
  usage: UsageMetrics[];
  memory: MemoryMetrics;
}
