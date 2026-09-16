"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FieldConfidenceBadgeProps {
  confidence?: number | null;
  value?: string | null;
  className?: string;
  showTooltip?: boolean;
}

export function FieldConfidenceBadge({
  confidence,
  value,
  className,
  showTooltip = true,
}: FieldConfidenceBadgeProps) {
  // 1. Do not render badge if value is empty/null/missing
  if (value !== undefined) {
    if (value === null || String(value).trim() === "") {
      return null;
    }
  }

  // 2. Do not render badge if confidence is not provided
  if (confidence === undefined || confidence === null) {
    return null;
  }

  const score = Math.round(confidence);

  // Determine styling based on confidence tier
  let badgeColor = "bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400 dark:border-rose-500/30";
  let label = "Low Confidence";

  if (score === 0) {
    badgeColor = "bg-muted text-muted-foreground border-border/80";
    label = "Not Detected";
  } else if (score >= 90) {
    badgeColor = "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400 dark:border-emerald-500/30";
    label = "High Confidence";
  } else if (score >= 70) {
    badgeColor = "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400 dark:border-amber-500/30";
    label = "Medium Confidence";
  }

  const badgeContent = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-sans tabular-nums leading-none font-medium select-none cursor-default",
        badgeColor,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {score}%
    </span>
  );

  if (!showTooltip) {
    return badgeContent;
  }

  return (
    <TooltipProvider delay={100}>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex cursor-default" />}>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-xs">
          <p className="font-semibold text-foreground">{label}: {score}%</p>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            Extraction certainty and OCR clarity rating
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
