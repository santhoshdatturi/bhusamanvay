import crypto from "crypto";
import { db } from "@/lib/db";
import { apiKeys } from "@/lib/db/schema/api-keys";
import { eq, desc } from "drizzle-orm";
import {
  type ServiceResult,
  ServiceErrorCode,
  ok,
  fail,
} from "@/lib/services/errors";
import { createLogger } from "@/lib/logger";
import type { ApiKeyRecord } from "@/lib/db/types";
import {
  createApiKeyInputSchema,
  insertApiKeyDbSchema,
  type CreateApiKeyInput,
  type ApiScope,
} from "@/lib/validations/api-keys";

const log = createLogger("api-keys.service");

export interface CreatedApiKeyResult {
  apiKey: ApiKeyRecord;
  secretKey: string;
}

/**
 * Generate a new API Key with cryptographically secure token.
 * Only the hashed version is stored in the database.
 * The raw secretKey is returned exactly once in the response.
 */
export async function create(
  input: CreateApiKeyInput,
  createdById?: string
): Promise<ServiceResult<CreatedApiKeyResult>> {
  try {
    const inputValidation = createApiKeyInputSchema.safeParse(input);
    if (!inputValidation.success) {
      return fail(
        ServiceErrorCode.VALIDATION_FAILED,
        inputValidation.error.message
      );
    }

    const { name, scopes, expiresInDays, allowedState } = inputValidation.data;

    // Generate high-entropy secret token
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawSecret = `bsv_live_${randomHex}`;
    const tokenPrefix = rawSecret.substring(0, 16);
    const maskedToken = `${rawSecret.substring(0, 12)}••••••••${rawSecret.slice(-4)}`;
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawSecret)
      .digest("hex");

    let expiresAt: string | undefined = undefined;
    if (expiresInDays !== "never") {
      const days = parseInt(expiresInDays, 10);
      const expDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      expiresAt = expDate.toISOString();
    }

    const dbPayload = {
      name,
      tokenPrefix,
      tokenHash,
      maskedToken,
      scopes,
      allowedState: allowedState ?? null,
      expiresAt,
      createdBy: createdById,
    };

    const payloadValidation = insertApiKeyDbSchema.safeParse(dbPayload);
    if (!payloadValidation.success) {
      return fail(
        ServiceErrorCode.VALIDATION_FAILED,
        payloadValidation.error.message
      );
    }

    const [insertedKey] = await db
      .insert(apiKeys)
      .values({
        ...payloadValidation.data,
      })
      .returning();

    if (!insertedKey) {
      return fail(ServiceErrorCode.DB_ERROR, "Failed to insert API key record");
    }

    log.info(
      { keyId: insertedKey.id, name: insertedKey.name, createdBy: createdById },
      "Generated new API Key successfully"
    );

    return ok({
      apiKey: insertedKey,
      secretKey: rawSecret,
    });
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during API key creation",
      error
    );
  }
}

/**
 * List all API Keys ordered by newest first.
 */
export async function list(): Promise<ServiceResult<ApiKeyRecord[]>> {
  try {
    const keys = await db
      .select()
      .from(apiKeys)
      .orderBy(desc(apiKeys.createdAt));

    return ok(keys);
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during API keys listing",
      error
    );
  }
}

/**
 * Fetch a single API Key by ID.
 */
export async function get(id: string): Promise<ServiceResult<ApiKeyRecord>> {
  try {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    if (!key) {
      return fail(
        ServiceErrorCode.NOT_FOUND,
        `API key not found with ID: ${id}`
      );
    }

    return ok(key);
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during API key fetch",
      error
    );
  }
}

/**
 * Revoke an API Key immediately.
 */
export async function revoke(id: string): Promise<ServiceResult<ApiKeyRecord>> {
  try {
    const [revokedKey] = await db
      .update(apiKeys)
      .set({
        revokedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(apiKeys.id, id))
      .returning();

    if (!revokedKey) {
      return fail(
        ServiceErrorCode.NOT_FOUND,
        `API key not found to revoke with ID: ${id}`
      );
    }

    log.info({ keyId: id }, "Revoked API key successfully");
    return ok(revokedKey);
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during API key revocation",
      error
    );
  }
}

/**
 * Verify a raw Bearer token against database hashes.
 *
 * Validates:
 *  - Token format and existence
 *  - Not revoked / not expired
 *  - Required scopes (admin:* bypasses)
 *  - State restriction: if the key has allowedStates and a requestState is
 *    provided, the requestState must be in allowedStates.
 */
export async function verify(
  rawToken: string,
  requiredScopes?: ApiScope[],
  requestState?: string
): Promise<ServiceResult<ApiKeyRecord>> {
  try {
    if (!rawToken || !rawToken.startsWith("bsv_live_")) {
      return fail(ServiceErrorCode.UNAUTHORIZED, "Invalid token format");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const [key] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.tokenHash, tokenHash))
      .limit(1);

    if (!key) {
      return fail(ServiceErrorCode.UNAUTHORIZED, "API token not recognized");
    }

    // Check revocation
    if (key.revokedAt) {
      return fail(ServiceErrorCode.UNAUTHORIZED, "API token has been revoked");
    }

    // Check expiration
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      return fail(ServiceErrorCode.UNAUTHORIZED, "API token has expired");
    }

    const hasFullAdmin = key.scopes.includes("admin:*");

    // Check required scopes (admin:* bypasses)
    if (requiredScopes && requiredScopes.length > 0 && !hasFullAdmin) {
      const hasAllScopes = requiredScopes.every((scope) =>
        key.scopes.includes(scope)
      );
      if (!hasAllScopes) {
        return fail(
          ServiceErrorCode.FORBIDDEN,
          "API token does not possess required scopes"
        );
      }
    }

    // Check state restriction (admin:* bypasses)
    if (
      !hasFullAdmin &&
      key.allowedState !== null &&
      key.allowedState !== undefined
    ) {
      if (!requestState) {
        return fail(
          ServiceErrorCode.FORBIDDEN,
          "This API token is restricted to a specific state. Provide a state parameter."
        );
      }
      if (key.allowedState !== requestState) {
        return fail(
          ServiceErrorCode.FORBIDDEN,
          `This API token is not authorized to access data for state: ${requestState}`
        );
      }
    }

    // Update lastUsedAt asynchronously in the background
    db.update(apiKeys)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(apiKeys.id, key.id))
      .catch((err) => {
        log.warn({ err, keyId: key.id }, "Failed to update lastUsedAt on token");
      });

    return ok(key);
  } catch (error) {
    return fail(
      ServiceErrorCode.DB_ERROR,
      "Unhandled database error during token verification",
      error
    );
  }
}
