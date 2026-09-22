import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema/audit-logs";
import { eq, and, desc, sql, ilike, or, gte, lte } from "drizzle-orm";
import {
  type ServiceResult,
  ServiceErrorCode,
  ok,
  fail,
} from "@/lib/services/errors";
import { createLogger } from "@/lib/logger";
import type { AuditLogRecord, FieldDiffItem } from "@/lib/db/types";
import {
  insertAuditLogSchema,
  auditLogFilterSchema,
  type InsertAuditLogInput,
  type AuditLogFilterInput,
} from "@/lib/validations/audit";

const log = createLogger("audit.service");

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DatabaseOrTransaction = typeof db | Transaction;

export interface PaginatedAuditLogsResult {
  logs: AuditLogRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    uploads: number;
    extractions: number;
    verifications: number;
    commits: number;
  };
}

/**
 * Record an immutable audit log entry.
 * Can participate in an existing atomic transaction by passing `txHandle`.
 */
export async function record(
  payload: InsertAuditLogInput,
  txHandle?: DatabaseOrTransaction
): Promise<ServiceResult<AuditLogRecord>> {
  try {
    const validationResult = insertAuditLogSchema.safeParse(payload);
    if (!validationResult.success) {
      log.warn({ errors: validationResult.error.format() }, "Invalid audit log payload");
      return fail(
        ServiceErrorCode.VALIDATION_FAILED,
        validationResult.error.message
      );
    }

    const client = txHandle ?? db;
    const { data } = validationResult;

    const [created] = await client
      .insert(auditLogs)
      .values({
        ...data,
      })
      .returning();

    if (!created) {
      return fail(ServiceErrorCode.DB_ERROR, "Failed to insert audit log entry");
    }

    return ok(created);
  } catch (error) {
    log.error({ err: error, payload }, "Database error recording audit log");
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during audit logging",
      error
    );
  }
}

/**
 * Fetch the complete chronological audit timeline for a specific document.
 */
export async function getDocumentTimeline(
  documentId: string
): Promise<ServiceResult<AuditLogRecord[]>> {
  try {
    const records = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.documentId, documentId))
      .orderBy(desc(auditLogs.createdAt));

    return ok(records);
  } catch (error) {
    log.error({ err: error, documentId }, "Failed to fetch document audit timeline");
    return fail(
      ServiceErrorCode.DB_ERROR,
      `Failed to retrieve audit timeline for document: ${documentId}`,
      error
    );
  }
}

/**
 * List audit logs with pagination, filtering, and summary statistics.
 */
export async function list(
  filters: AuditLogFilterInput = { page: 1, limit: 20 }
): Promise<ServiceResult<PaginatedAuditLogsResult>> {
  try {
    const parseResult = auditLogFilterSchema.safeParse(filters);
    if (!parseResult.success) {
      return fail(
        ServiceErrorCode.VALIDATION_FAILED,
        parseResult.error.message
      );
    }

    const {
      page,
      limit,
      documentId,
      resourceType,
      action,
      actorId,
      status,
      startDate,
      endDate,
      search,
    } = parseResult.data;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (documentId) {
      conditions.push(eq(auditLogs.documentId, documentId));
    }
    if (resourceType) {
      conditions.push(eq(auditLogs.resourceType, resourceType));
    }
    if (action) {
      if (action === "extraction.completed") {
        conditions.push(
          or(
            eq(auditLogs.action, "extraction.completed"),
            eq(auditLogs.action, "extraction.failed")
          )
        );
      } else {
        conditions.push(eq(auditLogs.action, action));
      }
    }
    if (actorId) {
      conditions.push(eq(auditLogs.actorId, actorId));
    }
    if (status) {
      conditions.push(eq(auditLogs.status, status));
    }
    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, startDate));
    }
    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, endDate));
    }
    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(auditLogs.action, term),
          ilike(auditLogs.actorEmail, term),
          ilike(auditLogs.resourceId, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [records, countResult, statsResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(whereClause),
      db
        .select({
          total: sql<number>`count(*)::int`,
          uploads: sql<number>`count(*) filter (where ${auditLogs.action} = 'document.uploaded')::int`,
          extractions: sql<number>`count(*) filter (where ${auditLogs.action} like 'extraction.%')::int`,
          verifications: sql<number>`count(*) filter (where ${auditLogs.action} in ('field.corrected', 'document.verified'))::int`,
          commits: sql<number>`count(*) filter (where ${auditLogs.action} = 'canonical.committed')::int`,
        })
        .from(auditLogs),
    ]);

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const stats = statsResult[0] ?? {
      total: 0,
      uploads: 0,
      extractions: 0,
      verifications: 0,
      commits: 0,
    };

    return ok({
      logs: records,
      total,
      page,
      limit,
      totalPages,
      stats,
    });
  } catch (error) {
    log.error({ err: error }, "Failed to list audit logs");
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during audit logs list fetch",
      error
    );
  }
}

