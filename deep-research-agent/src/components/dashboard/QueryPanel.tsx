"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QueryPanelProps {
  onSubmit: (query: string) => void;
  isResearching: boolean;
  className?: string;
}

const exampleQueries = [
  "Latest advances in multimodal LLMs",
  "Comparing RAG vs fine-tuning approaches",
  "State of AI agents and tool use",
  "Efficient training methods for transformers",
];

export function QueryPanel({ onSubmit, isResearching, className }: QueryPanelProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isResearching) {
      onSubmit(query.trim());
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className={cn("bg-white rounded-xl border border-gray-200 p-6 shadow-sm", className)}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-violet-100 rounded-lg">
          <Sparkles className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Research Query</h2>
          <p className="text-sm text-gray-500">
            Ask any research question. The agent team will search, analyze, and synthesize.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Enter your research question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-h-[100px] resize-none border-gray-200 focus:border-violet-500 focus:ring-violet-500"
          disabled={isResearching}
        />

        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={isResearching}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all duration-200",
                "border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {example}
            </button>
          ))}
        </div>

        <Button
          type="submit"
          disabled={!query.trim() || isResearching}
          className={cn(
            "w-full h-12 text-base font-medium transition-all duration-200",
            "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700",
            "disabled:from-gray-400 disabled:to-gray-500"
          )}
        >
          {isResearching ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Researching...
            </>
          ) : (
            <>
              <Send className="h-5 w-5 mr-2" />
              Start Research
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
}
