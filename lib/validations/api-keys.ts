import { createInsertSchema } from "drizzle-zod";
import { apiKeys } from "@/lib/db/schema/api-keys";
import { z } from "zod";

export const GRANULAR_SCOPES = [
  "documents:read",
  "documents:create",
  "documents:process",
  "documents:commit",
  "files:upload",
  "files:read",
] as const;

export const API_SCOPES = [
  ...GRANULAR_SCOPES,
  "admin:*",
] as const;

export type GranularScope = (typeof GRANULAR_SCOPES)[number];
export type ApiScope = (typeof API_SCOPES)[number];

export const API_SCOPE_LABELS: Record<
  ApiScope,
  { label: string; description: string }
> = {
  "documents:read": {
    label: "Read Documents",
    description: "Query land records, extractions, and document metadata",
  },
  "documents:create": {
    label: "Create Documents",
    description: "Register new land record documents and metadata",
  },
  "documents:process": {
    label: "Process OCR / AI",
    description: "Trigger AI extraction pipelines and update extracted fields",
  },
  "documents:commit": {
    label: "Commit Records",
    description: "Approve and commit extracted data to canonical land tables",
  },
  "files:upload": {
    label: "Upload Files",
    description: "Generate upload URLs and attach files to land documents",
  },
  "files:read": {
    label: "Read Files",
    description: "Request download and preview URLs for stored document files",
  },
  "admin:*": {
    label: "Full Access",
    description: "Administrative access across all system and domain operations",
  },
};

export const insertApiKeyDbSchema = createInsertSchema(apiKeys, {
  name: z.string().min(3, "Name must be at least 3 characters").max(64, "Name is too long"),
  tokenPrefix: z.string().min(8),
  tokenHash: z.string().min(32),
  maskedToken: z.string().min(12),
  scopes: z.array(z.enum(API_SCOPES)).min(1, "Select at least one scope"),
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
});

export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>;
