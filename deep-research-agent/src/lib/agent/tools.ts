import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import Exa from "exa-js";

// Initialize Exa client
const getExaClient = () => {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY environment variable is not set");
  }
  return new Exa(apiKey);
};

// Create Exa search tools for deep research
export const exaSearchTools = createSdkMcpServer({
  name: "exa-search",
  version: "1.0.0",
  tools: [
    // Neural/Keyword Search - main search tool
    tool(
      "search",
      "Search the web using neural or keyword search. Neural search uses semantic understanding for research queries, keyword search matches exact terms. Use this to find relevant sources on a topic.",
      {
        query: z.string().describe("Search query. Use natural language for neural search, operators (AND/OR/quotes) for keyword"),
        type: z.enum(["neural", "keyword"]).default("neural").describe("Search type - neural for research, keyword for exact matches"),
        num_results: z.number().min(1).max(20).default(10).describe("Number of results to return"),
        include_domains: z.array(z.string()).optional().describe("Only include results from these domains (e.g., ['arxiv.org', 'nature.com'])"),
        exclude_domains: z.array(z.string()).optional().describe("Exclude results from these domains"),
        start_published_date: z.string().optional().describe("Filter: only content published after this date (YYYY-MM-DD)"),
        end_published_date: z.string().optional().describe("Filter: only content published before this date (YYYY-MM-DD)"),
        use_autoprompt: z.boolean().default(true).describe("Let Exa optimize the query for better results"),
        category: z.enum(["research paper", "news", "blog", "company", "tweet", "github", "pdf"]).optional().describe("Filter by content category")
      },
      async (args) => {
        const exa = getExaClient();

        const options: Record<string, unknown> = {
          type: args.type,
          numResults: args.num_results,
          useAutoprompt: args.use_autoprompt,
          contents: {
            text: { maxCharacters: 1500 },
            highlights: { numSentences: 3 }
          }
        };

        if (args.include_domains?.length) options.includeDomains = args.include_domains;
        if (args.exclude_domains?.length) options.excludeDomains = args.exclude_domains;
        if (args.start_published_date) options.startPublishedDate = args.start_published_date;
        if (args.end_published_date) options.endPublishedDate = args.end_published_date;
        if (args.category) options.category = args.category;

        const results = await exa.searchAndContents(args.query, options);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              query: args.query,
              total: results.results.length,
              results: results.results.map((r: Record<string, unknown>) => ({
                title: r.title,
                url: r.url,
                author: r.author || "Unknown",
                published_date: r.publishedDate || "Unknown",
                text: r.text || null,
                highlights: r.highlights || []
              }))
            }, null, 2)
          }]
        };
      }
    ),

    // Get full content from URLs
    tool(
      "get_contents",
      "Retrieve the full text content from specific URLs. Use this after initial search to get detailed information from promising sources.",
      {
        urls: z.array(z.string().url()).min(1).max(10).describe("URLs to fetch full content from"),
        max_characters: z.number().min(1000).max(10000).default(5000).describe("Maximum characters to retrieve per document")
      },
      async (args) => {
        const exa = getExaClient();

        const contents = await exa.getContents(args.urls, {
          text: { maxCharacters: args.max_characters }
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              documents: contents.results.map((doc: Record<string, unknown>) => ({
                url: doc.url,
                title: doc.title,
                author: doc.author || "Unknown",
                published_date: doc.publishedDate || "Unknown",
                text: doc.text
              }))
            }, null, 2)
          }]
        };
      }
    ),

    // Find similar content
    tool(
      "find_similar",
      "Find content similar to a given URL. Useful for expanding research from a key source to find related articles, papers, or discussions.",
      {
        url: z.string().url().describe("URL to find similar content for"),
        num_results: z.number().min(1).max(20).default(5).describe("Number of similar results to find"),
        exclude_source_domain: z.boolean().default(true).describe("Exclude results from the same domain as the source")
      },
      async (args) => {
        const exa = getExaClient();

        const results = await exa.findSimilarAndContents(args.url, {
          numResults: args.num_results,
          excludeSourceDomain: args.exclude_source_domain,
          contents: {
            text: { maxCharacters: 1000 }
          }
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              source_url: args.url,
              similar: results.results.map((r: Record<string, unknown>) => ({
                title: r.title,
                url: r.url,
                author: r.author || "Unknown",
                published_date: r.publishedDate || "Unknown",
                text: r.text || null
              }))
            }, null, 2)
          }]
        };
      }
    ),

    // Search for research papers specifically
    tool(
      "search_papers",
      "Search specifically for academic research papers and scientific articles. Optimized for finding peer-reviewed content.",
      {
        query: z.string().describe("Research topic or question"),
        num_results: z.number().min(1).max(20).default(10).describe("Number of papers to find"),
        start_year: z.number().optional().describe("Only papers published after this year"),
        include_preprints: z.boolean().default(true).describe("Include preprints from arXiv, bioRxiv, etc.")
      },
      async (args) => {
        const exa = getExaClient();

        const domains = ["arxiv.org", "nature.com", "science.org", "pnas.org", "cell.com", "springer.com", "wiley.com", "acm.org", "ieee.org"];
        if (args.include_preprints) {
          domains.push("biorxiv.org", "medrxiv.org", "ssrn.com");
        }

        const options: Record<string, unknown> = {
          type: "neural",
          numResults: args.num_results,
          useAutoprompt: true,
          includeDomains: domains,
          contents: {
            text: { maxCharacters: 2000 },
            highlights: { numSentences: 5 }
          }
        };

        if (args.start_year) {
          options.startPublishedDate = `${args.start_year}-01-01`;
        }

        const results = await exa.searchAndContents(args.query, options);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              query: args.query,
              total: results.results.length,
              papers: results.results.map((r: Record<string, unknown>) => ({
                title: r.title,
                url: r.url,
                author: r.author || "Unknown",
                published_date: r.publishedDate || "Unknown",
                abstract: r.text || null,
                highlights: r.highlights || []
              }))
            }, null, 2)
          }]
        };
      }
    ),

    // Search recent news
    tool(
      "search_news",
      "Search for recent news articles and current events. Use this when researching recent developments or time-sensitive topics.",
      {
        query: z.string().describe("News topic to search for"),
        num_results: z.number().min(1).max(20).default(10).describe("Number of articles to find"),
        days_back: z.number().min(1).max(365).default(30).describe("How many days back to search")
      },
      async (args) => {
        const exa = getExaClient();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - args.days_back);

        const results = await exa.searchAndContents(args.query, {
          type: "neural",
          numResults: args.num_results,
          useAutoprompt: true,
          category: "news",
          startPublishedDate: startDate.toISOString().split("T")[0],
          contents: {
            text: { maxCharacters: 1500 },
            highlights: { numSentences: 3 }
          }
        });

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              query: args.query,
              date_range: `Last ${args.days_back} days`,
              total: results.results.length,
              articles: results.results.map((r: Record<string, unknown>) => ({
                title: r.title,
                url: r.url,
                source: r.author || "Unknown",
                published_date: r.publishedDate || "Unknown",
                text: r.text || null,
                highlights: r.highlights || []
              }))
            }, null, 2)
          }]
        };
      }
    )
  ]
});
