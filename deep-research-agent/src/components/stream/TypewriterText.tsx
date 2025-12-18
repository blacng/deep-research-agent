"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTypewriter } from "@/hooks/useTypewriter";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  showCursor?: boolean;
  onComplete?: () => void;
}

export function TypewriterText({
  text,
  speed = 50,
  className,
  showCursor = true,
  onComplete,
}: TypewriterTextProps) {
  const { displayedText, isTyping, isComplete } = useTypewriter(text, { speed, onComplete });

  return (
    <span className={cn("inline", className)}>
      {displayedText}
      {showCursor && isTyping && (
        <motion.span
          className="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 align-middle"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </span>
  );
}

interface StreamingTextBlockProps {
  text: string;
  className?: string;
}

export function StreamingTextBlock({ text, className }: StreamingTextBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("prose prose-sm max-w-none", className)}
    >
      <TypewriterText text={text} speed={100} showCursor />
    </motion.div>
  );
}
