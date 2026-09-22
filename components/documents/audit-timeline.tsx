"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Clock01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  File01Icon,
  CpuIcon,
  User02Icon,
  ShieldCheckIcon,
  Edit02Icon,
  ReloadIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuditLogRecord, FieldDiffItem } from "@/lib/db/types";

interface AuditTimelineProps {
  documentId: string;
  initialLogs?: AuditLogRecord[];
}

const ACTION_LABELS: Record<string, { label: string; description: string; icon: typeof Clock01Icon; color: string }> = {
  "document.uploaded": {
    label: "Document Ingested",
    description: "Raw land deed scanned file ingested and registered.",
    icon: File01Icon,
    color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  "extraction.started": {
    label: "AI Processing Started",
    description: "AI vision OCR engine initiated layout & text recognition.",
    icon: CpuIcon,
    color: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  "extraction.completed": {
    label: "AI Extraction Completed",
    description: "Structured land record entities parsed with confidence scoring.",
    icon: CheckmarkCircle02Icon,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
  "extraction.failed": {
    label: "Processing Failed",
    description: "Automated OCR extraction encountered an error.",
    icon: Alert02Icon,
    color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
  },
  "field.corrected": {
    label: "Field Modified",
    description: "Reviewer corrected an extracted field.",
    icon: Edit02Icon,
    color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  "document.verified": {
    label: "Human Verification",
    description: "Record inspected and approved by revenue reviewer.",
    icon: ShieldCheckIcon,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  "canonical.committed": {
    label: "Registry Registration",
    description: "Committed to canonical land records database tables.",
    icon: ShieldCheckIcon,
    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-600/15 border-emerald-600/30",
  },
};

export function AuditTimeline({ documentId, initialLogs = [] }: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLogRecord[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [expandedDiffs, setExpandedDiffs] = useState<Record<string, boolean>>({});

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/audit`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLogs(json.data);
        }
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  };

  const toggleDiff = (id: string) => {
    setExpandedDiffs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: d.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
    } catch {
      return { date: isoString, time: "" };
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card shadow-xs overflow-hidden font-sans">
      {/* Header */}
      <div className="h-11 px-3 border-b border-border bg-muted/40 shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={ShieldCheckIcon} className="size-4 shrink-0 text-primary" />
          <h2 className="text-xs font-semibold tracking-tight text-foreground font-sans">
            Audit Trail & Chain of Custody
          </h2>
          <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 h-4">
            {logs.length} {logs.length === 1 ? "Event" : "Events"}
          </Badge>
        </div>

        <Button
          variant="outline"
          size="xs"
          onClick={handleRefresh}
          disabled={loading}
          className="gap-1 font-sans text-xs h-7 px-2"
          title="Refresh audit trail"
        >
          <HugeiconsIcon
            icon={ReloadIcon}
            className={`size-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Body / Timeline */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <HugeiconsIcon icon={ReloadIcon} className="size-5 animate-spin text-primary" />
            <span className="text-xs">Loading audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2 text-center p-4">
            <HugeiconsIcon icon={Clock01Icon} className="size-8 text-muted-foreground/50" />
            <p className="text-xs font-medium">No audit events recorded yet.</p>
            <p className="text-[11px] text-muted-foreground">
              Audit events are recorded automatically during upload, extraction, and verification.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
            {logs.map((log) => {
              const meta = ACTION_LABELS[log.action] || {
                label: log.action,
                description: "System recorded action.",
                icon: Clock01Icon,
                color: "text-muted-foreground bg-muted border-border",
              };
              const Icon = meta.icon;
              const formattedTime = formatTimestamp(log.createdAt);
              const diffItems = Array.isArray(log.diff) ? (log.diff as unknown as FieldDiffItem[]) : [];
              const logMetadata = (log.metadata as Record<string, unknown>) || {};
              const isDiffExpanded = !!expandedDiffs[log.id];

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot Indicator */}
                  <div
                    className={`absolute -left-6 top-0.5 size-5 rounded-full border flex items-center justify-center shrink-0 ${meta.color}`}
                  >
                    <HugeiconsIcon icon={Icon} className="size-3" />
                  </div>

                  {/* Log Content Card */}
                  <div className="rounded-lg border border-border bg-card p-3 shadow-2xs hover:border-border/80 transition-all space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {meta.label}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                              log.status === "success"
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : log.status === "failure"
                                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {meta.description}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <div className="text-right shrink-0">
                        <span className="block text-[11px] font-medium text-foreground">
                          {formattedTime.date}
                        </span>
                        <span className="block text-[10px] font-mono text-muted-foreground">
                          {formattedTime.time}
                        </span>
                      </div>
                    </div>

                    {/* Actor & Metadata Pill Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      {log.actorType === "user" ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          <HugeiconsIcon icon={User02Icon} className="size-3 text-primary" />
                          <span>{log.actorEmail || log.actorId || "User"}</span>
                          {log.actorRole && (
                            <span className="text-[10px] opacity-75">({log.actorRole})</span>
                          )}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          <HugeiconsIcon icon={CpuIcon} className="size-3 text-purple-500" />
                          <span>AI Engine ({String(logMetadata.modelName || "Gemini")})</span>
                        </span>
                      )}

                      {logMetadata.confidenceScore !== undefined && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                          Confidence: {String(logMetadata.confidenceScore)}%
                        </span>
                      )}

                      {logMetadata.durationMs !== undefined && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px]">
                          {(Number(logMetadata.durationMs) / 1000).toFixed(2)}s
                        </span>
                      )}

                      {logMetadata.targetTable !== undefined && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px]">
                          Registry: {String(logMetadata.targetTable)}
                        </span>
                      )}

                      {logMetadata.recordId !== undefined && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] truncate max-w-[150px]">
                          ID: {String(logMetadata.recordId).slice(0, 8)}...
                        </span>
                      )}
                    </div>

                    {/* Human-in-the-loop Field Modifications Accordion */}
                    {diffItems.length > 0 && (
                      <div className="pt-2 border-t border-border/60">
                        <button
                          type="button"
                          onClick={() => toggleDiff(log.id)}
                          className="flex items-center justify-between w-full text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:underline"
                        >
                          <span className="inline-flex items-center gap-1">
                            <HugeiconsIcon icon={Edit02Icon} className="size-3" />
                            <span>{diffItems.length} Field Modification{diffItems.length > 1 ? "s" : ""} Verified by Reviewer</span>
                          </span>
                          <span className="text-[10px] font-mono">
                            {isDiffExpanded ? "Hide Details ▲" : "View Diffs ▼"}
                          </span>
                        </button>

                        {isDiffExpanded && (
                          <div className="mt-2 space-y-1.5 bg-muted/40 rounded-md p-2 border border-border/60 text-xs">
                            {diffItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 rounded bg-background/80 border border-border/40 text-[11px] space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-foreground">
                                    {item.label || item.field}
                                  </span>
                                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    {item.correctionType || "Modified"}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div className="p-1 rounded bg-rose-500/5 border border-rose-500/15">
                                    <span className="text-muted-foreground block text-[9px]">Original (AI OCR):</span>
                                    <span className="font-mono line-through text-rose-700 dark:text-rose-400">
                                      {String(item.ocrValue ?? "—")}
                                    </span>
                                  </div>
                                  <div className="p-1 rounded bg-emerald-500/5 border border-emerald-500/15">
                                    <span className="text-muted-foreground block text-[9px]">Approved Value:</span>
                                    <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400">
                                      {String(item.humanValue ?? "—")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
