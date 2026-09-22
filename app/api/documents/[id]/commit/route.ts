import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as documentsService from "@/lib/services/documents.service";
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

  let body: unknown = undefined;
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    // optional body
  }

  const actor = {
    id: authResult.data.id,
    email: authResult.data.email,
    role: authResult.data.role,
    clientIp: request.headers.get("x-forwarded-for") ?? undefined,
  };

  const result = await documentsService.commitToCanonicalDb(id, body, actor);
  return toApiResponse(result);
}
