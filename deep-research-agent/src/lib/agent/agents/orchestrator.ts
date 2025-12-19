/**
 * Orchestrator Agent - Main coordinator for the multi-agent research system
 *
 * The Orchestrator plans research strategy, spawns specialized subagents,
 * and coordinates their activities to produce comprehensive research reports.
 */

import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { readFileSync } from "fs";
import { join } from "path";
import { OrchestratorConfig } from "./types";
import { createSearcherAgent } from "./searcher";
import { logger } from "../../logging/logger";

/**
 * Read the Orchestrator agent system prompt
 */
function readOrchestratorPrompt(): string {
  const promptPath = join(process.cwd(), "src/lib/agent/prompts/orchestrator-agent.md");
  return readFileSync(promptPath, "utf-8");
}

/**
 * Run the Orchestrator agent
 *
 * This is the main entry point for the multi-agent research system.
 * The Orchestrator coordinates all other agents.
 *
 * @param config - Configuration for the Orchestrator
 * @yields Messages from the Orchestrator's execution
 */
export async function* runOrchestratorAgent(config: OrchestratorConfig) {
  const { topic, sessionId, tracker } = config;

  logger.info("Orchestrator agent started", {
    sessionId,
    topic
  });

  // Register the Orchestrator itself
  tracker.registerAgent("ORCHESTRATOR", "orchestrator", `Research: ${topic}`);

  const systemPrompt = readOrchestratorPrompt();

  // Tool 1: Spawn a Searcher subagent
  const spawnSearcherTool = tool(
    "spawn_searcher",
    "Spawn a Searcher subagent to research a specific subtopic in parallel. Use this tool multiple times to spawn several Searchers simultaneously.",
    {
      agent_id: z.string().describe("Unique ID for this searcher (format: SEARCHER-1, SEARCHER-2, etc.)"),
      subtopic: z.string().describe("Specific subtopic for this Searcher to research"),
      focus_areas: z.array(z.string()).describe("List of 2-4 specific focus areas within this subtopic")
    },
    async (args) => {
      try {
        // Register the Searcher agent
        tracker.registerAgent(args.agent_id, "searcher", args.subtopic);

        // Create and run the Searcher subagent
        const findings = await createSearcherAgent({
          subtopic: args.subtopic,
          focusAreas: args.focus_areas,
          agentId: args.agent_id,
          tracker,
          sessionId
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              agent_id: args.agent_id,
              status: "completed",
              subtopic: args.subtopic,
              findings_location: findings.outputPath,
              summary: findings.summary,
              message: `Searcher ${args.agent_id} completed research on "${args.subtopic}"`
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              agent_id: args.agent_id,
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error"
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 2: Spawn the Analyzer subagent
  const spawnAnalyzerTool = tool(
    "spawn_analyzer",
    "Spawn the Analyzer subagent to synthesize findings from all Searcher agents. Call this AFTER all Searchers have completed.",
    {
      searcher_count: z.number().describe("Number of Searcher agents whose findings should be analyzed")
    },
    async (args) => {
      try {
        const agentId = "ANALYZER-1";
        tracker.registerAgent(agentId, "analyzer", "Synthesize research findings");

        // Import and run the Analyzer agent
        const { createAnalyzerAgent } = await import("./analyzer");
        const analysis = await createAnalyzerAgent({
          agentId,
          searcherCount: args.searcher_count,
          tracker,
          sessionId
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              agent_id: agentId,
              status: "completed",
              analysis_location: analysis.outputPath,
              key_insights: analysis.insights.slice(0, 5),
              themes: analysis.themes.slice(0, 5),
              message: "Analyzer completed synthesis of research findings"
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              agent_id: "ANALYZER-1",
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error"
            }, null, 2)
          }]
        };
      }
    }
  );

  // Tool 3: Spawn the Writer subagent
  const spawnWriterTool = tool(
    "spawn_writer",
    "Spawn the Writer subagent to create the final research report. Call this AFTER the Analyzer has completed.",
    {
      topic: z.string().describe("The main research topic for the report title")
    },
    async (args) => {
      try {
        const agentId = "WRITER-1";
        tracker.registerAgent(agentId, "writer", "Generate research report");

        // Import and run the Writer agent
        const { createWriterAgent } = await import("./writer");
        const report = await createWriterAgent({
          agentId,
          topic: args.topic,
          tracker,
          sessionId
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              agent_id: agentId,
              status: "completed",
              report_content: report.content,
              word_count: report.wordCount,
              source_count: report.sourceCount,
              message: "Writer completed research report"
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              agent_id: "WRITER-1",
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error"
            }, null, 2)
          }]
        };
      }
    }
  );

  // Construct the Orchestrator's prompt
  const orchestratorPrompt = `You are coordinating a multi-agent research project on the following topic:

**Research Topic**: ${topic}

Your task is to:
1. Break down this topic into 3-5 distinct subtopics
2. Spawn Searcher agents to research each subtopic in parallel
3. Wait for all Searchers to complete
4. Spawn the Analyzer to synthesize findings
5. Spawn the Writer to create the final report
6. Provide a summary of the research process and key findings

Begin by explaining your research strategy, then execute it step by step using your tools.`;

  // Create SDK MCP server with custom tools
  const customToolsServer = createSdkMcpServer({
    name: "deep-research",
    version: "1.0.0",
    tools: [spawnSearcherTool, spawnAnalyzerTool, spawnWriterTool]
  });

  // Run the Orchestrator with all spawn tools
  try {
    for await (const message of query({
      prompt: orchestratorPrompt,
      options: {
        model: "claude-sonnet-4-5",
        systemPrompt,
        stderr: (data) => {
          logger.error("Claude Code CLI stderr", new Error("CLI subprocess error"), {
            sessionId,
            stderr: data.toString()
          });
        },
        mcpServers: {
          "deep-research": customToolsServer
        },
        allowedTools: [
          "mcp__deep-research__spawn_searcher",
          "mcp__deep-research__spawn_analyzer",
          "mcp__deep-research__spawn_writer"
        ],
        hooks: {
          PreToolUse: [{
            hooks: [async (input) => {
              if (input.hook_event_name === 'PreToolUse') {
                tracker.preToolUseHook({
                  tool_use_id: input.tool_use_id,
                  tool_name: input.tool_name,
                  input: input.tool_input as Record<string, unknown>,
                  agentId: "ORCHESTRATOR"
                });
              }
              return { continue: true };
            }]
          }],
          PostToolUse: [{
            hooks: [async (input) => {
              if (input.hook_event_name === 'PostToolUse') {
                tracker.postToolUseHook({
                  tool_use_id: input.tool_use_id,
                  tool_name: input.tool_name,
                  output: (input as any).tool_output,
                  success: !(input as any).is_error,
                  agentId: "ORCHESTRATOR"
                });
              }
              return { continue: true };
            }]
          }]
        }
        // Note: resume parameter removed - only use when resuming existing conversations
      }
    })) {
      yield message;
    }

    logger.info("Orchestrator agent completed", {
      sessionId,
      topic
    });

    // Mark Orchestrator as completed
    tracker.completeAgent("ORCHESTRATOR", "completed");

  } catch (error) {
    logger.error("Orchestrator agent failed", error as Error, {
      sessionId,
      topic
    });
    tracker.completeAgent("ORCHESTRATOR", "failed");
    throw error;
  }
}
