"use client";

import { AgentInfo } from "@/types/research";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface Props {
  agents: AgentInfo[];
}

/**
 * MultiAgentVisualizer - Displays live agent activity
 *
 * Shows all active and completed agents with their status, tool call counts,
 * and duration. Color-coded by agent role for easy identification.
 */
export function MultiAgentVisualizer({ agents }: Props) {
  /**
   * Get color class for each agent role
   */
  const getRoleColor = (role: AgentInfo["role"]): string => {
    switch (role) {
      case "orchestrator":
        return "bg-purple-500";
      case "searcher":
        return "bg-blue-500";
      case "analyzer":
        return "bg-green-500";
      case "writer":
        return "bg-orange-500";
    }
  };

  /**
   * Get appropriate icon for agent status
   */
  const getStatusIcon = (status: AgentInfo["status"]) => {
    switch (status) {
      case "active":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
    }
  };

  /**
   * Get badge color for agent status
   */
  const getStatusBadgeClass = (status: AgentInfo["status"]): string => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">
          Live Agent Activity
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Real-time multi-agent coordination
        </p>
      </div>

      <div className="p-4">
        {agents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">
              No agents active yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Agents will appear here when research starts
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => {
              const duration = agent.endTime
                ? Math.round((agent.endTime.getTime() - agent.startTime.getTime()) / 1000)
                : null;

              return (
                <div
                  key={agent.agentId}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {/* Role indicator dot */}
                  <div
                    className={`h-3 w-3 rounded-full ${getRoleColor(agent.role)} mt-1 flex-shrink-0`}
                    title={`${agent.role} agent`}
                  />

                  {/* Agent details */}
                  <div className="flex-1 min-w-0">
                    {/* Header: Agent ID and Status */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {agent.agentId}
                      </span>
                      <div
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${getStatusBadgeClass(agent.status)}`}
                      >
                        {getStatusIcon(agent.status)}
                        <span className="capitalize">{agent.status}</span>
                      </div>
                    </div>

                    {/* Task description */}
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {agent.task}
                    </p>

                    {/* Metrics */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{agent.toolCallCount}</span>
                        tool calls
                      </span>
                      {duration !== null && (
                        <>
                          <span>•</span>
                          <span>{duration}s</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="capitalize">{agent.role}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      {agents.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">Agent Roles:</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-gray-600">Orchestrator</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">Searcher</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-gray-600">Analyzer</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-gray-600">Writer</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
