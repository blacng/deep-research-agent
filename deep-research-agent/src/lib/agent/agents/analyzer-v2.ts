/**
 * Analyzer Agent - Refactored for Anthropic SDK
 *
 * Synthesizes research findings from multiple Searcher agents.
 */

import { readFileSync, readdirSync } from "fs";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { streamMessage, createTextMessage, extractText } from "../gemini-client";
import { AnalyzerConfig, AnalyzerResult } from "./types";
import { logger } from "../../logging/logger";
import { getFilesBasePath } from "../config";

/**
 * Read the Analyzer agent system prompt
 */
function readAnalyzerPrompt(): string {
  const promptPath = join(process.cwd(), "src/lib/agent/prompts/analyzer-agent.md");
  return readFileSync(promptPath, "utf-8");
}

/**
 * Helper to extract bullet points from markdown
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

/**
 * Create and run the Analyzer subagent
 */
export async function createAnalyzerAgent(
  config: AnalyzerConfig
): Promise<AnalyzerResult> {
  const { agentId, searcherCount, tracker } = config;

  logger.info("Analyzer agent started", {
    agentId,
    searcherCount
  });

  const basePath = getFilesBasePath();

  // Ensure output directory exists
  await mkdir(join(basePath, "analysis"), { recursive: true });

  const systemPrompt = readAnalyzerPrompt();

  try {
    // Read research notes directly
    const notesDir = join(basePath, "research_notes");
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

Create your synthesis following the format specified in your system prompt.`;

    // Run the Analyzer agent with Gemini 3 Pro for synthesis
    const response = await streamMessage({
      model: "gemini-3-pro-preview",
      system: systemPrompt,
      messages: [createTextMessage(analyzerPrompt)],
      max_tokens: 3072,
      onUsage: (usage) => {
        tracker.trackUsage(agentId, "gemini-3-pro-preview", usage);
      }
    });

    const analysis = extractText(response);

    // Save the synthesis
    const outputPath = join(basePath, "analysis/synthesis.md");
    await writeFile(outputPath, analysis);

    // Extract insights and themes
    const insights = extractBulletPoints(analysis, "## Key Themes", "## Cross-Subtopic Insights");
    const themes = extractBulletPoints(analysis, "## Cross-Subtopic Insights", "## Areas of Consensus");

    const finalResult = {
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
