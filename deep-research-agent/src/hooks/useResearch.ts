"use client";

import { useState, useCallback, useRef } from "react";

export interface ResearchMessage {
  id: string;
  type: "status" | "system" | "assistant" | "tool_use" | "tool_result" | "result" | "error" | "debug";
  content?: string;
  status?: string;
  message?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  result_summary?: string;
  session_id?: string;
  error?: string;
  raw_type?: string;
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
  const messageIdRef = useRef(0);
  const startTimeRef = useRef<number>(0);

  const addMessage = useCallback((msg: Omit<ResearchMessage, "id" | "timestamp">) => {
    const newMessage: ResearchMessage = {
      ...msg,
      id: `msg-${++messageIdRef.current}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);

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
    setStats({ ...initialStats, agents: 1 });
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

      // Calculate final stats
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      // Estimate cost based on turns (rough estimate: ~$0.01 per turn for Sonnet)
      setStats(prev => ({
        ...prev,
        duration,
        cost: prev.turns * 0.015
      }));

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
  }, []);

  return {
    messages,
    isResearching,
    sessionId,
    finalReport,
    error,
    stats,
    startResearch,
    clearMessages
  };
}
