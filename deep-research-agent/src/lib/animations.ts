import { Variants } from "framer-motion";

// Stagger children animation for lists
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// Fade in animation
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

// Fade in with upward motion
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// Scale in animation for cards
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
};

// Pulse animation for active states
export const pulse: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Glow animation for highlighted elements
export const glow: Variants = {
  initial: {
    boxShadow: "0 0 0 rgba(139, 92, 246, 0)"
  },
  glow: {
    boxShadow: [
      "0 0 0 rgba(139, 92, 246, 0)",
      "0 0 20px rgba(139, 92, 246, 0.4)",
      "0 0 0 rgba(139, 92, 246, 0)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Slide in from left
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// Node appearance animation for agent graph
export const nodeAppear: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: 0.1,
    },
  },
};

// Edge draw animation
export const edgeDraw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: "easeInOut" },
      opacity: { duration: 0.2 },
    },
  },
};

// Counter animation helper (for useEffect)
export const counterAnimation = {
  duration: 1,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

// Activity feed item animation
export const feedItem: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    height: 0,
  },
  show: {
    opacity: 1,
    x: 0,
    height: "auto",
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      opacity: { duration: 0.2 },
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

// Chart animation
export const chartAppear: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// Agent role colors
export const agentColors = {
  orchestrator: {
    bg: "bg-violet-500",
    text: "text-violet-500",
    border: "border-violet-500",
    fill: "#8B5CF6",
    glow: "rgba(139, 92, 246, 0.4)",
  },
  searcher: {
    bg: "bg-blue-500",
    text: "text-blue-500",
    border: "border-blue-500",
    fill: "#3B82F6",
    glow: "rgba(59, 130, 246, 0.4)",
  },
  analyzer: {
    bg: "bg-emerald-500",
    text: "text-emerald-500",
    border: "border-emerald-500",
    fill: "#10B981",
    glow: "rgba(16, 185, 129, 0.4)",
  },
  writer: {
    bg: "bg-orange-500",
    text: "text-orange-500",
    border: "border-orange-500",
    fill: "#F97316",
    glow: "rgba(249, 115, 22, 0.4)",
  },
} as const;

export type AgentRole = keyof typeof agentColors;
