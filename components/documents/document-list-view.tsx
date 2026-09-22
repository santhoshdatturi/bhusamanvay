"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  File01Icon,
  Search01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Alert02Icon,
  ReloadIcon,
  ViewIcon,
  Layers01Icon,
  Upload01Icon,
  MoreHorizontalIcon,
  Delete02Icon,
  Copy01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DocumentUploadModal } from "./document-upload-modal";
import { DOCUMENT_TYPES } from "@/lib/constants/documents";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DocumentRecord } from "@/lib/db/types";
import type { AuthUser } from "@/lib/auth";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "uploaded", label: "Uploaded" },
  { value: "extracted", label: "Extracted" },
  { value: "failed", label: "Failed" },
];

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All Document Types" },
  ...DOCUMENT_TYPES.map((dt) => ({
    value: dt.value,
    label: dt.shortLabel || dt.label,
  })),
];

interface DocumentListViewProps {
  initialDocuments?: DocumentRecord[];
  initialStats?: {
    total: number;
    uploaded: number;
    extracted: number;
    failed: number;
  };
  user?: AuthUser;
}

export function DocumentListView({
  initialDocuments = [],
}: DocumentListViewProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentRecord[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Delete Confirmation Dialog state
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Compute live stats from current document list
  const stats = useMemo(() => {
    return {
      total: documents.length,
      uploaded: documents.filter((d) => d.status === "uploaded").length,
      extracted: documents.filter((d) => d.status === "extracted").length,
      failed: documents.filter((d) => d.status === "failed").length,
    };
  }, [documents]);

  // Responsive instant in-memory filtering for cards and search
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Status filter
      if (statusFilter !== "all" && doc.status !== statusFilter) {
        return false;
      }

      // 2. Document type filter
      if (typeFilter !== "all" && doc.documentType !== typeFilter) {
        return false;
      }

      // 3. Search query filter
      const q = search.trim().toLowerCase();
      if (q) {
        const titleMatch = doc.title.toLowerCase().includes(q);
        const fileMatch = doc.fileName.toLowerCase().includes(q);
        const stateMatch = Boolean(doc.state && doc.state.toLowerCase().includes(q));
        const typeMatch = Boolean(
          doc.documentType && doc.documentType.toLowerCase().includes(q)
        );
        if (!titleMatch && !fileMatch && !stateMatch && !typeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [documents, statusFilter, typeFilter, search]);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/documents?limit=100");
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json?.data?.documents) {
        setDocuments(json.data.documents);
      }
    } catch (err) {
      console.warn("Failed to fetch documents:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle direct processing action from menu
  const handleTriggerProcess = (doc: DocumentRecord) => {
    if (processingIds.has(doc.id)) return;
    setProcessingIds((prev) => new Set(prev).add(doc.id));

    const processPromise = async () => {
      const res = await fetch(`/api/documents/${doc.id}/process`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.userMessage || "Failed to process document");
      }
      await fetchDocuments();
      return json.data;
    };

    toast.promise(processPromise(), {
      loading: `Extracting ${doc.title}`,
      success: `Extraction completed for ${doc.title}`,
      error: (err: Error) => err.message || "An error occurred during extraction",
      finally: () => {
        setProcessingIds((prev) => {
          const next = new Set(prev);
          next.delete(doc.id);
          return next;
        });
      },
    });
  };

  // Handle confirmed document deletion
  const handleConfirmDelete = async () => {
    if (!documentToDelete || isDeleting) return;
    const doc = documentToDelete;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.userMessage || "Failed to delete document");
      }
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      setDocumentToDelete(null);
      toast.success(`${doc.title} deleted successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Document ID copied to clipboard");
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Never";
    try {
      const d = new Date(isoString);
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    } catch {
      return isoString;
    }
  };

  const renderStatusBadge = (status: string, isItemProcessing: boolean) => {
    if (isItemProcessing) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400">
          <HugeiconsIcon icon={Loading03Icon} className="size-3 animate-spin" strokeWidth={2} />
          Processing
        </span>
      );
    }

    switch (status) {
      case "uploaded":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-400">
            <HugeiconsIcon icon={Clock01Icon} className="size-3" strokeWidth={2} />
            Uploaded
          </span>
        );
      case "extracted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" strokeWidth={2} />
            Extracted
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400">
            <HugeiconsIcon icon={Alert02Icon} className="size-3" strokeWidth={2} />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border border-border/70 bg-muted/40 text-foreground">
            {status}
          </span>
        );
    }
  };

  const handleCardFilter = (target: string) => {
    if (statusFilter === target) {
      setStatusFilter("all");
    } else {
      setStatusFilter(target);
    }
  };


  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Land Record Documents
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Digitize, inspect, and reconcile Indian land revenue records, cadastral registers, and 7/12 extracts with AI parcel extraction.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setUploadModalOpen(true)}
          className="shrink-0 font-medium shadow-xs"
        >
          <HugeiconsIcon icon={Upload01Icon} data-icon="inline-start" strokeWidth={2} />
          Upload Land Record
        </Button>
      </div>

      {/* Upload Modal Dialog */}
      <DocumentUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={fetchDocuments}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(documentToDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDocumentToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Delete Land Record Document
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanent removal of document file and metadata
                </p>
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{documentToDelete?.title}</strong>? This will delete the uploaded file ({documentToDelete?.fileName}) and remove all associated parcel extractions and cadastral records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDocumentToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="min-w-[130px] font-medium text-xs shadow-xs"
            >
              {isDeleting ? (
                <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
              ) : (
                <HugeiconsIcon icon={Delete02Icon} data-icon="inline-start" strokeWidth={2} />
              )}
              Delete Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Records */}
        <Card
          onClick={() => handleCardFilter("all")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "all"
              ? "border-primary/50 bg-primary/[0.03] ring-1 ring-primary/20"
              : "border-border/60 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Total Records
            </span>
            <HugeiconsIcon icon={File01Icon} className="size-4 text-muted-foreground" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            {stats.total}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Registered land records
          </p>
        </Card>

        {/* Card 2: Uploaded */}
        <Card
          onClick={() => handleCardFilter("uploaded")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "uploaded"
              ? "border-blue-500/50 bg-blue-500/[0.03] ring-1 ring-blue-500/20"
              : "border-border/60 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Uploaded
            </span>
            <HugeiconsIcon icon={Clock01Icon} className="size-4 text-blue-500" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            {stats.uploaded}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Pending AI extraction
          </p>
        </Card>

        {/* Card 3: Extracted */}
        <Card
          onClick={() => handleCardFilter("extracted")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "extracted"
              ? "border-emerald-500/50 bg-emerald-500/[0.03] ring-1 ring-emerald-500/20"
              : "border-border/60 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Extracted
            </span>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-emerald-500" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            {stats.extracted}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Parsed and ready to inspect
          </p>
        </Card>

        {/* Card 4: Failed */}
        <Card
          onClick={() => handleCardFilter("failed")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "failed"
              ? "border-rose-500/50 bg-rose-500/[0.03] ring-1 ring-rose-500/20"
              : "border-border/60 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Failed
            </span>
            <HugeiconsIcon icon={Alert02Icon} className="size-4 text-rose-500" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            {stats.failed}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Requires manual review
          </p>
        </Card>
      </div>

      {/* Table Section */}
      <div className="flex flex-col gap-3">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-2xs">
          <div className="flex flex-1 items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="Search by title, file, or state..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val || "all")}
              items={STATUS_FILTER_OPTIONS}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="min-w-[135px]">
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={typeFilter}
              onValueChange={(val) => setTypeFilter(val || "all")}
              items={TYPE_FILTER_OPTIONS}
            >
              <SelectTrigger className="w-[185px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Document Types" />
              </SelectTrigger>
              <SelectContent className="min-w-[190px]">
                {TYPE_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            {documents.length > 0 && (
              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                {filteredDocuments.length} of {documents.length} {documents.length === 1 ? "Record" : "Records"}
              </span>
            )}
            <Button
              variant="outline"
              size="xs"
              onClick={() => fetchDocuments()}
              disabled={isLoading}
              className="gap-1 font-sans text-xs h-8 px-2.5"
            >
              <HugeiconsIcon
                icon={isLoading ? Loading03Icon : ReloadIcon}
                className={cn("size-3.5", isLoading && "animate-spin")}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
          {documents.length === 0 ? (
            <div className="py-14 px-4 text-center flex flex-col items-center justify-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/60 border border-border/70 text-muted-foreground">
                <HugeiconsIcon icon={File01Icon} className="size-5" strokeWidth={1.8} />
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <span className="text-sm font-semibold text-foreground">
                  No land record documents uploaded yet
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Upload a scanned Record of Rights (RoR), 7/12 extract, or cadastral map to start AI digitization.
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setUploadModalOpen(true)}
                className="mt-2 font-medium"
              >
                <HugeiconsIcon icon={Upload01Icon} data-icon="inline-start" strokeWidth={2} />
                Upload First Document
              </Button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-14 px-4 text-center flex flex-col items-center justify-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/60 border border-border/70 text-muted-foreground">
                <HugeiconsIcon icon={Search01Icon} className="size-5" strokeWidth={1.8} />
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <span className="text-sm font-semibold text-foreground">
                  No matching land records found
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  No documents matched your filter criteria ({statusFilter !== "all" ? `status: ${statusFilter}` : "all statuses"}{typeFilter !== "all" ? `, type: ${typeFilter}` : ""}{search.trim() ? `, search: "${search.trim()}"` : ""}). Try resetting filters.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                }}
                className="mt-2 font-medium"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/35 hover:bg-muted/35 border-b border-border/60">
                  <TableHead className="text-xs font-semibold py-3 pl-5">Document Title</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Classification Type</TableHead>
                  <TableHead className="text-xs font-semibold py-3">State Jurisdiction</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Pipeline Status</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Uploaded Date</TableHead>
                  <TableHead className="text-xs font-semibold py-3 pr-5 text-right w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const isItemProcessing = processingIds.has(doc.id);
                  const docTypeMeta = DOCUMENT_TYPES.find((t) => t.value === doc.documentType);
                  const docTypeLabel = docTypeMeta?.shortLabel || docTypeMeta?.label || doc.documentType;

                  return (
                    <TableRow
                      key={doc.id}
                      className="text-xs border-b border-border/40 hover:bg-muted/20 transition-colors group"
                    >
                      {/* Document Title with Icon Box */}
                      <TableCell className="font-medium text-foreground py-3.5 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground border border-border/50">
                            <HugeiconsIcon icon={File01Icon} className="size-3.5" strokeWidth={2} />
                          </div>
                          <div className="flex flex-col">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="font-semibold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer"
                            >
                              {doc.title}
                            </Link>
                            <span className="text-[11px] font-mono text-muted-foreground truncate max-w-xs mt-0.5">
                              {doc.fileName}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Classification Type Badge */}
                      <TableCell className="py-3.5">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-sans font-medium px-2 py-0.5 bg-muted/80 border-border text-foreground rounded-md"
                        >
                          {docTypeLabel}
                        </Badge>
                      </TableCell>

                      {/* State Jurisdiction */}
                      <TableCell className="py-3.5 text-xs text-muted-foreground font-medium">
                        {doc.state || "-"}
                      </TableCell>

                      {/* Pipeline Status */}
                      <TableCell className="py-3.5">
                        {renderStatusBadge(doc.status, isItemProcessing)}
                      </TableCell>

                      {/* Uploaded Date */}
                      <TableCell
                        className="py-3.5 text-[11px] font-mono text-muted-foreground tabular-nums"
                        suppressHydrationWarning
                      >
                        <span suppressHydrationWarning>{formatDate(doc.createdAt)}</span>
                      </TableCell>

                      {/* Actions Menu */}
                      <TableCell className="py-3.5 pr-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors outline-none cursor-pointer"
                          >
                            <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" strokeWidth={2} />
                            <span className="sr-only">Actions for {doc.title}</span>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-56">
                            <DropdownMenuGroup>
                              <DropdownMenuItem onClick={() => router.push(`/documents/${doc.id}`)}>
                                <HugeiconsIcon icon={ViewIcon} className="size-4" strokeWidth={2} />
                                <span>Open Workspace</span>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                onClick={() => handleTriggerProcess(doc)}
                                disabled={isItemProcessing}
                              >
                                <HugeiconsIcon
                                  icon={doc.status === "uploaded" ? Layers01Icon : ReloadIcon}
                                  className={cn("size-4", isItemProcessing && "animate-spin")}
                                  strokeWidth={2}
                                />
                                <span>
                                  {doc.status === "uploaded" ? "Run AI Extraction" : "Reprocess Extraction"}
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyId(doc.id)}>
                                <HugeiconsIcon icon={Copy01Icon} className="size-4" strokeWidth={2} />
                                <span>Copy Document ID</span>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDocumentToDelete(doc)}
                              >
                                <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
                                <span>Delete Document</span>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
