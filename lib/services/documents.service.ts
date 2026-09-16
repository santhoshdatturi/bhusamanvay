import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema/documents";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import {
  type ServiceResult,
  ServiceErrorCode,
  ok,
  fail,
} from "@/lib/services/errors";
import type { DocumentRecord, DocumentStatus, DocumentType } from "@/lib/db/types";
import {
  insertDocumentSchema,
  updateDocumentSchema,
  type DocumentFilterInput,
} from "@/lib/validations/documents";
import { markFileLinked } from "@/lib/services/files.service";
import {
  parcels,
  ownerships,
  cultivations,
  mutations,
  accountHoldings,
  encumbrances,
  spatialMaps,
  propertyCards,
} from "@/lib/db/schema/canonical";
import {
  insertParcelSchema,
  insertOwnershipSchema,
  insertCultivationSchema,
  insertMutationSchema,
  insertAccountHoldingSchema,
  insertEncumbranceSchema,
  insertSpatialMapSchema,
  insertPropertyCardSchema,
} from "@/lib/validations/canonical";
import { stateEnum } from "@/lib/db/schema/enums";
import type { StructuredLandRecordExtraction } from "@/lib/validations/extractions";


export interface PaginatedDocumentsResult {
  documents: DocumentRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats: {
    total: number;
    uploaded: number;
    extracted: number;
    failed: number;
  };
}

export async function create(
  payload: typeof documents.$inferInsert
): Promise<ServiceResult<DocumentRecord>> {
  try {
    const validationResult = insertDocumentSchema.safeParse(payload);
    if (!validationResult.success) {
      return fail(
        ServiceErrorCode.VALIDATION_FAILED,
        validationResult.error.message
      );
    }

    const { data } = validationResult;
    const [document] = await db
      .insert(documents)
      .values({
        ...data,
      })
      .returning();

    if (!document) {
      return fail(ServiceErrorCode.DB_ERROR, "Failed to insert document record");
    }

    // Server-side linking: mark the file as linked to this document
    if (document.fileId) {
      await markFileLinked(document.fileId);
    }

    return ok(document);
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during document creation",
      error
    );
  }
}

export async function get(id: string): Promise<ServiceResult<DocumentRecord>> {
  try {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document) {
      return fail(ServiceErrorCode.NOT_FOUND, `Document not found with ID: ${id}`);
    }

    return ok(document);
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during document fetch",
      error
    );
  }
}

export async function list(
  filters: DocumentFilterInput = { page: 1, limit: 20 }
): Promise<ServiceResult<PaginatedDocumentsResult>> {
  try {
    const { page, limit, status, documentType, search } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (status) {
      conditions.push(eq(documents.status, status));
    }
    if (documentType) {
      conditions.push(eq(documents.documentType, documentType));
    }
    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(documents.title, term),
          ilike(documents.fileName, term),
          ilike(documents.state, term)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch paginated results
    const [records, countResult, statsResult] = await Promise.all([
      db
        .select()
        .from(documents)
        .where(whereClause)
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(whereClause),
      db
        .select({
          total: sql<number>`count(*)::int`,
          uploaded: sql<number>`count(*) filter (where ${documents.status} = 'uploaded')::int`,
          extracted: sql<number>`count(*) filter (where ${documents.status} = 'extracted')::int`,
          failed: sql<number>`count(*) filter (where ${documents.status} = 'failed')::int`,
        })
        .from(documents),
    ]);

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const stats = statsResult[0] ?? {
      total: 0,
      uploaded: 0,
      extracted: 0,
      failed: 0,
    };

    return ok({
      documents: records,
      total,
      page,
      limit,
      totalPages,
      stats,
    });
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during documents list fetch",
      error
    );
  }
}

