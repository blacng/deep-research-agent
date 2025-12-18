"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { chartAppear } from "@/lib/animations";
import { CostSegment } from "@/types/research";
import { formatCurrency } from "@/lib/chart-config";

interface CostBreakdownChartProps {
  data: CostSegment[];
  totalCost: number;
  className?: string;
}

export function CostBreakdownChart({ data, totalCost, className }: CostBreakdownChartProps) {
  // Filter out zero values
  const filteredData = data.filter(d => d.value > 0);

  if (filteredData.length === 0 || totalCost === 0) {
    return (
      <motion.div
        variants={chartAppear}
        initial="hidden"
        animate="show"
        className={cn(
          "flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6",
          className
        )}
      >
        <div className="text-center text-gray-400">
          <p className="text-sm">No cost data yet</p>
          <p className="text-xs mt-1">Costs will appear as agents run</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={chartAppear}
      initial="hidden"
      animate="show"
      className={cn("bg-white rounded-xl border border-gray-200 p-4", className)}
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Cost Breakdown</h3>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-gray-600">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center mt-2">
        <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</span>
        <span className="text-sm text-gray-500 ml-1">total</span>
      </div>
    </motion.div>
  );
}
