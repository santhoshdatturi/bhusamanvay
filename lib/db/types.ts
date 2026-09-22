import type {
  files,
  documents,
  users,
  sessions,
  accounts,
  verifications,
  parcels,
  ownerships,
  cultivations,
  mutations,
  accountHoldings,
  encumbrances,
  spatialMaps,
  propertyCards,
  apiKeys,
  auditLogs,
} from "./schema";
import { userRoleEnum, stateEnum } from "./schema/enums";

// ── Row types (SELECT) ─────────────────────────────────────────────────
export type UserRecord = typeof users.$inferSelect;
export type FileRecord = typeof files.$inferSelect;
export type DocumentRecord = typeof documents.$inferSelect;
export type ApiKeyRecord = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type AuditLogRecord = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type AuthUserRecord = typeof users.$inferSelect;
export type AuthSessionRecord = typeof sessions.$inferSelect;
export type AuthAccountRecord = typeof accounts.$inferSelect;
export type AuthVerificationRecord = typeof verifications.$inferSelect;

// ── Canonical Land Record Row types (SELECT) ───────────────────────────
export type ParcelRecord = typeof parcels.$inferSelect;
export type OwnershipRecord = typeof ownerships.$inferSelect;
export type CultivationRecord = typeof cultivations.$inferSelect;
export type MutationRecord = typeof mutations.$inferSelect;
export type AccountHoldingRecord = typeof accountHoldings.$inferSelect;
export type EncumbranceRecord = typeof encumbrances.$inferSelect;
export type SpatialMapRecord = typeof spatialMaps.$inferSelect;
export type PropertyCardRecord = typeof propertyCards.$inferSelect;

// ── Canonical Land Record Insert types (INSERT) ───────────────────────
export type NewParcel = typeof parcels.$inferInsert;
export type NewOwnership = typeof ownerships.$inferInsert;
export type NewCultivation = typeof cultivations.$inferInsert;
export type NewMutation = typeof mutations.$inferInsert;
export type NewAccountHolding = typeof accountHoldings.$inferInsert;
export type NewEncumbrance = typeof encumbrances.$inferInsert;
export type NewSpatialMap = typeof spatialMaps.$inferInsert;
export type NewPropertyCard = typeof propertyCards.$inferInsert;

// ── Column-level utility types ─────────────────────────────────────────
export type FileBucket = typeof files.$inferInsert["bucket"];
export type FileStatus = typeof files.$inferInsert["status"];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type State = (typeof stateEnum.enumValues)[number];
export type DocumentType = typeof documents.$inferInsert["documentType"];
export type DocumentStatus = typeof documents.$inferInsert["status"];
export type AuditLogAction =
  | "document.uploaded"
  | "extraction.started"
  | "extraction.completed"
  | "extraction.failed"
  | "field.corrected"
  | "document.verified"
  | "canonical.committed"
  | "document.deleted"
  | "api_key.created"
  | "api_key.revoked"
  | "lrms.exported";
export type AuditActorType = "user" | "system" | "api_key";
export interface FieldDiffItem {
  field: string;
  label?: string;
  ocrValue?: string | number | boolean | null;
  ocrConfidence?: number | null;
  humanValue?: string | number | boolean | null;
  correctionType?: "manual_edit" | "cleared" | "added";
}


