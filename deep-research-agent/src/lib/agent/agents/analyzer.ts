/**
 * Analyzer Agent - Synthesizes research findings from multiple Searcher agents
 *
 * The Analyzer reads all research notes, cross-references information,
 * identifies patterns and themes, and creates a synthesis document.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, readdirSync } from "fs";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { AnalyzerConfig, AnalyzerResult } from "./types";
import { logger } from "../../logging/logger";

/**
 * Read the Analyzer agent system prompt
 */
function readAnalyzerPrompt(): string {
  const promptPath = join(process.cwd(), "src/lib/agent/prompts/analyzer-agent.md");
  return readFileSync(promptPath, "utf-8");
}

/**
 * Create and run the Analyzer subagent
 *
 * This agent reads all Searcher findings, synthesizes them,
 * and creates an analysis document.
 *
 * @param config - Configuration for the Analyzer agent
 * @returns Promise resolving to the analysis results
 */
export async function createAnalyzerAgent(
  config: AnalyzerConfig
): Promise<AnalyzerResult> {
  const { agentId, searcherCount, tracker } = config;

  logger.info("Analyzer agent started", {
    agentId,
    searcherCount
  });

  // Ensure output directory exists
  await mkdir(join(process.cwd(), "files/analysis"), { recursive: true });

  const systemPrompt = readAnalyzerPrompt();

  let analysis = "";
  let finalResult: AnalyzerResult | null = null;

  try {
    // Read research notes directly
    const notesDir = join(process.cwd(), "files/research_notes");
    const noteFiles = readdirSync(notesDir).filter(f => f.endsWith(".md"));

    let allNotes = "";
    for (const file of noteFiles) {
      const content = await readFile(join(notesDir, file), "utf-8");
      allNotes += `\n\n## Research Note: ${file}\n\n${content}\n\n---\n`;
    }

    const analyzerPrompt = `You are analyzing research findings from ${searcherCount} Searcher agents.

Here are all the research notes:

${allNotes}

**Your Task**:
1. Read and analyze all the research notes above
2. Cross-reference information across all notes
3. Identify key themes, patterns, and insights
4. Note areas of consensus and debate
5. Extract important data points and metrics
6. Create a comprehensive synthesis document

Create your synthesis following the format specified in your system prompt. Output the complete markdown document for "files/analysis/synthesis.md".`;

    // Run the Analyzer agent
    for await (const message of query({
      prompt: analyzerPrompt,
      options: {
        model: "claude-sonnet-4-5",
        systemPrompt
      }
    })) {
      // Capture assistant messages
      if (message.type === "assistant") {
        const content = (message as any).message?.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "text" && block.text) {
              analysis += block.text;
            }
          }
        }
      }
    }

    // Save the synthesis
    const outputPath = join(process.cwd(), "files/analysis/synthesis.md");
    await writeFile(outputPath, analysis);

    // Extract insights and themes (simplified extraction)
    const insights = extractBulletPoints(analysis, "## Key Themes", "## Cross-Subtopic Insights");
    const themes = extractBulletPoints(analysis, "## Cross-Subtopic Insights", "## Areas of Consensus");

    finalResult = {
      agentId,
      outputPath,
      insights: insights.slice(0, 10),
      themes: themes.slice(0, 10)
    };

    logger.info("Analyzer agent completed", {
      agentId,
      insightCount: insights.length,
      themeCount: themes.length,
      outputPath
    });

    // Mark agent as completed
    tracker.completeAgent(agentId, "completed");

    return finalResult;

  } catch (error) {
    logger.error("Analyzer agent failed", error as Error, {
      agentId
    });
    tracker.completeAgent(agentId, "failed");

    return {
      agentId,
      outputPath: "",
      insights: [],
      themes: []
    };
  }
}

/**
 * Helper function to extract bullet points from markdown between two headings
 */
function extractBulletPoints(content: string, startHeading: string, endHeading: string): string[] {
  const startIndex = content.indexOf(startHeading);
  const endIndex = content.indexOf(endHeading);

  if (startIndex === -1) return [];

  const section = endIndex === -1
    ? content.substring(startIndex)
    : content.substring(startIndex, endIndex);

  const lines = section.split("\n");
  const bulletPoints: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      bulletPoints.push(trimmed.substring(1).trim());
    } else if (trimmed.startsWith("###")) {
      bulletPoints.push(trimmed.substring(3).trim());
    }
  }

  return bulletPoints;
}
