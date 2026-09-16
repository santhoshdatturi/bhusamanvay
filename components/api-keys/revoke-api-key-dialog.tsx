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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { revokeApiKeyAction } from "@/lib/actions/api-keys.actions";
import { toast } from "sonner";
import type { ApiKeyRecord } from "@/lib/db/types";

interface RevokeApiKeyDialogProps {
  apiKey: ApiKeyRecord | null;
  onClose: () => void;
  onRevoked: (revokedKey: ApiKeyRecord) => void;
}

export function RevokeApiKeyDialog({
  apiKey,
  onClose,
  onRevoked,
}: RevokeApiKeyDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  if (!apiKey) return null;

  const handleRevoke = async () => {
    if (isLoading || !apiKey) return;
    setIsLoading(true);

    const revokePromise = async () => {
      const res = await revokeApiKeyAction(apiKey.id);
      if (!res.success) {
        throw new Error(res.error.userMessage || "Failed to revoke API key");
      }
      onRevoked(res.data);
      onClose();
      return res.data;
    };

    toast.promise(revokePromise(), {
      loading: `Revoking API key for ${apiKey.name}...`,
      success: `API key for ${apiKey.name} revoked successfully`,
      error: (err: Error) => err.message || "Failed to revoke API key",
      finally: () => setIsLoading(false),
    });
  };

  return (
    <Dialog open={Boolean(apiKey)} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <HugeiconsIcon icon={Alert02Icon} className="size-4" strokeWidth={2} />
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              Revoke API Key
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-0.5">
            Are you sure you want to revoke credentials for <span className="font-semibold text-foreground">{apiKey.name}</span>?
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-1">
          <HugeiconsIcon icon={Alert02Icon} className="size-4 shrink-0" strokeWidth={2} />
          <AlertTitle className="text-xs font-semibold">
            Irreversible Security Action
          </AlertTitle>
          <AlertDescription className="text-xs leading-relaxed mt-0.5">
            Any external service or automated pipeline using this token will immediately receive a <code className="font-mono text-destructive">401 Unauthorized</code> response. This credential cannot be restored.
          </AlertDescription>
        </Alert>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRevoke}
            disabled={isLoading}
            className="font-medium gap-1.5"
          >
            {isLoading && (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="size-3.5 animate-spin"
                strokeWidth={2.5}
              />
            )}
            {isLoading ? "Revoking..." : "Revoke Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
