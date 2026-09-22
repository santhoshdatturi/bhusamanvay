import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as auditService from "@/lib/services/audit.service";
import { toApiResponse } from "@/lib/services/errors";

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
  const result = await auditService.getDocumentTimeline(id);
  return toApiResponse(result);
}
