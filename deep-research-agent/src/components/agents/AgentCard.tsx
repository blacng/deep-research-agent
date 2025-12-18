"use client";

import { motion } from "framer-motion";
import { Bot, Search, FileText, PenTool, Loader2, CheckCircle2, XCircle, Clock, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentInfo } from "@/types/research";
import { agentColors, AgentRole, fadeInUp } from "@/lib/animations";
import { PulseIndicator } from "@/components/ui/PulseIndicator";

interface AgentCardProps {
  agent: AgentInfo;
  isExpanded?: boolean;
  onClick?: () => void;
}

const roleIcons = {
  orchestrator: Bot,
  searcher: Search,
  analyzer: FileText,
  writer: PenTool,
};

export function AgentCard({ agent, isExpanded = false, onClick }: AgentCardProps) {
  const colors = agentColors[agent.role as AgentRole];
  const Icon = roleIcons[agent.role];
  const isActive = agent.status === "active";
  const isCompleted = agent.status === "completed";
  const isFailed = agent.status === "failed";

  const duration = agent.endTime
    ? (new Date(agent.endTime).getTime() - new Date(agent.startTime).getTime()) / 1000
    : null;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-lg border bg-white transition-all duration-200",
        isActive && [colors.border, "border-2 shadow-md"],
        !isActive && "border-gray-200",
        onClick && "cursor-pointer hover:shadow-md"
      )}
    >
      {/* Active glow background */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg opacity-5"
          style={{ backgroundColor: colors.fill }}
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", colors.bg, "bg-opacity-20")}>
              <Icon className={cn("h-4 w-4", colors.text)} />
            </div>
            <div>
              <div className="font-medium text-sm text-gray-900">{agent.agentId}</div>
              <div className={cn("text-xs capitalize", colors.text)}>{agent.role}</div>
            </div>
          </div>
          <PulseIndicator status={agent.status} role={agent.role as AgentRole} size="md" />
        </div>

        {/* Task */}
        {agent.task && (
          <div className="mt-2 text-xs text-gray-500 line-clamp-2">
            {agent.task}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            <span>{agent.toolCallCount} calls</span>
          </div>
          {duration !== null && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{duration.toFixed(1)}s</span>
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 mt-2">
          {isActive && (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              <span className="text-xs text-blue-500">Running</span>
            </>
          )}
          {isCompleted && (
            <>
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-500">Completed</span>
            </>
          )}
          {isFailed && (
            <>
              <XCircle className="h-3 w-3 text-red-500" />
              <span className="text-xs text-red-500">Failed</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