/**
 * Compare two structured extraction objects or records and return a granular list of differences.
 * Identifies human corrections against AI OCR predictions for DILRMP compliance.
 */
export function computeFieldDiffs(
  originalData: unknown,
  updatedData: unknown
): FieldDiffItem[] {
  const diffs: FieldDiffItem[] = [];

  if (!originalData || !updatedData || typeof originalData !== "object" || typeof updatedData !== "object") {
    return diffs;
  }

  const origObj = originalData as Record<string, unknown>;
  const updObj = updatedData as Record<string, unknown>;

  // Helper to compare key-value pairs recursively for top-level scalar properties
  const compareScalars = (prefix: string, oVal: unknown, uVal: unknown, label?: string) => {
    if (oVal === uVal) return;
    if (oVal === undefined && uVal === undefined) return;
    if (oVal === null && uVal === "") return;
    if (oVal === "" && uVal === null) return;

    if (
      (typeof oVal === "string" || typeof oVal === "number" || typeof oVal === "boolean" || oVal === null) &&
      (typeof uVal === "string" || typeof uVal === "number" || typeof uVal === "boolean" || uVal === null)
    ) {
      if (String(oVal ?? "").trim() !== String(uVal ?? "").trim()) {
        diffs.push({
          field: prefix,
          label: label || prefix,
          ocrValue: oVal,
          humanValue: uVal,
          correctionType: oVal === null || oVal === "" ? "added" : uVal === null || uVal === "" ? "cleared" : "manual_edit",
        });
      }
    }
  };

  // Compare standard land record records array if available
  const origRecords = Array.isArray(origObj.records) ? (origObj.records as Record<string, unknown>[]) : [];
  const updRecords = Array.isArray(updObj.records) ? (updObj.records as Record<string, unknown>[]) : [];

  for (let i = 0; i < Math.max(origRecords.length, updRecords.length); i++) {
    const origItem = origRecords[i] || {};
    const updItem = updRecords[i] || {};

    compareScalars(`records[${i}].surveyNumber`, origItem.surveyNumber, updItem.surveyNumber, `Record #${i + 1} Survey Number`);
    compareScalars(`records[${i}].plotNumber`, origItem.plotNumber, updItem.plotNumber, `Record #${i + 1} Plot Number`);
    compareScalars(`records[${i}].subDivision`, origItem.subDivision, updItem.subDivision, `Record #${i + 1} Sub-Division`);
    compareScalars(`records[${i}].khataNumber`, origItem.khataNumber, updItem.khataNumber, `Record #${i + 1} Khata Number`);
    compareScalars(`records[${i}].ownerName`, origItem.ownerName, updItem.ownerName, `Record #${i + 1} Owner Name`);
    compareScalars(`records[${i}].relativeName`, origItem.relativeName, updItem.relativeName, `Record #${i + 1} Relative Name`);
    compareScalars(`records[${i}].area`, origItem.area, updItem.area, `Record #${i + 1} Area`);
    compareScalars(`records[${i}].areaUnit`, origItem.areaUnit, updItem.areaUnit, `Record #${i + 1} Area Unit`);
    compareScalars(`records[${i}].landClassification`, origItem.landClassification, updItem.landClassification, `Record #${i + 1} Land Classification`);
  }

  // Compare owners array if available
  const origOwners = Array.isArray(origObj.owners) ? (origObj.owners as Record<string, unknown>[]) : [];
  const updOwners = Array.isArray(updObj.owners) ? (updObj.owners as Record<string, unknown>[]) : [];

  for (let i = 0; i < Math.max(origOwners.length, updOwners.length); i++) {
    const oOwner = origOwners[i] || {};
    const uOwner = updOwners[i] || {};

    compareScalars(`owners[${i}].name`, oOwner.name, uOwner.name, `Owner #${i + 1} Name`);
    compareScalars(`owners[${i}].relativeName`, oOwner.relativeName, uOwner.relativeName, `Owner #${i + 1} Relation Name`);
    compareScalars(`owners[${i}].share`, oOwner.share, uOwner.share, `Owner #${i + 1} Share`);
  }

  // Compare top-level location or extent fields
  const origLoc = (origObj.location as Record<string, { value?: string }>) || {};
  const updLoc = (updObj.location as Record<string, { value?: string }>) || {};
  compareScalars("location.district", origLoc.district?.value, updLoc.district?.value, "District");
  compareScalars("location.taluk", origLoc.taluk?.value, updLoc.taluk?.value, "Taluk / Mandal");
  compareScalars("location.village", origLoc.village?.value, updLoc.village?.value, "Village");

  const origExt = (origObj.extent as Record<string, { value?: string }>) || {};
  const updExt = (updObj.extent as Record<string, { value?: string }>) || {};
  compareScalars("extent.totalArea", origExt.totalArea?.value, updExt.totalArea?.value, "Total Area");
  compareScalars("extent.areaUnit", origExt.areaUnit?.value, updExt.areaUnit?.value, "Area Unit");

  return diffs;
}
