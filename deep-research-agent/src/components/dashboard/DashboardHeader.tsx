"use client";

import { motion } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/animations";
import { ResearchPhase } from "@/types/research";
import { PhaseIndicator } from "./PhaseIndicator";

interface DashboardHeaderProps {
  isResearching: boolean;
  currentPhase: ResearchPhase;
  hasError?: boolean;
}

export function DashboardHeader({ isResearching, currentPhase, hasError }: DashboardHeaderProps) {
  return (
    <motion.header
      variants={fadeIn}
      initial="hidden"
      animate="show"
      className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <motion.div
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg"
            animate={isResearching ? { scale: [1, 1.05, 1] } : {}}
            transition={isResearching ? { duration: 2, repeat: Infinity } : {}}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Deep Research Agent</h1>
            <p className="text-sm text-gray-500">Multi-agent research system</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-4">
          <PhaseIndicator phase={currentPhase} />

          {/* Global status badge */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              isResearching && "bg-blue-50 text-blue-600",
              currentPhase === "complete" && !hasError && "bg-emerald-50 text-emerald-600",
              hasError && "bg-red-50 text-red-600",
              !isResearching && currentPhase === "idle" && "bg-gray-100 text-gray-600"
            )}
          >
            {isResearching && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Researching</span>
              </>
            )}
            {currentPhase === "complete" && !hasError && (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Complete</span>
              </>
            )}
            {hasError && (
              <>
                <XCircle className="h-4 w-4" />
                <span>Error</span>
              </>
            )}
            {!isResearching && currentPhase === "idle" && !hasError && (
              <span>Ready</span>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
