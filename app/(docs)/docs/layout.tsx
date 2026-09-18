import type { Metadata } from "next";
import { DocsHeader } from "@/components/docs/docs-header";
import { DocsSidebarNav } from "@/components/docs/docs-sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";

export const metadata: Metadata = {
  title: {
    default: "API Documentation",
    template: "%s | BhuSamanvay API Docs",
  },
  description:
    "Comprehensive developer documentation, authentication specifications, endpoints, and schema references for the BhuSamanvay Land Records API.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DocsHeader />
      <div className="flex-1 w-full max-w-7xl mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border/70 py-6 pr-4 pl-6 sticky top-14 h-[calc(100vh-3.5rem)]">
          <ScrollArea className="h-full pr-3">
            <DocsSidebarNav />
          </ScrollArea>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 py-8 sm:px-8 lg:px-12 max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
