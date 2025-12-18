"use client";

import { useMemo } from "react";
import { Node, Edge } from "@xyflow/react";
import { AgentInfo } from "@/types/research";
import { agentColors, AgentRole } from "@/lib/animations";

export interface AgentNodeData extends Record<string, unknown> {
  agentId: string;
  role: AgentRole;
  task: string;
  status: "active" | "completed" | "failed";
  toolCallCount: number;
  duration?: number;
}

export type AgentNode = Node<AgentNodeData>;
export type AgentEdge = Edge;

interface UseAgentGraphProps {
  agents: AgentInfo[];
}

interface UseAgentGraphReturn {
  nodes: AgentNode[];
  edges: AgentEdge[];
}

// Position configuration for hierarchical layout
const LAYOUT = {
  startY: 50,
  rowGap: 120,
  nodeWidth: 180,
  centerX: 300,
};

export function useAgentGraph({ agents }: UseAgentGraphProps): UseAgentGraphReturn {
  const { nodes, edges } = useMemo(() => {
    if (agents.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Filter out agents with empty or invalid IDs
    const validAgents = agents.filter((a) => a.agentId && a.agentId.trim() !== "");

    if (validAgents.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodeMap = new Map<string, AgentNode>();
    const edgeList: AgentEdge[] = [];

    // Categorize agents by role
    const orchestrators = validAgents.filter((a) => a.role === "orchestrator");
    const searchers = validAgents.filter((a) => a.role === "searcher");
    const analyzers = validAgents.filter((a) => a.role === "analyzer");
    const writers = validAgents.filter((a) => a.role === "writer");

    // Helper to create node
    const createNode = (
      agent: AgentInfo,
      x: number,
      y: number
    ): AgentNode => ({
      id: agent.agentId,
      type: "agentNode",
      position: { x, y },
      data: {
        agentId: agent.agentId,
        role: agent.role as AgentRole,
        task: agent.task,
        status: agent.status,
        toolCallCount: agent.toolCallCount,
        duration: agent.endTime
          ? (new Date(agent.endTime).getTime() - new Date(agent.startTime).getTime()) / 1000
          : undefined,
      },
    });

    // Row 1: Orchestrator (centered)
    orchestrators.forEach((agent, index) => {
      const x = LAYOUT.centerX - LAYOUT.nodeWidth / 2 + index * (LAYOUT.nodeWidth + 20);
      const node = createNode(agent, x, LAYOUT.startY);
      nodeMap.set(agent.agentId, node);
    });

    // Row 2: Searchers (spread horizontally)
    const searcherStartX = LAYOUT.centerX - ((searchers.length - 1) * (LAYOUT.nodeWidth + 20)) / 2 - LAYOUT.nodeWidth / 2;
    searchers.forEach((agent, index) => {
      const x = searcherStartX + index * (LAYOUT.nodeWidth + 20);
      const y = LAYOUT.startY + LAYOUT.rowGap;
      const node = createNode(agent, x, y);
      nodeMap.set(agent.agentId, node);

      // Edge from orchestrator to searcher
      if (orchestrators.length > 0) {
        edgeList.push({
          id: `${orchestrators[0].agentId}-${agent.agentId}`,
          source: orchestrators[0].agentId,
          target: agent.agentId,
          type: "smoothstep",
          animated: agent.status === "active",
          style: {
            stroke: agentColors.searcher.fill,
            strokeWidth: 2,
          },
        });
      }
    });

    // Row 3: Analyzer (centered below searchers)
    analyzers.forEach((agent, index) => {
      const x = LAYOUT.centerX - LAYOUT.nodeWidth / 2 + index * (LAYOUT.nodeWidth + 20);
      const y = LAYOUT.startY + LAYOUT.rowGap * 2;
      const node = createNode(agent, x, y);
      nodeMap.set(agent.agentId, node);

      // Edges from searchers to analyzer
      searchers.forEach((searcher) => {
        edgeList.push({
          id: `${searcher.agentId}-${agent.agentId}`,
          source: searcher.agentId,
          target: agent.agentId,
          type: "smoothstep",
          animated: agent.status === "active",
          style: {
            stroke: agentColors.analyzer.fill,
            strokeWidth: 2,
          },
        });
      });
    });

    // Row 4: Writer (centered below analyzer)
    writers.forEach((agent, index) => {
      const x = LAYOUT.centerX - LAYOUT.nodeWidth / 2 + index * (LAYOUT.nodeWidth + 20);
      const y = LAYOUT.startY + LAYOUT.rowGap * 3;
      const node = createNode(agent, x, y);
      nodeMap.set(agent.agentId, node);

      // Edge from analyzer to writer
      analyzers.forEach((analyzer) => {
        edgeList.push({
          id: `${analyzer.agentId}-${agent.agentId}`,
          source: analyzer.agentId,
          target: agent.agentId,
          type: "smoothstep",
          animated: agent.status === "active",
          style: {
            stroke: agentColors.writer.fill,
            strokeWidth: 2,
          },
        });
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: edgeList,
    };
  }, [agents]);

  return { nodes, edges };
}
