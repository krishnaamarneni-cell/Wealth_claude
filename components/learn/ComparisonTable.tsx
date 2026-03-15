"use client";

import { motion } from "framer-motion";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ===========================================
// Two Column Comparison
// ===========================================

interface ComparisonColumn {
  title: string;
  subtitle?: string;
  items: string[];
  highlight?: "positive" | "negative" | "neutral";
}

interface ComparisonTableProps {
  left: ComparisonColumn;
  right: ComparisonColumn;
  className?: string;
}

const highlightConfig = {
  positive: {
    headerBg: "bg-primary/10",
    headerBorder: "border-primary/30",
    headerText: "text-primary",
    itemIcon: Check,
    itemIconClass: "text-primary",
  },
  negative: {
    headerBg: "bg-red-500/10",
    headerBorder: "border-red-500/30",
    headerText: "text-red-400",
    itemIcon: X,
    itemIconClass: "text-red-400",
  },
  neutral: {
    headerBg: "bg-muted",
    headerBorder: "border-border",
    headerText: "text-foreground",
    itemIcon: Minus,
    itemIconClass: "text-muted-foreground",
  },
};

export function ComparisonTable({
  left,
  right,
  className,
}: ComparisonTableProps) {
  const leftConfig = highlightConfig[left.highlight || "negative"];
  const rightConfig = highlightConfig[right.highlight || "positive"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("my-8", className)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column */}
        <div className={cn("rounded-xl border overflow-hidden", leftConfig.headerBorder)}>
          {/* Header */}
          <div className={cn("px-5 py-4", leftConfig.headerBg)}>
            <h4 className={cn("font-semibold", leftConfig.headerText)}>
              {left.title}
            </h4>
            {left.subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {left.subtitle}
              </p>
            )}
          </div>
          {/* Items */}
          <ul className="p-4 space-y-3 bg-card/50">
            {left.items.map((item, index) => {
              const Icon = leftConfig.itemIcon;
              return (
                <li key={index} className="flex items-start gap-3">
                  <Icon
                    className={cn("w-5 h-5 flex-shrink-0 mt-0.5", leftConfig.itemIconClass)}
                  />
                  <span className="text-foreground/90">{item}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Column */}
        <div className={cn("rounded-xl border overflow-hidden", rightConfig.headerBorder)}>
          {/* Header */}
          <div className={cn("px-5 py-4", rightConfig.headerBg)}>
            <h4 className={cn("font-semibold", rightConfig.headerText)}>
              {right.title}
            </h4>
            {right.subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {right.subtitle}
              </p>
            )}
          </div>
          {/* Items */}
          <ul className="p-4 space-y-3 bg-card/50">
            {right.items.map((item, index) => {
              const Icon = rightConfig.itemIcon;
              return (
                <li key={index} className="flex items-start gap-3">
                  <Icon
                    className={cn("w-5 h-5 flex-shrink-0 mt-0.5", rightConfig.itemIconClass)}
                  />
                  <span className="text-foreground/90">{item}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================
// Person Comparison (Maya vs Jordan style)
// ===========================================

interface PersonData {
  name: string;
  emoji: string;
  description?: string;
  stats: { label: string; value: string }[];
  highlight?: "positive" | "negative" | "neutral";
}

interface PersonComparisonProps {
  left: PersonData;
  right: PersonData;
  className?: string;
}

export function PersonComparison({
  left,
  right,
  className,
}: PersonComparisonProps) {
  const leftHighlight = left.highlight || "negative";
  const rightHighlight = right.highlight || "positive";

  const getBorderClass = (highlight: string) => {
    switch (highlight) {
      case "positive":
        return "border-primary/30";
      case "negative":
        return "border-red-500/30";
      default:
        return "border-border";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("my-8", className)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Person */}
        <div
          className={cn(
            "rounded-xl border bg-card/50 p-5",
            getBorderClass(leftHighlight)
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{left.emoji}</span>
            <div>
              <h4 className="font-semibold text-foreground">{left.name}</h4>
              {left.description && (
                <p className="text-sm text-muted-foreground">
                  {left.description}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {left.stats.map((stat, index) => (
              <div
                key={index}
                className="flex justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-muted-foreground">{stat.label}</span>
                <span className="font-medium text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Person */}
        <div
          className={cn(
            "rounded-xl border bg-card/50 p-5",
            getBorderClass(rightHighlight)
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{right.emoji}</span>
            <div>
              <h4 className="font-semibold text-foreground">{right.name}</h4>
              {right.description && (
                <p className="text-sm text-muted-foreground">
                  {right.description}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            {right.stats.map((stat, index) => (
              <div
                key={index}
                className="flex justify-between py-2 border-b border-border last:border-0"
              >
                <span className="text-muted-foreground">{stat.label}</span>
                <span className="font-medium text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================
// Simple Data Table
// ===========================================

interface DataTableRow {
  cells: string[];
  highlight?: boolean;
}

interface DataTableProps {
  headers: string[];
  rows: DataTableRow[];
  caption?: string;
  className?: string;
}

export function DataTable({
  headers,
  rows,
  caption,
  className,
}: DataTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("my-6 overflow-x-auto", className)}
    >
      <table className="w-full border-collapse">
        {caption && (
          <caption className="text-sm text-muted-foreground mb-2 text-left">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="border-b border-border">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-semibold text-foreground bg-muted/50"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                "border-b border-border last:border-0",
                row.highlight && "bg-primary/5"
              )}
            >
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-3 text-sm text-foreground/90"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

// ===========================================
// Number Comparison Box
// ===========================================

interface NumberComparisonProps {
  title: string;
  scenarios: {
    label: string;
    value: string;
    description?: string;
    highlight?: "positive" | "negative" | "neutral";
  }[];
  className?: string;
}

export function NumberComparison({
  title,
  scenarios,
  className,
}: NumberComparisonProps) {
  const getValueClass = (highlight?: string) => {
    switch (highlight) {
      case "positive":
        return "text-primary";
      case "negative":
        return "text-red-400";
      default:
        return "text-foreground";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-border bg-card p-6 my-6",
        className
      )}
    >
      <h4 className="font-semibold text-foreground mb-4">{title}</h4>

      <div className="space-y-4">
        {scenarios.map((scenario, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <div>
              <span className="font-medium text-foreground">
                {scenario.label}
              </span>
              {scenario.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {scenario.description}
                </p>
              )}
            </div>
            <span
              className={cn(
                "text-lg font-semibold",
                getValueClass(scenario.highlight)
              )}
            >
              {scenario.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
