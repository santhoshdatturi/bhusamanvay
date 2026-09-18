"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "bash",
  filename,
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API fails
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-muted/40 overflow-hidden text-sm",
        className
      )}
    >
      {(filename || language) && (
        <div className="flex items-center justify-between border-b border-border/60 bg-muted/60 px-4 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            {filename && (
              <span className="font-mono text-muted-foreground font-medium">
                {filename}
              </span>
            )}
            {!filename && language && (
              <span className="font-mono uppercase text-[10px] tracking-wider text-muted-foreground">
                {language}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Copy code to clipboard"
          >
            {copied ? (
              <>
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-3.5 text-emerald-500"
                  data-icon="inline-start"
                />
                <span>Copied</span>
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={Copy01Icon}
                  className="size-3.5"
                  data-icon="inline-start"
                />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      )}

      {!filename && !language && (
        <Button
          variant="ghost"
          size="sm"
          onClick={copyToClipboard}
          className="absolute right-2 top-2 z-10 h-7 px-2 text-xs text-muted-foreground hover:text-foreground bg-muted/50"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                className="size-3.5 text-emerald-500"
                data-icon="inline-start"
              />
              <span>Copied</span>
            </>
          ) : (
            <>
              <HugeiconsIcon
                icon={Copy01Icon}
                className="size-3.5"
                data-icon="inline-start"
              />
              <span>Copy</span>
            </>
          )}
        </Button>
      )}

      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}
