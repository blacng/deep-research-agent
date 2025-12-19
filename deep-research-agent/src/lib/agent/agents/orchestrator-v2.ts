/**
 * Orchestrator Agent - Refactored for Anthropic SDK
 *
 * Uses direct API access instead of Claude Code CLI subprocess.
 * Coordinates Searcher, Analyzer, and Writer agents via tool calling.
 */

import { readFileSync } from "fs";
import { join } from "path";
import { streamMessage, createTextMessage, type GeminiTool as AnthropicTool } from "../gemini-client";
import { OrchestratorConfig } from "./types";
import { createSearcherAgent } from "./searcher-v2";
import { logger } from "../../logging/logger";

/**
 * Read the Orchestrator agent system prompt
 */
function readOrchestratorPrompt(): string {
  const promptPath = join(process.cwd(), "src/lib/agent/prompts/orchestrator-agent.md");
  return readFileSync(promptPath, "utf-8");
}

/**
 * Define tools for spawning sub-agents
 */
const orchestratorTools: AnthropicTool[] = [
  {
    name: "spawn_searcher",
    description: "Spawn a Searcher subagent to research a specific subtopic in parallel. Use this tool multiple times to spawn several Searchers simultaneously.",
    input_schema: {
      type: "object",
      properties: {
        agent_id: {
          type: "string",
          description: "Unique ID for this searcher (format: SEARCHER-1, SEARCHER-2, etc.)"
        },
        subtopic: {
          type: "string",
          description: "Specific subtopic for this Searcher to research"
        },
        focus_areas: {
          type: "array",
          items: { type: "string" },
          description: "List of 2-4 specific focus areas within this subtopic"
        }
      },
      required: ["agent_id", "subtopic", "focus_areas"]
    }
  },
  {
    name: "spawn_analyzer",
    description: "Spawn the Analyzer subagent to synthesize findings from all Searcher agents. Call this AFTER all Searchers have completed.",
    input_schema: {
      type: "object",
      properties: {
        searcher_count: {
          type: "number",
          description: "Number of Searcher agents whose findings should be analyzed"
        }
      },
      required: ["searcher_count"]
    }
  },
  {
    name: "spawn_writer",
    description: "Spawn the Writer subagent to create the final research report. Call this AFTER the Analyzer has completed.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The main research topic for the report title"
        }
      },
      required: ["topic"]
    }
  }
];

/**
 * Run the Orchestrator agent with Anthropic SDK
 */
export async function* runOrchestratorAgent(config: OrchestratorConfig) {
  const { topic, sessionId, tracker } = config;

  logger.info("Orchestrator agent started", {
    sessionId,
    topic
  });

  // Register the Orchestrator
  tracker.registerAgent("ORCHESTRATOR", "orchestrator", `Research: ${topic}`);

  const systemPrompt = readOrchestratorPrompt();

  const orchestratorPrompt = `You are coordinating a multi-agent research project on the following topic:

**Research Topic**: ${topic}

Your task is to:
1. Break down this topic into 3 distinct subtopics (to avoid rate limits)
2. Spawn Searcher agents to research each subtopic in parallel
3. Wait for all Searchers to complete
4. Spawn the Analyzer to synthesize findings
5. Spawn the Writer to create the final report
6. Provide a summary of the research process and key findings

Begin by explaining your research strategy, then execute it step by step using your tools.`;

  try {
    // Handle tool execution
    const handleToolUse = async (
      toolUseId: string,
      toolName: string,
      toolInput: Record<string, unknown>
    ): Promise<string> => {
      // Track tool start
      tracker.preToolUseHook({
        tool_use_id: toolUseId,
        tool_name: toolName,
        input: toolInput,
        agentId: "ORCHESTRATOR"
      });

      let result: string;
      const startTime = Date.now();

      try {
        if (toolName === "spawn_searcher") {
          const { agent_id, subtopic, focus_areas } = toolInput as {
            agent_id: string;
            subtopic: string;
            focus_areas: string[];
          };

          // Register the Searcher agent
          tracker.registerAgent(agent_id, "searcher", subtopic);

          // Create and run the Searcher subagent
          const findings = await createSearcherAgent({
            subtopic,
            focusAreas: focus_areas,
            agentId: agent_id,
            tracker,
            sessionId
          });

          result = JSON.stringify({
            agent_id,
            status: "completed",
            subtopic,
            findings_location: findings.outputPath,
            summary: findings.summary,
            message: `Searcher ${agent_id} completed research on "${subtopic}"`
          }, null, 2);
        } else if (toolName === "spawn_analyzer") {
          const { searcher_count } = toolInput as { searcher_count: number };

          const agentId = "ANALYZER-1";
          tracker.registerAgent(agentId, "analyzer", "Synthesize research findings");

          // Import and run the Analyzer agent
          const { createAnalyzerAgent } = await import("./analyzer-v2");
          const analysis = await createAnalyzerAgent({
            agentId,
            searcherCount: searcher_count,
            tracker,
            sessionId
          });

          result = JSON.stringify({
            agent_id: agentId,
            status: "completed",
            analysis_location: analysis.outputPath,
            key_insights: analysis.insights.slice(0, 5),
            themes: analysis.themes.slice(0, 5),
            message: "Analyzer completed synthesis of research findings"
          }, null, 2);
        } else if (toolName === "spawn_writer") {
          const { topic: reportTopic } = toolInput as { topic: string };

          const agentId = "WRITER-1";
          tracker.registerAgent(agentId, "writer", "Generate research report");

          // Import and run the Writer agent
          const { createWriterAgent } = await import("./writer-v2");
          const report = await createWriterAgent({
            agentId,
            topic: reportTopic,
            tracker,
            sessionId
          });

          result = JSON.stringify({
            agent_id: agentId,
            status: "completed",
            report_content: report.content,
            word_count: report.wordCount,
            source_count: report.sourceCount,
            message: "Writer completed research report"
          }, null, 2);
        } else {
          result = JSON.stringify({ error: `Unknown tool: ${toolName}` });
        }

        // Track tool success
        tracker.postToolUseHook({
          tool_use_id: toolUseId,
          tool_name: toolName,
          output: result,
          success: true,
          agentId: "ORCHESTRATOR"
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result = JSON.stringify({
          agent_id: toolInput.agent_id || "unknown",
          status: "failed",
          error: errorMessage
        });

        // Track tool failure
        tracker.postToolUseHook({
          tool_use_id: toolUseId,
          tool_name: toolName,
          output: result,
          success: false,
          agentId: "ORCHESTRATOR"
        });

        return result;
      }
    };

    // Stream the orchestrator's execution
    let fullResponse = "";

    const response = await streamMessage({
      model: "gemini-3-pro-preview",
      system: systemPrompt,
      messages: [createTextMessage(orchestratorPrompt)],
      tools: orchestratorTools,
      max_tokens: 4096,
      onToolUse: handleToolUse,
      onText: (text) => {
        fullResponse += text;
        // Yield text chunks to API route for streaming to client
      },
      onUsage: (usage) => {
        tracker.trackUsage("ORCHESTRATOR", "gemini-3-pro-preview", usage);
      }
    });

    logger.info("Orchestrator agent completed", {
      sessionId,
      topic
    });

    // Mark Orchestrator as completed
    tracker.completeAgent("ORCHESTRATOR", "completed");

    // Yield final response
    yield { type: "complete", content: fullResponse };

  } catch (error) {
    logger.error("Orchestrator agent failed", error as Error, {
      sessionId,
      topic
    });
    tracker.completeAgent("ORCHESTRATOR", "failed");
    throw error;
  }
}
