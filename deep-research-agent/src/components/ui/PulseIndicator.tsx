"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AgentRole, agentColors } from "@/lib/animations";

interface PulseIndicatorProps {
  status: "active" | "completed" | "failed" | "pending";
  role?: AgentRole;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

const statusColors = {
  active: "bg-blue-500",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
  pending: "bg-gray-400",
};

export function PulseIndicator({
  status,
  role,
  size = "md",
  className,
}: PulseIndicatorProps) {
  const isActive = status === "active";
  const colorClass = role ? agentColors[role].bg : statusColors[status];

  return (
    <span className={cn("relative inline-flex", className)}>
      {isActive && (
        <motion.span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            colorClass
          )}
          animate={{
            scale: [1, 1.5, 1.5],
            opacity: [0.75, 0, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}
      <span
        className={cn(
          "relative inline-flex rounded-full",
          sizeClasses[size],
          colorClass
        )}
      />
    </span>
  );
}
