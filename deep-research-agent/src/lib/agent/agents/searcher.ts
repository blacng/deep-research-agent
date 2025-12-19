/**
 * Searcher Agent - Specialized subagent for information retrieval
 *
 * The Searcher agent is responsible for researching a specific subtopic using
 * the Exa search tools. Multiple Searchers can run in parallel for efficiency.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { exaSearchTools } from "../tools";
import { SearcherConfig, SearcherResult } from "./types";
import { logger } from "../../logging/logger";

/**
 * Read the Searcher agent system prompt
 */
function readSearcherPrompt(): string {
  const promptPath = join(process.cwd(), "src/lib/agent/prompts/searcher-agent.md");
  return readFileSync(promptPath, "utf-8");
}

/**
 * Create and run a Searcher subagent
 *
 * This agent conducts research on a specific subtopic using Exa search tools
 * and saves its findings to a markdown file.
 *
 * @param config - Configuration for the Searcher agent
 * @returns Promise resolving to the search results
 */
export async function createSearcherAgent(
  config: SearcherConfig
): Promise<SearcherResult> {
  const { subtopic, focusAreas, agentId, tracker } = config;

  logger.info("Searcher agent started", {
    agentId,
    subtopic,
    focusAreas
  });

  // Ensure output directory exists
  await mkdir(join(process.cwd(), "files/research_notes"), { recursive: true });

  const systemPrompt = readSearcherPrompt();

  let findings = "";
  let finalResult: SearcherResult | null = null;

  try {
    // Construct the research prompt for this Searcher
    const researchPrompt = `Research the following subtopic in depth:

**Subtopic**: ${subtopic}

**Focus Areas**:
${focusAreas.map((area, i) => `${i + 1}. ${area}`).join("\n")}

**Instructions**:
1. Use the search tool to find relevant sources on this subtopic
2. Use get_contents to read full articles from the most promising sources
3. Use find_similar to expand from your best sources
4. For academic topics, use search_papers for scholarly research
5. For current events, use search_news for recent developments

Synthesize your findings into a well-organized markdown document following the output format specified in your system prompt. Include:
- Clear headings for each focus area
- Bullet points of key findings with citations [Source Title](URL)
- Detailed information and analysis
- Cross-cutting insights
- Sources summary

Be thorough and cite all claims. Your research will be analyzed alongside other Searchers' findings.`;

    // Run the Searcher agent with Exa tools
    for await (const message of query({
      prompt: researchPrompt,
      options: {
        model: "claude-sonnet-4-5",
        systemPrompt,
        mcpServers: {
          "exa-search": exaSearchTools
        },
        allowedTools: [
          "mcp__exa-search__search",
          "mcp__exa-search__get_contents",
          "mcp__exa-search__find_similar",
          "mcp__exa-search__search_papers",
          "mcp__exa-search__search_news"
        ],
        hooks: {
          PreToolUse: [{
            hooks: [async (input) => {
              // Track tool usage for this specific agent
              if (input.hook_event_name === 'PreToolUse') {
                tracker.preToolUseHook({
                  tool_use_id: input.tool_use_id,
                  tool_name: input.tool_name,
                  input: input.tool_input as Record<string, unknown>,
                  agentId
                });
              }
              return { continue: true };
            }]
          }],
          PostToolUse: [{
            hooks: [async (input) => {
              // Track tool completion for this specific agent
              if (input.hook_event_name === 'PostToolUse') {
                tracker.postToolUseHook({
                  tool_use_id: input.tool_use_id,
                  tool_name: input.tool_name,
                  output: (input as any).tool_output,
                  success: !(input as any).is_error,
                  agentId
                });
              }
              return { continue: true };
            }]
          }]
        }
      }
    })) {
      // Capture assistant messages
      if (message.type === "assistant") {
        const content = (message as any).message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "text" && block.text) {
              findings += block.text;
            }
          }
        }
      }
    }

    // Save findings to file
    const outputPath = join(process.cwd(), "files/research_notes", `${agentId}.md`);
    await writeFile(outputPath, findings);

    // Extract summary (first 500 characters or first 5 lines)
    const summaryLines = findings.split("\n").slice(0, 5);
    const summary = summaryLines.join("\n").slice(0, 500);

    finalResult = {
      agentId,
      subtopic,
      outputPath,
      summary,
      fullFindings: findings
    };

    logger.info("Searcher agent completed", {
      agentId,
      subtopic,
      findingsLength: findings.length,
      outputPath
    });

    // Mark agent as completed successfully
    tracker.completeAgent(agentId, "completed");

    return finalResult;

  } catch (error) {
    logger.error("Searcher agent failed", error as Error, {
      agentId,
      subtopic
    });

    // Mark agent as failed
    tracker.completeAgent(agentId, "failed");

    // Still return a result with error information
    return {
      agentId,
      subtopic,
      outputPath: "",
      summary: `Research failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      fullFindings: ""
    };
  }
}
