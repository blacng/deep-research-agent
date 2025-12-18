"use client";

import { motion } from "framer-motion";
import { Search, FileText, Bot, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { AnimatedStatCard } from "./AnimatedStatCard";

interface MetricsGridProps {
  searches: number;
  sources: number;
  agents: number;
  cost: number;
  className?: string;
}

export function MetricsGrid({
  searches,
  sources,
  agents,
  cost,
  className,
}: MetricsGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}
    >
      <motion.div key="searches" variants={staggerItem}>
        <AnimatedStatCard
          label="Searches"
          value={searches}
          icon={Search}
          color="blue"
        />
      </motion.div>

      <motion.div key="sources" variants={staggerItem}>
        <AnimatedStatCard
          label="Sources"
          value={sources}
          icon={FileText}
          color="green"
        />
      </motion.div>

      <motion.div key="agents" variants={staggerItem}>
        <AnimatedStatCard
          label="Agents"
          value={agents}
          icon={Bot}
          color="purple"
        />
      </motion.div>

      <motion.div key="cost" variants={staggerItem}>
        <AnimatedStatCard
          label="Cost"
          value={cost}
          icon={DollarSign}
          color="orange"
          format="currency"
        />
      </motion.div>
    </motion.div>
  );
}
