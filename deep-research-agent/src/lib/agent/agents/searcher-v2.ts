/**
 * Searcher Agent - Refactored for Anthropic SDK
 *
 * Uses Exa search tools via Anthropic SDK's native tool calling.
 */

import { readFileSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import Exa from "exa-js";
import { streamMessage, createTextMessage, extractText, type GeminiTool as AnthropicTool } from "../gemini-client";
import { SearcherConfig, SearcherResult } from "./types";
import { logger } from "../../logging/logger";
import { getFilesBasePath } from "../config";

const exa = new Exa(process.env.EXA_API_KEY);

/**
 * Read the Searcher agent system prompt
 */
function readSearcherPrompt(): string {
  const promptPath = join(process.cwd(), "src/lib/agent/prompts/searcher-agent.md");
  return readFileSync(promptPath, "utf-8");
}

/**
 * Define Exa search tools for Anthropic SDK
 */
const exaTools: AnthropicTool[] = [
  {
    name: "exa_search",
    description: "Search the web using Exa's neural search. Returns URLs and snippets of relevant web pages.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
        num_results: { type: "number", description: "Number of results to return (default: 10)" },
        include_domains: { type: "array", items: { type: "string" }, description: "Only include results from these domains" },
        start_published_date: { type: "string", description: "Only include results published after this date (ISO 8601 format)" }
      },
      required: ["query"]
    }
  },
  {
    name: "exa_get_contents",
    description: "Get the full text content of web pages from URLs. Use after exa_search to read full articles.",
    input_schema: {
      type: "object",
      properties: {
        ids: { type: "array", items: { type: "string" }, description: "List of Exa result IDs to fetch content for" }
      },
      required: ["ids"]
    }
  },
  {
    name: "exa_find_similar",
    description: "Find web pages similar to a given URL. Useful for expanding from good sources.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL to find similar pages to" },
        num_results: { type: "number", description: "Number of results to return (default: 10)" }
      },
      required: ["url"]
    }
  },
  {
    name: "exa_search_papers",
    description: "Search for academic papers and scholarly articles.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query for papers" },
        num_results: { type: "number", description: "Number of results (default: 10)" }
      },
      required: ["query"]
    }
  },
  {
    name: "exa_search_news",
    description: "Search for recent news articles and current events.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The news search query" },
        num_results: { type: "number", description: "Number of results (default: 10)" }
      },
      required: ["query"]
    }
  }
];

/**
 * Create and run a Searcher subagent
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

  try {
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

Synthesize your findings into a well-organized markdown document. Include:
- Clear headings for each focus area
- Bullet points of key findings with citations [Source Title](URL)
- Detailed information and analysis
- Cross-cutting insights
- Sources summary

Be thorough and cite all claims.`;

    // Handle Exa tool execution
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
        agentId
      });

      let result: string;

      try {
        if (toolName === "exa_search") {
          const { query, num_results = 10, include_domains, start_published_date } = toolInput as any;
          const searchResult = await exa.searchAndContents(query, {
            numResults: num_results,
            includeDomains: include_domains,
            startPublishedDate: start_published_date,
            text: { maxCharacters: 1000 }
          });

          result = JSON.stringify({
            results: searchResult.results.map(r => ({
              id: r.id,
              title: r.title,
              url: r.url,
              snippet: r.text?.substring(0, 200),
              published_date: r.publishedDate
            }))
          }, null, 2);
        } else if (toolName === "exa_get_contents") {
          const { ids } = toolInput as { ids: string[] };
          const contents = await exa.getContents(ids, { text: true });

          result = JSON.stringify({
            contents: contents.results.map(r => ({
              id: r.id,
              title: r.title,
              url: r.url,
              text: r.text?.substring(0, 2000)
            }))
          }, null, 2);
        } else if (toolName === "exa_find_similar") {
          const { url, num_results = 10 } = toolInput as any;
          const similarResult = await exa.findSimilarAndContents(url, {
            numResults: num_results,
            text: { maxCharacters: 1000 }
          });

          result = JSON.stringify({
            results: similarResult.results.map(r => ({
              id: r.id,
              title: r.title,
              url: r.url,
              snippet: r.text?.substring(0, 200)
            }))
          }, null, 2);
        } else if (toolName === "exa_search_papers") {
          const { query, num_results = 10 } = toolInput as any;
          const paperResult = await exa.searchAndContents(query, {
            numResults: num_results,
            category: "research paper",
            text: { maxCharacters: 1000 }
          });

          result = JSON.stringify({
            results: paperResult.results.map(r => ({
              id: r.id,
              title: r.title,
              url: r.url,
              snippet: r.text?.substring(0, 200),
              published_date: r.publishedDate
            }))
          }, null, 2);
        } else if (toolName === "exa_search_news") {
          const { query, num_results = 10 } = toolInput as any;
          const newsResult = await exa.searchAndContents(query, {
            numResults: num_results,
            category: "news",
            text: { maxCharacters: 1000 }
          });

          result = JSON.stringify({
            results: newsResult.results.map(r => ({
              id: r.id,
              title: r.title,
              url: r.url,
              snippet: r.text?.substring(0, 200),
              published_date: r.publishedDate
            }))
          }, null, 2);
        } else {
          result = JSON.stringify({ error: `Unknown tool: ${toolName}` });
        }

        // Track tool success
        tracker.postToolUseHook({
          tool_use_id: toolUseId,
          tool_name: toolName,
          output: result.substring(0, 200),
          success: true,
          agentId
        });

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result = JSON.stringify({ error: errorMessage });

        // Track tool failure
        tracker.postToolUseHook({
          tool_use_id: toolUseId,
          tool_name: toolName,
          output: result,
          success: false,
          agentId
        });

        return result;
      }
    };

    // Run the Searcher agent with Gemini 3 Pro
    const response = await streamMessage({
      model: "gemini-3-pro-preview",
      system: systemPrompt,
      messages: [createTextMessage(researchPrompt)],
      tools: exaTools,
      max_tokens: 2048,
      onToolUse: handleToolUse,
      onUsage: (usage) => {
        tracker.trackUsage(agentId, "gemini-3-pro-preview", usage);
      }
    });

    const findings = extractText(response);

    // Save findings to file
    const basePath = getFilesBasePath();
    const notesDir = join(basePath, "research_notes");
    await mkdir(notesDir, { recursive: true });
    const outputPath = join(notesDir, `${agentId}.md`);
    await writeFile(outputPath, findings);

    // Extract summary
    const summaryLines = findings.split("\n").slice(0, 5);
    const summary = summaryLines.join("\n").slice(0, 500);

    const finalResult = {
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

    // Mark agent as completed
    tracker.completeAgent(agentId, "completed");

    return finalResult;

  } catch (error) {
    logger.error("Searcher agent failed", error as Error, {
      agentId,
      subtopic
    });

    tracker.completeAgent(agentId, "failed");

    return {
      agentId,
      subtopic,
      outputPath: "",
      summary: `Research failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      fullFindings: ""
    };
  }
}
