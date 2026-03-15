"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StoryBlockProps {
  title?: string;
  children: React.ReactNode;
  character?: "maya" | "alex" | "jordan";
  className?: string;
}

const characterConfig = {
  maya: {
    emoji: "👩‍💼",
    name: "Maya",
    bgClass: "bg-primary/5 border-primary/20",
    accentClass: "bg-primary/10",
  },
  alex: {
    emoji: "👨‍💼",
    name: "Alex",
    bgClass: "bg-blue-500/5 border-blue-500/20",
    accentClass: "bg-blue-500/10",
  },
  jordan: {
    emoji: "🧑‍💻",
    name: "Jordan",
    bgClass: "bg-amber-500/5 border-amber-500/20",
    accentClass: "bg-amber-500/10",
  },
};

export function StoryBlock({
  title,
  children,
  character = "maya",
  className,
}: StoryBlockProps) {
  const config = characterConfig[character];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-xl border p-6 my-6",
        config.bgClass,
        className
      )}
    >
      {/* Character avatar */}
      <div
        className={cn(
          "absolute -top-4 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full",
          config.accentClass
        )}
      >
        <span className="text-lg">{config.emoji}</span>
        <span className="text-sm font-medium text-foreground">
          {title || `${config.name}'s Story`}
        </span>
      </div>

      {/* Story content */}
      <div className="mt-4 text-foreground/90 leading-relaxed">
        {typeof children === "string" ? (
          <p className="italic">{children}</p>
        ) : (
          <div className="italic space-y-3">{children}</div>
        )}
      </div>

      {/* Decorative quote mark */}
      <div className="absolute top-4 right-6 text-4xl text-muted-foreground/20 font-serif">
        "
      </div>
    </motion.div>
  );
}

// ===========================================
// Dialogue variant for conversations
// ===========================================

interface DialogueProps {
  speaker: "maya" | "alex" | "jordan";
  children: React.ReactNode;
}

export function Dialogue({ speaker, children }: DialogueProps) {
  const config = characterConfig[speaker];

  return (
    <div className="flex gap-3 my-4">
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm",
          config.accentClass
        )}
      >
        {config.emoji}
      </div>
      <div className="flex-1">
        <span className="text-xs font-medium text-muted-foreground">
          {config.name}
        </span>
        <p className="text-foreground/90 mt-0.5">{children}</p>
      </div>
    </div>
  );
}

// ===========================================
// Story conversation wrapper
// ===========================================

interface ConversationProps {
  children: React.ReactNode;
  className?: string;
}

export function Conversation({ children, className }: ConversationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-xl border border-border bg-card/50 p-6 my-6",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
