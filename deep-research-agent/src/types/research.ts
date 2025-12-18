export interface SearchResult {
  title: string;
  url: string;
  author: string;
  publishedDate: string;
  text?: string;
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface ResearchStep {
  id: string;
  type: "search" | "analyze" | "synthesize" | "complete";
  status: "pending" | "in_progress" | "completed";
  description: string;
  results?: SearchResult[];
  timestamp: Date;
}

export interface ResearchProgress {
  currentStep: number;
  totalSteps: number;
  steps: ResearchStep[];
  query: string;
  status: "idle" | "researching" | "completed" | "error";
}

export interface ResearchReport {
  title: string;
  summary: string;
  sections: ReportSection[];
  sources: ResearchSource[];
  generatedAt: Date;
}

export interface ReportSection {
  heading: string;
  content: string;
}

export interface AgentMessage {
  type: "system" | "assistant" | "user" | "tool_use" | "tool_result" | "result";
  subtype?: "init" | "progress" | "step";
  content?: string;
  session_id?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  step?: ResearchStep;
  report?: ResearchReport;
}

/**
 * Multi-Agent System Types
 */

export interface AgentInfo {
  agentId: string;
  role: "orchestrator" | "searcher" | "analyzer" | "writer";
  task: string;
  status: "active" | "completed" | "failed";
  toolCallCount: number;
  startTime: Date;
  endTime?: Date;
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

export interface ResearchMessage {
  id: string;
  type: "status" | "assistant" | "tool_use" | "tool_result" | "result" | "error" | "agent_event" | "agent_stats";
  content?: string;
  status?: string;
  message?: string;
  topic?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  result_summary?: string;
  error?: string;
  event?: AgentEvent;
  stats?: AgentStats;
  timestamp: Date;
}

export interface ResearchStats {
  searches: number;
  sources: number;
  agents: number;
  turns: number;
  duration: number;
  estimatedCost: number;
}

/**
 * Dashboard Types
 */

export type ResearchPhase = "idle" | "planning" | "searching" | "analyzing" | "writing" | "complete";

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface CostSegment {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

export interface AgentNodeData {
  agentId: string;
  role: "orchestrator" | "searcher" | "analyzer" | "writer";
  task: string;
  status: "active" | "completed" | "failed";
  toolCallCount: number;
  duration?: number;
}

export interface ActivityLogItem {
  id: string;
  type: "tool_call" | "agent_event" | "status";
  agentId?: string;
  agentRole?: "orchestrator" | "searcher" | "analyzer" | "writer";
  toolName?: string;
  description: string;
  timestamp: Date;
  isComplete?: boolean;
}
