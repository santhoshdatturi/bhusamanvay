"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Key01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import type { CreatedApiKeyResult } from "@/lib/services/api-keys.service";

interface ApiKeyCreatedModalProps {
  result: CreatedApiKeyResult | null;
  onClose: () => void;
}

export function ApiKeyCreatedModal({
  result,
  onClose,
}: ApiKeyCreatedModalProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.secretKey);
      setCopied(true);
      toast.success("API Key copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy API key to clipboard");
    }
  };

  return (
    <Dialog open={Boolean(result)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <HugeiconsIcon icon={Key01Icon} className="size-4" strokeWidth={2} />
            </div>
            <DialogTitle className="text-base font-semibold">
              Save Your New API Key
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Key generated for <span className="font-semibold text-foreground">{result.apiKey.name}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Warning Banner */}
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 text-xs">
          <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Copy this secret key immediately!</span>
            <span className="text-[11px] opacity-90">
              For security, this key is hashed in the database and will never be shown again once you close this dialog.
            </span>
          </div>
        </div>

        {/* Key Display Container */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">Bearer Token</span>
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
              {result.apiKey.scopes.length} Scopes
            </Badge>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30 font-mono text-xs text-foreground break-all select-all">
            <span className="flex-1 select-all">{result.secretKey}</span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={handleCopy}
              className="shrink-0"
              title="Copy to clipboard"
            >
              {copied ? (
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-3.5 text-emerald-600"
                  strokeWidth={2}
                />
              ) : (
                <HugeiconsIcon icon={Copy01Icon} className="size-3.5" strokeWidth={2} />
              )}
            </Button>
          </div>
        </div>

        {/* Usage example snippet */}
        <div className="flex flex-col gap-1.5 p-2.5 rounded-md bg-muted/20 border border-border text-[11px] font-mono text-muted-foreground">
          <span className="text-[10px] font-sans font-medium text-foreground">Header Usage:</span>
          <code className="text-foreground">
            Authorization: Bearer {result.apiKey.tokenPrefix}...
          </code>
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" size="sm" onClick={onClose} className="w-full sm:w-auto">
            I Have Copied The Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
