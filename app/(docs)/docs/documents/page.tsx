import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EndpointCard } from "@/components/docs/endpoint-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

export const metadata = {
  title: "Documents API",
  description:
    "Register land record documents, list staging records, inspect metadata, and update status.",
};

export default function DocumentsDocsPage() {
  // POST /api/documents
  const createBodyParams = [
    {
      name: "fileId",
      type: "string (UUID)",
      required: true,
      description: "UUID of the uploaded or registered raw file (fileId).",
    },
    {
      name: "title",
      type: "string",
      required: true,
      description: "Human-readable title describing the land record (e.g. Kokapet Spatial Map).",
    },
    {
      name: "fileName",
      type: "string",
      required: true,
      description: "Original filename matching the uploaded asset.",
    },
    {
      name: "documentType",
      type: "string (Enum)",
      required: true,
      description: "Document classification enum.",
      allowedValues: [
        "spatial_map",
        "property_card",
        "parcel",
        "ownership",
        "cultivation",
        "mutation",
        "account_holding",
        "encumbrance",
      ],
    },
    {
      name: "state",
      type: "string (Enum)",
      required: false,
      description: "Uppercase Indian State enum (e.g. TELANGANA, ANDHRA_PRADESH).",
    },
  ];

  const createBodyExample = `{
  "fileId": "6c442cf2-4417-4889-b05b-80074218eb85",
  "title": "Kokapet Cadastral Map 128/A",
  "fileName": "cadastral_survey_kokapet.pdf",
  "documentType": "spatial_map",
  "state": "TELANGANA"
}`;

  const createResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "True if the document registration was successful.",
    },
    {
      name: "data.id",
      type: "string (UUID)",
      description: "Generated unique document UUID.",
    },
    {
      name: "data.fileId",
      type: "string (UUID)",
      description: "Linked S3 storage file UUID.",
    },
    {
      name: "data.title",
      type: "string",
      description: "Registered document title.",
    },
    {
      name: "data.fileName",
      type: "string",
      description: "Registered filename.",
    },
    {
      name: "data.documentType",
      type: "string (Enum)",
      description: "Canonical document type category.",
    },
    {
      name: "data.status",
      type: "string (Enum)",
      description: "Initial registration status: uploaded.",
    },
    {
      name: "data.state",
      type: "string",
      description: "Assigned state jurisdiction.",
    },
    {
      name: "data.uploadedBy",
      type: "string",
      description: "Identifier of the user or API client who registered the record.",
    },
    {
      name: "data.createdAt",
      type: "string (ISO 8601)",
      description: "Creation timestamp.",
    },
    {
      name: "data.updatedAt",
      type: "string (ISO 8601)",
      description: "Last modification timestamp.",
    },
  ];

  const createResponse = `{
  "success": true,
  "data": {
    "id": "d52ef713-363e-46cf-a5dc-5e74ce9a6b12",
    "fileId": "6c442cf2-4417-4889-b05b-80074218eb85",
    "title": "Kokapet Cadastral Map 128/A",
    "fileName": "cadastral_survey_kokapet.pdf",
    "documentType": "spatial_map",
    "status": "uploaded",
    "state": "TELANGANA",
    "uploadedBy": "usr_99a812...",
    "createdAt": "2026-03-15T09:02:10.000Z",
    "updatedAt": "2026-03-15T09:02:10.000Z"
  }
}`;

  const createCurl = `curl -X POST "https://bhusamanvay.vercel.app/api/documents" \\
  -H "Authorization: Bearer bs_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileId": "6c442cf2-4417-4889-b05b-80074218eb85",
    "title": "Kokapet Cadastral Map 128/A",
    "fileName": "cadastral_survey_kokapet.pdf",
    "documentType": "spatial_map",
    "state": "TELANGANA"
  }'`;

  // GET /api/documents
  const listQueryParams = [
    {
      name: "status",
      type: "string (Enum)",
      required: false,
      description: "Filter by document processing status.",
      allowedValues: ["uploaded", "extracted", "committed", "failed"],
    },
    {
      name: "documentType",
      type: "string (Enum)",
      required: false,
      description: "Filter by document type.",
      allowedValues: [
        "spatial_map",
        "property_card",
        "parcel",
        "ownership",
        "cultivation",
        "mutation",
        "account_holding",
        "encumbrance",
      ],
    },
    {
      name: "search",
      type: "string",
      required: false,
      description: "Search term matching title or file name.",
    },
    {
      name: "page",
      type: "number",
      required: false,
      defaultValue: "1",
      description: "Page number for pagination.",
    },
    {
      name: "limit",
      type: "number",
      required: false,
      defaultValue: "20",
      description: "Number of documents per page (max 100).",
    },
  ];

  const listResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "True if query executed successfully.",
    },
    {
      name: "data.documents",
      type: "Array<DocumentRecord>",
      description: "List of document records matching the search and filter query.",
    },
    {
      name: "data.total",
      type: "number",
      description: "Total count of records matching filters across all pages.",
    },
    {
      name: "data.page",
      type: "number",
      description: "Current page number.",
    },
    {
      name: "data.limit",
      type: "number",
      description: "Current page size limit.",
    },
    {
      name: "data.totalPages",
      type: "number",
      description: "Total number of available pages.",
    },
    {
      name: "data.stats.total",
      type: "number",
      description: "Aggregate count of all documents across the organization.",
    },
    {
      name: "data.stats.uploaded",
      type: "number",
      description: "Count of documents in 'uploaded' status awaiting AI extraction.",
    },
    {
      name: "data.stats.extracted",
      type: "number",
      description: "Count of documents with completed AI extraction awaiting commit.",
    },
    {
      name: "data.stats.committed",
      type: "number",
      description: "Count of documents committed to canonical database tables.",
    },
    {
      name: "data.stats.failed",
      type: "number",
      description: "Count of documents that failed processing or OCR.",
    },
  ];

  const listResponse = `{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "d52ef713-363e-46cf-a5dc-5e74ce9a6b12",
        "title": "Kokapet Cadastral Map 128/A",
        "documentType": "spatial_map",
        "status": "extracted",
        "confidenceScore": 94,
        "state": "TELANGANA",
        "createdAt": "2026-03-15T09:02:10.000Z"
      }
    ],
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "stats": {
      "total": 42,
      "uploaded": 8,
      "extracted": 14,
      "committed": 18,
      "failed": 2
    }
  }
}`;

  const listCurl = `curl -X GET "https://bhusamanvay.vercel.app/api/documents?status=extracted&documentType=spatial_map&limit=10" \\
  -H "Authorization: Bearer bs_live_..."`;

  // GET /api/documents/[id]
  const idPathParams = [
    {
      name: "id",
      type: "string (UUID)",
      required: true,
      description: "Unique document record UUID.",
    },
  ];

  const getResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "True if document was found.",
    },
    {
      name: "data.document",
      type: "object",
      description: "Full document record including staged extractedData and confidenceScore.",
    },
    {
      name: "data.file",
      type: "object",
      description: "Linked file metadata including original size and MIME type.",
    },
    {
      name: "data.downloadUrl",
      type: "string (URL)",
      description: "Presigned S3 download URL valid for 15 minutes.",
    },
  ];

  const getResponse = `{
  "success": true,
  "data": {
    "document": {
      "id": "d52ef713-363e-46cf-a5dc-5e74ce9a6b12",
      "fileId": "6c442cf2-4417-4889-b05b-80074218eb85",
      "title": "Kokapet Cadastral Map 128/A",
      "fileName": "cadastral_survey_kokapet.pdf",
      "documentType": "spatial_map",
      "status": "extracted",
      "state": "TELANGANA",
      "extractedData": { ... },
      "confidenceScore": 94,
      "createdAt": "2026-03-15T09:02:10.000Z"
    },
    "file": {
      "id": "6c442cf2-4417-4889-b05b-80074218eb85",
      "name": "cadastral_survey_kokapet.pdf",
      "sizeBytes": 2849102,
      "mimeType": "application/pdf"
    },
    "downloadUrl": "https://storage.bhusamanvay.vercel.app/documents/6c442cf2...pdf"
  }
}`;

  const getCurl = `curl -X GET "https://bhusamanvay.vercel.app/api/documents/d52ef713-363e-46cf-a5dc-5e74ce9a6b12" \\
  -H "Authorization: Bearer bs_live_..."`;

  // PATCH /api/documents/[id]
  const patchBodyParams = [
    {
      name: "title",
      type: "string",
      required: false,
      description: "Updated document title.",
    },
    {
      name: "state",
      type: "string (Enum)",
      required: false,
      description: "Updated Indian state assignment.",
    },
  ];

  const patchBodyExample = `{
  "title": "Kokapet Village Survey 128/A (Revised)"
}`;

  const patchResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "True if metadata was successfully updated.",
    },
    {
      name: "data.id",
      type: "string (UUID)",
      description: "Document UUID.",
    },
    {
      name: "data.title",
      type: "string",
      description: "Updated title value.",
    },
    {
      name: "data.status",
      type: "string",
      description: "Current processing status.",
    },
    {
      name: "data.updatedAt",
      type: "string (ISO 8601)",
      description: "Timestamp of update.",
    },
  ];

  const patchResponse = `{
  "success": true,
  "data": {
    "id": "d52ef713-363e-46cf-a5dc-5e74ce9a6b12",
    "title": "Kokapet Village Survey 128/A (Revised)",
    "status": "extracted",
    "updatedAt": "2026-03-15T09:20:00.000Z"
  }
}`;

  const patchCurl = `curl -X PATCH "https://bhusamanvay.vercel.app/api/documents/d52ef713-363e-46cf-a5dc-5e74ce9a6b12" \\
  -H "Authorization: Bearer bs_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "title": "Kokapet Village Survey 128/A (Revised)" }'`;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
          >
            Management
          </Badge>
          <span className="text-xs text-muted-foreground">Documents API</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Documents API
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          Register new land record documents, manage extraction statuses, query staged payloads,
          and update document metadata.
        </p>
      </div>

      <Alert className="border-border/80 bg-muted/30">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-foreground" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          Document Registration Workflow
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          After obtaining a <code className="font-mono text-foreground font-semibold">fileId</code> (e.g. via direct upload or file registration),
          register the document record using <code className="font-mono text-foreground font-semibold">POST /documents</code> before
          running AI extraction.
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Endpoint 1: Register Document */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Register Document
          </h2>
          <p className="text-xs text-muted-foreground">
            Creates a document record linked to an uploaded file, ready for AI extraction.
          </p>
        </div>

        <EndpointCard
          method="POST"
          path="/documents"
          title="Register Land Record Document"
          description="Registers metadata linking fileId, documentType, and jurisdiction."
          scopeRequirement="document:upload, ingest:*, admin:*"
          bodyParams={createBodyParams}
          bodyExample={createBodyExample}
          responseParams={createResponseParams}
          responseExample={createResponse}
          responseStatus="201 Created"
          curlExample={createCurl}
        />
      </div>

      <Separator />

      {/* Endpoint 2: List Documents */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            List Documents
          </h2>
          <p className="text-xs text-muted-foreground">
            Search and filter documents by processing status, document type, and title search.
          </p>
        </div>

        <EndpointCard
          method="GET"
          path="/documents"
          title="Query Document Registry"
          description="Returns a paginated list of documents with processing statistics."
          scopeRequirement="document:upload, ingest:*, admin:*"
          queryParams={listQueryParams}
          responseParams={listResponseParams}
          responseExample={listResponse}
          responseStatus="200 OK"
          curlExample={listCurl}
        />
      </div>

      <Separator />

      {/* Endpoint 3: Get Document */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Get Document by ID
          </h2>
          <p className="text-xs text-muted-foreground">
            Retrieves full document record, linked file information, and presigned download URL.
          </p>
        </div>

        <EndpointCard
          method="GET"
          path="/documents/{id}"
          title="Fetch Document Details"
          description="Retrieves complete document metadata including staged extractedData and confidence score."
          scopeRequirement="document:upload, ingest:*, admin:*"
          pathParams={idPathParams}
          responseParams={getResponseParams}
          responseExample={getResponse}
          responseStatus="200 OK"
          curlExample={getCurl}
        />
      </div>

      <Separator />

      {/* Endpoint 4: Update Document */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Update Document Metadata
          </h2>
          <p className="text-xs text-muted-foreground">
            Updates document title, state, or manual review corrections prior to commit.
          </p>
        </div>

        <EndpointCard
          method="PATCH"
          path="/documents/{id}"
          title="Update Document"
          description="Applies partial updates to title or state attributes."
          scopeRequirement="document:upload, ingest:*, admin:*"
          pathParams={idPathParams}
          bodyParams={patchBodyParams}
          bodyExample={patchBodyExample}
          responseParams={patchResponseParams}
          responseExample={patchResponse}
          responseStatus="200 OK"
          curlExample={patchCurl}
        />
      </div>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
