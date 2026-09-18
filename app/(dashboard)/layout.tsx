import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ModeToggle } from "@/components/theme-toggle";

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
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card/60 backdrop-blur-xs px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground tracking-tight">
                BhuSamanvay
              </span>
              <span>/</span>
              <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Workspace
              </span>
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
