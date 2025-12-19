/**
 * Anthropic SDK Client and Utilities
 *
 * Provides direct API access to Claude models without CLI subprocess overhead.
 * Supports tool calling, streaming, and multi-agent coordination.
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../logging/logger";

/**
 * Configured Anthropic client instance
 */
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Tool definition for Anthropic SDK
 */
export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Message content types for streaming
 */
export type MessageContent =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

/**
 * Stream messages from Claude with tool support
 *
 * @param params - Message parameters
 * @param onToolUse - Callback for tool use events
 * @param onText - Callback for text content
 * @returns Final message response
 */
export async function streamMessage(params: {
  model: string;
  system?: string;
  messages: Anthropic.MessageParam[];
  tools?: AnthropicTool[];
  max_tokens?: number;
  onToolUse?: (toolUseId: string, toolName: string, toolInput: Record<string, unknown>) => Promise<string>;
  onText?: (text: string) => void;
  onUsage?: (usage: { input_tokens: number; output_tokens: number }) => void;
}): Promise<Anthropic.Message> {
  const {
    model,
    system,
    messages,
    tools,
    max_tokens = 4096,
    onToolUse,
    onText,
    onUsage
  } = params;

  let conversationMessages = [...messages];
  let continueProcessing = true;

  while (continueProcessing) {
    // Retry logic for rate limits
    let retries = 0;
    const maxRetries = 3;
    let response: Anthropic.Message;

    while (true) {
      try {
        response = await anthropic.messages.create({
          model,
          max_tokens,
          system,
          messages: conversationMessages,
          tools: tools as Anthropic.Tool[],
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        if (error?.status === 429 && retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1000; // Exponential: 1s, 2s, 4s
          logger.warn("Rate limit hit, retrying", {
            retryCount: retries + 1,
            delayMs: delay,
            model
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } else {
          throw error; // Re-throw if not 429 or max retries exceeded
        }
      }
    }

    // Track usage
    if (onUsage && response.usage) {
      onUsage({
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens
      });
    }

    // Process response content
    let hasToolUse = false;
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    // First pass: collect text blocks and tool use blocks
    const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

    for (const block of response.content) {
      if (block.type === "text") {
        if (onText) {
          onText(block.text);
        }
      } else if (block.type === "tool_use") {
        hasToolUse = true;
        toolUseBlocks.push({
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>
        });
      }
    }

    // Second pass: execute all tool uses in parallel
    if (toolUseBlocks.length > 0 && onToolUse) {
      logger.info("Executing tools in parallel", {
        toolCount: toolUseBlocks.length,
        tools: toolUseBlocks.map(t => t.name)
      });

      const toolPromises = toolUseBlocks.map(async (block) => {
        try {
          const result = await onToolUse(block.id, block.name, block.input);
          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: result
          };
        } catch (error) {
          logger.error("Tool execution failed", error as Error, {
            toolName: block.name,
            toolUseId: block.id
          });

          return {
            type: "tool_result" as const,
            tool_use_id: block.id,
            content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            is_error: true
          };
        }
      });

      // Wait for all tools to complete in parallel
      const results = await Promise.all(toolPromises);
      toolResults.push(...results);

      logger.info("All tools completed", {
        toolCount: results.length,
        successCount: results.filter(r => !r.is_error).length,
        errorCount: results.filter(r => r.is_error).length
      });
    }

    // If there were tool uses, add results and continue
    if (hasToolUse && toolResults.length > 0) {
      conversationMessages.push({
        role: "assistant",
        content: response.content
      });

      conversationMessages.push({
        role: "user",
        content: toolResults
      });
    } else {
      // No more tool uses, we're done
      continueProcessing = false;
    }

    // Return final response
    if (!continueProcessing) {
      return response;
    }
  }

  // Fallback (should never reach here)
  throw new Error("Unexpected end of message loop");
}

/**
 * Create a simple text message
 */
export function createTextMessage(text: string): Anthropic.MessageParam {
  return {
    role: "user",
    content: text
  };
}

/**
 * Extract text from message response
 */
export function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map(block => block.text)
    .join("\n");
}
