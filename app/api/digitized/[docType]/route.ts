import { NextRequest, NextResponse } from "next/server";
import * as apiKeysService from "@/lib/services/api-keys.service";
import * as digitizedService from "@/lib/services/digitized.service";
import { toApiResponse, fail, ServiceErrorCode } from "@/lib/services/errors";
import {
  digitizedListQuerySchema,
  docTypeSlugSchema,
} from "@/lib/validations/digitized";

/**
 * GET /api/digitized/[docType]
 *
 * Public API secured via Bearer token requiring `digitized:read` scope.
 * Returns paginated canonical land records for the requested document type.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docType: string }> }
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
  const { docType: rawDocType } = await params;
  const docTypeParsed = docTypeSlugSchema.safeParse(rawDocType);
  if (!docTypeParsed.success) {
    return toApiResponse(
      fail(ServiceErrorCode.NOT_FOUND, `Unknown document type: ${rawDocType}`)
    );
  }
  const docType = docTypeParsed.data;

  // 3. Parse query params
  const { searchParams } = new URL(request.url);
  const queryParsed = digitizedListQuerySchema.safeParse({
    state: searchParams.get("state") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  if (!queryParsed.success) {
    return toApiResponse(
      fail(ServiceErrorCode.VALIDATION_FAILED, queryParsed.error.message)
    );
  }

  // 4. Verify token — require digitized:read scope
  //    Pass requestState so verify() can check key's allowedStates early
  const verifyResult = await apiKeysService.verify(
    rawToken,
    ["digitized:read"],
    queryParsed.data.state
  );
  if (!verifyResult.success) return toApiResponse(verifyResult);

  const apiKey = verifyResult.data;

  // 5. Delegate to service (state enforcement also happens in service for data-level checks)
  const result = await digitizedService.list(
    docType,
    queryParsed.data,
    apiKey.allowedState ?? null
  );

  if (!result.success) return toApiResponse(result);

  // 6. Return paginated envelope
  return NextResponse.json(
    {
      success: true,
      data: result.data.data,
      meta: result.data.meta,
    },
    { status: 200 }
  );
}
