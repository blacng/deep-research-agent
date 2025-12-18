"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, ExternalLink, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/animations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface ReportViewerProps {
  content: string | undefined;
  className?: string;
}

export function ReportViewer({ content, className }: ReportViewerProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = async (text: string, sectionId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // Extract table of contents from markdown
  const toc = useMemo(() => {
    if (!content) return [];

    const headings: { level: number; text: string; id: string }[] = [];
    const lines = content.split("\n");

    for (const line of lines) {
      const h1Match = line.match(/^# (.+)$/);
      const h2Match = line.match(/^## (.+)$/);
      const h3Match = line.match(/^### (.+)$/);

      if (h1Match) {
        headings.push({
          level: 1,
          text: h1Match[1],
          id: h1Match[1].toLowerCase().replace(/\s+/g, "-"),
        });
      } else if (h2Match) {
        headings.push({
          level: 2,
          text: h2Match[1],
          id: h2Match[1].toLowerCase().replace(/\s+/g, "-"),
        });
      } else if (h3Match) {
        headings.push({
          level: 3,
          text: h3Match[1],
          id: h3Match[1].toLowerCase().replace(/\s+/g, "-"),
        });
      }
    }

    return headings;
  }, [content]);

  if (!content) {
    return (
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        className={cn(
          "flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl border border-dashed border-gray-200 p-12",
          className
        )}
      >
        <FileText className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-center">No report generated yet</p>
        <p className="text-sm text-gray-400 text-center mt-1">
          Complete a research query to see the report
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="show"
      className={cn("bg-white rounded-xl border border-gray-200 overflow-hidden", className)}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-600" />
          <h3 className="font-semibold text-gray-900">Research Report</h3>
        </div>
        <button
          onClick={() => copyToClipboard(content, "full")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {copiedSection === "full" ? (
            <>
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="flex">
        {/* Table of Contents Sidebar */}
        {toc.length > 3 && (
          <div className="hidden lg:block w-64 border-r border-gray-100 p-4 bg-gray-50/50">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Contents
            </h4>
            <nav className="space-y-1">
              {toc.map((heading, index) => (
                <a
                  key={index}
                  href={`#${heading.id}`}
                  className={cn(
                    "block text-sm text-gray-600 hover:text-violet-600 transition-colors",
                    heading.level === 1 && "font-medium",
                    heading.level === 2 && "pl-3",
                    heading.level === 3 && "pl-6 text-xs"
                  )}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Report Content */}
        <ScrollArea className="flex-1 h-[600px]">
          <div className="p-6 lg:p-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1
                    id={String(children).toLowerCase().replace(/\s+/g, "-")}
                    className="text-2xl font-bold text-gray-900 mt-6 mb-4 first:mt-0"
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2
                    id={String(children).toLowerCase().replace(/\s+/g, "-")}
                    className="text-xl font-semibold text-gray-900 mt-6 mb-3"
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3
                    id={String(children).toLowerCase().replace(/\s+/g, "-")}
                    className="text-lg font-medium text-gray-900 mt-4 mb-2"
                  >
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-600 hover:text-violet-800 hover:underline inline-flex items-center gap-0.5"
                  >
                    {children}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-violet-200 pl-4 italic text-gray-600 my-4">
                    {children}
                  </blockquote>
                ),
                code: ({ className, children }) => {
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="bg-gray-100 text-violet-600 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
                      {children}
                    </code>
                  );
                },
                hr: () => <hr className="my-6 border-gray-200" />,
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">{children}</strong>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-50">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2 text-sm text-gray-700 border-t border-gray-100">
                    {children}
                  </td>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      </div>
    </motion.div>
  );
}
