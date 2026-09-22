"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Key01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Delete02Icon,
  Shield01Icon,
  Layers01Icon,
  MoreHorizontalIcon,
  Loading03Icon,
  Search01Icon,
  ReloadIcon,
} from "@hugeicons/core-free-icons";
import { CreateApiKeyDialog } from "./create-api-key-dialog";
import { ApiKeyCreatedModal } from "./api-key-created-modal";
import {
  revokeApiKeyAction,
  listApiKeysAction,
} from "@/lib/actions/api-keys.actions";
import { API_SCOPE_LABELS, type ApiScope } from "@/lib/validations/api-keys";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ApiKeyRecord } from "@/lib/db/types";
import type { AuthUser } from "@/lib/auth";
import type { CreatedApiKeyResult } from "@/lib/services/api-keys.service";

const API_KEY_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
  { value: "expired", label: "Expired" },
];

const API_KEY_SCOPE_OPTIONS = [
  { value: "all", label: "All Scopes" },
  ...Object.entries(API_SCOPE_LABELS).map(([scope, meta]) => ({
    value: scope,
    label: meta.label,
  })),
];

function isKeyRevoked(k: ApiKeyRecord): boolean {
  return Boolean(k.revokedAt);
}

function isKeyExpired(k: ApiKeyRecord): boolean {
  return Boolean(k.expiresAt) && new Date(k.expiresAt!) < new Date();
}

function isKeyActive(k: ApiKeyRecord): boolean {
  return !isKeyRevoked(k) && !isKeyExpired(k);
}

interface ApiKeysViewProps {
  initialKeys: ApiKeyRecord[];
  user: AuthUser;
}

