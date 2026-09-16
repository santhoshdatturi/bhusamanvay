import { createInsertSchema } from "drizzle-zod";
import { apiKeys } from "@/lib/db/schema/api-keys";
import { z } from "zod";
import { INDIAN_STATES } from "@/lib/constants/states";

// ── Workflow / Service Scopes ───────────────────────────────────────────────
//
// Scopes are modelled around named workflows and canonical data services,
// not around internal resource types. External callers (NIC, GIS, OCR engines)
// think in terms of what a service does, not which internal table it touches.
//
// Scope → what it grants:
//   document:upload   — Upload files and register document metadata.
//   ingest:*          — Full ingestion pipeline: upload + extract + commit.
//   digitized:read    — Read-only access to committed canonical land records.
//   extraction:run    — Trigger AI OCR extraction on existing documents.
//   extraction:commit — Approve and persist extraction results to canonical tables.
//   admin:*           — Full access; bypasses all scope checks.

export const WORKFLOW_SCOPES = [
  "document:upload",
  "ingest:*",
  "digitized:read",
  "extraction:run",
  "extraction:commit",
] as const;

export const API_SCOPES = [
  ...WORKFLOW_SCOPES,
  "admin:*",
] as const;

export type WorkflowScope = (typeof WORKFLOW_SCOPES)[number];
export type ApiScope = (typeof API_SCOPES)[number];

/** Maps each scope to a human-readable label and description for the UI. */
export const API_SCOPE_LABELS: Record<
  ApiScope,
  { label: string; description: string }
> = {
  "document:upload": {
    label: "Upload Documents",
    description:
      "Upload land record files and register document metadata. Does not trigger extraction or commit.",
  },
  "ingest:*": {
    label: "Full Ingestion Pipeline",
    description:
      "Upload files, register documents, trigger AI extraction, and save results as verified land records. For fully automated OCR pipelines.",
  },
  "digitized:read": {
    label: "Read Digitized Records",
    description:
      "Query verified and saved land records — parcels, ownerships, mutations, cultivations, encumbrances, and more.",
  },
  "extraction:run": {
    label: "Run AI Extraction",
    description:
      "Trigger OCR and AI extraction on already-uploaded documents. Does not grant upload or save access.",
  },
  "extraction:commit": {
    label: "Save Verified Extraction",
    description:
      "Approve and save AI extraction output as verified land records. Does not grant upload or extraction access.",
  },
  "admin:*": {
    label: "Full Access",
    description:
      "Administrative access across all system operations. Supersedes all other scopes.",
  },
};

/**
 * Maps scopes to the endpoint groups they are allowed to call.
 * Used for documentation and UI — enforcement happens in route handlers.
 */
export const SCOPE_ENDPOINT_MAP: Record<ApiScope, string[]> = {
  "document:upload": [
    "POST /api/files/upload-url",
    "POST /api/documents",
  ],
  "ingest:*": [
    "POST /api/files/upload-url",
    "POST /api/documents",
    "POST /api/documents/[id]/process",
    "POST /api/documents/[id]/commit",
  ],
  "digitized:read": [
    "GET /api/digitized/[docType]",
    "GET /api/digitized/[docType]/[id]",
  ],
  "extraction:run": ["POST /api/documents/[id]/process"],
  "extraction:commit": ["POST /api/documents/[id]/commit"],
  "admin:*": ["*"],
};

// ── Zod Schemas ────────────────────────────────────────────────────────────

export const insertApiKeyDbSchema = createInsertSchema(apiKeys, {
  name: z.string().min(3, "Name must be at least 3 characters").max(64, "Name is too long"),
  tokenPrefix: z.string().min(8),
  tokenHash: z.string().min(32),
  maskedToken: z.string().min(12),
  scopes: z.array(z.enum(API_SCOPES)).min(1, "Select at least one scope"),
  allowedState: z.enum(INDIAN_STATES).nullable().optional(),
});

/**
 * Client form / action input schema when generating a new API key.
 */
export const createApiKeyInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(64, "Name must not exceed 64 characters"),
  scopes: z
    .array(z.enum(API_SCOPES))
    .min(1, "Select at least one permission scope"),
  expiresInDays: z.enum(["30", "90", "365", "never"]).default("90"),
  /**
   * null = all-India access (no restriction).
   * Non-null = key is restricted to this one state only.
   */
  allowedState: z.enum(INDIAN_STATES).nullable().default(null),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>;
