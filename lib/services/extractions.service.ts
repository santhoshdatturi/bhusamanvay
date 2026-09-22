import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema/documents";
import { eq } from "drizzle-orm";
import {
  type ServiceResult,
  ServiceErrorCode,
  ok,
  fail,
} from "@/lib/services/errors";
import type { DocumentRecord } from "@/lib/db/types";
import * as documentsService from "@/lib/services/documents.service";
import * as filesService from "@/lib/services/files.service";
import * as extractionEngineService from "@/lib/services/extraction-engine.service";
import { type DocumentErrorDetails } from "@/lib/validations/documents";
import { createLogger } from "@/lib/logger";
import * as auditService from "@/lib/services/audit.service";

const log = createLogger("extractions.service");

export async function processDocument(
  documentId: string,
  actor?: { id?: string; email?: string; role?: string; clientIp?: string }
): Promise<ServiceResult<DocumentRecord>> {
  const modelName = process.env.EXTRACTION_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const startTime = Date.now();

  try {
    // 1. Fetch document record
    const docResult = await documentsService.get(documentId);
    if (!docResult.success) {
      return docResult;
    }
    const document = docResult.data;

    // Record extraction start audit log
    await auditService.record({
      resourceType: "document",
      resourceId: documentId,
      documentId,
      action: "extraction.started",
      status: "success",
      actorType: actor?.id ? "user" : "system",
      actorId: actor?.id || "system-gemini",
      actorEmail: actor?.email,
      actorRole: actor?.role || "system",
      clientIp: actor?.clientIp,
      metadata: {
        modelName,
        fileName: document.fileName,
        selectedState: document.state,
      },
    });

    // 2. Obtain file bytes from storage
    const fileBytesResult = await filesService.getFileContentBytes(document.fileId);
    if (!fileBytesResult.success) {
      log.error({ fileId: document.fileId }, "Could not fetch document file content from storage");

      const structuredError: DocumentErrorDetails = {
        errorType: "file_read_error",
        message: "Could not read document file from storage. Please verify that the uploaded file exists and is accessible.",
        cause: fileBytesResult.error.message,
        timestamp: new Date().toISOString(),
      };

      const [failedDoc] = await db
        .update(documents)
        .set({
          status: "failed",
          errorDetails: structuredError,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(documents.id, documentId))
        .returning();

      await auditService.record({
        resourceType: "document",
        resourceId: documentId,
        documentId,
        action: "extraction.completed",
        status: "failure",
        actorType: "system",
        actorId: "system-gemini",
        actorRole: "system",
        metadata: {
          modelName,
          errorType: structuredError.errorType,
          errorMessage: structuredError.message,
          cause: structuredError.cause,
        },
      });

      return fail(
        ServiceErrorCode.FILE_OPERATION_FAILED,
        fileBytesResult.error.message,
        failedDoc
      );
    }

    const { bytes: fileBytes, mimeType } = fileBytesResult.data;

    // 4. Run structured land record extraction
    const extractionResult = await extractionEngineService.extractLandRecordFromDocument({
      fileBytes,
      mimeType,
      fileName: document.fileName,
      selectedState: document.state,
      modelName,
    });

    if (!extractionResult.success) {
      log.error({ err: extractionResult.error, documentId }, "Document extraction failed");

      // Check if this failure represents a domain/validation issue (e.g. Jurisdiction Mismatch, unreadable file)
      const isDomainError =
        extractionResult.error.code === ServiceErrorCode.VALIDATION_FAILED ||
        extractionResult.error.message.startsWith("Jurisdiction Mismatch");

      const userFacingMessage = isDomainError
        ? extractionResult.error.message
        : "Document digitization could not be completed for this file. Please ensure the scan is clear and try again.";

      const structuredError: DocumentErrorDetails = {
        errorType: isDomainError ? "validation_error" : "extraction_failed",
        message: userFacingMessage,
        timestamp: new Date().toISOString(),
      };

      await db
        .update(documents)
        .set({
          status: "failed",
          errorDetails: structuredError,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(documents.id, documentId));

      await auditService.record({
        resourceType: "document",
        resourceId: documentId,
        documentId,
        action: "extraction.completed",
        status: "failure",
        actorType: "system",
        actorId: "system-gemini",
        actorRole: "system",
        metadata: {
          modelName,
          errorType: structuredError.errorType,
          errorMessage: structuredError.message,
        },
      });

      return extractionResult;
    }

    const { data: structuredData } = extractionResult.data;

    // 5. Update document directly with raw extracted JSON and confidence score
    const [updatedDoc] = await db
      .update(documents)
      .set({
        status: "extracted",
        documentType: structuredData.documentClassification.documentType || document.documentType,
        state: structuredData.documentClassification.state || document.state,
        extractedData: structuredData,
        confidenceScore: Math.round(structuredData.overallConfidence),
        errorDetails: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(documents.id, documentId))
      .returning();

    const durationMs = Date.now() - startTime;

    // Record extraction completed audit log
    await auditService.record({
      resourceType: "document",
      resourceId: documentId,
      documentId,
      action: "extraction.completed",
      status: "success",
      actorType: "system",
      actorId: "system-gemini",
      actorRole: "system",
      metadata: {
        modelName,
        durationMs,
        confidenceScore: Math.round(structuredData.overallConfidence),
        detectedState: structuredData.documentClassification.state || document.state,
        documentType: structuredData.documentClassification.documentType || document.documentType,
        recordsCount: structuredData.records?.length || 0,
        ownersCount: structuredData.owners?.length || 0,
      },
    });

    return ok(updatedDoc);
  } catch (error) {
    log.error({ err: error, documentId }, "Document processing error");

    const structuredError: DocumentErrorDetails = {
      errorType: "unknown_error",
      message: "An unexpected error occurred while processing the document. Please try again or upload a clearer scan.",
      timestamp: new Date().toISOString(),
    };

    try {
      await db
        .update(documents)
        .set({
          status: "failed",
          errorDetails: structuredError,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(documents.id, documentId));

      await auditService.record({
        resourceType: "document",
        resourceId: documentId,
        documentId,
        action: "extraction.completed",
        status: "failure",
        actorType: "system",
        actorId: "system-gemini",
        actorRole: "system",
        metadata: {
          modelName,
          errorType: structuredError.errorType,
          errorMessage: structuredError.message,
        },
      });
    } catch (cleanupError) {
      log.error({ cleanupError }, "Failed to update failure state for document");
    }

    return fail(
      ServiceErrorCode.AI_SERVICE_ERROR,
      "An unexpected error occurred while processing the document.",
      error
    );
  }
}
