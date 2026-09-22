"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  Key01Icon,
  Logout01Icon,
  Book02Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth/client";
import type { AuthUser } from "@/lib/auth";

interface AppSidebarProps {
  user: AuthUser;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/sign-in");
        },
      },
    });
  };

  interface NavItem {
    title: string;
    href: string;
    icon: typeof File01Icon;
    isActive: boolean;
    badge?: string;
  }

  const navItems: NavItem[] = [
    {
      title: "Documents",
      href: "/documents",
      icon: File01Icon,
      isActive: pathname.startsWith("/documents"),
    },
    {
      title: "Audit Logs",
      href: "/audit",
      icon: ShieldCheckIcon,
      isActive: pathname.startsWith("/audit"),
    },
    {
      title: "API Keys",
      href: "/api-keys",
      icon: Key01Icon,
      isActive: pathname.startsWith("/api-keys"),
    },
    {
      title: "API Docs",
      href: "/docs",
      icon: Book02Icon,
      isActive: pathname.startsWith("/docs"),
    },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* Brand Header */}
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-0 py-1.5 group-data-[collapsible=icon]:justify-center">
          <Logo size={32} className="size-8 shrink-0 text-foreground" />
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight text-foreground truncate">
              BhuSamanvay
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate">
              Land Records AI
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation Links */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/70">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={
                      <Link href={item.href} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="ml-auto text-[10px] font-mono px-1.5 py-0 group-data-[collapsible=icon]:hidden"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    }
                    isActive={item.isActive}
                    tooltip={item.title}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer Profile & Sign Out */}
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs border border-primary/20">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground truncate">
                  {user.name || "Officer"}
                </span>
                <Badge
                  variant={user.role === "admin" ? "default" : "secondary"}
                  className="text-[9px] font-mono px-1 py-0 h-3.5 uppercase shrink-0"
                >
                  {user.role}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground truncate" title={user.email}>
                {user.email}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            title="Sign out"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
          >
            <HugeiconsIcon icon={Logout01Icon} className="size-4" strokeWidth={2} />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
