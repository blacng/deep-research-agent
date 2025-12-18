"use client";

import { useState, useEffect, useCallback } from "react";

interface UseTypewriterOptions {
  speed?: number; // Characters per second
  delay?: number; // Initial delay before starting
  onComplete?: () => void;
}

interface UseTypewriterReturn {
  displayedText: string;
  isTyping: boolean;
  isComplete: boolean;
  reset: () => void;
}

export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const { speed = 50, delay = 0, onComplete } = options;

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);

    if (text.length > 0) {
      const delayTimer = setTimeout(() => {
        setIsTyping(true);
      }, delay);

      return () => clearTimeout(delayTimer);
    }
  }, [text, delay]);

  // Typing effect
  useEffect(() => {
    if (!isTyping || currentIndex >= text.length) {
      if (currentIndex >= text.length && text.length > 0) {
        setIsTyping(false);
        setIsComplete(true);
        onComplete?.();
      }
      return;
    }

    const charDelay = 1000 / speed;

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, currentIndex + 1));
      setCurrentIndex((prev) => prev + 1);
    }, charDelay);

    return () => clearTimeout(timer);
  }, [isTyping, currentIndex, text, speed, onComplete]);

  const reset = useCallback(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsTyping(false);
    setIsComplete(false);
  }, []);

  return {
    displayedText,
    isTyping,
    isComplete,
    reset,
  };
}

// Hook for streaming text that appends rather than replaces
interface UseStreamingTextOptions {
  chunkDelay?: number; // Delay between chunks in ms
}

interface UseStreamingTextReturn {
  displayedText: string;
  appendText: (newText: string) => void;
  clear: () => void;
}

export function useStreamingText(
  options: UseStreamingTextOptions = {}
): UseStreamingTextReturn {
  const { chunkDelay = 10 } = options;

  const [fullText, setFullText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [pendingChunks, setPendingChunks] = useState<string[]>([]);

  // Process pending chunks with delay
  useEffect(() => {
    if (pendingChunks.length === 0) return;

    const timer = setTimeout(() => {
      const [nextChunk, ...remaining] = pendingChunks;
      setDisplayedText((prev) => prev + nextChunk);
      setPendingChunks(remaining);
    }, chunkDelay);

    return () => clearTimeout(timer);
  }, [pendingChunks, chunkDelay]);

  const appendText = useCallback((newText: string) => {
    setFullText((prev) => prev + newText);
    // Split into small chunks for smoother animation
    const chunks = newText.match(/.{1,3}/g) || [];
    setPendingChunks((prev) => [...prev, ...chunks]);
  }, []);

  const clear = useCallback(() => {
    setFullText("");
    setDisplayedText("");
    setPendingChunks([]);
  }, []);

  return {
    displayedText,
    appendText,
    clear,
  };
}
