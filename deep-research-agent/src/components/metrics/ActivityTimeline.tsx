"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { chartAppear } from "@/lib/animations";
import { ChartDataPoint } from "@/types/research";

interface ActivityTimelineProps {
  data: ChartDataPoint[];
  className?: string;
}

export function ActivityTimeline({ data, className }: ActivityTimelineProps) {
  // Convert timestamps to relative time for display
  const processedData = data.map((point, index) => ({
    ...point,
    index: index + 1,
    time: index === 0 ? 0 : Math.round((point.timestamp - data[0].timestamp) / 1000),
  }));

  if (data.length === 0) {
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
          <p className="text-sm">No activity yet</p>
          <p className="text-xs mt-1">Tool calls will appear here</p>
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
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Activity Timeline</h3>

      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              tickFormatter={(value) => `${value}s`}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 text-xs">
                      <p className="font-medium text-gray-900">{data.label}</p>
                      <p className="text-gray-500">Call #{data.value}</p>
                      <p className="text-gray-400">{data.time}s elapsed</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8B5CF6"
              strokeWidth={2}
              fill="url(#colorActivity)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
        <span>{data.length} tool calls</span>
        {processedData.length > 0 && (
          <span>Duration: {processedData[processedData.length - 1].time}s</span>
        )}
      </div>
    </motion.div>
  );
}
