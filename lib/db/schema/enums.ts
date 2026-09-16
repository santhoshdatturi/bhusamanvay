import { pgEnum } from "drizzle-orm/pg-core";
import { INDIAN_STATES } from "@/lib/constants/states";

export const stateEnum = pgEnum("state", INDIAN_STATES);

export const fileBucketEnum = pgEnum("file_bucket", [
  "app",
  "documents",
]);

export const fileStatusEnum = pgEnum("file_status", [
  "uploaded",
  "linked",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "reviewer",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "parcel",
  "ownership",
  "cultivation",
  "mutation",
  "account_holding",
  "encumbrance",
  "spatial_map",
  "property_card",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "uploaded",
  "extracted",
  "committed",
  "failed",
]);
