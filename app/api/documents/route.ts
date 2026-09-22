import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as documentsService from "@/lib/services/documents.service";
import { documentFilterSchema, insertDocumentSchema } from "@/lib/validations/documents";
import { toApiResponse, fail, ServiceErrorCode } from "@/lib/services/errors";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) return toApiResponse(authResult);

  const { searchParams } = new URL(request.url);
  const filterParams = {
    status: searchParams.get("status") || undefined,
    documentType: searchParams.get("documentType") || undefined,
    search: searchParams.get("search") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  };

  const parsedFilter = documentFilterSchema.safeParse(filterParams);
  if (!parsedFilter.success) {
    return toApiResponse(fail(ServiceErrorCode.VALIDATION_FAILED, parsedFilter.error.message));
  }

  const result = await documentsService.list(parsedFilter.data);
  return toApiResponse(result);
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) return toApiResponse(authResult);

  try {
    const body = await request.json();
    const payloadWithUser = {
      ...body,
      uploadedBy: authResult.data.id,
    };

    const parsed = insertDocumentSchema.safeParse(payloadWithUser);
    if (!parsed.success) {
      return toApiResponse(fail(ServiceErrorCode.VALIDATION_FAILED, parsed.error.message));
    }

    const actor = {
      id: authResult.data.id,
      email: authResult.data.email,
      role: authResult.data.role,
      clientIp: request.headers.get("x-forwarded-for") ?? undefined,
    };

    const result = await documentsService.create(parsed.data, actor);
    return toApiResponse(result, 201);
  } catch (err) {
    return toApiResponse(fail(ServiceErrorCode.VALIDATION_FAILED, "Invalid JSON request body", err));
  }
}
