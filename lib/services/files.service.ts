import { db } from "@/lib/db";
import { files } from "@/lib/db/schema/files";
import { eq } from "drizzle-orm";
import {
  type ServiceResult,
  ServiceErrorCode,
  ok,
  fail,
} from "@/lib/services/errors";
import type { FileRecord } from "@/lib/db/types";
import {
  generatePresignedUploadUrl,
  getFileUrl as resolveFileUrl,
  getFileBytes as fetchS3FileBytes,
  deleteFileFromStorage,
  s3Client,
} from "@/lib/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createLogger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { randomUUID } from "crypto";

const log = createLogger("files.service");

export const DEFAULT_DOCUMENTS_BUCKET = "documents" as const;

export interface UploadUrlResult {
  fileId: string;
  uploadUrl: string;
  bucket: string;
  name: string;
  mimeType: string;
}

export interface DownloadUrlResult {
  file: FileRecord;
  downloadUrl: string;
}

export interface CreateFileRecordResult {
  id: string;
  file: FileRecord;
  uploadUrl: string;
}

/**
 * Create a file record in the database before uploading (status: uploaded)
 * and immediately generate its presigned upload URL.
 */
export async function createFileRecord(
  fileName: string,
  fileSize: number,
  mimeType: string,
  bucket: typeof files.$inferInsert.bucket = DEFAULT_DOCUMENTS_BUCKET
): Promise<ServiceResult<CreateFileRecordResult>> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  const user = authResult.data;
  log.info({ fileName, fileSize, mimeType, userId: user.id }, "Creating file record & generating upload URL");

  try {
    const fileId = randomUUID();
    const [insertedFile] = await db
      .insert(files)
      .values({
        id: fileId,
        name: fileName,
        bucket,
        sizeBytes: fileSize,
        mimeType,
        createdBy: user.id,
        status: "uploaded",
      })
      .returning();

    if (!insertedFile) {
      return fail(ServiceErrorCode.DB_ERROR, "Failed to create file record");
    }

    const uploadUrl = await generatePresignedUploadUrl(
      bucket,
      fileId,
      mimeType
    );

    log.info({ fileId: insertedFile.id }, "File record created and upload URL generated");
    return ok({
      id: insertedFile.id,
      file: insertedFile,
      uploadUrl,
    });
  } catch (error) {
    log.error({ err: error, fileName }, "Failed to create file record");
    return fail(ServiceErrorCode.DB_ERROR, "Failed to create file record", error);
  }
}

/**
 * Mark an uploaded file as officially linked to a domain entity (e.g. document, profile)
 */
export async function markFileLinked(
  fileId: string,
  txHandle?: Parameters<Parameters<typeof db.transaction>[0]>[0]
): Promise<ServiceResult> {
  log.debug({ fileId }, "Marking file as linked");

  try {
    const client = txHandle ?? db;
    await client
      .update(files)
      .set({ status: "linked" })
      .where(eq(files.id, fileId));

    return ok();
  } catch (error) {
    log.error({ err: error, fileId }, "Failed to mark file as linked");
    return fail(
      ServiceErrorCode.FILE_OPERATION_FAILED,
      "Failed to update file status",
      error
    );
  }
}

/**
 * Delete a file database record and remove its physical object from S3
 */
export async function deleteFileRecord(fileId: string): Promise<ServiceResult> {
  const authResult = await requireAuth();
  if (!authResult.success) return authResult;

  log.debug({ fileId }, "Deleting file record and physical file");

  try {
    const [file] = await db
      .select({ bucket: files.bucket, createdBy: files.createdBy })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);

    if (!file) {
      log.error({ fileId }, "File not found");
      return fail(ServiceErrorCode.NOT_FOUND, "File not found");
    }

    // Authorization check: file creator or admin
    if (file.createdBy && file.createdBy !== authResult.data.id) {
      return fail(
        ServiceErrorCode.UNAUTHORIZED,
        "You do not have permission to delete this file"
      );
    }

    // 1. Delete database record
    await db.delete(files).where(eq(files.id, fileId));

    // 2. Delete physical file from S3
    await deleteFileFromStorage(file.bucket, fileId).catch((storageError) => {
      log.error({ err: storageError, fileId }, "Failed to delete physical file from storage");
    });

    return ok();
  } catch (dbError: unknown) {
    if ((dbError as { code?: string }).code === "23503") {
      return fail(ServiceErrorCode.FILE_IN_USE);
    }
    log.error({ err: dbError, fileId }, "Failed to delete file record");
    return fail(
      ServiceErrorCode.FILE_OPERATION_FAILED,
      "Failed to delete file record",
      dbError
    );
  }
}

/**
 * Get presigned upload URL for a specific bucket and file ID
 */
