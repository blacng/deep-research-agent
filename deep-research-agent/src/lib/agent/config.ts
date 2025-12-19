import { readFileSync } from "fs";
import { join } from "path";
import { exaSearchTools } from "./tools";

// Read the system prompt from the markdown file
const promptPath = join(process.cwd(), "src/lib/agent/prompts/research-agent.md");
export const DEEP_RESEARCH_SYSTEM_PROMPT = readFileSync(promptPath, "utf-8");

export const deepResearchAgentConfig = {
  model: "claude-sonnet-4-5" as const,
  systemPrompt: DEEP_RESEARCH_SYSTEM_PROMPT,
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
  permissionMode: "bypassPermissions" as const
};