/**
 * Writer Agent - Creates the final research report
 *
 * The Writer reads research notes and analysis, then creates a comprehensive,
 * well-structured, professional markdown report.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, readdirSync } from "fs";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { WriterConfig, WriterResult } from "./types";
import { logger } from "../../logging/logger";

/**
 * Read the Writer agent system prompt
 */
function readWriterPrompt(): string {
  const promptPath = join(process.cwd(), "src/lib/agent/prompts/writer-agent.md");
  return readFileSync(promptPath, "utf-8");
}

/**
 * Create and run the Writer subagent
 *
 * This agent reads all research materials and creates the final report.
 *
 * @param config - Configuration for the Writer agent
 * @returns Promise resolving to the report results
 */
export async function createWriterAgent(
  config: WriterConfig
): Promise<WriterResult> {
  const { agentId, topic, tracker } = config;

  logger.info("Writer agent started", {
    agentId,
    topic
  });

  // Ensure output directory exists
  await mkdir(join(process.cwd(), "files/reports"), { recursive: true });

  const systemPrompt = readWriterPrompt();

  let report = "";
  let finalResult: WriterResult | null = null;

  try {
    // Read all research materials
    const analysisPath = join(process.cwd(), "files/analysis/synthesis.md");
    const notesDir = join(process.cwd(), "files/research_notes");

    let analysisContent = "";
    try {
      analysisContent = await readFile(analysisPath, "utf-8");
    } catch {
      analysisContent = "No analysis available.";
    }

    const noteFiles = readdirSync(notesDir).filter(f => f.endsWith(".md"));
    let allNotes = "";
    for (const file of noteFiles) {
      const content = await readFile(join(notesDir, file), "utf-8");
      allNotes += `\n\n## ${file}\n\n${content}\n\n---\n`;
    }

    const writerPrompt = `You are creating the final research report on: "${topic}"

Here is the Analyzer's synthesis (most important):

${analysisContent}

Here are the original research notes for additional detail:

${allNotes}

**Your Task**:
Create a comprehensive, professional research report following the template in your system prompt.

**Important**:
- Include ALL major findings from the research
- Cite every claim with [Source Title](URL) format
- Use clear structure with proper headings
- Make it 2000-4000 words
- Include 15+ citations minimum
- Follow the report template exactly

Output the complete markdown document for the final report.`;

    // Run the Writer agent
    for await (const message of query({
      prompt: writerPrompt,
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
              report += block.text;
            }
          }
        }
      }
    }

    // Save the report
    const reportPath = join(process.cwd(), "files/reports/final_report.md");
    await writeFile(reportPath, report);

    // Calculate metrics
    const wordCount = report.split(/\s+/).length;
    const sourceCount = (report.match(/\]\(http/g) || []).length;

    finalResult = {
      agentId,
      content: report,
      wordCount,
      sourceCount
    };

    logger.info("Writer agent completed", {
      agentId,
      topic,
      wordCount,
      sourceCount,
      reportLength: report.length
    });

    // Mark agent as completed
    tracker.completeAgent(agentId, "completed");

    return finalResult;

  } catch (error) {
    logger.error("Writer agent failed", error as Error, {
      agentId,
      topic
    });
    tracker.completeAgent(agentId, "failed");

    return {
      agentId,
      content: `# Research Report: ${topic}\n\nError generating report: ${error instanceof Error ? error.message : "Unknown error"}`,
      wordCount: 0,
      sourceCount: 0
    };
  }
}