export async function update(
  id: string,
  payload: Partial<typeof documents.$inferInsert>
): Promise<ServiceResult<DocumentRecord>> {
  try {
    const validationResult = updateDocumentSchema.safeParse(payload);
    if (!validationResult.success) {
      return fail(
        ServiceErrorCode.VALIDATION_FAILED,
        validationResult.error.message
      );
    }

    const { data } = validationResult;
    const [updated] = await db
      .update(documents)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(documents.id, id))
      .returning();

    if (!updated) {
      return fail(ServiceErrorCode.NOT_FOUND, `Document not found with ID: ${id}`);
    }

    return ok(updated);
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during document update",
      error
    );
  }
}

export async function updateStatus(
  id: string,
  status: DocumentStatus,
  metadata?: {
    documentType?: DocumentType;
    state?: string | null;
  }
): Promise<ServiceResult<DocumentRecord>> {
  try {
    const [updated] = await db
      .update(documents)
      .set({
        status,
        ...(metadata?.documentType ? { documentType: metadata.documentType } : {}),
        ...(metadata?.state !== undefined ? { state: metadata.state } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(documents.id, id))
      .returning();

    if (!updated) {
      return fail(ServiceErrorCode.NOT_FOUND, `Document not found with ID: ${id}`);
    }

    return ok(updated);
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      `Failed to update status for document ID: ${id}`,
      error
    );
  }
}

export async function remove(id: string): Promise<ServiceResult<void>> {
  try {
    const [deleted] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });

    if (!deleted) {
      return fail(ServiceErrorCode.NOT_FOUND, `Document not found with ID: ${id}`);
    }

    return ok();
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      `Failed to delete document ID: ${id}`,
      error
    );
  }
}

