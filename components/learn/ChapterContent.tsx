"use client";

import { motion } from "framer-motion";
import { Play, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionContent, ChapterSection } from "@/types/learn";
import { StoryBlock, Dialogue, Conversation } from "./StoryBlock";
import {
  RichCallout,
  MythRealityBlock,
  QuoteBlock,
  FormulaBlock,
} from "./RichCallout";
import {
  ComparisonTable,
  PersonComparison,
  DataTable,
  NumberComparison,
} from "./ComparisonTable";
import { MiniQuizTrigger } from "./MiniQuiz";

// ===========================================
// Content Block Renderer
// ===========================================

interface ContentBlockProps {
  content: SectionContent;
  index: number;
}

function ContentBlock({ content, index }: ContentBlockProps) {
  const animationDelay = index * 0.05;

  switch (content.type) {
    case "story":
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationDelay }}
        >
          <StoryBlock title={content.title}>{content.content}</StoryBlock>
        </motion.div>
      );

    case "text":
      return (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay }}
          className="text-foreground/90 leading-relaxed my-4"
        >
          {content.content}
        </motion.p>
      );

    case "heading":
      return (
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay }}
          className="text-xl font-semibold text-foreground mt-8 mb-4"
        >
          {content.content}
        </motion.h2>
      );

    case "myth_reality":
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationDelay }}
        >
          <MythRealityBlock
            myth={content.myth}
            reality={content.reality}
            wealthy={content.wealthy}
          />
        </motion.div>
      );

    case "comparison":
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationDelay }}
        >
          <ComparisonTable left={content.left} right={content.right} />
        </motion.div>
      );

    case "callout":
      return (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: animationDelay }}
        >
          <RichCallout variant={content.variant} title={content.title}>
            {content.content}
          </RichCallout>
        </motion.div>
      );

    case "formula":
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationDelay }}
        >
          <FormulaBlock
            title={content.title}
            formula={content.formula}
            example={content.example}
          />
        </motion.div>
      );

    case "video":
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationDelay }}
        >
          <VideoEmbed
            youtubeId={content.youtube_id}
            title={content.title}
            optional={content.optional}
          />
        </motion.div>
      );

    case "list":
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animationDelay }}
          className="my-4"
        >
          {content.title && (
            <h4 className="font-medium text-foreground mb-2">{content.title}</h4>
          )}
          {content.ordered ? (
            <ol className="list-decimal list-inside space-y-2 text-foreground/90">
              {content.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ) : (
            <ul className="space-y-2 text-foreground/90">
              {content.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      );

    case "diagram":
      // Placeholder for interactive diagrams
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animationDelay }}
          className="my-6 p-8 rounded-xl border border-border bg-card/50 text-center"
        >
          <p className="text-muted-foreground">
            [Interactive diagram: {content.component}]
          </p>
        </motion.div>
      );

    default:
      return null;
  }
}

// ===========================================
// Video Embed Component
// ===========================================

interface VideoEmbedProps {
  youtubeId: string;
  title: string;
  optional?: boolean;
}

function VideoEmbed({ youtubeId, title, optional = true }: VideoEmbedProps) {
  return (
    <div className="my-6" role="region" aria-label={`Video: ${title}`}>
      {optional && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Play className="w-4 h-4" aria-hidden="true" />
          <span>Optional video • {title}</span>
        </div>
      )}
      <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
      <a
        href={`https://www.youtube.com/watch?v=${youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        Watch on YouTube
        <span className="sr-only">(opens in new tab)</span>
      </a>
    </div>
  );
}

// ===========================================
// Section Content Renderer
// ===========================================

interface SectionContentProps {
  section: ChapterSection;
  className?: string;
}

export function SectionContentRenderer({
  section,
  className,
}: SectionContentProps) {
  return (
    <motion.div
      key={section.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className={cn("max-w-3xl mx-auto", className)}
    >
      {/* Section title */}
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground mb-6"
      >
        {section.title}
      </motion.h2>

      {/* Content blocks */}
      <div className="space-y-2">
        {section.content.map((block, index) => (
          <ContentBlock key={index} content={block} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

// ===========================================
// Full Chapter Content Component
// ===========================================

interface ChapterContentProps {
  section: ChapterSection;
  onMiniQuizComplete?: (passed: boolean, score: number) => void;
  className?: string;
}

export function ChapterContent({
  section,
  onMiniQuizComplete,
  className,
}: ChapterContentProps) {
  return (
    <div className={cn("px-6 py-8 md:px-8 lg:px-12", className)}>
      <SectionContentRenderer section={section} />

      {/* Mini quiz at the end of section if present */}
      {section.mini_quiz && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-border"
        >
          <MiniQuizTrigger
            quiz={section.mini_quiz}
            onComplete={onMiniQuizComplete}
          />
        </motion.div>
      )}
    </div>
  );
}

// Re-export for convenience
export { VideoEmbed };
