"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  GRANULAR_SCOPES,
  API_SCOPE_LABELS,
  type ApiScope,
  type GranularScope,
} from "@/lib/validations/api-keys";
import { createApiKeyAction } from "@/lib/actions/api-keys.actions";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Key01Icon, CheckmarkCircle02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import type { CreatedApiKeyResult } from "@/lib/services/api-keys.service";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (result: CreatedApiKeyResult) => void;
}

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateApiKeyDialogProps) {
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>([
    "documents:read",
    "documents:create",
  ]);
  const [expiresInDays, setExpiresInDays] = useState<"30" | "90" | "365" | "never">("90");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFullAccess = selectedScopes.includes("admin:*");

  const handleToggleFullAccess = () => {
    if (isFullAccess) {
      setSelectedScopes(["documents:read", "documents:create"]);
    } else {
      setSelectedScopes(["admin:*"]);
    }
  };

  const toggleGranularScope = (scope: GranularScope) => {
    if (isFullAccess) return;

    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please enter a descriptive name for this API key.");
      return;
    }

    if (selectedScopes.length === 0) {
      setErrorMsg("Please select at least one permission scope.");
      return;
    }

    startTransition(async () => {
      const res = await createApiKeyAction({
        name: name.trim(),
        scopes: selectedScopes,
        expiresInDays,
      });

      if (!res.success) {
        setErrorMsg(res.error.userMessage || "Failed to create API key");
        toast.error(res.error.userMessage || "Failed to create API key");
        return;
      }

      toast.success("API key generated successfully");
      setName("");
      setSelectedScopes(["documents:read", "documents:create"]);
      setExpiresInDays("90");
      onOpenChange(false);
      onCreated(res.data);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Static Header with Padding */}
          <DialogHeader className="p-6 pb-3">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Key01Icon} className="size-4" strokeWidth={2} />
              </div>
              <DialogTitle className="text-base font-semibold">
                Generate Service API Key
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a machine-to-machine token with scoped permissions for external LRMS, GIS integrations, or automated AI pipelines.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Form Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1 flex flex-col gap-5">
            {errorMsg && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs">
                {errorMsg}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="key-name" className="text-xs font-medium">
                Client / Service Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="key-name"
                placeholder="e.g. Oxian OCR Engine, NIC-Bhulekh-Gateway"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs h-9"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                A clear label describing the calling external service or system.
              </p>
            </div>

            {/* Expiration */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-medium">Expiration Period</Label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { value: "30", label: "30 Days" },
                    { value: "90", label: "90 Days" },
                    { value: "365", label: "1 Year" },
                    { value: "never", label: "No Expiry" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setExpiresInDays(option.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      expiresInDays === option.value
                        ? "bg-foreground text-background border-foreground font-semibold"
                        : "bg-muted/30 hover:bg-muted/60 text-muted-foreground border-border/60"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scopes */}
            <div className="flex flex-col gap-3">
              <Label className="text-xs font-medium">
                Permission Scopes <span className="text-destructive">*</span>
              </Label>

              {/* 1. Full Access Option */}
              <div
                onClick={handleToggleFullAccess}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                  isFullAccess
                    ? "bg-card border-foreground/40 shadow-xs"
                    : "bg-muted/15 border-border/60 hover:bg-muted/30"
                }`}
              >
                <div
                  className={`size-4 rounded shrink-0 mt-0.5 border flex items-center justify-center transition-colors ${
                    isFullAccess
                      ? "bg-foreground border-foreground text-background"
                      : "border-muted-foreground/40 bg-background"
                  }`}
                >
                  {isFullAccess && (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="size-3"
                      strokeWidth={2.5}
                    />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      Full Access
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-mono px-1.5 py-0 h-4 border-border/40"
                    >
                      admin:*
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Administrative access across all system and domain operations. Supersedes granular scopes.
                  </span>
                </div>
              </div>

              {/* 2. Granular Scopes List */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground/80">
                    Granular Scopes
                  </span>
                  {isFullAccess && (
                    <span className="text-[11px] text-muted-foreground italic">
                      Locked — Full Access granted
                    </span>
                  )}
                </div>

                <div
                  className={`flex flex-col gap-1 border border-border/60 rounded-lg p-1.5 transition-all ${
                    isFullAccess
                      ? "opacity-35 pointer-events-none select-none bg-muted/10 cursor-not-allowed"
                      : "bg-muted/15"
                  }`}
                >
                  {GRANULAR_SCOPES.map((scope) => {
                    const info = API_SCOPE_LABELS[scope];
                    const isSelected = selectedScopes.includes(scope);
                    return (
                      <div
                        key={scope}
                        onClick={() => toggleGranularScope(scope)}
                        className={`flex items-start gap-2.5 p-2 rounded-md transition-colors text-left border ${
                          isSelected && !isFullAccess
                            ? "bg-card border-border/80 shadow-2xs"
                            : "bg-transparent border-transparent hover:bg-muted/30"
                        } ${isFullAccess ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div
                          className={`size-4 rounded shrink-0 mt-0.5 border flex items-center justify-center transition-colors ${
                            isSelected && !isFullAccess
                              ? "bg-foreground border-foreground text-background"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isSelected && !isFullAccess && (
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              className="size-3"
                              strokeWidth={2.5}
                            />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">
                              {info.label}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono px-1.5 py-0 h-4 border-border/60 text-muted-foreground"
                            >
                              {scope}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                            {info.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Static Footer Pinned Outside the Scroll Container */}
          <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/20 flex flex-row items-center justify-end gap-3 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="min-w-[110px]">
              {isPending ? (
                <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" strokeWidth={2.5} />
              ) : (
                <>
                  <HugeiconsIcon icon={Key01Icon} data-icon="inline-start" strokeWidth={2} />
                  Generate Key
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
