"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Globe, Bot, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { feedItem, agentColors, AgentRole } from "@/lib/animations";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityItem {
  id: string;
  type: "tool_use" | "tool_result" | "agent_event" | "status" | "error";
  agentId?: string;
  agentRole?: AgentRole;
  toolName?: string;
  content?: string;
  message?: string;
  isComplete?: boolean;
  timestamp: Date;
}

interface LiveActivityFeedProps {
  messages: ActivityItem[];
  className?: string;
}

function getIcon(item: ActivityItem) {
  if (item.type === "tool_use" || item.type === "tool_result") {
    if (item.toolName?.includes("search")) return Search;
    if (item.toolName?.includes("contents")) return FileText;
    return Globe;
  }
  if (item.type === "agent_event") return Bot;
  return Bot;
}

function getLabel(item: ActivityItem): string {
  if (item.type === "tool_use") {
    const tool = item.toolName?.replace("mcp__exa-search__", "") || "Tool";
    return tool
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  if (item.type === "tool_result") return "Result";
  if (item.type === "agent_event") return item.agentId || "Agent";
  if (item.type === "status") return "Status";
  if (item.type === "error") return "Error";
  return item.type;
}

function getDescription(item: ActivityItem): string {
  if (item.type === "tool_use") return "Executing...";
  if (item.type === "tool_result") {
    return item.content?.slice(0, 80) || "Completed";
  }
  if (item.message) return item.message;
  if (item.content) return item.content.slice(0, 80);
  return "";
}

function ActivityItemComponent({ item }: { item: ActivityItem }) {
  const Icon = getIcon(item);
  const label = getLabel(item);
  const description = getDescription(item);
  const isComplete = item.type === "tool_result" || item.type === "status";
  const isError = item.type === "error";
  const roleColor = item.agentRole ? agentColors[item.agentRole] : null;

  return (
    <motion.div
      variants={feedItem}
      initial="hidden"
      animate="show"
      exit="exit"
      layout
      className="flex items-start gap-3 py-3 px-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 p-1.5 rounded-md",
          roleColor ? `${roleColor.bg} bg-opacity-20` : "bg-gray-100"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            roleColor ? roleColor.text : "text-gray-500",
            !isComplete && !isError && "animate-pulse"
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium text-sm",
              isError ? "text-red-600" : "text-gray-900"
            )}
          >
            {label}
          </span>
          {item.agentRole && (
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded capitalize",
                roleColor ? `${roleColor.bg} bg-opacity-20 ${roleColor.text}` : "bg-gray-100 text-gray-500"
              )}
            >
              {item.agentRole}
            </span>
          )}
          {isComplete && !isError && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
          {isError && <XCircle className="h-4 w-4 text-red-500" />}
          {!isComplete && !isError && (
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
          )}
        </div>
        {description && (
          <p
            className={cn(
              "text-xs mt-0.5 truncate",
              isError ? "text-red-500" : "text-gray-500"
            )}
          >
            {description}
          </p>
        )}
        <span className="text-xs text-gray-400">
          {new Date(item.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}

export function LiveActivityFeed({ messages, className }: LiveActivityFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Detect manual scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    setAutoScroll(isAtBottom);
  };

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6",
          className
        )}
      >
        <Bot className="h-12 w-12 text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">No activity yet</p>
        <p className="text-xs text-gray-400">Start a research query to see agent activity</p>
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-700">Live Activity</h3>
        <span className="text-xs text-gray-400">{messages.length} events</span>
      </div>

      <ScrollArea className="h-[300px]">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="p-2 space-y-1 custom-scrollbar overflow-y-auto h-full"
        >
          <AnimatePresence mode="popLayout">
            {messages.map((item) => (
              <ActivityItemComponent key={item.id} item={item as ActivityItem} />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
          className="absolute bottom-4 right-4 px-3 py-1.5 text-xs bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 transition-colors"
        >
          Jump to latest
        </button>
      )}
    </div>
  );
}
