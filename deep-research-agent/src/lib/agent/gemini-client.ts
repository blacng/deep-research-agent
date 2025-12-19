/**
 * Gemini Client and Utilities
 *
 * Provides API access to Google's Gemini models with tool calling support.
 * Designed to be a drop-in replacement for anthropic-client.ts
 */

import { GoogleGenAI, FunctionDeclaration, Content, Part, FunctionCall } from "@google/genai";
import { logger } from "../logging/logger";

/**
 * Configured Gemini client instance
 */
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || "" });

/**
 * Tool definition compatible with both Anthropic and Gemini
 */
export interface GeminiTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Message parameter type (compatible with Anthropic format)
 */
export interface MessageParam {
  role: "user" | "assistant";
  content: string | Array<{ type: string; [key: string]: unknown }>;
}

/**
 * Usage statistics
 */
export interface UsageStats {
  input_tokens: number;
  output_tokens: number;
}

/**
 * Message response (compatible with Anthropic format)
 */
export interface Message {
  content: Array<{ type: "text"; text: string }>;
  usage?: UsageStats;
}

/**
 * Convert Anthropic-style tool definition to Gemini format
 */
function convertToolToGemini(tool: GeminiTool): FunctionDeclaration {
  return {
    name: tool.name,
    description: tool.description,
    parametersJsonSchema: {
      type: "object",
      properties: tool.input_schema.properties,
      required: tool.input_schema.required || []
    }
  };
}

/**
 * Convert message history to Gemini format
 */
function convertMessagesToGemini(messages: MessageParam[]): Content[] {
  return messages.map(msg => {
    let text = "";

    if (typeof msg.content === "string") {
      text = msg.content;
    } else {
      text = msg.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n");
    }

    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text }]
    };
  });
}

/**
 * Stream messages from Gemini with tool support
 *
 * @param params - Message parameters
 * @returns Final message response
 */
export async function streamMessage(params: {
  model: string;
  system?: string;
  messages: MessageParam[];
  tools?: GeminiTool[];
  max_tokens?: number;
  onToolUse?: (toolUseId: string, toolName: string, toolInput: Record<string, unknown>) => Promise<string>;
  onText?: (text: string) => void;
  onUsage?: (usage: UsageStats) => void;
}): Promise<Message> {
  const {
    model: modelName,
    system,
    messages,
    tools,
    max_tokens = 2048,
    onToolUse,
    onText,
    onUsage
  } = params;

  // Convert tools to Gemini format
  const geminiTools = tools ? tools.map(convertToolToGemini) : [];

  // Convert message history
  const contents = convertMessagesToGemini(messages);

  let continueProcessing = true;
  let conversationHistory: Content[] = [...contents];
  let fullResponse = "";
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  while (continueProcessing) {
    // Retry logic for rate limits
    let retries = 0;
    const maxRetries = 3;
    let response: any;

    while (true) {
      try {
        // Generate content with tools
        const result = await genAI.models.generateContent({
          model: modelName,
          contents: conversationHistory,
          config: {
            systemInstruction: system ? { parts: [{ text: system }] } : undefined,
            maxOutputTokens: max_tokens,
            tools: geminiTools.length > 0 ? [{ functionDeclarations: geminiTools }] : undefined
          }
        });

        response = result;
        break; // Success, exit retry loop
      } catch (error: any) {
        if (error?.message?.includes("429") && retries < maxRetries) {
          const delay = Math.pow(2, retries) * 1000; // Exponential: 1s, 2s, 4s
          logger.warn("Rate limit hit, retrying", {
            retryCount: retries + 1,
            delayMs: delay,
            model: modelName
          });
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
        } else {
          throw error;
        }
      }
    }

    // Track usage
    const usage = {
      input_tokens: response.usageMetadata?.promptTokenCount || 0,
      output_tokens: response.usageMetadata?.candidatesTokenCount || 0
    };
    totalInputTokens += usage.input_tokens;
    totalOutputTokens += usage.output_tokens;

    if (onUsage) {
      onUsage({
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens
      });
    }

    // Process response
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("No response candidate from Gemini");
    }

    // Get function calls if any
    const functionCalls = response.functionCalls;

    // Extract text parts
    const textParts = candidate.content.parts?.filter((part: Part) => part.text);
    if (textParts && textParts.length > 0) {
      const text = textParts.map((p: Part) => p.text).join("");
      fullResponse += text;
      if (onText) {
        onText(text);
      }
    }

    // Handle function calls (parallel execution)
    if (functionCalls && functionCalls.length > 0 && onToolUse) {
      logger.info("Executing tools in parallel", {
        toolCount: functionCalls.length,
        tools: functionCalls.map((fc: FunctionCall) => fc.name)
      });

      // Add model's function call to history
      conversationHistory.push({
        role: "model",
        parts: candidate.content.parts
      });

      const toolPromises = functionCalls.map(async (fc: FunctionCall) => {
        const toolUseId = fc.id || `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
          const result = await onToolUse(toolUseId, fc.name!, fc.args || {});

          // Parse result if it's a JSON string, otherwise use as-is
          let parsedResult: Record<string, unknown>;
          try {
            parsedResult = typeof result === "string" ? JSON.parse(result) : result;
          } catch {
            parsedResult = { content: result };
          }

          return {
            functionResponse: {
              name: fc.name!,
              response: parsedResult,
              id: toolUseId
            }
          } as Part;
        } catch (error) {
          logger.error("Tool execution failed", error as Error, {
            toolName: fc.name,
            toolUseId
          });

          return {
            functionResponse: {
              name: fc.name!,
              response: {
                error: error instanceof Error ? error.message : "Unknown error"
              },
              id: toolUseId
            }
          } as Part;
        }
      });

      const toolResultParts = await Promise.all(toolPromises);

      logger.info("All tools completed", {
        toolCount: toolResultParts.length,
        successCount: toolResultParts.filter(p => !p.functionResponse?.response.error).length,
        errorCount: toolResultParts.filter(p => p.functionResponse?.response.error).length
      });

      // Add function results to history as user message
      conversationHistory.push({
        role: "user",
        parts: toolResultParts
      });
    } else {
      // No more function calls, we're done
      continueProcessing = false;
    }
  }

  return {
    content: [{ type: "text", text: fullResponse }],
    usage: {
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens
    }
  };
}

/**
 * Create a simple text message (compatible with Anthropic format)
 */
export function createTextMessage(text: string): MessageParam {
  return {
    role: "user",
    content: text
  };
}

/**
 * Extract text from message response (compatible with Anthropic format)
 */
export function extractText(message: Message): string {
  return message.content
    .filter(block => block.type === "text")
    .map(block => block.text)
    .join("\n");
}
