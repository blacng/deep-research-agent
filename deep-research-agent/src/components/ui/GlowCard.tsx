"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AgentRole, agentColors, scaleIn } from "@/lib/animations";

interface GlowCardProps {
  children: React.ReactNode;
  role?: AgentRole;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GlowCard({
  children,
  role,
  isActive = false,
  className,
  onClick,
}: GlowCardProps) {
  const glowColor = role ? agentColors[role].glow : "rgba(99, 102, 241, 0.3)";
  const borderColor = role ? agentColors[role].border : "border-indigo-500";

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "relative rounded-xl border bg-card p-4 transition-all duration-300",
        isActive && [
          "border-2",
          borderColor,
          "animate-pulse-glow",
        ],
        !isActive && "border-border",
        onClick && "cursor-pointer",
        className
      )}
      style={
        isActive
          ? {
              "--glow-color": glowColor,
              boxShadow: `0 0 20px ${glowColor}`,
            } as React.CSSProperties
          : undefined
      }
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-xl opacity-10"
          style={{ backgroundColor: role ? agentColors[role].fill : "#6366F1" }}
          animate={{
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
