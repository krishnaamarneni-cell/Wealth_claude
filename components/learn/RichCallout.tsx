"use client";

import { motion } from "framer-motion";
import {
  Lightbulb,
  AlertTriangle,
  Info,
  DollarSign,
  Brain,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutVariant =
  | "wealthy"      // What the wealthy do
  | "myth"         // Common myth
  | "reality"      // What's actually true
  | "tip"          // Pro tip
  | "warning"      // Watch out
  | "info"         // General info
  | "key"          // Key takeaway
  | "action";      // Action item

interface RichCalloutProps {
  variant: CalloutVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantConfig: Record<
  CalloutVariant,
  {
    icon: React.ElementType;
    defaultTitle: string;
    bgClass: string;
    borderClass: string;
    iconClass: string;
    titleClass: string;
  }
> = {
  wealthy: {
    icon: DollarSign,
    defaultTitle: "What the wealthy do",
    bgClass: "bg-primary/5",
    borderClass: "border-primary/30",
    iconClass: "text-primary bg-primary/10",
    titleClass: "text-primary",
  },
  myth: {
    icon: AlertTriangle,
    defaultTitle: "What most people think",
    bgClass: "bg-red-500/5",
    borderClass: "border-red-500/30",
    iconClass: "text-red-400 bg-red-500/10",
    titleClass: "text-red-400",
  },
  reality: {
    icon: Brain,
    defaultTitle: "What's actually true",
    bgClass: "bg-blue-500/5",
    borderClass: "border-blue-500/30",
    iconClass: "text-blue-400 bg-blue-500/10",
    titleClass: "text-blue-400",
  },
  tip: {
    icon: Lightbulb,
    defaultTitle: "Pro tip",
    bgClass: "bg-amber-500/5",
    borderClass: "border-amber-500/30",
    iconClass: "text-amber-400 bg-amber-500/10",
    titleClass: "text-amber-400",
  },
  warning: {
    icon: AlertTriangle,
    defaultTitle: "Watch out",
    bgClass: "bg-orange-500/5",
    borderClass: "border-orange-500/30",
    iconClass: "text-orange-400 bg-orange-500/10",
    titleClass: "text-orange-400",
  },
  info: {
    icon: Info,
    defaultTitle: "Good to know",
    bgClass: "bg-blue-500/5",
    borderClass: "border-blue-500/30",
    iconClass: "text-blue-400 bg-blue-500/10",
    titleClass: "text-blue-400",
  },
  key: {
    icon: Target,
    defaultTitle: "Key takeaway",
    bgClass: "bg-purple-500/5",
    borderClass: "border-purple-500/30",
    iconClass: "text-purple-400 bg-purple-500/10",
    titleClass: "text-purple-400",
  },
  action: {
    icon: Zap,
    defaultTitle: "Action item",
    bgClass: "bg-emerald-500/5",
    borderClass: "border-emerald-500/30",
    iconClass: "text-emerald-400 bg-emerald-500/10",
    titleClass: "text-emerald-400",
  },
};

export function RichCallout({
  variant,
  title,
  children,
  className,
}: RichCalloutProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border p-5 my-6",
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            config.iconClass
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <h4 className={cn("font-semibold text-sm uppercase tracking-wide", config.titleClass)}>
          {title || config.defaultTitle}
        </h4>
      </div>

      {/* Content */}
      <div className="text-foreground/90 leading-relaxed pl-11">
        {children}
      </div>
    </motion.div>
  );
}

// ===========================================
// Myth vs Reality Block (side by side on desktop)
// ===========================================

interface MythRealityBlockProps {
  myth: string;
  reality: string;
  wealthy?: string;
  className?: string;
}

export function MythRealityBlock({
  myth,
  reality,
  wealthy,
  className,
}: MythRealityBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("my-8 space-y-4", className)}
    >
      {/* Myth and Reality side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Myth */}
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">😵</span>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-red-400">
              What most people think
            </h4>
          </div>
          <p className="text-foreground/90 leading-relaxed">{myth}</p>
        </div>

        {/* Reality */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧠</span>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-blue-400">
              What's actually true
            </h4>
          </div>
          <p className="text-foreground/90 leading-relaxed">{reality}</p>
        </div>
      </div>

      {/* Wealthy (full width below) */}
      {wealthy && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💰</span>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">
              What the wealthy do
            </h4>
          </div>
          <p className="text-foreground/90 leading-relaxed">{wealthy}</p>
        </div>
      )}
    </motion.div>
  );
}

// ===========================================
// Quote Block
// ===========================================

interface QuoteBlockProps {
  quote: string;
  author?: string;
  className?: string;
}

export function QuoteBlock({ quote, author, className }: QuoteBlockProps) {
  return (
    <motion.blockquote
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative my-8 pl-6 border-l-4 border-primary/50",
        className
      )}
    >
      <p className="text-lg italic text-foreground/90 leading-relaxed">
        "{quote}"
      </p>
      {author && (
        <footer className="mt-2 text-sm text-muted-foreground">
          — {author}
        </footer>
      )}
    </motion.blockquote>
  );
}

// ===========================================
// Formula/Calculation Block
// ===========================================

interface FormulaBlockProps {
  title: string;
  formula: string;
  example?: string;
  className?: string;
}

export function FormulaBlock({
  title,
  formula,
  example,
  className,
}: FormulaBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-border bg-card p-6 my-6",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h4 className="font-semibold text-foreground">{title}</h4>
      </div>

      {/* Formula display */}
      <div className="bg-muted/50 rounded-lg p-4 font-mono text-center text-lg text-primary mb-4">
        {formula}
      </div>

      {/* Example if provided */}
      {example && (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">Example: </span>
          {example}
        </div>
      )}
    </motion.div>
  );
}
