import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ModeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await requireAuth();

  if (!authResult.success) {
    redirect("/auth/sign-in");
  }

  const user = authResult.data;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-xs supports-backdrop-filter:bg-background/60 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <div className="h-4 w-px bg-border/80 shrink-0" role="separator" aria-orientation="vertical" />
            <div className="flex items-center gap-2.5">
              <span className="font-sans font-bold text-sm sm:text-base tracking-tight text-foreground">
                BhuSamanvay
              </span>
              <span className="text-muted-foreground/60 text-xs">/</span>
              <Badge
                variant="secondary"
                className="font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.2 text-muted-foreground"
              >
                Admin Workspace
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
