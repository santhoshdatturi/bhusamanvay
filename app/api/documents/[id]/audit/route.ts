import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import * as auditService from "@/lib/services/audit.service";
import { toApiResponse, fail, ServiceErrorCode } from "@/lib/services/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteParams
) {
  const authResult = await requireAuth();
  if (!authResult.success) return toApiResponse(authResult);

  const { id } = await context.params;
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) {
    return toApiResponse(
      fail(ServiceErrorCode.VALIDATION_FAILED, "Invalid document ID", parsed.error)
    );
  }

  const result = await auditService.getDocumentTimeline(parsed.data);
  return toApiResponse(result);
}
