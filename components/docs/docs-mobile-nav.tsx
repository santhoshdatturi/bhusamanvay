"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { DocsSidebarNav } from "@/components/docs/docs-sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DocsMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Open documentation navigation menu"
          />
        }
      >
        <HugeiconsIcon icon={SidebarLeftIcon} className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b border-border/80 px-4 py-3">
          <SheetTitle className="text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Documentation Menu
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-4rem)] p-4">
          <DocsSidebarNav onItemClick={() => setOpen(false)} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
