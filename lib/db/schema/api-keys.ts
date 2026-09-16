import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    tokenPrefix: text("token_prefix").notNull().unique(),
    tokenHash: text("token_hash").notNull(),
    maskedToken: text("masked_token").notNull(),
    scopes: text("scopes").array().notNull(),
    allowedState: text("allowed_state"),
    expiresAt: timestamp("expires_at", { mode: "string" }),
    lastUsedAt: timestamp("last_used_at", { mode: "string" }),
    revokedAt: timestamp("revoked_at", { mode: "string" }),
    createdBy: text("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_api_keys_token_prefix").on(table.tokenPrefix),
    index("idx_api_keys_created_by").on(table.createdBy),
    index("idx_api_keys_revoked_at").on(table.revokedAt),
  ]
);
