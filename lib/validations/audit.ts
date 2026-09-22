import { createInsertSchema } from "drizzle-zod";
import { auditLogs } from "@/lib/db/schema/audit-logs";
import { z } from "zod";

export const fieldDiffItemSchema = z.object({
  field: z.string(),
  label: z.string().optional(),
  ocrValue: z.union([z.string(), z.number(), z.boolean()]).nullable().optional(),
  ocrConfidence: z.number().nullable().optional(),
  humanValue: z.union([z.string(), z.number(), z.boolean()]).nullable().optional(),
  correctionType: z.enum(["manual_edit", "cleared", "added"]).optional(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs, {
  documentId: z.string().uuid().nullable().optional(),
  resourceType: z.string().min(1).max(50),
  resourceId: z.string().min(1).max(100),
  action: z.string().min(1).max(80),
  status: z.enum(["success", "failure", "warning"]).default("success"),
  actorType: z.enum(["user", "system", "api_key"]),
  actorId: z.string().nullable().optional(),
  actorEmail: z.string().nullable().optional(),
  actorRole: z.string().max(50).nullable().optional(),
  clientIp: z.string().max(45).nullable().optional(),
  userAgent: z.string().nullable().optional(),
  previousState: z.record(z.string(), z.unknown()).nullable().optional(),
  newState: z.record(z.string(), z.unknown()).nullable().optional(),
  diff: z.array(fieldDiffItemSchema).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const auditLogFilterSchema = z.object({
  documentId: z.string().uuid().optional(),
  resourceType: z.string().optional(),
  action: z.string().optional(),
  actorId: z.string().optional(),
  status: z.enum(["success", "failure", "warning"]).optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type FieldDiffItemInput = z.infer<typeof fieldDiffItemSchema>;
export type InsertAuditLogInput = z.infer<typeof insertAuditLogSchema>;
export type AuditLogFilterInput = z.infer<typeof auditLogFilterSchema>;
