"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  Key01Icon,
  Shield01Icon,
  Layers01Icon,
  Alert02Icon,
  InformationCircleIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import type React from "react";
import { cn } from "@/lib/utils";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"];
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const DOC_NAV_GROUPS: NavGroup[] = [
  {
    label: "Getting Started",
    items: [
      {
        title: "Overview",
        href: "/docs",
        icon: InformationCircleIcon,
      },
      {
        title: "Authentication",
        href: "/docs/authentication",
        icon: Key01Icon,
      },
      {
        title: "Scopes & Permissions",
        href: "/docs/scopes",
        icon: Shield01Icon,
      },
      {
        title: "Digitization Pipeline",
        href: "/docs/pipeline",
        icon: Layers01Icon,
        badge: "Guide",
      },
    ],
  },
  {
    label: "API Endpoints",
    items: [
      {
        title: "Files API",
        href: "/docs/files",
        icon: Upload01Icon,
      },
      {
        title: "Documents API",
        href: "/docs/documents",
        icon: File01Icon,
      },
      {
        title: "Extraction & Commit",
        href: "/docs/extraction",
        icon: Layers01Icon,
        badge: "AI",
      },
      {
        title: "Digitized Records",
        href: "/docs/digitized-records",
        icon: File01Icon,
        badge: "v1",
      },
    ],
  },
  {
    label: "Reference",
    items: [
      {
        title: "Document Types",
        href: "/docs/document-types",
        icon: File01Icon,
      },
      {
        title: "Indian States",
        href: "/docs/states",
        icon: Layers01Icon,
      },
      {
        title: "Errors & Status Codes",
        href: "/docs/errors",
        icon: Alert02Icon,
      },
    ],
  },
];

interface DocsSidebarNavProps {
  onItemClick?: () => void;
  className?: string;
}

export function DocsSidebarNav({ onItemClick, className }: DocsSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-6 text-sm", className)}>
      {DOC_NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1.5">
          <div className="px-3 py-1 text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground/80">
            {group.label}
          </div>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    "group flex items-center justify-between gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <HugeiconsIcon
                      icon={item.icon}
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span className="font-mono text-[10px] rounded bg-muted-foreground/10 px-1.5 py-0.2 text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