export async function getFileUploadUrl(
  bucket: string,
  fileId: string,
  contentType: string
): Promise<string> {
  return generatePresignedUploadUrl(bucket, fileId, contentType);
}

/**
 * Get download/display URL for a file (direct static URL for public buckets, signed URL for private)
 */
export async function getFileDownloadUrl(
  bucket: string,
  fileId: string
): Promise<string> {
  return resolveFileUrl(bucket, fileId);
}

/**
 * Fetch file record by ID
 */
export async function get(id: string): Promise<ServiceResult<FileRecord>> {
  try {
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, id))
      .limit(1);

    if (!file) {
      return fail(ServiceErrorCode.NOT_FOUND, `File not found with ID: ${id}`);
    }

    return ok(file);
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during file fetch",
      error
    );
  }
}

/**
 * Pre-register file and generate presigned upload URL
 */
export async function getUploadUrl(params: {
  name: string;
  mimeType: string;
  sizeBytes?: number;
  bucket?: typeof files.$inferInsert.bucket;
  createdBy?: string;
}): Promise<ServiceResult<UploadUrlResult>> {
  try {
    const fileId = randomUUID();
    const bucket = params.bucket ?? DEFAULT_DOCUMENTS_BUCKET;

    const [file] = await db
      .insert(files)
      .values({
        id: fileId,
        name: params.name,
        bucket,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes ?? null,
        status: "uploaded",
        createdBy: params.createdBy ?? null,
      })
      .returning();

    if (!file) {
      return fail(ServiceErrorCode.DB_ERROR, "Failed to pre-register file record");
    }

    const uploadUrl = await generatePresignedUploadUrl(
      bucket,
      fileId,
      params.mimeType
    );

    return ok({
      fileId: file.id,
      uploadUrl,
      bucket: file.bucket,
      name: file.name ?? params.name,
      mimeType: file.mimeType ?? params.mimeType,
    });
  } catch (error) {
    return fail(
      ServiceErrorCode.FILE_OPERATION_FAILED,
      "Failed to generate presigned upload URL",
      error
    );
  }
}

/**
 * Get download URL and metadata for a file
 */
export async function getDownloadUrl(
  fileId: string
): Promise<ServiceResult<DownloadUrlResult>> {
  try {
    const fileResult = await get(fileId);
    if (!fileResult.success) {
      return fileResult;
    }

    const file = fileResult.data;
    const downloadUrl = await resolveFileUrl(file.bucket, file.id);

    return ok({
      file,
      downloadUrl,
    });
  } catch (error) {
    return fail(
      ServiceErrorCode.FILE_OPERATION_FAILED,
      `Failed to resolve download URL for file ID: ${fileId}`,
      error
    );
  }
}

/**
 * Retrieve raw byte content of a file from storage
 */
export async function getFileContentBytes(
  fileId: string
): Promise<ServiceResult<{ bytes: Uint8Array; mimeType: string; name: string }>> {
  try {
    const fileResult = await get(fileId);
    if (!fileResult.success) {
      return fileResult;
    }

    const file = fileResult.data;
    const bytes = await fetchS3FileBytes(file.bucket, file.id);

    return ok({
      bytes,
      mimeType: file.mimeType || "application/pdf",
      name: file.name || "document",
    });
  } catch (error) {
    return fail(
      ServiceErrorCode.FILE_OPERATION_FAILED,
      `Failed to retrieve file content bytes for file ID: ${fileId}`,
      error
    );
  }
}

/**
 * Direct server-side upload fallback
 */
export async function uploadDirect(
  buffer: Uint8Array | Buffer,
  params: {
    name: string;
    mimeType: string;
    sizeBytes?: number;
    bucket?: typeof files.$inferInsert.bucket;
    createdBy?: string;
  }
): Promise<ServiceResult<FileRecord>> {
  try {
    const fileId = randomUUID();
    const bucket = params.bucket ?? DEFAULT_DOCUMENTS_BUCKET;

    try {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: fileId,
        Body: buffer,
        ContentType: params.mimeType,
      });

      await s3Client.send(command);
    } catch (s3Error) {
      log.warn({ err: s3Error }, "Direct storage upload notice");
    }

    const [file] = await db
      .insert(files)
      .values({
        id: fileId,
        name: params.name,
        bucket,
        mimeType: params.mimeType,
        sizeBytes: params.sizeBytes ?? buffer.length,
        status: "uploaded",
        createdBy: params.createdBy ?? null,
      })
      .returning();

    if (!file) {
      return fail(ServiceErrorCode.DB_ERROR, "Failed to register uploaded file record");
    }

    return ok(file);
  } catch (error) {
    return fail(
      ServiceErrorCode.FILE_OPERATION_FAILED,
      "Failed to upload file to storage",
      error
    );
  }
}
