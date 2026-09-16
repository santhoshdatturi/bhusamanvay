import { z } from "zod";
import { INDIAN_STATES } from "@/lib/constants/states";

// ── Document Type Slug Map ─────────────────────────────────────────────────
// Maps URL-safe slugs (used in [docType] segment) to their DB table identifiers.
// These strings are the single source of truth for routing + service resolution.

export const DOC_TYPE_SLUGS = [
  "parcels",
  "ownerships",
  "cultivations",
  "mutations",
  "account-holdings",
  "encumbrances",
  "spatial-maps",
  "property-cards",
] as const;

export type DocTypeSlug = (typeof DOC_TYPE_SLUGS)[number];

/** Human-readable labels for each doc type slug. */
export const DOC_TYPE_LABELS: Record<DocTypeSlug, string> = {
  "parcels": "Parcels (Cadastral)",
  "ownerships": "Ownerships (RoR)",
  "cultivations": "Cultivations (Adangal / Pahani)",
  "mutations": "Mutations (Transfers)",
  "account-holdings": "Account Holdings (Khata / 8A)",
  "encumbrances": "Encumbrances",
  "spatial-maps": "Spatial / Cadastral Maps",
  "property-cards": "Property Cards (Urban)",
};

/**
 * Whether each doc type has a top-level `state` column that can be filtered.
 * Mutations, ownerships, cultivations, encumbrances, spatial_maps, property_cards
 * are linked via parcel_id so state filtering goes through a join — not a direct
 * column. For v1, only parcels and account-holdings support direct state filtering.
 */
export const DOC_TYPE_HAS_STATE_COLUMN: Record<DocTypeSlug, boolean> = {
  "parcels": true,
  "ownerships": false,
  "cultivations": false,
  "mutations": false,
  "account-holdings": true,
  "encumbrances": false,
  "spatial-maps": false,
  "property-cards": false,
};

// ── Query Schemas ──────────────────────────────────────────────────────────

export const digitizedListQuerySchema = z.object({
  /** Filter by state. Enforced server-side against key's allowedStates. */
  state: z.enum(INDIAN_STATES).optional(),
  /** Filter by district (only applicable to doc types with a district column). */
  district: z.string().trim().max(100).optional(),
  /** Free-text search against owner name / parcel ID (doc-type dependent). */
  q: z.string().trim().max(200).optional(),
  /** Page number, 1-indexed. */
  page: z.coerce.number().int().min(1).default(1),
  /** Page size. Max 100. */
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type DigitizedListQuery = z.infer<typeof digitizedListQuerySchema>;

export const docTypeSlugSchema = z.enum(DOC_TYPE_SLUGS);
