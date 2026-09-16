import { NextRequest, NextResponse } from "next/server";
import * as apiKeysService from "@/lib/services/api-keys.service";
import * as digitizedService from "@/lib/services/digitized.service";
import { toApiResponse, fail, ServiceErrorCode } from "@/lib/services/errors";
import { docTypeSlugSchema } from "@/lib/validations/digitized";

/**
 * GET /api/digitized/[docType]/[id]
 *
 * Public API secured via Bearer token requiring `digitized:read` scope.
 * Returns a single canonical land record by UUID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docType: string; id: string }> }
): Promise<NextResponse> {
  // 1. Authenticate via Bearer token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return toApiResponse(
      fail(ServiceErrorCode.UNAUTHORIZED, "Missing or malformed Authorization header")
    );
  }
  const rawToken = authHeader.slice(7);

  // 2. Parse and validate docType slug
  const { docType: rawDocType, id } = await params;
  const docTypeParsed = docTypeSlugSchema.safeParse(rawDocType);
  if (!docTypeParsed.success) {
    return toApiResponse(
      fail(ServiceErrorCode.NOT_FOUND, `Unknown document type: ${rawDocType}`)
    );
  }
  const docType = docTypeParsed.data;

  // 3. Verify token — require digitized:read scope
  const verifyResult = await apiKeysService.verify(rawToken, ["digitized:read"]);
  if (!verifyResult.success) return toApiResponse(verifyResult);

  const apiKey = verifyResult.data;

  // 4. Fetch single record (state enforcement happens inside get())
  const result = await digitizedService.get(docType, id, apiKey.allowedState ?? null);

  if (!result.success) return toApiResponse(result);

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      meta: { docType },
    },
    { status: 200 }
  );
}
