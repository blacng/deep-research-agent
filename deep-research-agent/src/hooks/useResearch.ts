"use client";

import { useState, useCallback, useRef } from "react";
import { AgentInfo, AgentEvent, AgentStats } from "@/types/research";

export interface ResearchMessage {
  id: string;
  type: "status" | "system" | "assistant" | "tool_use" | "tool_result" | "result" | "error" | "debug" | "agent_event" | "agent_stats";
  content?: string;
  status?: string;
  message?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  result_summary?: string;
  session_id?: string;
  error?: string;
  raw_type?: string;
  event?: AgentEvent;
  stats?: AgentStats;
  timestamp: Date;
}

export interface ResearchStats {
  searches: number;
  sources: number;
  agents: number;
  duration: number;
  cost: number;
  turns: number;
}

export interface UseResearchReturn {
  messages: ResearchMessage[];
  isResearching: boolean;
  sessionId: string | undefined;
  finalReport: string | undefined;
  error: string | undefined;
  stats: ResearchStats;
  agents: AgentInfo[];
  agentEvents: AgentEvent[];
  activeAgents: number;
  startResearch: (topic: string) => Promise<void>;
  clearMessages: () => void;
}

const initialStats: ResearchStats = {
  searches: 0,
  sources: 0,
  agents: 1,
  duration: 0,
  cost: 0,
  turns: 0
};

export function useResearch(): UseResearchReturn {
  const [messages, setMessages] = useState<ResearchMessage[]>([]);
  const [isResearching, setIsResearching] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [finalReport, setFinalReport] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [stats, setStats] = useState<ResearchStats>(initialStats);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const messageIdRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  const addMessage = useCallback((msg: Omit<ResearchMessage, "id" | "timestamp">) => {
    const newMessage: ResearchMessage = {
      ...msg,
      id: `msg-${++messageIdRef.current}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);

    // Handle agent events
    if (msg.type === "agent_event" && msg.event) {
      const event = msg.event;
      setAgentEvents(prev => [...prev, event]);

      if (event.type === "agent_started") {
        setAgents(prev => [...prev, {
          agentId: event.agentId,
          role: event.role || "orchestrator",
          task: event.task || "",
          status: "active",
          toolCallCount: 0,
          startTime: new Date(event.timestamp)
        }]);
      }

      if (event.type === "agent_completed") {
        setAgents(prev => prev.map(a =>
          a.agentId === event.agentId
            ? { ...a, status: event.status || "completed", endTime: new Date(event.timestamp) }
            : a
        ));
      }

      if (event.type === "tool_started") {
        setAgents(prev => prev.map(a =>
          a.agentId === event.agentId
            ? { ...a, toolCallCount: a.toolCallCount + 1 }
            : a
        ));
      }
    }

    // Handle agent stats updates
    if (msg.type === "agent_stats" && msg.stats) {
      setStats(prev => ({
        ...prev,
        agents: msg.stats?.totalAgents || prev.agents,
        searches: msg.stats?.searchCalls || prev.searches,
        sources: msg.stats?.contentFetches || prev.sources
      }));
    }

    // Update stats based on message type
    if (msg.type === "tool_use") {
      const toolName = msg.tool_name || "";
      if (toolName.includes("search")) {
        setStats(prev => ({ ...prev, searches: prev.searches + 1 }));
      }
      setStats(prev => ({ ...prev, turns: prev.turns + 1 }));
    }

    if (msg.type === "tool_result") {
      const toolName = msg.tool_name || "";
      if (toolName.includes("get_contents") || toolName.includes("find_similar")) {
        // Estimate sources from content fetches
        setStats(prev => ({ ...prev, sources: prev.sources + 1 }));
      }
    }

    return newMessage;
  }, []);

  const startResearch = useCallback(async (topic: string) => {
    setIsResearching(true);
    setError(undefined);
    setFinalReport(undefined);
    setMessages([]);
    setAgents([]);
    setAgentEvents([]);
    setStats({ ...initialStats, agents: 0 });
    startTimeRef.current = Date.now();

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, sessionId })
      });

      if (!response.ok) {
        throw new Error("Failed to start research");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              continue;
            }

            try {
              const message = JSON.parse(data);

              // Handle different message types
              if (message.type === "system" && message.session_id) {
                setSessionId(message.session_id);
              }

              if (message.type === "result" && message.content) {
                setFinalReport(message.content);
              }

              // Handle report from status messages
              if (message.type === "status" && message.status === "completed" && message.report) {
                setFinalReport(message.report);

                // Update stats with actual cost from the API
                const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
                setStats(prev => ({
                  ...prev,
                  duration,
                  cost: message.stats?.costs?.totalCost || prev.cost,
                  agents: message.stats?.agents?.totalAgents || prev.agents
                }));
              }

              if (message.type === "error") {
                setError(message.error);
              }

              addMessage(message);
            } catch (e) {
              console.error("Failed to parse message:", e);
            }
          }
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      addMessage({
        type: "error",
        error: errorMessage
      });
    } finally {
      setIsResearching(false);
    }
  }, [sessionId, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setFinalReport(undefined);
    setError(undefined);
    setSessionId(undefined);
    setStats(initialStats);
    setAgents([]);
    setAgentEvents([]);
  }, []);

  const activeAgents = agents.filter(a => a.status === "active").length;

  return {
    messages,
    isResearching,
    sessionId,
    finalReport,
    error,
    stats,
    agents,
    agentEvents,
    activeAgents,
    startResearch,
    clearMessages
  };
}
