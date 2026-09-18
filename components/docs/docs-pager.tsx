"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export interface PagerItem {
  title: string;
  href: string;
}

export const DOC_PAGES: PagerItem[] = [
  { title: "Overview", href: "/docs" },
  { title: "Authentication", href: "/docs/authentication" },
  { title: "Scopes & Permissions", href: "/docs/scopes" },
  { title: "Digitization Pipeline", href: "/docs/pipeline" },
  { title: "Files API", href: "/docs/files" },
  { title: "Documents API", href: "/docs/documents" },
  { title: "Extraction & Commit", href: "/docs/extraction" },
  { title: "Digitized Records", href: "/docs/digitized-records" },
  { title: "Document Types", href: "/docs/document-types" },
  { title: "Indian States", href: "/docs/states" },
  { title: "Errors & Status Codes", href: "/docs/errors" },
];

interface DocsPagerProps {
  prev?: PagerItem | null;
  next?: PagerItem | null;
  className?: string;
}

export function DocsPager({ prev, next, className }: DocsPagerProps) {
  const pathname = usePathname();

  const currentIndex = DOC_PAGES.findIndex((item) => item.href === pathname);

  const resolvedPrev =
    prev !== undefined
      ? prev
      : currentIndex > 0
        ? DOC_PAGES[currentIndex - 1]
        : null;

  const resolvedNext =
    next !== undefined
      ? next
      : currentIndex >= 0 && currentIndex < DOC_PAGES.length - 1
        ? DOC_PAGES[currentIndex + 1]
        : null;

  if (!resolvedPrev && !resolvedNext) {
    return null;
  }

  // Single item: Next page only (e.g. /docs overview)
  if (!resolvedPrev && resolvedNext) {
    return (
      <div className={cn("pt-8 pb-4", className)}>
        <Link
          href={resolvedNext.href}
          className="group flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/60 p-5 transition-all hover:border-foreground/30 hover:bg-muted/30"
        >
          <div className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
              Next Section
            </span>
            <div className="text-base font-semibold text-foreground">
              {resolvedNext.title}
            </div>
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors">
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </div>
        </Link>
      </div>
    );
  }

  // Single item: Previous page only (e.g. last page)
  if (resolvedPrev && !resolvedNext) {
    return (
      <div className={cn("pt-8 pb-4", className)}>
        <Link
          href={resolvedPrev.href}
          className="group flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-card/60 p-5 transition-all hover:border-foreground/30 hover:bg-muted/30"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors">
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </div>
          <div className="space-y-1 text-right">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
              Previous Section
            </span>
            <div className="text-base font-semibold text-foreground">
              {resolvedPrev.title}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Both Previous and Next
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 pb-4",
        className
      )}
    >
      <Link
        href={resolvedPrev!.href}
        className="group flex items-center gap-3.5 rounded-xl border border-border/80 bg-card/60 p-4 transition-all hover:border-foreground/30 hover:bg-muted/30"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          />
        </div>
        <div className="space-y-0.5 overflow-hidden">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
            Previous
          </span>
          <div className="truncate text-sm font-semibold text-foreground">
            {resolvedPrev!.title}
          </div>
        </div>
      </Link>

      <Link
        href={resolvedNext!.href}
        className="group flex items-center justify-between gap-3.5 rounded-xl border border-border/80 bg-card/60 p-4 transition-all hover:border-foreground/30 hover:bg-muted/30 text-right"
      >
        <div className="space-y-0.5 overflow-hidden ml-auto">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-foreground">
            Next
          </span>
          <div className="truncate text-sm font-semibold text-foreground">
            {resolvedNext!.title}
          </div>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors">
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </div>
      </Link>
    </div>
  );
}