export async function commitToCanonicalDb(
  documentId: string,
  verifiedRecord?: unknown
): Promise<ServiceResult<{ committed: boolean; targetTable: string; recordId: string }>> {
  try {
    const docResult = await get(documentId);
    if (!docResult.success) return docResult;

    const doc = docResult.data;
    if (doc.status !== "extracted" && doc.status !== "committed") {
      return fail(
        ServiceErrorCode.VALIDATION_FAILED,
        `Document status must be 'extracted' to commit. Current status: ${doc.status}`
      );
    }

    const payload = (verifiedRecord || doc.extractedData) as Record<string, unknown> | null;
    if (!payload) {
      return fail(
        ServiceErrorCode.VALIDATION_FAILED,
        "No extracted data found to commit to database"
      );
    }

    let insertedRecordId = "";

    await db.transaction(async (tx) => {
      switch (doc.documentType) {
        case "parcel": {
          const structuredPayload = payload as unknown as StructuredLandRecordExtraction;
          const recordsList = structuredPayload.records && structuredPayload.records.length > 0 ? structuredPayload.records : [];
          if (recordsList.length > 0) {
            const locState = (doc.state || structuredPayload.location?.state?.value || "Andhra Pradesh") as typeof stateEnum.enumValues[number];
            const validState = stateEnum.enumValues.includes(locState) ? locState : stateEnum.enumValues[0];
            const dist = structuredPayload.location?.district?.value || "Unknown District";
            const subDist = structuredPayload.location?.taluk?.value || null;
            const vill = structuredPayload.location?.village?.value || "Unknown Village";

            for (const rec of recordsList) {
              const pId = rec.plotNumber || rec.surveyNumber || "Plot-1";
              const subDiv = rec.subDivision || null;
              const parsedArea = parseFloat(rec.area);
              const areaVal = !isNaN(parsedArea) ? parsedArea.toFixed(2) : "1.00";
              const areaUnitVal = rec.areaUnit || "Hectares";
              const classVal = rec.landClassification || null;

              const [inserted] = await tx
                .insert(parcels)
                .values({
                  state: validState,
                  district: dist,
                  subDistrict: subDist,
                  village: vill,
                  parcelIdType: "Survey/Plot",
                  parcelId: pId,
                  subdivision: subDiv,
                  area: areaVal,
                  areaUnit: areaUnitVal,
                  landClassification: classVal,
                })
                .returning();

              if (!insertedRecordId) insertedRecordId = inserted.id;
            }
          } else {
            const parseResult = insertParcelSchema.safeParse(payload);
            if (!parseResult.success) {
              throw new Error(`Parcel validation error: ${parseResult.error.message}`);
            }
            const [inserted] = await tx.insert(parcels).values(parseResult.data).returning();
            insertedRecordId = inserted.id;
          }
          break;
        }
        case "ownership": {
          const structuredPayload = payload as unknown as StructuredLandRecordExtraction;
          const recordsList = structuredPayload.records && structuredPayload.records.length > 0
            ? structuredPayload.records
            : structuredPayload.owners && structuredPayload.owners.length > 0
            ? structuredPayload.owners.map((o) => ({
                surveyNumber: o.surveyNumber || structuredPayload.parcelIdentifiers?.surveyNumber?.value || "",
                subDivision: o.subDivision || structuredPayload.parcelIdentifiers?.subDivision?.value || "",
                plotNumber: structuredPayload.parcelIdentifiers?.plotNumber?.value || "",
                khataNumber: o.khataNumber || structuredPayload.parcelIdentifiers?.khataNumber?.value || "",
                ownerName: o.name,
                relativeName: o.relativeName,
                relationshipType: o.relationshipType,
                address: "",
                area: structuredPayload.extent?.totalArea?.value || "",
                areaUnit: structuredPayload.extent?.areaUnit?.value || "Ha",
                natureOfPossession: o.ownershipType || "",
                landClassification: structuredPayload.extent?.landClassification?.value || "",
                remarksOrEncumbrances: "",
                share: o.share,
                confidence: o.confidence,
                evidence: o.evidence,
              }))
            : [];

          if (recordsList.length > 0) {
            const locState = (doc.state || structuredPayload.location?.state?.value || "Andhra Pradesh") as typeof stateEnum.enumValues[number];
            const validState = stateEnum.enumValues.includes(locState) ? locState : stateEnum.enumValues[0];
            const dist = structuredPayload.location?.district?.value || "Unknown District";
            const subDist = structuredPayload.location?.taluk?.value || null;
            const vill = structuredPayload.location?.village?.value || "Unknown Village";

            for (const rec of recordsList) {
              const pId = rec.plotNumber || rec.surveyNumber || "Plot-1";
              const subDiv = rec.subDivision || null;
              const parsedArea = parseFloat(rec.area);
              const areaVal = !isNaN(parsedArea) ? parsedArea.toFixed(2) : "1.00";
              const areaUnitVal = rec.areaUnit || "Hectares";
              const classVal = rec.landClassification || null;

              // Insert parcel for this record
              const [insertedParcel] = await tx
                .insert(parcels)
                .values({
                  state: validState,
                  district: dist,
                  subDistrict: subDist,
                  village: vill,
                  parcelIdType: "Survey/Plot",
                  parcelId: pId,
                  subdivision: subDiv,
                  area: areaVal,
                  areaUnit: areaUnitVal,
                  landClassification: classVal,
                })
                .returning();

              const parsedShare = parseFloat(rec.share);
              // Insert ownership linked to the parcel
              const [insertedOwnership] = await tx
                .insert(ownerships)
                .values({
                  parcelId: insertedParcel.id,
                  ownerName: rec.ownerName || "Unknown Owner",
                  ownerRelation: rec.relativeName || null,
                  ownershipShare: !isNaN(parsedShare) ? parsedShare.toFixed(2) : null,
                  khataNumber: rec.khataNumber || structuredPayload.parcelIdentifiers?.khataNumber?.value || null,
                  rights: rec.natureOfPossession || rec.remarksOrEncumbrances || null,
                })
                .returning();

              if (!insertedRecordId) {
                insertedRecordId = insertedOwnership.id;
              }
            }
          } else {
            const parseResult = insertOwnershipSchema.safeParse(payload);
            if (!parseResult.success) {
              throw new Error(`Ownership validation error: ${parseResult.error.message}`);
            }
            const [inserted] = await tx.insert(ownerships).values(parseResult.data).returning();
            insertedRecordId = inserted.id;
          }
          break;
        }
        case "cultivation": {
          const parseResult = insertCultivationSchema.safeParse(payload);
          if (!parseResult.success) {
            throw new Error(`Cultivation validation error: ${parseResult.error.message}`);
          }
          const [inserted] = await tx.insert(cultivations).values(parseResult.data).returning();
          insertedRecordId = inserted.id;
          break;
        }
        case "mutation": {
          const parseResult = insertMutationSchema.safeParse(payload);
          if (!parseResult.success) {
            throw new Error(`Mutation validation error: ${parseResult.error.message}`);
          }
          const [inserted] = await tx.insert(mutations).values(parseResult.data).returning();
          insertedRecordId = inserted.id;
          break;
        }
        case "account_holding": {
          const parseResult = insertAccountHoldingSchema.safeParse(payload);
          if (!parseResult.success) {
            throw new Error(`Account holding validation error: ${parseResult.error.message}`);
          }
          const [inserted] = await tx.insert(accountHoldings).values(parseResult.data).returning();
          insertedRecordId = inserted.id;
          break;
        }
        case "encumbrance": {
          const parseResult = insertEncumbranceSchema.safeParse(payload);
          if (!parseResult.success) {
            throw new Error(`Encumbrance validation error: ${parseResult.error.message}`);
          }
          const [inserted] = await tx.insert(encumbrances).values(parseResult.data).returning();
          insertedRecordId = inserted.id;
          break;
        }
        case "spatial_map": {
          const parseResult = insertSpatialMapSchema.safeParse(payload);
          if (!parseResult.success) {
            throw new Error(`Spatial map validation error: ${parseResult.error.message}`);
          }
          const [inserted] = await tx.insert(spatialMaps).values(parseResult.data).returning();
          insertedRecordId = inserted.id;
          break;
        }
        case "property_card": {
          const structuredPayload = payload as unknown as StructuredLandRecordExtraction;
          if (structuredPayload.parcelIdentifiers || structuredPayload.owners) {
            const pId =
              structuredPayload.parcelIdentifiers?.plotNumber?.value ||
              structuredPayload.parcelIdentifiers?.surveyNumber?.value ||
              "CTS-1";
            const owner = structuredPayload.owners?.[0];
            const ownerNameVal = owner?.name || "Unknown Holder";
            const ownerRel = owner?.relativeName
              ? `${owner.relationshipType || "Relative"}: ${owner.relativeName}`
              : null;
            const usageVal = structuredPayload.extent?.landClassification?.value || "Residential";
            const areaVal = structuredPayload.extent?.totalArea?.value || null;
            const areaUnitVal = structuredPayload.extent?.areaUnit?.value || "Sq. Mtr";
            const taxVal = structuredPayload.extent?.landRevenueTax?.value || null;
            const remarksVal = structuredPayload.remarks && structuredPayload.remarks.length > 0
              ? structuredPayload.remarks.join("; ")
              : null;

            const [inserted] = await tx
              .insert(propertyCards)
              .values({
                propertyId: pId,
                ownerName: ownerNameVal,
                ownerRelation: ownerRel,
                usage: usageVal,
                area: areaVal,
                areaUnit: areaUnitVal,
                taxAssessment: taxVal,
                remarks: remarksVal,
              })
              .returning();
            insertedRecordId = inserted.id;
          } else {
            const parseResult = insertPropertyCardSchema.safeParse(payload);
            if (!parseResult.success) {
              throw new Error(`Property card validation error: ${parseResult.error.message}`);
            }
            const [inserted] = await tx.insert(propertyCards).values(parseResult.data).returning();
            insertedRecordId = inserted.id;
          }
          break;
        }
        default:
          throw new Error(`Unsupported document type for commit: ${doc.documentType}`);
      }

      await tx
        .update(documents)
        .set({
          status: "committed",
          extractedData: payload,
          committedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(documents.id, documentId));
    });

    return ok({
      committed: true,
      targetTable: doc.documentType,
      recordId: insertedRecordId,
    });
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      error instanceof Error ? error.message : "Failed to commit canonical record to database",
      error
    );
  }
}

