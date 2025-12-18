"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/lib/animations";

interface AnimatedStatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "orange" | "gray";
  format?: "number" | "currency" | "duration";
  suffix?: string;
  className?: string;
}

const colorClasses = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    icon: "bg-blue-100",
  },
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    icon: "bg-emerald-100",
  },
  purple: {
    bg: "bg-violet-50",
    text: "text-violet-600",
    icon: "bg-violet-100",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    icon: "bg-orange-100",
  },
  gray: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    icon: "bg-gray-100",
  },
};

function useAnimatedNumber(value: number, duration: number = 500) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
}

export function AnimatedStatCard({
  label,
  value,
  icon: Icon,
  color,
  format = "number",
  suffix,
  className,
}: AnimatedStatCardProps) {
  const animatedValue = useAnimatedNumber(value);
  const colors = colorClasses[color];

  const formatValue = (val: number): string => {
    switch (format) {
      case "currency":
        return `$${val.toFixed(4)}`;
      case "duration":
        return `${val.toFixed(1)}s`;
      case "number":
      default:
        return Math.round(val).toString();
    }
  };

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="show"
      whileHover={{ scale: 1.03 }}
      className={cn(
        "rounded-xl p-4 border border-gray-100 shadow-sm",
        colors.bg,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-lg", colors.icon)}>
          <Icon className={cn("h-5 w-5", colors.text)} />
        </div>
      </div>

      <div className="mt-3">
        <div className={cn("text-3xl font-bold tracking-tight", colors.text)}>
          {formatValue(animatedValue)}
          {suffix && <span className="text-lg ml-1">{suffix}</span>}
        </div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
      </div>
    </motion.div>
  );
}
