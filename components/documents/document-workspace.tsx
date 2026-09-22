"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Layers01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { DocumentViewer } from "./document-viewer";
import { ExtractionPanel } from "./extraction-panel";
import { AuditTimeline } from "./audit-timeline";
import { DOCUMENT_TYPES } from "@/lib/constants/documents";
import type { DocumentRecord, AuditLogRecord } from "@/lib/db/types";

interface DocumentWorkspaceProps {
  initialDocument: DocumentRecord;
  initialDownloadUrl?: string | null;
  initialAuditLogs?: AuditLogRecord[];
}

export function DocumentWorkspace({
  initialDocument,
  initialDownloadUrl,
  initialAuditLogs = [],
}: DocumentWorkspaceProps) {
  const [document, setDocument] = useState<DocumentRecord>(initialDocument);
  const [downloadUrl, setDownloadUrl] = useState(initialDownloadUrl);
  const [activeTab, setActiveTab] = useState<"extraction" | "audit">("extraction");

  const fetchDocumentDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${initialDocument.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setDocument(json.data.document);
          if (json.data.downloadUrl) {
            setDownloadUrl(json.data.downloadUrl);
          }
        }
      }
    } catch {
      // Ignored
    }
  }, [initialDocument.id]);

  const docTypeLabel =
    DOCUMENT_TYPES.find((t) => t.value === document.documentType)?.shortLabel ||
    document.documentType;

  // Status badge helper
  const renderStatusBadge = () => {
    switch (document.status) {
      case "uploaded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans font-medium border border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400">
            <HugeiconsIcon icon={Clock01Icon} className="size-3" />
            <span>Uploaded</span>
          </span>
        );
      case "extracted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans font-medium border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
            <span>Extracted</span>
          </span>
        );
      case "committed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans font-medium border border-emerald-600/30 bg-emerald-600/15 text-emerald-800 dark:text-emerald-300">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
            <span>Registered</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans font-medium border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400">
            <HugeiconsIcon icon={Alert02Icon} className="size-3" />
            <span>Failed</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-dvh w-full overflow-hidden bg-background">
      {/* Top Header & Breadcrumbs */}
      <header className="h-11 px-3.5 border-b border-border bg-card/70 backdrop-blur-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/documents"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
            <span>Documents</span>
          </Link>

          <div className="h-3.5 w-px bg-border shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs font-semibold truncate text-foreground">
              {document.title}
            </h1>
            <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
              ({document.fileName})
            </span>
          </div>
        </div>

        {/* Center: View Switcher (Extraction vs Audit Trail) */}
        <div className="inline-flex items-center rounded-lg bg-muted/80 p-0.5 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("extraction")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-sans transition-all ${
              activeTab === "extraction"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={Layers01Icon} className="size-3.5" />
            <span>Extraction</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-sans transition-all ${
              activeTab === "audit"
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <HugeiconsIcon icon={ShieldCheckIcon} className="size-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-sans bg-muted/80 text-foreground border border-border px-2 py-0.5 rounded font-medium hidden sm:inline-flex items-center gap-1">
            {document.state && (
              <span className="text-muted-foreground">{document.state} •</span>
            )}
            <span>{docTypeLabel}</span>
          </span>
          {renderStatusBadge()}
        </div>
      </header>

      {/* Main Side-by-Side Split Workspace - Full Viewport Height & Width */}
      <main className="flex-1 min-h-0 p-2 grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-hidden">
        {/* Left Pane: Interactive Document Viewer */}
        <div className="h-full min-h-0 flex flex-col overflow-hidden">
          <DocumentViewer
            fileName={document.fileName}
            documentType={document.documentType}
            downloadUrl={downloadUrl}
          />
        </div>

        {/* Right Pane: Structured Extraction Panel OR Audit Trail */}
        <div className="h-full min-h-0 flex flex-col overflow-hidden">
          {activeTab === "extraction" ? (
            <ExtractionPanel
              document={document}
              onRefresh={fetchDocumentDetails}
            />
          ) : (
            <AuditTimeline
              documentId={document.id}
              initialLogs={initialAuditLogs}
            />
          )}
        </div>
      </main>
    </div>
  );
}
