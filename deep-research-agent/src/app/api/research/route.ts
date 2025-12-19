import { NextRequest } from "next/server";
import { runOrchestratorAgent } from "@/lib/agent/agents/orchestrator-v2";
import { AgentActivityTracker } from "@/lib/agent/coordination/agent-tracker";
import { logger } from "@/lib/logging/logger";
import { getFilesBasePath } from "@/lib/agent/config";
import { readFile } from "fs/promises";
import { join } from "path";

export const maxDuration = 300; // 5 minutes for deep research

export async function POST(request: NextRequest) {
  // Generate a unique session ID
  const sessionId = crypto.randomUUID();

  try {
    const { topic } = await request.json();

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    logger.info("Research request started", { sessionId, topic });

    const encoder = new TextEncoder();
    const tracker = new AgentActivityTracker(sessionId, topic);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Setup event streaming from activity tracker
          tracker.onEvent((event) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: "agent_event",
                event
              })}\n\n`)
            );
          });

          // Send initial message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "status",
              status: "started",
              message: "Orchestrator agent starting multi-agent research...",
              topic
            })}\n\n`)
          );

          // Run the Orchestrator agent
          for await (const message of runOrchestratorAgent({
            topic,
            sessionId,
            tracker
          })) {
            // Log raw message for debugging
            logger.debug("SDK Message received", {
              sessionId,
              messageType: message.type,
              message: JSON.stringify(message).slice(0, 500)
            });

            // Extract usage data if present and track costs
            if ((message as any).usage) {
              const agentId = "ORCHESTRATOR"; // Could be extracted from message context if available
              const model = "claude-sonnet-4-5";
              tracker.trackUsage(agentId, model, (message as any).usage);
            }

            // Transform message for client consumption
            const clientMessage = transformMessage(message);

            if (clientMessage) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(clientMessage)}\n\n`)
              );
            }

            // Send agent statistics periodically
            if (message.type === "result" || (message as {type: string}).type === "stream_event") {
              const stats = tracker.getStatistics();
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: "agent_stats",
                  stats
                })}\n\n`)
              );
            }
          }

          // Read the final report
          let reportContent = "";
          try {
            const basePath = getFilesBasePath();
            const reportPath = join(basePath, "reports/final_report.md");
            reportContent = await readFile(reportPath, "utf-8");
          } catch (error) {
            logger.error("Failed to read final report", error as Error, { sessionId });
            reportContent = "Error: Failed to load the generated report.";
          }

          // Send final enhanced statistics with costs, memory & agent details
          const enhancedStats = tracker.getEnhancedStatistics();
          const activities = tracker.getAgentActivities();

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "status",
              status: "completed",
              message: "Multi-agent research completed",
              report: reportContent,
              stats: enhancedStats,
              activities: activities.map(a => ({
                agentId: a.agentId,
                role: a.agentRole,
                task: a.agentTask,
                status: a.status,
                toolCallCount: a.toolCalls.length,
                duration: a.endTime ? a.endTime.getTime() - a.startTime.getTime() : null
              }))
            })}\n\n`)
          );

          // Finalize session logging with markdown generation
          await tracker.finalizeSession();

          logger.info("Research request completed", {
            sessionId,
            totalCost: enhancedStats.costs.totalCost.toFixed(4),
            agentCount: enhancedStats.agents.totalAgents,
            topic
          });

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          logger.error("Research error", error as Error, { sessionId, topic });
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "Unknown error occurred"
            })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    logger.error("API error", error as Error, { sessionId });
    return new Response(
      JSON.stringify({ error: "Failed to start research" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Transform SDK messages to a cleaner format for the client
function transformMessage(message: Record<string, unknown>): Record<string, unknown> | null {
  const type = message.type as string;

  switch (type) {
    case "system":
      if (message.subtype === "init") {
        return {
          type: "system",
          subtype: "init",
          session_id: message.session_id
        };
      }
      return null;

    case "assistant":
      // Extract text content from assistant messages
      const content = message.message as Record<string, unknown> | undefined;
      if (content?.content) {
        const contentArray = content.content as Array<Record<string, unknown>>;
        const textContent = contentArray
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("");

        if (textContent) {
          return {
            type: "assistant",
            content: textContent
          };
        }
      }
      return null;

    case "tool_use":
      return {
        type: "tool_use",
        tool_name: message.tool_name,
        tool_input: message.tool_input
      };

    case "tool_result":
      // Parse tool results to extract useful info
      const resultContent = message.content as string | undefined;
      if (resultContent) {
        try {
          const parsed = JSON.parse(resultContent);
          return {
            type: "tool_result",
            tool_name: message.tool_name,
            result_summary: summarizeToolResult(message.tool_name as string, parsed)
          };
        } catch {
          return {
            type: "tool_result",
            tool_name: message.tool_name,
            result_summary: "Results received"
          };
        }
      }
      return null;

    case "result":
      // Final result
      const resultText = message.result as string | undefined;
      if (resultText) {
        return {
          type: "result",
          content: resultText
        };
      }
      return null;

    default:
      return null;
  }
}

// Summarize tool results for progress display
function summarizeToolResult(toolName: string, result: Record<string, unknown>): string {
  switch (toolName) {
    // Exa search tools
    case "mcp__exa-search__search":
    case "mcp__exa-search__search_papers":
    case "mcp__exa-search__search_news":
      const total = result.total as number || 0;
      return `Found ${total} results`;

    case "mcp__exa-search__get_contents":
      const docs = result.documents as Array<unknown> || [];
      return `Retrieved content from ${docs.length} source(s)`;

    case "mcp__exa-search__find_similar":
      const similar = result.similar as Array<unknown> || [];
      return `Found ${similar.length} similar sources`;

    // Multi-agent spawn tools
    case "spawn_searcher":
      const agentId = result.agent_id as string || "Unknown";
      const status = result.status as string || "unknown";
      const subtopic = result.subtopic as string || "";
      if (status === "completed") {
        return `${agentId} completed research on "${subtopic}"`;
      }
      return `${agentId} ${status}`;

    case "spawn_analyzer":
      if (result.status === "completed") {
        const insights = (result.key_insights as Array<unknown>) || [];
        return `Analyzer completed synthesis with ${insights.length} key insights`;
      }
      return `Analyzer ${result.status || "running"}`;

    case "spawn_writer":
      if (result.status === "completed") {
        const wordCount = result.word_count as number || 0;
        return `Writer completed ${wordCount}-word research report`;
      }
      return `Writer ${result.status || "running"}`;

    // File operation tools
    case "read_file":
    case "list_files":
    case "write_file":
      return result.message as string || "File operation completed";

    default:
      return "Results received";
  }
}
