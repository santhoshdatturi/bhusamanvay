import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as extractionsService from "@/lib/services/extractions.service";
import { toApiResponse } from "@/lib/services/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteParams
) {
  const authResult = await requireAuth();
  if (!authResult.success) return toApiResponse(authResult);

  const { id } = await context.params;
  const actor = {
    id: authResult.data.id,
    email: authResult.data.email,
    role: authResult.data.role,
    clientIp: request.headers.get("x-forwarded-for") ?? undefined,
  };

  const result = await extractionsService.processDocument(id, actor);
  return toApiResponse(result);
}
