import { query } from "@anthropic-ai/claude-agent-sdk";
import { NextRequest } from "next/server";
import { deepResearchAgentConfig } from "@/lib/agent/config";

export const maxDuration = 300; // 5 minutes for deep research

export async function POST(request: NextRequest) {
  try {
    const { topic, sessionId } = await request.json();

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prompt = `Conduct comprehensive deep research on the following topic and provide a detailed report:

**Research Topic:** ${topic}

Please follow your systematic research process:
1. Break down the topic into key aspects
2. Search for relevant sources using the available tools
3. Read full content from the most promising sources
4. Find similar content to expand your research
5. Synthesize your findings into a comprehensive report

Start by outlining your research plan, then execute it step by step. As you work, explain what you're doing so the user can follow your progress.`;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "status",
              status: "started",
              message: "Starting deep research...",
              topic
            })}\n\n`)
          );

          for await (const message of query({
            prompt,
            options: {
              ...deepResearchAgentConfig,
              resume: sessionId,
            }
          })) {
            // Log raw message for debugging
            console.log("SDK Message:", JSON.stringify(message, null, 2));

            // Transform message for client consumption
            const clientMessage = transformMessage(message);

            if (clientMessage) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(clientMessage)}\n\n`)
              );
            } else {
              // Send raw message type for debugging if transform returns null
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: "debug",
                  raw_type: (message as Record<string, unknown>).type,
                  message: "Unhandled message type"
                })}\n\n`)
              );
            }
          }

          // Send completion message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "status",
              status: "completed",
              message: "Research completed"
            })}\n\n`)
          );

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Research error:", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: "error",
              error: error instanceof Error ? error.message : "Unknown error occurred"
            })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to start research" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Transform SDK messages to a cleaner format for the client
function transformMessage(message: Record<string, unknown>): Record<string, unknown> | null {
  const type = message.type as string;

  switch (type) {
    case "system":
      if (message.subtype === "init") {
        return {
          type: "system",
          subtype: "init",
          session_id: message.session_id
        };
      }
      return null;

    case "assistant":
      // Extract text content from assistant messages
      const content = message.message as Record<string, unknown> | undefined;
      if (content?.content) {
        const contentArray = content.content as Array<Record<string, unknown>>;
        const textContent = contentArray
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("");

        if (textContent) {
          return {
            type: "assistant",
            content: textContent
          };
        }
      }
      return null;

    case "tool_use":
      return {
        type: "tool_use",
        tool_name: message.tool_name,
        tool_input: message.tool_input
      };

    case "tool_result":
      // Parse tool results to extract useful info
      const resultContent = message.content as string | undefined;
      if (resultContent) {
        try {
          const parsed = JSON.parse(resultContent);
          return {
            type: "tool_result",
            tool_name: message.tool_name,
            result_summary: summarizeToolResult(message.tool_name as string, parsed)
          };
        } catch {
          return {
            type: "tool_result",
            tool_name: message.tool_name,
            result_summary: "Results received"
          };
        }
      }
      return null;

    case "result":
      // Final result
      const resultText = message.result as string | undefined;
      if (resultText) {
        return {
          type: "result",
          content: resultText
        };
      }
      return null;

    default:
      return null;
  }
}

// Summarize tool results for progress display
function summarizeToolResult(toolName: string, result: Record<string, unknown>): string {
  switch (toolName) {
    case "mcp__exa-search__search":
    case "mcp__exa-search__search_papers":
    case "mcp__exa-search__search_news":
      const total = result.total as number || 0;
      return `Found ${total} results`;

    case "mcp__exa-search__get_contents":
      const docs = result.documents as Array<unknown> || [];
      return `Retrieved content from ${docs.length} source(s)`;

    case "mcp__exa-search__find_similar":
      const similar = result.similar as Array<unknown> || [];
      return `Found ${similar.length} similar sources`;

    default:
      return "Results received";
  }
}
