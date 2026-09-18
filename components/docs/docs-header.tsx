import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocsMobileNav } from "@/components/docs/docs-mobile-nav";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export function DocsHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <DocsMobileNav />
          <Link
            href="/docs"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
          >
            <span className="font-sans font-bold text-sm sm:text-base tracking-tight text-foreground">
              BhuSamanvay
            </span>
            <span className="text-muted-foreground/60 text-xs">/</span>
            <Badge
              variant="secondary"
              className="font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.2 text-muted-foreground"
            >
              API Docs
            </Badge>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            render={<Link href="/api-keys" />}
          >
            API Keys
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-foreground font-medium"
            render={<Link href="/documents" />}
          >
            <span>Dashboard</span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="size-3 text-muted-foreground"
              data-icon="inline-end"
            />
          </Button>
        </div>
      </div>
    </header>
  );
}
