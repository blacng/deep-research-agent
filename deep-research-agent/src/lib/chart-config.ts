// Recharts configuration and theme

export const chartColors = {
  orchestrator: "#8B5CF6",
  searcher: "#3B82F6",
  analyzer: "#10B981",
  writer: "#F97316",
  primary: "#6366F1",
  secondary: "#8B5CF6",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  muted: "#6B7280",
};

export const chartTheme = {
  background: "transparent",
  textColor: "#6B7280",
  fontSize: 12,
  axis: {
    domain: {
      line: {
        stroke: "#E5E7EB",
        strokeWidth: 1,
      },
    },
    ticks: {
      line: {
        stroke: "#E5E7EB",
        strokeWidth: 1,
      },
    },
  },
  grid: {
    line: {
      stroke: "#F3F4F6",
      strokeWidth: 1,
    },
  },
  tooltip: {
    container: {
      background: "#FFFFFF",
      color: "#111827",
      fontSize: 12,
      borderRadius: 8,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    },
  },
};

// Cost breakdown chart colors
export const costChartColors = [
  "#8B5CF6", // LLM costs - purple
  "#3B82F6", // Tool costs - blue
  "#10B981", // Other - green
];

// Activity timeline colors by tool type
export const activityColors = {
  search: "#3B82F6",
  get_contents: "#10B981",
  find_similar: "#F59E0B",
  search_papers: "#8B5CF6",
  search_news: "#EC4899",
};

// Format helpers
export const formatCurrency = (value: number): string => {
  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toFixed(2)}`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
};

export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

// Chart animation config
export const chartAnimationConfig = {
  duration: 500,
  easing: "ease-out" as const,
};

// Responsive breakpoints for charts
export const chartBreakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};
