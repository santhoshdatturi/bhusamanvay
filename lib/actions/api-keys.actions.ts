"use server";

import { requireAuth } from "@/lib/auth";
import * as apiKeysService from "@/lib/services/api-keys.service";
import {
  type ServiceResult,
  ServiceErrorCode,
  fail,
} from "@/lib/services/errors";
import type { ApiKeyRecord } from "@/lib/db/types";
import {
  createApiKeyInputSchema,
  type CreateApiKeyInput,
} from "@/lib/validations/api-keys";
import { revalidatePath } from "next/cache";

/**
 * Generate a new API key.
 * Strictly restricted to users with the 'admin' role.
 */
export async function createApiKeyAction(
  input: CreateApiKeyInput
): Promise<ServiceResult<apiKeysService.CreatedApiKeyResult>> {
  // 1. Authenticate caller
  const authResult = await requireAuth();
  if (!authResult.success) {
    return fail(authResult.error.code, authResult.error.userMessage);
  }

  const authUser = authResult.data;

  // 2. Authorize caller: ONLY admin can create API keys
  if (authUser.role !== "admin") {
    return fail(
      ServiceErrorCode.FORBIDDEN,
      "Only administrators are authorized to create API keys."
    );
  }

  // 3. Validate input
  const parsed = createApiKeyInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(ServiceErrorCode.VALIDATION_FAILED, parsed.error.message);
  }

  // 4. Invoke service
  const result = await apiKeysService.create(parsed.data, authUser.id);
  if (result.success) {
    revalidatePath("/api-keys");
  }

  return result;
}

/**
 * Revoke an existing API key.
 * Strictly restricted to users with the 'admin' role.
 */
export async function revokeApiKeyAction(
  id: string
): Promise<ServiceResult<ApiKeyRecord>> {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return fail(authResult.error.code, authResult.error.userMessage);
  }

  const authUser = authResult.data;

  if (authUser.role !== "admin") {
    return fail(
      ServiceErrorCode.FORBIDDEN,
      "Only administrators are authorized to revoke API keys."
    );
  }

  const result = await apiKeysService.revoke(id);
  if (result.success) {
    revalidatePath("/api-keys");
  }

  return result;
}

/**
 * List API keys for authenticated users.
 */
export async function listApiKeysAction(): Promise<
  ServiceResult<ApiKeyRecord[]>
> {
  const authResult = await requireAuth();
  if (!authResult.success) {
    return fail(authResult.error.code, authResult.error.userMessage);
  }

  return apiKeysService.list();
}
