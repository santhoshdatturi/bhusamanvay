"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  File01Icon,
  Search01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Alert02Icon,
  ReloadIcon,
  ViewIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentUploadModal } from "./document-upload-modal";
import { DOCUMENT_TYPES } from "@/lib/constants/documents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DocumentRecord } from "@/lib/db/types";

interface DocumentListViewProps {
  initialDocuments?: DocumentRecord[];
  initialStats?: {
    total: number;
    uploaded: number;
    extracted: number;
    failed: number;
  };
}

export function DocumentListView({
  initialDocuments = [],
  initialStats = { total: 0, uploaded: 0, extracted: 0, failed: 0 },
}: DocumentListViewProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [stats, setStats] = useState(initialStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (search.trim()) {
        params.set("search", search.trim());
      }

      const res = await fetch(`/api/documents?${params.toString()}`);
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json?.data) {
        setDocuments(json.data.documents);
        setStats(json.data.stats);
      }
    } catch (err) {
      console.warn("Failed to fetch documents:", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") {
          params.set("status", statusFilter);
        }
        if (search.trim()) {
          params.set("search", search.trim());
        }

        const res = await fetch(`/api/documents?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          if (!ignore && json.success && json.data) {
            setDocuments(json.data.documents);
            setStats(json.data.stats);
          }
        }
      } catch {
        // Handled
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [search, statusFilter]);

  // Handle direct processing action from list
  const handleTriggerProcess = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingIds((prev) => new Set(prev).add(docId));

    try {
      const res = await fetch(`/api/documents/${docId}/process`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.userMessage || "Failed to process document");
      } else {
        toast.success("Document extraction completed!");
        fetchDocuments();
      }
    } catch {
      toast.error("An error occurred during extraction");
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(docId);
        return next;
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "uploaded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400">
            <HugeiconsIcon icon={Clock01Icon} className="size-3" />
            <span>Uploaded</span>
          </span>
        );
      case "extracted":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
            <span>Extracted</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400">
            <HugeiconsIcon icon={Alert02Icon} className="size-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Land Record Documents
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Digitize, inspect, and reconcile Indian land revenue records and cadastral documents.
          </p>
        </div>

        <DocumentUploadModal onSuccess={fetchDocuments} />
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "p-3 rounded-lg border text-left transition-all",
            statusFilter === "all"
              ? "border-primary bg-primary/5 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          )}
        >
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Total Records
          </div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">
            {stats.total}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("uploaded")}
          className={cn(
            "p-3 rounded-lg border text-left transition-all",
            statusFilter === "uploaded"
              ? "border-blue-500 bg-blue-500/5 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          )}
        >
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-blue-500" />
            <span>Uploaded</span>
          </div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">
            {stats.uploaded}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("extracted")}
          className={cn(
            "p-3 rounded-lg border text-left transition-all",
            statusFilter === "extracted"
              ? "border-emerald-500 bg-emerald-500/5 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          )}
        >
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Extracted</span>
          </div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">
            {stats.extracted}
          </div>
        </button>

        <button
          onClick={() => setStatusFilter("failed")}
          className={cn(
            "p-3 rounded-lg border text-left transition-all",
            statusFilter === "failed"
              ? "border-rose-500 bg-rose-500/5 shadow-xs"
              : "border-border bg-card hover:bg-muted/40"
          )}
        >
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-rose-500" />
            <span>Failed</span>
          </div>
          <div className="text-xl font-bold text-foreground mt-1 font-mono">
            {stats.failed}
          </div>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
          />
          <Input
            type="text"
            placeholder="Search documents by title or file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchDocuments()}
          disabled={isLoading}
          className="gap-1.5 font-mono text-xs"
        >
          <HugeiconsIcon
            icon={ReloadIcon}
            className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Documents Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[300px] text-xs font-semibold">Document Title</TableHead>
              <TableHead className="text-xs font-semibold">Type</TableHead>
              <TableHead className="text-xs font-semibold">State / Region</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Uploaded Date</TableHead>
              <TableHead className="text-right text-xs font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground font-mono">
                  Loading land records...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                  <div className="space-y-2">
                    <HugeiconsIcon icon={File01Icon} className="size-8 mx-auto text-muted-foreground/60" />
                    <p className="font-medium text-foreground">No land record documents found</p>
                    <p className="text-[11px]">Upload a scanned RoR, 7/12, or Mutation extract to start digitization.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => {
                const isItemProcessing = processingIds.has(doc.id);
                const docTypeMeta = DOCUMENT_TYPES.find((t) => t.value === doc.documentType);
                const docTypeLabel = docTypeMeta?.shortLabel || docTypeMeta?.label || doc.documentType;

                return (
                  <TableRow
                    key={doc.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                  >
                    <TableCell className="py-3">
                      <Link href={`/documents/${doc.id}`} className="block">
                        <div className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors">
                          {doc.title}
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate max-w-xs mt-0.5">
                          {doc.fileName}
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell className="py-3">
                      <span className="text-[11px] font-sans font-medium bg-muted/80 px-2.5 py-1 rounded-md border border-border/70 text-foreground inline-flex items-center">
                        {docTypeLabel}
                      </span>
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground">
                      {doc.state || "—"}
                    </TableCell>

                    <TableCell className="py-3">
                      {renderStatusBadge(doc.status)}
                    </TableCell>

                    <TableCell className="py-3 text-[11px] font-mono text-muted-foreground tabular-nums">
                      {new Date(doc.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {doc.status === "uploaded" && (
                          <Button
                            size="xs"
                            onClick={(e) => handleTriggerProcess(doc.id, e)}
                            disabled={isItemProcessing}
                            className="gap-1 font-mono text-xs h-7 px-2"
                          >
                            <HugeiconsIcon icon={Layers01Icon} className={`size-3 ${isItemProcessing ? "animate-spin" : ""}`} />
                            <span>{isItemProcessing ? "Processing..." : "Process"}</span>
                          </Button>
                        )}

                        {(doc.status === "extracted" || doc.status === "failed") && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => handleTriggerProcess(doc.id, e)}
                            disabled={isItemProcessing}
                            className="gap-1 font-mono text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <HugeiconsIcon icon={ReloadIcon} className={`size-3 ${isItemProcessing ? "animate-spin" : ""}`} />
                            <span>Reprocess</span>
                          </Button>
                        )}

                        <Link
                          href={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
                        >
                          <HugeiconsIcon icon={ViewIcon} className="size-3" />
                          <span>View</span>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
