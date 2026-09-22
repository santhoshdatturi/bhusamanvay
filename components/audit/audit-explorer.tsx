"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldCheckIcon,
  Search01Icon,
  ReloadIcon,
  Download01Icon,
  Clock01Icon,
  File01Icon,
  CpuIcon,
  ArrowRight01Icon,
  User02Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Database01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AuditLogRecord, FieldDiffItem } from "@/lib/db/types";
import type { PaginatedAuditLogsResult } from "@/lib/services/audit.service";
import type { AuthUser } from "@/lib/auth";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "document.uploaded": {
    label: "Document Ingested",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  },
  "extraction.started": {
    label: "AI Processing Started",
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  },
  "extraction.completed": {
    label: "AI Extraction Completed",
    color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
  },
  "extraction.failed": {
    label: "Processing Failed",
    color: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
  },
  "field.corrected": {
    label: "Field Modified",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  "document.verified": {
    label: "Human Verified",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  },
  "canonical.committed": {
    label: "Canonical Committed",
    color: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/30",
  },
};

const ACTION_FILTER_OPTIONS = [
  { value: "all", label: "All Actions" },
  { value: "document.uploaded", label: "Document Ingested" },
  { value: "extraction.completed", label: "AI Extraction" },
  { value: "field.corrected", label: "Field Modified" },
  { value: "document.verified", label: "Human Verified" },
  { value: "canonical.committed", label: "Canonical Committed" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
];

interface AuditExplorerProps {
  initialData: PaginatedAuditLogsResult;
  user?: AuthUser;
}

export function AuditExplorer({ initialData, user }: AuditExplorerProps) {
  const [data, setData] = useState<PaginatedAuditLogsResult>(initialData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedLogForModal, setSelectedLogForModal] = useState<AuditLogRecord | null>(null);

  const fetchWithParams = async (
    targetPage: number,
    targetSearch: string,
    targetAction: string,
    targetStatus: string
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", targetPage.toString());
      params.set("limit", "20");
      if (targetSearch.trim()) params.set("search", targetSearch.trim());
      if (targetAction !== "all") params.set("action", targetAction);
      if (targetStatus !== "all") params.set("status", targetStatus);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleActionChange = (action: string | null) => {
    const val = action || "all";
    setSelectedAction(val);
    setPage(1);
    fetchWithParams(1, search, val, selectedStatus);
  };

  const handleStatusChange = (status: string | null) => {
    const val = status || "all";
    setSelectedStatus(val);
    setPage(1);
    fetchWithParams(1, search, selectedAction, val);
  };

  const handleCardFilter = (targetAction: string) => {
    if (selectedAction === targetAction) {
      setSelectedAction("all");
      setPage(1);
      fetchWithParams(1, search, "all", selectedStatus);
    } else {
      setSelectedAction(targetAction);
      setPage(1);
      fetchWithParams(1, search, targetAction, selectedStatus);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWithParams(1, search, selectedAction, selectedStatus);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchWithParams(newPage, search, selectedAction, selectedStatus);
  };

  const handleRefresh = () => {
    fetchWithParams(page, search, selectedAction, selectedStatus);
  };

  const handleExportCsv = () => {
    if (!data || data.logs.length === 0) return;

    const headers = [
      "Timestamp",
      "Action",
      "Status",
      "Resource Type",
      "Resource ID",
      "Actor Type",
      "Actor Email",
      "Actor Role",
      "Document ID",
    ];
    const rows = data.logs.map((log) => [
      log.createdAt,
      log.action,
      log.status,
      log.resourceType,
      log.resourceId,
      log.actorType,
      log.actorEmail || "",
      log.actorRole || "",
      log.documentId || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `bhusamanvay_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, "0");
      return {
        date: `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
        time: `${strHours}:${minutes}:${seconds} ${ampm}`,
      };
    } catch {
      return { date: isoString, time: "" };
    }
  };

  const stats = data?.stats ?? {
    total: 0,
    uploads: 0,
    extractions: 0,
    verifications: 0,
    commits: 0,
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Audit Logs & Chain of Custody
            </h1>
            <Badge
              variant="outline"
              className="text-[11px] font-mono uppercase px-2 py-0.5 tracking-wider bg-muted/40 text-foreground border-border/60"
            >
              {user?.role ? `${user.role} workspace` : "Workspace"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Immutable digital provenance and verification logs for DILRMP compliance, AI OCR extraction runs, and canonical registry commits.
          </p>
        </div>
      </div>

      {/* Metric Cards Banner - Exact same size, design and layout as /documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Records */}
        <Card
          onClick={() => handleCardFilter("all")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            selectedAction === "all"
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
            Registered audit events
          </p>
        </Card>

        {/* Card 2: Uploaded */}
        <Card
          onClick={() => handleCardFilter("document.uploaded")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            selectedAction === "document.uploaded"
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
            {stats.uploads}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Pending AI extraction
          </p>
        </Card>

        {/* Card 3: Extracted */}
        <Card
          onClick={() => handleCardFilter("extraction.completed")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            selectedAction === "extraction.completed"
              ? "border-purple-500/50 bg-purple-500/[0.03] ring-1 ring-purple-500/20"
              : "border-border/60 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Extracted
            </span>
            <HugeiconsIcon icon={CpuIcon} className="size-4 text-purple-500" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            {stats.extractions}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Parsed and ready to inspect
          </p>
        </Card>

        {/* Card 4: Committed */}
        <Card
          onClick={() => handleCardFilter("canonical.committed")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            selectedAction === "canonical.committed"
              ? "border-emerald-500/50 bg-emerald-500/[0.03] ring-1 ring-emerald-500/20"
              : "border-border/60 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Committed
            </span>
            <HugeiconsIcon icon={Database01Icon} className="size-4 text-emerald-500" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            {stats.commits}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Official canonical registry
          </p>
        </Card>
      </div>

      {/* Table Section with Heading and Layout matching /documents */}
      <div className="flex flex-col gap-3">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Audit Trail Records
            </h2>
            <p className="text-xs text-muted-foreground">
              Chronological log of document ingestion, AI extractions, field corrections, and canonical commits.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar - Kept exactly as requested */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-2xs">
          <div className="flex flex-1 items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-sm">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="Search by action, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </form>

            <Select
              value={selectedAction}
              onValueChange={handleActionChange}
              items={ACTION_FILTER_OPTIONS}
            >
              <SelectTrigger className="w-[185px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent className="min-w-[190px]">
                {ACTION_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={handleStatusChange}
              items={STATUS_FILTER_OPTIONS}
            >
              <SelectTrigger className="w-[125px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="min-w-[130px]">
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="xs"
              onClick={handleRefresh}
              disabled={loading}
              className="gap-1 font-sans text-xs h-8 px-2.5"
            >
              <HugeiconsIcon icon={ReloadIcon} className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={handleExportCsv}
              disabled={!data || data.logs.length === 0}
              className="gap-1 font-sans text-xs h-8 px-2.5"
            >
              <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Table Container - Exact same table header and layout style as /documents */}
        <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/35 hover:bg-muted/35 border-b border-border/60">
                <TableHead className="text-xs font-semibold py-3 pl-5">Timestamp</TableHead>
                <TableHead className="text-xs font-semibold py-3">Event Action</TableHead>
                <TableHead className="text-xs font-semibold py-3">Status</TableHead>
                <TableHead className="text-xs font-semibold py-3">Resource</TableHead>
                <TableHead className="text-xs font-semibold py-3">Actor / Officer</TableHead>
                <TableHead className="text-xs font-semibold py-3 pr-5 text-right">Audit Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (!data || data.logs.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 px-4 text-center text-muted-foreground">
                    <HugeiconsIcon icon={ReloadIcon} className="size-5 animate-spin mx-auto mb-2 text-primary" />
                    <span>Loading audit records...</span>
                  </TableCell>
                </TableRow>
              ) : !data || data.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/60 border border-border/70 text-muted-foreground">
                        <HugeiconsIcon icon={Clock01Icon} className="size-5" strokeWidth={1.8} />
                      </div>
                      <div className="flex flex-col gap-1 max-w-md">
                        <span className="text-sm font-semibold text-foreground">
                          No audit entries found
                        </span>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          No audit logs matched your search or filter criteria. Try resetting filters.
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSearch("");
                          setSelectedAction("all");
                          setSelectedStatus("all");
                          setPage(1);
                          fetchWithParams(1, "", "all", "all");
                        }}
                        className="mt-2 font-medium"
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.logs.map((log) => {
                  const meta = ACTION_LABELS[log.action] || {
                    label: log.action,
                    color: "bg-muted text-muted-foreground border-border",
                  };
                  const time = formatTimestamp(log.createdAt);

                  return (
                    <TableRow
                      key={log.id}
                      className="text-xs border-b border-border/40 hover:bg-muted/20 transition-colors group"
                    >
                      {/* Timestamp */}
                      <TableCell className="py-3.5 pl-5 whitespace-nowrap" suppressHydrationWarning>
                        <span className="block font-medium text-foreground" suppressHydrationWarning>{time.date}</span>
                        <span className="block text-[10px] font-mono text-muted-foreground" suppressHydrationWarning>{time.time}</span>
                      </TableCell>

                      {/* Event / Action */}
                      <TableCell className="py-3.5 whitespace-nowrap">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border", meta.color)}>
                          {meta.label}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border",
                            log.status === "success"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                          )}
                        >
                          <HugeiconsIcon
                            icon={log.status === "success" ? CheckmarkCircle02Icon : Alert02Icon}
                            className="size-3"
                          />
                          <span>{log.status}</span>
                        </span>
                      </TableCell>

                      {/* Resource */}
                      <TableCell className="py-3.5 whitespace-nowrap">
                        {log.documentId ? (
                          <Link
                            href={`/documents/${log.documentId}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/30 transition-all group cursor-pointer"
                            title={`View ${log.resourceType === "document" ? "document" : log.resourceType}`}
                          >
                            <HugeiconsIcon icon={File01Icon} className="size-3.5 shrink-0" />
                            <span className="capitalize">{log.resourceType === "document" ? "Document" : log.resourceType.replace(/_/g, " ")}</span>
                            <HugeiconsIcon
                              icon={ArrowRight01Icon}
                              className="size-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0"
                            />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 text-muted-foreground border border-border/60">
                            <HugeiconsIcon icon={File01Icon} className="size-3.5 shrink-0" />
                            <span className="capitalize">{log.resourceType.replace(/_/g, " ")}</span>
                          </span>
                        )}
                      </TableCell>

                      {/* Actor */}
                      <TableCell className="py-3.5 whitespace-nowrap">
                        {log.actorType === "user" ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <HugeiconsIcon icon={User02Icon} className="size-3 text-primary shrink-0" />
                            <span className="font-medium text-foreground truncate max-w-[150px]">
                              {log.actorEmail || log.actorId}
                            </span>
                            {log.actorRole && (
                              <span className="text-[10px] text-muted-foreground">({log.actorRole})</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <HugeiconsIcon icon={CpuIcon} className="size-3 text-purple-500 shrink-0" />
                            <span>AI Engine</span>
                          </div>
                        )}
                      </TableCell>

                      {/* Details / Modal Trigger */}
                      <TableCell className="py-3.5 pr-5 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setSelectedLogForModal(log)}
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground font-medium"
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination Bar */}
          {data && data.totalPages > 1 && (
            <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Showing {(data.page - 1) * data.limit + 1} to{" "}
                {Math.min(data.page * data.limit, data.total)} of {data.total} audit entries
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handlePageChange(Math.max(1, data.page - 1))}
                  disabled={data.page <= 1}
                  className="h-7 text-xs"
                >
                  Previous
                </Button>
                <span className="font-mono text-xs px-2 text-foreground">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handlePageChange(Math.min(data.totalPages, data.page + 1))}
                  disabled={data.page >= data.totalPages}
                  className="h-7 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Detail Modal */}
      {selectedLogForModal ? (() => {
        const modalMeta = (selectedLogForModal.metadata as Record<string, unknown>) || {};
        const modalActionMeta = ACTION_LABELS[selectedLogForModal.action] || {
          label: selectedLogForModal.action,
          color: "bg-muted text-muted-foreground border-border",
        };
        const modalTime = formatTimestamp(selectedLogForModal.createdAt);
        const modalTargetDocId = selectedLogForModal.documentId || (selectedLogForModal.resourceType === "document" ? selectedLogForModal.resourceId : null);
        const modalResourceLabel = selectedLogForModal.resourceType === "document" ? "Land Document" : selectedLogForModal.resourceType.replace(/_/g, " ");

        return (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl space-y-5 max-h-[88vh] overflow-y-auto font-sans">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HugeiconsIcon icon={ShieldCheckIcon} className="size-4" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Audit Entry Details
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Cryptographic digital chain of custody record
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setSelectedLogForModal(null)}
                  className="size-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </Button>
              </div>

              {/* Core Information Attributes */}
              <div className="grid grid-cols-2 gap-3.5 p-3.5 rounded-xl bg-muted/30 border border-border/60">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Event Action</span>
                  <div>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md border inline-block", modalActionMeta.color)}>
                      {modalActionMeta.label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Execution Status</span>
                  <div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border",
                        selectedLogForModal.status === "success"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                      )}
                    >
                      <HugeiconsIcon
                        icon={selectedLogForModal.status === "success" ? CheckmarkCircle02Icon : Alert02Icon}
                        className="size-3"
                      />
                      <span className="capitalize">{selectedLogForModal.status}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Target Resource</span>
                  <div className="text-xs font-medium text-foreground">
                    {modalTargetDocId ? (
                      <Link
                        href={`/documents/${modalTargetDocId}`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <HugeiconsIcon icon={File01Icon} className="size-3.5" />
                        <span className="capitalize">{modalResourceLabel}</span>
                        <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
                      </Link>
                    ) : (
                      <span className="capitalize text-muted-foreground">{modalResourceLabel}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-muted-foreground">Recorded Timestamp</span>
                  <span className="text-xs font-medium text-foreground" suppressHydrationWarning>
                    {modalTime.date} at {modalTime.time}
                  </span>
                </div>

                <div className="col-span-2 flex flex-col gap-1 pt-2 border-t border-border/40">
                  <span className="text-[11px] font-medium text-muted-foreground">Actor / Officer</span>
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    {selectedLogForModal.actorType === "user" ? (
                      <>
                        <HugeiconsIcon icon={User02Icon} className="size-3.5 text-primary" />
                        <span className="font-medium">{selectedLogForModal.actorEmail || selectedLogForModal.actorId}</span>
                        {selectedLogForModal.actorRole && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {selectedLogForModal.actorRole}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={CpuIcon} className="size-3.5 text-purple-500" />
                        <span className="font-medium">System Automated Pipeline (AI Engine)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Execution & AI Performance Cards (Moved from table to here) */}
              {Boolean(modalMeta.durationMs !== undefined || modalMeta.confidenceScore !== undefined || modalMeta.modelName) && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground">Execution & Performance Metrics</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {modalMeta.durationMs !== undefined && (
                      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <HugeiconsIcon icon={Clock01Icon} className="size-3.5 text-blue-500" />
                          <span>Duration</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground font-mono">
                          {(Number(modalMeta.durationMs) / 1000).toFixed(2)}s
                        </span>
                      </div>
                    )}

                    {modalMeta.confidenceScore !== undefined && (
                      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5 text-emerald-500" />
                          <span>Confidence</span>
                        </div>
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                          {String(modalMeta.confidenceScore)}%
                        </span>
                      </div>
                    )}

                    {Boolean(modalMeta.modelName) && (
                      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                          <HugeiconsIcon icon={CpuIcon} className="size-3.5 text-purple-500" />
                          <span>AI Model</span>
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {String(modalMeta.modelName)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Details (if failed) */}
              {Boolean(modalMeta.errorMessage || selectedLogForModal.status === "failure") && (
                <div className="p-3.5 rounded-lg border border-rose-500/25 bg-rose-500/10 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-semibold text-xs">
                    <HugeiconsIcon icon={Alert02Icon} className="size-3.5" />
                    <span>Failure Diagnostic Details</span>
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                    {String(modalMeta.errorMessage || "Operation failed during execution.")}
                  </p>
                </div>
              )}

              {/* Human-in-the-Loop Field Modifications (Diffs) */}
              {Array.isArray(selectedLogForModal.diff) && selectedLogForModal.diff.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Human-in-the-Loop Field Modifications
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-500/10">
                      {selectedLogForModal.diff.length} Modification{selectedLogForModal.diff.length > 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(selectedLogForModal.diff as unknown as FieldDiffItem[]).map((item, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-border bg-background space-y-1.5">
                        <span className="text-xs font-semibold text-foreground">{item.label || item.field}</span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
                            <span className="block text-[10px] text-muted-foreground font-medium mb-0.5">Original (AI OCR):</span>
                            <span className="font-mono text-[11px] break-all">{String(item.ocrValue ?? "—")}</span>
                          </div>
                          <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                            <span className="block text-[10px] text-muted-foreground font-medium mb-0.5">Approved (Officer):</span>
                            <span className="font-mono text-[11px] break-all">{String(item.humanValue ?? "—")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Context Metadata */}
              {Boolean(selectedLogForModal.metadata) && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-foreground">Metadata Context</span>
                  <pre className="p-3 rounded-lg bg-muted/40 border border-border/60 font-mono text-[11px] overflow-x-auto text-foreground max-h-40 leading-relaxed">
                    {JSON.stringify(selectedLogForModal.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedLogForModal(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        );
      })() : null}
    </div>
  );
}
