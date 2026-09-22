import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as auditService from "@/lib/services/audit.service";
import { auditLogFilterSchema } from "@/lib/validations/audit";
import { toApiResponse, fail, ServiceErrorCode } from "@/lib/services/errors";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.success) return toApiResponse(authResult);

  const { searchParams } = new URL(request.url);
  const filterParams = {
    documentId: searchParams.get("documentId") || undefined,
    resourceType: searchParams.get("resourceType") || undefined,
    action: searchParams.get("action") || undefined,
    actorId: searchParams.get("actorId") || undefined,
    status: searchParams.get("status") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    search: searchParams.get("search") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  };

  const parsedFilter = auditLogFilterSchema.safeParse(filterParams);
  if (!parsedFilter.success) {
    return toApiResponse(
      fail(ServiceErrorCode.VALIDATION_FAILED, parsedFilter.error.message)
    );
  }

  const result = await auditService.list(parsedFilter.data);
  return toApiResponse(result);
}
