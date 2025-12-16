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
