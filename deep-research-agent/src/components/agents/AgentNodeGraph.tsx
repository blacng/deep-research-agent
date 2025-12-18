"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { Bot, Search, FileText, PenTool, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentInfo } from "@/types/research";
import { useAgentGraph, AgentNodeData } from "@/hooks/useAgentGraph";
import { agentColors, AgentRole } from "@/lib/animations";
import { PulseIndicator } from "@/components/ui/PulseIndicator";

interface AgentNodeGraphProps {
  agents: AgentInfo[];
  className?: string;
}

// Custom node component for agents
function AgentNode({ data }: { data: AgentNodeData }) {
  const colors = agentColors[data.role];
  const isActive = data.status === "active";
  const isCompleted = data.status === "completed";
  const isFailed = data.status === "failed";

  const Icon = useMemo(() => {
    switch (data.role) {
      case "orchestrator": return Bot;
      case "searcher": return Search;
      case "analyzer": return FileText;
      case "writer": return PenTool;
      default: return Bot;
    }
  }, [data.role]);

  const StatusIcon = useMemo(() => {
    if (isActive) return Loader2;
    if (isCompleted) return CheckCircle2;
    if (isFailed) return XCircle;
    return null;
  }, [isActive, isCompleted, isFailed]);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={cn(
          "relative px-4 py-3 rounded-xl border-2 bg-white shadow-lg min-w-[160px]",
          colors.border,
          isActive && "animate-pulse-glow",
          `glow-${data.role}`
        )}
        style={isActive ? { "--glow-color": colors.glow } as React.CSSProperties : undefined}
      >
        {/* Header with icon and status */}
        <div className="flex items-center justify-between mb-2">
          <div className={cn("p-1.5 rounded-lg", colors.bg, "bg-opacity-20")}>
            <Icon className={cn("h-4 w-4", colors.text)} />
          </div>
          <div className="flex items-center gap-1.5">
            {data.toolCallCount > 0 && (
              <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
                {data.toolCallCount} calls
              </span>
            )}
            <PulseIndicator status={data.status} role={data.role} size="sm" />
          </div>
        </div>

        {/* Agent ID */}
        <div className={cn("font-semibold text-sm", colors.text)}>
          {data.agentId}
        </div>

        {/* Task */}
        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
          {data.task || data.role.charAt(0).toUpperCase() + data.role.slice(1)}
        </div>

        {/* Duration */}
        {data.duration !== undefined && (
          <div className="text-xs text-gray-400 mt-1">
            {data.duration.toFixed(1)}s
          </div>
        )}

        {/* Status badge */}
        {StatusIcon && (
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-0.5 shadow">
            <StatusIcon
              className={cn(
                "h-4 w-4",
                isActive && "animate-spin text-blue-500",
                isCompleted && "text-emerald-500",
                isFailed && "text-red-500"
              )}
            />
          </div>
        )}
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </>
  );
}

const nodeTypes = {
  agentNode: AgentNode,
};

export function AgentNodeGraph({ agents, className }: AgentNodeGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useAgentGraph({ agents });

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when agents change
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const minimapNodeColor = useCallback((node: Node) => {
    const nodeData = node.data as AgentNodeData | undefined;
    if (!nodeData?.role) return "#6B7280";
    return agentColors[nodeData.role as AgentRole]?.fill || "#6B7280";
  }, []);

  if (agents.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-gray-50 rounded-xl border border-dashed border-gray-200", className)}>
        <div className="text-center text-gray-400">
          <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No agents active</p>
          <p className="text-xs">Start a research query to see agents</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#E5E7EB" gap={16} />
        <Controls className="!bg-white !border-gray-200 !shadow-md" />
        <MiniMap
          nodeColor={minimapNodeColor}
          className="!bg-white !border-gray-200"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
