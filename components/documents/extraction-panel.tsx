"use client";

import { useState } from "react";
import {
  ReloadIcon,
  Alert02Icon,
  Layers01Icon,
  File01Icon,
  CheckmarkCircle02Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { INDIAN_STATES } from "@/lib/constants/states";
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from "@/lib/constants/documents";
import { FieldConfidenceBadge } from "./field-confidence-badge";
import { CanonicalExtractedFieldsView } from "./canonical-extracted-fields-view";
import { toast } from "sonner";
import type { DocumentRecord } from "@/lib/db/types";
import type { StructuredLandRecordExtraction } from "@/lib/validations/extractions";
import type { DocumentErrorDetails } from "@/lib/validations/documents";

interface ExtractionPanelProps {
  document: DocumentRecord;
  onRefresh?: () => void;
}

export function ExtractionPanel({
  document,
  onRefresh,
}: ExtractionPanelProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [selectedState, setSelectedState] = useState<string>(document.state || "");
  const [selectedDocType, setSelectedDocType] = useState<string>(document.documentType || "ownership");

  // Manage editable extraction data locally
  const [extractedData, setExtractedData] = useState<StructuredLandRecordExtraction | null>(
    (document.extractedData as StructuredLandRecordExtraction | null) || null
  );
  const [hasEdits, setHasEdits] = useState(false);
  const [prevExtractedProp, setPrevExtractedProp] = useState(document.extractedData);

  // Sync state if external document extraction data changes (e.g. after reprocess)
  if (document.extractedData !== prevExtractedProp) {
    setPrevExtractedProp(document.extractedData);
    setExtractedData((document.extractedData as StructuredLandRecordExtraction | null) || null);
    setHasEdits(false);
  }

  const status = document.status;
  const errorDetails = document.errorDetails as DocumentErrorDetails | null;
  const confidenceScore = document.confidenceScore;

  const handleDataChange = (updated: StructuredLandRecordExtraction) => {
    setExtractedData(updated);
    setHasEdits(true);
  };

  const handleClearEdits = () => {
    setExtractedData((document.extractedData as StructuredLandRecordExtraction | null) || null);
    setHasEdits(false);
    toast.info("Edits cleared. Reverted to last saved record.");
  };

  const handleSaveMetadataAndProcess = async () => {
    setIsProcessing(true);
    try {
      // 1. Update metadata if changed
      if (selectedState !== document.state || selectedDocType !== document.documentType) {
        setIsSavingMeta(true);
        const updateRes = await fetch(`/api/documents/${document.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: selectedState || null,
            documentType: selectedDocType,
          }),
        });
        const updateJson = await updateRes.json();
        setIsSavingMeta(false);

        if (!updateRes.ok || !updateJson.success) {
          toast.error(updateJson.error?.userMessage || "Failed to update document settings");
          setIsProcessing(false);
          return;
        }
      }

      // 2. Trigger process endpoint
      const res = await fetch(`/api/documents/${document.id}/process`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error?.message || json.error?.userMessage || "Extraction failed. Please try again.");
        onRefresh?.();
      } else {
        toast.success("Document digitized and extracted successfully!");
        onRefresh?.();
      }
    } catch {
      toast.error("An error occurred during document processing");
    } finally {
      setIsProcessing(false);
      setIsSavingMeta(false);
    }
  };

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      const res = await fetch(`/api/documents/${document.id}/commit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extractedData || document.extractedData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(
          json.error?.userMessage || "Unable to save record to registry. Please check the extracted fields and retry."
        );
      } else {
        toast.success("Land record verified and saved to official registry!");
        setHasEdits(false);
        setIsEditing(false);
        onRefresh?.();
      }
    } catch {
      toast.error("An error occurred while saving record to registry");
    } finally {
      setIsCommitting(false);
    }
  };

  const docTypeLabel =
    DOCUMENT_TYPES.find((t) => t.value === document.documentType)?.shortLabel ||
    DOCUMENT_TYPE_LABELS[document.documentType] ||
    document.documentType;

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card shadow-xs overflow-hidden">
      {/* Streamlined Header Bar */}
      <div className="h-11 px-3 border-b border-border bg-muted/40 shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={Layers01Icon} className="size-4 shrink-0 text-primary" />
          <h2 className="text-xs font-semibold tracking-tight text-foreground font-sans truncate">
            {docTypeLabel}
          </h2>
          {confidenceScore !== null && confidenceScore !== undefined && (status === "extracted" || status === "committed") && (
            <FieldConfidenceBadge confidence={confidenceScore} />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Edit Fields Toggle Button */}
          {(status === "extracted" || status === "committed") && (
            <Button
              type="button"
              variant={isEditing ? "secondary" : "outline"}
              size="xs"
              onClick={() => setIsEditing(!isEditing)}
              disabled={isProcessing || isCommitting}
              className="gap-1 font-sans text-xs h-7 px-2 transition-all"
              title={isEditing ? "Done editing" : "Edit extracted fields"}
            >
              <HugeiconsIcon icon={Edit02Icon} className="size-3.5" />
              <span>{isEditing ? "Done Editing" : "Edit Fields"}</span>
            </Button>
          )}

          {/* Clear Edits Button */}
          {hasEdits && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClearEdits}
              disabled={isCommitting}
              className="font-sans text-xs h-7 px-2 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              title="Clear modifications and revert to saved record"
            >
              <span>Clear</span>
            </Button>
          )}

          {(status === "extracted" || status === "failed") && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleSaveMetadataAndProcess}
              disabled={isProcessing || isCommitting || isSavingMeta}
              className="font-sans text-xs h-7 px-2 transition-all"
            >
              {isProcessing ? (
                <HugeiconsIcon
                  icon={ReloadIcon}
                  className="size-3.5 animate-spin"
                />
              ) : (
                <span className="inline-flex items-center gap-1">
                  <HugeiconsIcon icon={ReloadIcon} className="size-3.5" />
                  <span>Reprocess</span>
                </span>
              )}
            </Button>
          )}

          {(status === "extracted" || (status === "committed" && (isEditing || hasEdits))) && (
            <Button
              size="xs"
              onClick={handleCommit}
              disabled={isProcessing || isCommitting}
              className="font-sans text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
            >
              {isCommitting ? (
                <HugeiconsIcon
                  icon={ReloadIcon}
                  className="size-3.5 animate-spin"
                />
              ) : (
                <span className="inline-flex items-center gap-1">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    className="size-3.5"
                  />
                  <span>Approve & Save</span>
                </span>
              )}
            </Button>
          )}

          {status === "committed" && !isEditing && !hasEdits && (
            <span className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3" />
              <span>Registered</span>
            </span>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 font-sans">
        {/* Reviewer Edits Banner Notice */}
        {hasEdits && (
          <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300">
            <span>You have modified fields in this record.</span>
            <span className="text-[11px] font-medium text-muted-foreground">
              Click &quot;Approve &amp; Save&quot; to permanently commit.
            </span>
          </div>
        )}

        {/* State 1: Uploaded (Not yet processed) */}
        {status === "uploaded" && !isProcessing && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4 max-w-md mx-auto">
            <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <HugeiconsIcon icon={File01Icon} className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">Ready for AI Digitization</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Review document jurisdiction and classification settings, then initiate AI extraction.
              </p>
            </div>

            {/* Editable State & Document Type Controls */}
            <div className="w-full text-left bg-muted/30 border border-border/80 rounded-lg p-3.5 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">State / Jurisdiction</Label>
                <Select
                  value={selectedState}
                  onValueChange={(val) => setSelectedState(val as string)}
                >
                  <SelectTrigger className="w-full text-xs h-8 bg-card">
                    <SelectValue placeholder="Select state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state} className="text-xs">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Document Classification</Label>
                <Select
                  value={selectedDocType}
                  onValueChange={(val) => setSelectedDocType(val as string)}
                  items={DOCUMENT_TYPES}
                >
                  <SelectTrigger className="w-full text-xs h-8 bg-card">
                    <SelectValue placeholder="Select document type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-xs">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSaveMetadataAndProcess}
              disabled={isProcessing || isSavingMeta}
              className="gap-2 font-sans text-xs w-full h-9"
            >
              <HugeiconsIcon icon={Layers01Icon} className="size-3.5" />
              <span>Start Extraction</span>
            </Button>
          </div>
        )}

        {/* State 2: Processing */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
            <div className="relative size-12">
              <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
              <div className="relative size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/30">
                <HugeiconsIcon icon={ReloadIcon} className="size-6 animate-spin" />
              </div>
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-semibold text-foreground">Digitizing Land Record</h3>
              <p className="text-xs text-muted-foreground">
                Analyzing scanned record, structuring khatedar tables, and calculating field certainty scores.
              </p>
            </div>
            <div className="w-full max-w-xs space-y-1 text-left text-[11px] bg-muted/40 p-2.5 rounded-md border border-border/60">
              <div className="flex items-center gap-2 text-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Reading scanned document text...</span>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span>Classifying jurisdiction & record format...</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Extracting parcel identifiers & owners...</span>
              </div>
            </div>
          </div>
        )}

        {/* State 3: Extraction Failure */}
        {status === "failed" && !isProcessing && (() => {
          const isTechnicalString = (str?: string | null) =>
            !str ||
            str.includes("Error:") ||
            str.includes("GoogleGenerativeAI") ||
            str.includes("at ") ||
            str.includes("http") ||
            str.includes("{") ||
            str.includes("TypeError") ||
            str.includes("Bad Request");

          let displayMessage = errorDetails?.message || "Document digitization could not be completed for this file.";
          if (
            errorDetails?.cause &&
            !isTechnicalString(errorDetails.cause) &&
            (errorDetails.cause.startsWith("Jurisdiction Mismatch") ||
             displayMessage.includes("analyzing the document structure"))
          ) {
            displayMessage = errorDetails.cause;
          }

          const isJurisdictionNotice =
            displayMessage.toLowerCase().includes("jurisdiction mismatch") ||
            errorDetails?.errorType === "validation_error";

          return (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center space-y-4 max-w-md mx-auto">
              <div
                className={`size-12 rounded-full flex items-center justify-center ${
                  isJurisdictionNotice
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                }`}
              >
                <HugeiconsIcon icon={Alert02Icon} className="size-6" />
              </div>

              <div className="space-y-2 max-w-md w-full">
                <h3 className="text-sm font-semibold text-foreground">
                  {isJurisdictionNotice ? "Document Verification Notice" : "Digitization Incomplete"}
                </h3>

                <div
                  className={`text-xs p-3.5 rounded-lg border text-left space-y-1.5 ${
                    isJurisdictionNotice
                      ? "bg-amber-500/5 border-amber-500/20 text-foreground"
                      : "bg-muted/30 border-border/80 text-foreground"
                  }`}
                >
                  <p className="text-xs leading-relaxed font-medium">
                    {displayMessage}
                  </p>

                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {isJurisdictionNotice
                      ? "Please adjust the document state jurisdiction or document classification type below, then click reprocess."
                      : "You can adjust settings below and retry processing."}
                  </p>
                </div>
              </div>

              {/* Editable Settings for Reprocessing */}
              <div className="w-full text-left bg-muted/30 border border-border/80 rounded-lg p-3.5 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">State / Jurisdiction</Label>
                  <Select
                    value={selectedState}
                    onValueChange={(val) => setSelectedState(val as string)}
                  >
                    <SelectTrigger className="w-full text-xs h-8 bg-card">
                      <SelectValue placeholder="Select state..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state} className="text-xs">
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Document Classification</Label>
                  <Select
                    value={selectedDocType}
                    onValueChange={(val) => setSelectedDocType(val as string)}
                    items={DOCUMENT_TYPES}
                  >
                    <SelectTrigger className="w-full text-xs h-8 bg-card">
                      <SelectValue placeholder="Select document type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-xs">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleSaveMetadataAndProcess}
                disabled={isProcessing || isSavingMeta}
                className="gap-2 font-sans text-xs w-full h-9"
              >
                <HugeiconsIcon icon={ReloadIcon} className={`size-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                <span>{isProcessing ? "Reprocessing..." : "Save Settings & Reprocess"}</span>
              </Button>
            </div>
          );
        })()}

        {/* State 4: Extracted or Committed Successfully */}
        {(status === "extracted" || status === "committed") && !isProcessing && (
          <CanonicalExtractedFieldsView
            documentType={document.documentType}
            data={extractedData}
            isEditing={isEditing}
            onChange={handleDataChange}
          />
        )}
      </div>
    </div>
  );
}
