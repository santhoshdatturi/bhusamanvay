import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EndpointCard } from "@/components/docs/endpoint-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

export const metadata = {
  title: "Files API",
  description:
    "Endpoints for uploading, managing, and generating presigned URLs for raw land record files.",
};

export default function FilesDocsPage() {
  // POST /api/files/upload
  const uploadBodyParams = [
    {
      name: "file",
      type: "Binary File",
      required: true,
      description:
        "The raw land record file (PDF, TIFF, JPEG, PNG). Transmitted via multipart/form-data.",
    },
  ];

  const uploadHeader = [
    {
      name: "Authorization",
      type: "string",
      required: true,
      description: "Bearer token containing document:upload, ingest:*, or admin:* scope.",
    },
    {
      name: "Content-Type",
      type: "string",
      required: true,
      description: "multipart/form-data; boundary=...",
    },
  ];

  const uploadResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "Indicates whether the file was successfully stored and registered.",
    },
    {
      name: "data.fileId",
      type: "string (UUID)",
      description: "Generated unique UUID of the file. Required for Step 2 (document registration).",
    },
    {
      name: "data.file.id",
      type: "string (UUID)",
      description: "Database record identifier.",
    },
    {
      name: "data.file.name",
      type: "string",
      description: "Original filename with extension as provided by client.",
    },
    {
      name: "data.file.sizeBytes",
      type: "number",
      description: "Total size of the file in bytes.",
    },
    {
      name: "data.file.mimeType",
      type: "string",
      description: "MIME type of the uploaded object.",
    },
    {
      name: "data.file.bucket",
      type: "string",
      description: "Storage bucket name (documents or app).",
    },
    {
      name: "data.file.status",
      type: "string (Enum)",
      description: "Lifecycle status of the file.",
      allowedValues: ["uploaded", "linked"],
    },
    {
      name: "data.file.key",
      type: "string",
      description: "Unique S3 object key path inside the storage bucket.",
    },
    {
      name: "data.file.createdAt",
      type: "string (ISO 8601)",
      description: "Timestamp when the file record was created.",
    },
  ];

  const uploadResponse = `{
  "success": true,
  "data": {
    "fileId": "6c442cf2-4417-4889-b05b-80074218eb85",
    "file": {
      "id": "6c442cf2-4417-4889-b05b-80074218eb85",
      "name": "cadastral_survey_kokapet.pdf",
      "sizeBytes": 2849102,
      "mimeType": "application/pdf",
      "bucket": "documents",
      "status": "uploaded",
      "key": "documents/6c442cf2-4417-4889-b05b-80074218eb85.pdf",
      "createdAt": "2026-03-15T09:00:00.000Z"
    }
  }
}`;

  const uploadCurl = `curl -X POST "https://bhusamanvay.vercel.app/api/files/upload" \\
  -H "Authorization: Bearer bs_live_..." \\
  -F "file=@cadastral_survey_kokapet.pdf;type=application/pdf"`;

  // POST /api/files
  const createBodyParams = [
    {
      name: "name",
      type: "string",
      required: true,
      description: "Original filename with extension (e.g. spatial_map.pdf).",
    },
    {
      name: "sizeBytes",
      type: "number",
      required: true,
      description: "Non-negative integer size of the file in bytes.",
    },
    {
      name: "mimeType",
      type: "string",
      required: true,
      description: "MIME type (e.g. application/pdf, image/tiff).",
    },
    {
      name: "bucket",
      type: "string",
      required: false,
      defaultValue: "documents",
      description: "Target S3 bucket identifier.",
      allowedValues: ["documents", "app"],
    },
  ];

  const createBodyExample = `{
  "name": "settlement_register_1985.pdf",
  "sizeBytes": 4194304,
  "mimeType": "application/pdf",
  "bucket": "documents"
}`;

  const createResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "Indicates whether the file record was successfully provisioned.",
    },
    {
      name: "data.id",
      type: "string (UUID)",
      description: "Provisioned database file ID.",
    },
    {
      name: "data.name",
      type: "string",
      description: "Registered filename.",
    },
    {
      name: "data.sizeBytes",
      type: "number",
      description: "Registered byte length.",
    },
    {
      name: "data.mimeType",
      type: "string",
      description: "Registered MIME type.",
    },
    {
      name: "data.bucket",
      type: "string",
      description: "Destination S3 bucket.",
    },
    {
      name: "data.status",
      type: "string (Enum)",
      description: "Status initial value: uploaded.",
    },
    {
      name: "data.key",
      type: "string",
      description: "Assigned S3 storage key.",
    },
  ];

  const createResponse = `{
  "success": true,
  "data": {
    "id": "8f3102c1-8451-41bb-b6ae-932f912cae01",
    "name": "settlement_register_1985.pdf",
    "sizeBytes": 4194304,
    "mimeType": "application/pdf",
    "bucket": "documents",
    "status": "uploaded",
    "key": "documents/8f3102c1-8451-41bb-b6ae-932f912cae01.pdf",
    "createdAt": "2026-03-15T09:10:00.000Z"
  }
}`;

  const createCurl = `curl -X POST "https://bhusamanvay.vercel.app/api/files" \\
  -H "Authorization: Bearer bs_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "settlement_register_1985.pdf",
    "sizeBytes": 4194304,
    "mimeType": "application/pdf"
  }'`;

  // GET /api/files/[id]
  const idPathParams = [
    {
      name: "id",
      type: "string (UUID)",
      required: true,
      description: "Unique file UUID obtained from the upload step.",
    },
  ];

  const getDownloadResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "Indicates whether the presigned URL generation succeeded.",
    },
    {
      name: "data.file",
      type: "object",
      description: "Complete file metadata record.",
    },
    {
      name: "data.downloadUrl",
      type: "string (URL)",
      description: "Cryptographically signed S3 GET URL. Expires automatically after 15 minutes.",
    },
  ];

  const getDownloadResponse = `{
  "success": true,
  "data": {
    "file": {
      "id": "6c442cf2-4417-4889-b05b-80074218eb85",
      "name": "cadastral_survey_kokapet.pdf",
      "sizeBytes": 2849102,
      "mimeType": "application/pdf",
      "bucket": "documents",
      "status": "linked"
    },
    "downloadUrl": "https://storage.bhusamanvay.vercel.app/documents/6c442cf2...pdf?X-Amz-Signature=..."
  }
}`;

  const getDownloadCurl = `curl -X GET "https://bhusamanvay.vercel.app/api/files/6c442cf2-4417-4889-b05b-80074218eb85" \\
  -H "Authorization: Bearer bs_live_..."`;

  // DELETE /api/files/[id]
  const deleteResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "True if the file was deleted from S3 and database.",
    },
    {
      name: "data.id",
      type: "string (UUID)",
      description: "Deleted file record UUID.",
    },
    {
      name: "data.deleted",
      type: "boolean",
      description: "Confirmation boolean flag.",
    },
  ];

  const deleteResponse = `{
  "success": true,
  "data": {
    "id": "6c442cf2-4417-4889-b05b-80074218eb85",
    "deleted": true
  }
}`;

  const deleteCurl = `curl -X DELETE "https://bhusamanvay.vercel.app/api/files/6c442cf2-4417-4889-b05b-80074218eb85" \\
  -H "Authorization: Bearer bs_live_..."`;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
          >
            Storage Service
          </Badge>
          <span className="text-xs text-muted-foreground">Files API</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Files API
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          Direct multipart binary upload, file record registration, and temporary presigned URL
          generation for land record documents.
        </p>
      </div>

      <Alert className="border-border/80 bg-muted/30">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-foreground" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          Upload Workflow Note
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Acquiring a raw file record generates a <code className="font-mono text-foreground font-semibold">fileId</code>.
          Direct upload via <code className="font-mono text-foreground font-semibold">POST /files/upload</code> is one method
          to ingest source files; save the returned <code className="font-mono text-foreground font-semibold">fileId</code> to
          pass into the document registration endpoint.
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Endpoint 1: Upload File */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Direct File Upload
          </h2>
          <p className="text-xs text-muted-foreground">
            Upload binary files using multipart/form-data. Stores bytes in object storage and creates a database record.
          </p>
        </div>

        <EndpointCard
          method="POST"
          path="/files/upload"
          title="Upload Raw Document File"
          description="Directly uploads PDF/TIFF/JPG files into S3 and provisions an unlinked file UUID."
          scopeRequirement="document:upload, ingest:*, admin:*"
          headerParams={uploadHeader}
          bodyParams={uploadBodyParams}
          bodyType="form-data"
          responseParams={uploadResponseParams}
          responseExample={uploadResponse}
          responseStatus="201 Created"
          curlExample={uploadCurl}
        />
      </div>

      <Separator />

      {/* Endpoint 2: Register File Metadata */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Create File Record
          </h2>
          <p className="text-xs text-muted-foreground">
            Creates a file reference in the database for externally uploaded or presigned S3 objects.
          </p>
        </div>

        <EndpointCard
          method="POST"
          path="/files"
          title="Create File Record"
          description="Registers a database file record with name, byte size, and MIME type."
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

      {/* Endpoint 3: Presigned Download URL */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Get File Download URL
          </h2>
          <p className="text-xs text-muted-foreground">
            Generates a temporary, cryptographically signed S3 download URL valid for 15 minutes.
          </p>
        </div>

        <EndpointCard
          method="GET"
          path="/files/{id}"
          title="Generate Presigned URL"
          description="Retrieve file metadata and a secure presigned S3 link for document viewing."
          scopeRequirement="document:upload, ingest:*, admin:*"
          pathParams={idPathParams}
          responseParams={getDownloadResponseParams}
          responseExample={getDownloadResponse}
          responseStatus="200 OK"
          curlExample={getDownloadCurl}
        />
      </div>

      <Separator />

      {/* Endpoint 4: Delete File */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Delete File Record
          </h2>
          <p className="text-xs text-muted-foreground">
            Deletes an unlinked file from object storage and removes its database entry.
          </p>
        </div>

        <EndpointCard
          method="DELETE"
          path="/files/{id}"
          title="Delete File"
          description="Deletes a file record. If the file is linked to a committed document, the request fails with 409 Conflict."
          scopeRequirement="admin:*"
          pathParams={idPathParams}
          responseParams={deleteResponseParams}
          responseExample={deleteResponse}
          responseStatus="200 OK"
          curlExample={deleteCurl}
        />
      </div>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
