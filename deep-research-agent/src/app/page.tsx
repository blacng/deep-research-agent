"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResearch } from "@/hooks/useResearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dashboard components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QueryPanel } from "@/components/dashboard/QueryPanel";

// Agent components
import { AgentNodeGraph } from "@/components/agents/AgentNodeGraph";

// Metrics components
import { MetricsGrid } from "@/components/metrics/MetricsGrid";
import { CostBreakdownChart } from "@/components/metrics/CostBreakdownChart";
import { ActivityTimeline } from "@/components/metrics/ActivityTimeline";

// Stream components
import { LiveActivityFeed } from "@/components/stream/LiveActivityFeed";

// Report components
import { ReportViewer } from "@/components/report/ReportViewer";

export default function Home() {
  const {
    messages,
    isResearching,
    finalReport,
    error,
    startResearch,
    stats,
    agents,
    currentPhase,
    chartData,
  } = useResearch();

  const [activeTab, setActiveTab] = useState<"dashboard" | "report">("dashboard");
  const hasAutoSwitchedRef = useRef(false);

  // Transform messages for activity feed
  const activityItems = messages
    .filter((m) => ["tool_use", "tool_result", "agent_event", "status", "error"].includes(m.type))
    .map((m) => ({
      id: m.id,
      type: m.type as "tool_use" | "tool_result" | "agent_event" | "status" | "error",
      agentId: m.event?.agentId,
      agentRole: m.event?.role,
      toolName: m.tool_name,
      content: m.content,
      message: m.message,
      isComplete: m.type === "tool_result" || m.type === "status",
      timestamp: m.timestamp,
    }));

  // Auto-switch to report tab once when research completes
  useEffect(() => {
    if (finalReport && !isResearching && !hasAutoSwitchedRef.current) {
      hasAutoSwitchedRef.current = true;
      setTimeout(() => setActiveTab("report"), 500);
    }
    // Reset when starting new research
    if (isResearching) {
      hasAutoSwitchedRef.current = false;
    }
  }, [finalReport, isResearching]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader
        isResearching={isResearching}
        currentPhase={currentPhase}
        hasError={!!error}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "dashboard" | "report")}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="bg-white border border-gray-200">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="report" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
                Report
                {finalReport && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <TabsContent value="dashboard" className="mt-0" key="dashboard-tab">
              <motion.div
                key="dashboard-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Left Column - Query & Activity */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Query Panel */}
                  <QueryPanel
                    onSubmit={startResearch}
                    isResearching={isResearching}
                  />

                  {/* Metrics Grid */}
                  <MetricsGrid
                    searches={stats.searches}
                    sources={stats.sources}
                    agents={stats.agents}
                    cost={stats.cost}
                  />

                  {/* Live Activity Feed */}
                  <LiveActivityFeed messages={activityItems} isResearching={isResearching} />

                  {/* Error Display */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-4"
                    >
                      <p className="text-sm text-red-600 font-medium">Error</p>
                      <p className="text-sm text-red-500 mt-1">{error}</p>
                    </motion.div>
                  )}
                </div>

                {/* Right Column - Agent Graph & Charts */}
                <div className="space-y-6">
                  {/* Agent Node Graph */}
                  <div className="h-[400px]">
                    <AgentNodeGraph agents={agents} />
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <CostBreakdownChart
                      data={chartData.costBreakdown}
                      totalCost={stats.cost}
                    />
                    <ActivityTimeline data={chartData.toolCallsOverTime} />
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="report" className="mt-0" key="report-tab">
              <motion.div
                key="report-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ReportViewer content={finalReport} />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
}
