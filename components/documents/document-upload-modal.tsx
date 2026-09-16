"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload01Icon,
  File01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { INDIAN_STATES } from "@/lib/constants/states";
import { DOCUMENT_TYPES } from "@/lib/constants/documents";

interface DocumentUploadModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function DocumentUploadModal({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  onSuccess,
  trigger,
}: DocumentUploadModalProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (externalOnOpenChange ?? (() => {})) : setInternalOpen;

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState<string>("");
  const [stateName, setStateName] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDocumentType("");
    setStateName("");
    setIsUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a document file to upload");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }
    if (!documentType) {
      toast.error("Please select a document classification type");
      return;
    }
    if (!stateName) {
      toast.error("Please select a state jurisdiction");
      return;
    }

    setIsUploading(true);
    setOpen(false);

    const uploadPromise = (async () => {
      // 1. Upload file to storage endpoint
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.error?.userMessage || "Failed to upload file to storage");
      }

      const { fileId } = uploadJson.data;

      // 2. Register document record
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId,
          title: title.trim(),
          fileName: file.name,
          documentType,
          state: stateName.trim() || null,
        }),
      });

      const docJson = await docRes.json();
      if (!docRes.ok || !docJson.success) {
        throw new Error(docJson.error?.userMessage || "Failed to create document record");
      }

      const newDoc = docJson.data;
      resetForm();
      onSuccess?.();
      router.push(`/documents/${newDoc.id}`);
      return newDoc;
    })();

    toast.promise(uploadPromise, {
      loading: `Uploading ${title.trim()}`,
      success: "Document uploaded successfully! Redirecting to workspace",
      error: (err) => (err instanceof Error ? err.message : "Upload failed"),
      finally: () => setIsUploading(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={<div>{trigger}</div>} />}
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Header with Icon Badge */}
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Upload01Icon} className="size-4" strokeWidth={2} />
              </div>
              <DialogTitle className="text-base font-semibold">
                Upload Land Record Document
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload a scanned PDF or high-resolution cadastral extract for AI digitization and parcel boundary extraction.
            </DialogDescription>
          </DialogHeader>

          {/* Form Content */}
          <div className="p-6 pt-0 space-y-4 overflow-y-auto flex-1">
            {/* File Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "cursor-pointer border-2 border-dashed rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center gap-2",
                file
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border/80 bg-muted/15 hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp,image/tiff"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-5" />
                  <span className="font-mono truncate max-w-xs">{file.name}</span>
                  <span className="text-muted-foreground font-mono">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              ) : (
                <>
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <HugeiconsIcon icon={File01Icon} className="size-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold text-primary">Click to browse</span> or drag and drop
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    PDF, PNG, JPG, or WebP (up to 25 MB)
                  </p>
                </>
              )}
            </div>

            {/* Document Title */}
            <div className="space-y-1.5">
              <Label htmlFor="doc-title" className="text-xs font-medium text-foreground">
                Document Title
              </Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Survey 103/2B RoR Devanahalli"
                required
                className="text-xs h-9 bg-card"
              />
            </div>

            {/* State / Jurisdiction Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">State Jurisdiction</Label>
              <Select value={stateName} onValueChange={(val) => setStateName(val as string)}>
                <SelectTrigger className="w-full text-xs h-9 bg-card">
                  <SelectValue placeholder="Select state jurisdiction..." />
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

            {/* Document Type Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Classification Type</Label>
              <Select
                value={documentType}
                onValueChange={(val) => setDocumentType(val as string)}
                items={DOCUMENT_TYPES}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-card">
                  <SelectValue placeholder="Select document classification type..." />
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

          {/* Dialog Footer */}
          <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!file || isUploading}
              className="min-w-[140px] font-medium text-xs shadow-xs"
            >
              {isUploading ? (
                <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" />
              ) : (
                <HugeiconsIcon icon={Upload01Icon} data-icon="inline-start" strokeWidth={2} />
              )}
              Upload Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