export function ApiKeysView({ initialKeys, user }: ApiKeysViewProps) {
  const [keys, setKeys] = useState<ApiKeyRecord[]>(initialKeys);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreatedApiKeyResult | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdmin = user.role === "admin";

  const activeCount = keys.filter(isKeyActive).length;
  const revokedCount = keys.filter(isKeyRevoked).length;

  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      // 1. Status filter
      if (statusFilter === "active" && !isKeyActive(k)) return false;
      if (statusFilter === "revoked" && !isKeyRevoked(k)) return false;
      if (statusFilter === "expired" && !isKeyExpired(k)) return false;

      // 2. Scope filter
      if (scopeFilter !== "all" && !k.scopes?.includes(scopeFilter as ApiScope)) {
        return false;
      }

      // 3. Search filter
      const q = search.trim().toLowerCase();
      if (q) {
        const nameMatch = k.name.toLowerCase().includes(q);
        const prefixMatch =
          k.tokenPrefix.toLowerCase().includes(q) ||
          k.maskedToken.toLowerCase().includes(q);
        const scopeMatch = k.scopes?.some((s) => {
          const label = API_SCOPE_LABELS[s as ApiScope]?.label || s;
          return s.toLowerCase().includes(q) || label.toLowerCase().includes(q);
        });
        if (!nameMatch && !prefixMatch && !scopeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [keys, statusFilter, scopeFilter, search]);

  const handleCardFilter = (target: string) => {
    if (statusFilter === target) {
      setStatusFilter("all");
    } else {
      setStatusFilter(target);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await listApiKeysAction();
      if (res.success && res.data) {
        setKeys(res.data);
      }
    } catch {
      // Ignored
    } finally {
      setIsRefreshing(false);
    }
  };


  const handleCreated = (result: CreatedApiKeyResult) => {
    setKeys([result.apiKey, ...keys]);
    setCreatedResult(result);
  };

  const handleRevoke = (apiKey: ApiKeyRecord) => {
    if (revokingId) return;
    setRevokingId(apiKey.id);

    const revokePromise = async () => {
      const res = await revokeApiKeyAction(apiKey.id);
      if (!res.success) {
        throw new Error(res.error.userMessage || "Failed to revoke API key");
      }
      setKeys((prev) => prev.map((k) => (k.id === res.data.id ? res.data : k)));
      return res.data;
    };

    toast.promise(revokePromise(), {
      loading: `Revoking ${apiKey.name}…`,
      success: `${apiKey.name} revoked`,
      error: (err: Error) => err.message || "Failed to revoke API key",
      finally: () => setRevokingId(null),
    });
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "Never";
    try {
      return new Date(isoString).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const getScopeLabel = (scope: string): string => {
    const info = API_SCOPE_LABELS[scope as ApiScope];
    return info ? info.label : scope;
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            API Keys & Service Tokens
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Authenticate and authorize external Land Record Management Systems (LRMS), GIS platforms, and automated background AI extraction pipelines with granular scopes.
          </p>
        </div>

        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setCreateDialogOpen(true)}
            className="shrink-0 font-medium shadow-xs"
          >
            <HugeiconsIcon icon={Key01Icon} data-icon="inline-start" strokeWidth={2} />
            Generate New Key
          </Button>
        )}
      </div>

      {/* Role Notice for Non-Admins */}
      {!isAdmin && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground shadow-2xs">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Shield01Icon} className="size-4" strokeWidth={2} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 flex-1">
            <span>
              Signed in as <strong>Reviewer</strong>. Key generation and revocation are restricted to Administrators. You have read-only visibility into configured tokens.
            </span>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Credentials */}
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
              Total Credentials
            </span>
            <HugeiconsIcon icon={Key01Icon} className="size-4 text-muted-foreground" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            {keys.length}
          </div>
          <p className="text-xs text-muted-foreground">
            Registered service credentials
          </p>
        </Card>

        {/* Card 2: Active Tokens */}
        <Card
          onClick={() => handleCardFilter("active")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "active"
              ? "border-emerald-500/50 bg-emerald-500/[0.03] ring-1 ring-emerald-500/20"
              : "border-border/60 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Active Tokens
            </span>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-emerald-500" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            {activeCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Live and ready for API access
          </p>
        </Card>

        {/* Card 3: Revoked Tokens */}
        <Card
          onClick={() => handleCardFilter("revoked")}
          className={cn(
            "rounded-xl border p-5 flex flex-col gap-2 shadow-xs transition-all cursor-pointer select-none",
            statusFilter === "revoked"
              ? "border-rose-500/50 bg-rose-500/[0.03] ring-1 ring-rose-500/20"
              : "border-border/60 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Revoked Tokens
            </span>
            <HugeiconsIcon icon={Alert02Icon} className="size-4 text-rose-500" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            {revokedCount}
          </div>
          <p className="text-xs text-muted-foreground">
            Permanently disabled keys
          </p>
        </Card>

        {/* Card 4: Security Scopes */}
        <Card className="rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-2 shadow-xs hover:border-border transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Security Scopes
            </span>
            <HugeiconsIcon icon={Shield01Icon} className="size-4 text-muted-foreground" strokeWidth={1.8} />
          </div>
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans tabular-nums">
            7 Scopes
          </div>
          <p className="text-xs text-muted-foreground">
            Granular least-privilege policies
          </p>
        </Card>
      </div>

      {/* Table Section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Registered Credentials
            </h2>
            <p className="text-xs text-muted-foreground">
              Service accounts configured for automated LRMS, GIS, and AI workflows.
            </p>
          </div>
          {keys.length > 0 && (
            <span className="text-xs font-mono text-muted-foreground self-start sm:self-auto">
              {filteredKeys.length} of {keys.length} {keys.length === 1 ? "Key" : "Keys"}
            </span>
          )}
        </div>

        {/* Filter and Search Bar - Kept matching audit-explorer styling */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-2xs">
          <div className="flex flex-1 items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 max-w-sm min-w-[200px]">
              <HugeiconsIcon
                icon={Search01Icon}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder="Search by name, prefix, or scope..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-background"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val || "all")}
              items={API_KEY_STATUS_OPTIONS}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="min-w-[135px]">
                {API_KEY_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={scopeFilter}
              onValueChange={(val) => setScopeFilter(val || "all")}
              items={API_KEY_SCOPE_OPTIONS}
            >
              <SelectTrigger className="w-[170px] h-8 text-xs bg-background">
                <SelectValue placeholder="All Scopes" />
              </SelectTrigger>
              <SelectContent className="min-w-[180px]">
                {API_KEY_SCOPE_OPTIONS.map((opt) => (
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
              disabled={isRefreshing}
              className="gap-1 font-sans text-xs h-8 px-2.5"
            >
              <HugeiconsIcon
                icon={isRefreshing ? Loading03Icon : ReloadIcon}
                className={cn("size-3.5", isRefreshing && "animate-spin")}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
          {keys.length === 0 ? (
            <div className="py-14 px-4 text-center flex flex-col items-center justify-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/60 border border-border/70 text-muted-foreground">
                <HugeiconsIcon icon={Key01Icon} className="size-5" strokeWidth={1.8} />
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <span className="text-sm font-semibold text-foreground">
                  No API keys generated yet
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {isAdmin
                    ? "Generate your first service token to enable external Land Record systems (LRMS), GIS platforms, or Python AI extractors to interact with BhuSamanvay."
                    : "No external service credentials have been configured by administrators yet."}
                </span>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                  className="mt-2 font-medium"
                >
                  <HugeiconsIcon icon={Key01Icon} data-icon="inline-start" strokeWidth={2} />
                  Generate First Key
                </Button>
              )}
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="py-14 px-4 text-center flex flex-col items-center justify-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-muted/60 border border-border/70 text-muted-foreground">
                <HugeiconsIcon icon={Search01Icon} className="size-5" strokeWidth={1.8} />
              </div>
              <div className="flex flex-col gap-1 max-w-md">
                <span className="text-sm font-semibold text-foreground">
                  No matching credentials found
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  No API keys matched your current filter criteria ({statusFilter !== "all" ? `status: ${statusFilter}` : "all statuses"}{scopeFilter !== "all" ? `, scope: ${scopeFilter}` : ""}{search.trim() ? `, search: "${search.trim()}"` : ""}). Try resetting filters.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setScopeFilter("all");
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
                  <TableHead className="text-xs font-semibold py-3 pl-5">Service Name</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Masked Token</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Status</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Created</TableHead>
                  <TableHead className="text-xs font-semibold py-3">Last Used</TableHead>
                  {isAdmin && (
                    <TableHead className="text-xs font-semibold py-3 pr-5 text-right w-12" />
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((apiKey) => {
                  const isRevoked = Boolean(apiKey.revokedAt);
                  const isExpired =
                    Boolean(apiKey.expiresAt) &&
                    new Date(apiKey.expiresAt!) < new Date();
                  const isRevoking = revokingId === apiKey.id;

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border border-border/70 bg-muted/40 text-foreground">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3 text-muted-foreground" strokeWidth={2} />
                      Active
                    </span>
                  );

                  if (isRevoked) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400">
                        <HugeiconsIcon icon={Alert02Icon} className="size-3" strokeWidth={2} />
                        Revoked
                      </span>
                    );
                  } else if (isExpired) {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        <HugeiconsIcon icon={Alert02Icon} className="size-3" strokeWidth={2} />
                        Expired
                      </span>
                    );
                  }

                  return (
                    <TableRow key={apiKey.id} className="text-xs border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-foreground py-3.5 pl-5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground border border-border/50">
                            <HugeiconsIcon icon={Layers01Icon} className="size-3.5" strokeWidth={2} />
                          </div>
                          <span className="font-semibold text-foreground tracking-tight">
                            {apiKey.name}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground py-3.5">
                        <code className="px-2 py-1 rounded-md bg-muted/50 border border-border/50 text-foreground font-mono text-[11px]">
                          {apiKey.maskedToken}
                        </code>
                      </TableCell>

                      <TableCell className="py-3.5">{statusBadge}</TableCell>

                      <TableCell className="font-mono text-[11px] text-muted-foreground py-3.5 tabular-nums">
                        {formatDate(apiKey.createdAt)}
                      </TableCell>

                      <TableCell className="font-mono text-[11px] text-muted-foreground py-3.5 tabular-nums">
                        {formatDate(apiKey.lastUsedAt)}
                      </TableCell>

                      {isAdmin && (
                        <TableCell className="text-right py-3.5 pr-5">
                          <ApiKeyActionsMenu
                            apiKey={apiKey}
                            isRevoked={isRevoked}
                            isRevoking={isRevoking}
                            getScopeLabel={getScopeLabel}
                            onRevoke={handleRevoke}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Dialog Modals */}
      <CreateApiKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleCreated}
      />

      <ApiKeyCreatedModal
        result={createdResult}
        onClose={() => setCreatedResult(null)}
      />
    </div>
  );
}

/* ─── Actions Dropdown ─── */

interface ApiKeyActionsMenuProps {
  apiKey: ApiKeyRecord;
  isRevoked: boolean;
  isRevoking: boolean;
  getScopeLabel: (scope: string) => string;
  onRevoke: (apiKey: ApiKeyRecord) => void;
}

function ApiKeyActionsMenu({
  apiKey,
  isRevoked,
  isRevoking,
  getScopeLabel,
  onRevoke,
}: ApiKeyActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={isRevoking}
      >
        {isRevoking ? (
          <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" strokeWidth={2} />
        )}
        <span className="sr-only">Actions for {apiKey.name}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-56">
        {/* Scopes Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] text-muted-foreground font-medium">
            Scopes ({apiKey.scopes.length})
          </DropdownMenuLabel>
          <div className="px-2 py-1 flex flex-wrap gap-1">
            {apiKey.scopes.map((scope) => (
              <Badge
                key={scope}
                variant={scope === "admin:*" ? "secondary" : "outline"}
                className="text-[10px] font-mono px-1.5 py-0.5 h-5 bg-muted/80 border-border text-foreground"
              >
                {getScopeLabel(scope)}
              </Badge>
            ))}
          </div>
        </DropdownMenuGroup>

        {!isRevoked && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onRevoke(apiKey)}
                disabled={isRevoking}
                className="text-xs gap-2"
              >
                {isRevoking ? (
                  <HugeiconsIcon icon={Loading03Icon} className="size-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5" strokeWidth={2} />
                )}
                Revoke Key
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
