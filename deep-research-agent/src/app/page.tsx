"use client";

import { useState } from "react";
import { useResearch } from "@/hooks/useResearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MultiAgentVisualizer } from "@/components/multi-agent-visualizer";
import {
  Send,
  Sparkles,
  CheckCircle2,
  Loader2,
  Search,
  FileText,
  Globe,
  Bot
} from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const {
    messages,
    isResearching,
    finalReport,
    error,
    startResearch,
    stats,
    agents,
    activeAgents
  } = useResearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isResearching) {
      startResearch(query.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const exampleQueries = [
    "Latest advances in multimodal LLMs",
    "Comparing RAG vs fine-tuning approaches",
    "State of AI agents and tool use",
    "Efficient training methods for transformers"
  ];

  const isComplete = !isResearching && (finalReport || messages.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Deep Research Agent</h1>
            <p className="text-sm text-gray-500">Multi-agent research system powered by Claude and Exa</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Research Query Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Research Query</CardTitle>
                <p className="text-sm text-gray-500">
                  Ask any research question. The agent team will search, analyze, and synthesize findings.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Enter your research question..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={isResearching}
                  />
                  <Button
                    type="submit"
                    disabled={!query.trim() || isResearching}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {isResearching ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Start Research
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Research Output Card */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Research Output</CardTitle>
                  {isComplete && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      Report Ready
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="progress" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="report">Report</TabsTrigger>
                  </TabsList>

                  <TabsContent value="progress" className="space-y-4">
                    {/* Research Status */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Research Status</span>
                        <Badge
                          variant="outline"
                          className={isResearching
                            ? "text-blue-600 border-blue-200 bg-blue-50"
                            : isComplete
                              ? "text-green-600 border-green-200 bg-green-50"
                              : "text-gray-600 border-gray-200"
                          }
                        >
                          {isResearching ? (
                            <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running</>
                          ) : isComplete ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</>
                          ) : (
                            "Idle"
                          )}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {isResearching ? "In Progress" : isComplete ? "Complete" : "Ready"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {isResearching
                            ? "Agent is researching..."
                            : isComplete
                              ? "Research finished"
                              : "Enter a query to begin"
                          }
                        </p>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{stats.searches}</p>
                        <p className="text-sm text-gray-600">Searches</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{stats.sources}</p>
                        <p className="text-sm text-gray-600">Sources</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">{stats.agents}</p>
                        <p className="text-sm text-gray-600">Total Agents</p>
                        {activeAgents > 0 && (
                          <p className="text-xs text-gray-500 mt-1">({activeAgents} active)</p>
                        )}
                      </div>
                    </div>

                    {/* Activity Log */}
                    <div className="border rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Activity Log</h4>
                      <ScrollArea className="h-[200px]">
                        {messages.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-8">
                            No activity yet. Start a research query.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {messages.map((msg) => (
                              <ActivityLogItem key={msg.id} message={msg} />
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="report">
                    <ScrollArea className="h-[400px]">
                      {finalReport ? (
                        <div className="prose prose-sm max-w-none">
                          <ReportContent content={finalReport} />
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No report generated yet.</p>
                          <p className="text-sm">Complete a research query to see the report.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Multi-Agent Visualizer */}
            <MultiAgentVisualizer agents={agents} />

            {/* Example Queries */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Example Queries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {exampleQueries.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-md transition-colors"
                    disabled={isResearching}
                  >
                    {example}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Last Research Stats */}
            {isComplete && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Last Research</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-medium">{stats.duration}s</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Cost</span>
                      <span className="font-medium">${stats.cost.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Turns</span>
                      <span className="font-medium">{stats.turns}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ActivityLogItem({ message }: { message: { type: string; tool_name?: string; content?: string; message?: string; raw_type?: string } }) {
  const getIcon = () => {
    if (message.type === "tool_use" || message.type === "tool_result") {
      if (message.tool_name?.includes("search")) return <Search className="h-4 w-4" />;
      if (message.tool_name?.includes("contents")) return <FileText className="h-4 w-4" />;
      return <Globe className="h-4 w-4" />;
    }
    if (message.type === "assistant") return <Bot className="h-4 w-4" />;
    return <Sparkles className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (message.type === "tool_use") {
      const tool = message.tool_name?.replace("mcp__exa-search__", "") || "Tool";
      return tool.charAt(0).toUpperCase() + tool.slice(1).replace(/_/g, " ");
    }
    if (message.type === "tool_result") return "Result";
    if (message.type === "assistant") return "Agent";
    if (message.type === "status") return message.message || "Status";
    if (message.type === "debug") return `Debug: ${message.raw_type}`;
    return message.type;
  };

  const getDescription = () => {
    if (message.type === "tool_use" && message.tool_name?.includes("search")) {
      return "Searching...";
    }
    if (message.type === "tool_result") {
      return message.content?.slice(0, 50) || "Received results";
    }
    if (message.type === "assistant" && message.content) {
      return message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "");
    }
    return "";
  };

  const isComplete = message.type === "tool_result" || message.type === "status";

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 text-gray-400">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900">{getLabel()}</span>
          {isComplete && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </div>
        {getDescription() && (
          <p className="text-xs text-gray-500 truncate">{getDescription()}</p>
        )}
      </div>
    </div>
  );
}

function ReportContent({ content }: { content: string }) {
  const lines = content.split("\n");

  // Helper to render inline markdown (links, bold, etc.)
  const renderInline = (text: string) => {
    const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      // Markdown links [text](url)
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            className="text-blue-600 hover:text-blue-800 hover:underline"
            target={linkMatch[2].startsWith("#") ? undefined : "_blank"}
            rel={linkMatch[2].startsWith("#") ? undefined : "noopener noreferrer"}
          >
            {linkMatch[1]}
          </a>
        );
      }
      // Bold **text**
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        // Main title
        if (line.startsWith("# ")) {
          return (
            <h1 key={index} id={line.slice(2).toLowerCase().replace(/\s+/g, "-")} className="text-xl font-bold mt-4 mb-2">
              {renderInline(line.slice(2))}
            </h1>
          );
        }
        // Section headers
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} id={line.slice(3).toLowerCase().replace(/\s+/g, "-")} className="text-lg font-semibold mt-3 mb-2">
              {renderInline(line.slice(3))}
            </h2>
          );
        }
        // Subsection headers
        if (line.startsWith("### ")) {
          return (
            <h3 key={index} id={line.slice(4).toLowerCase().replace(/\s+/g, "-")} className="text-base font-medium mt-2 mb-1">
              {renderInline(line.slice(4))}
            </h3>
          );
        }
        // Numbered list items (for TOC)
        const numberedMatch = line.match(/^(\d+)\.\s(.*)$/);
        if (numberedMatch) {
          return (
            <li key={index} className="ml-4 list-decimal text-sm">
              {renderInline(numberedMatch[2])}
            </li>
          );
        }
        // Indented list items (nested TOC)
        const indentedMatch = line.match(/^(\s+)[-*]\s(.*)$/);
        if (indentedMatch) {
          const indent = Math.floor(indentedMatch[1].length / 2) * 16 + 16;
          return (
            <li key={index} className="list-disc text-sm" style={{ marginLeft: `${indent}px` }}>
              {renderInline(indentedMatch[2])}
            </li>
          );
        }
        // Unordered list items
        if (line.match(/^[-*]\s/)) {
          return (
            <li key={index} className="ml-4 list-disc text-sm">
              {renderInline(line.slice(2))}
            </li>
          );
        }
        // Horizontal rule
        if (line.match(/^-{3,}$/)) {
          return <hr key={index} className="my-4 border-gray-200" />;
        }
        // Empty lines
        if (!line.trim()) {
          return <div key={index} className="h-2" />;
        }
        // Regular paragraphs
        return (
          <p key={index} className="text-sm text-gray-700">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}
