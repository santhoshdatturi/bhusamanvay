import { pgTable, text, timestamp, uuid, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { documents } from "./documents";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceType: varchar("resource_type", { length: 50 }).notNull(),
    resourceId: varchar("resource_id", { length: 100 }).notNull(),
    documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
    action: varchar("action", { length: 80 }).notNull(),
    status: varchar("status", { length: 20 }).default("success").notNull(),
    actorType: varchar("actor_type", { length: 20 }).notNull(),
    actorId: text("actor_id"),
    actorEmail: text("actor_email"),
    actorRole: varchar("actor_role", { length: 50 }),
    clientIp: varchar("client_ip", { length: 45 }),
    userAgent: text("user_agent"),
    previousState: jsonb("previous_state"),
    newState: jsonb("new_state"),
    diff: jsonb("diff"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_doc_id").on(table.documentId),
    index("idx_audit_resource").on(table.resourceType, table.resourceId),
    index("idx_audit_actor").on(table.actorType, table.actorId),
    index("idx_audit_action").on(table.action),
    index("idx_audit_created_at").on(table.createdAt),
  ]
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  document: one(documents, {
    fields: [auditLogs.documentId],
    references: [documents.id],
  }),
}));
