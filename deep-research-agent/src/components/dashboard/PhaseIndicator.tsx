"use client";

import { motion } from "framer-motion";
import { Bot, Search, FileText, PenTool, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ResearchPhase } from "@/types/research";

interface PhaseIndicatorProps {
  phase: ResearchPhase;
  className?: string;
}

const phases: { key: ResearchPhase; label: string; icon: typeof Bot }[] = [
  { key: "planning", label: "Planning", icon: Bot },
  { key: "searching", label: "Searching", icon: Search },
  { key: "analyzing", label: "Analyzing", icon: FileText },
  { key: "writing", label: "Writing", icon: PenTool },
];

const phaseOrder: Record<ResearchPhase, number> = {
  idle: -1,
  planning: 0,
  searching: 1,
  analyzing: 2,
  writing: 3,
  complete: 4,
};

export function PhaseIndicator({ phase, className }: PhaseIndicatorProps) {
  const currentIndex = phaseOrder[phase];

  if (phase === "idle") {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {phases.map((p, index) => {
        const Icon = p.icon;
        const isActive = p.key === phase;
        const isComplete = phaseOrder[phase] > index || phase === "complete";
        const isPending = phaseOrder[phase] < index && phase !== "complete";

        return (
          <div key={p.key} className="flex items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300",
                isActive && "bg-violet-100 text-violet-700",
                isComplete && !isActive && "bg-emerald-50 text-emerald-600",
                isPending && "bg-gray-100 text-gray-400"
              )}
            >
              {isComplete && !isActive ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Icon className={cn("h-3 w-3", isActive && "animate-pulse")} />
              )}
              <span className="hidden sm:inline">{p.label}</span>
            </motion.div>

            {index < phases.length - 1 && (
              <div
                className={cn(
                  "w-4 h-0.5 mx-0.5 transition-colors duration-300",
                  isComplete ? "bg-emerald-300" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}

      {phase === "complete" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 ml-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span className="hidden sm:inline">Done</span>
        </motion.div>
      )}
    </div>
  );
}
