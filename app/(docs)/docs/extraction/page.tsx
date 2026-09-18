import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EndpointCard } from "@/components/docs/endpoint-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

export const metadata = {
  title: "Extraction & Canonical Commit API",
  description:
    "Trigger AI spatial OCR extraction and commit verified canonical land records to the database.",
};

export default function ExtractionDocsPage() {
  // POST /api/documents/[id]/process
  const processPathParams = [
    {
      name: "id",
      type: "string (UUID)",
      required: true,
      description: "Unique UUID of the registered document in 'uploaded' status.",
    },
  ];

  const processResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "True if the AI extraction engine completed successfully.",
    },
    {
      name: "data.id",
      type: "string (UUID)",
      description: "Document identifier.",
    },
    {
      name: "data.status",
      type: "string (Enum)",
      description: "Updated document status: extracted.",
    },
    {
      name: "data.confidenceScore",
      type: "number (0-100)",
      description: "Overall AI confidence percentage in the extracted fields.",
    },
    {
      name: "data.extractedData.spatialPolygon",
      type: "GeoJSON Polygon",
      description: "Extracted coordinate ring polygon for GIS mapping.",
    },
    {
      name: "data.extractedData.surveyNumber",
      type: "string",
      description: "Extracted parcel survey number or sub-division identifier.",
    },
    {
      name: "data.extractedData.extentAcres",
      type: "number",
      description: "Total land extent parsed from document text.",
    },
    {
      name: "data.extractedData.adjacentSurveys",
      type: "object",
      description: "Dictionary of bordering survey boundaries (north, south, east, west).",
    },
    {
      name: "data.updatedAt",
      type: "string (ISO 8601)",
      description: "Timestamp when extraction finished.",
    },
  ];

  const processResponse = `{
  "success": true,
  "data": {
    "id": "d52ef713-363e-46cf-a5dc-5e74ce9a6b12",
    "fileId": "6c442cf2-4417-4889-b05b-80074218eb85",
    "title": "Kokapet Cadastral Map 128/A",
    "documentType": "spatial_map",
    "status": "extracted",
    "confidenceScore": 94,
    "extractedData": {
      "spatialPolygon": {
        "type": "Polygon",
        "coordinates": [[[78.342, 17.388], [78.351, 17.388], [78.351, 17.395], [78.342, 17.395], [78.342, 17.388]]]
      },
      "surveyNumber": "128/A",
      "extentAcres": 4.5,
      "adjacentSurveys": {
        "north": "129",
        "south": "127",
        "east": "130",
        "west": "Road"
      },
      "classification": "Wet / Irrigated"
    },
    "updatedAt": "2026-03-15T09:02:45.000Z"
  }
}`;

  const processCurl = `curl -X POST "https://bhusamanvay.vercel.app/api/documents/d52ef713-363e-46cf-a5dc-5e74ce9a6b12/process" \\
  -H "Authorization: Bearer bs_live_..."`;

  // POST /api/documents/[id]/commit
  const commitPathParams = [
    {
      name: "id",
      type: "string (UUID)",
      required: true,
      description: "UUID of the document in 'extracted' status to commit.",
    },
  ];

  const commitBodyParams = [
    {
      name: "verifiedRecord",
      type: "object",
      required: false,
      description:
        "Optional manual corrections or canonical overrides. If omitted or empty ({}), the server commits the doc.extractedData payload produced by the AI model.",
    },
  ];

  const commitBodyExample = `{
  "verifiedRecord": {
    "surveyNumber": "128/A",
    "extentAcres": 4.5,
    "notes": "Verified against revenue settlement gazette"
  }
}`;

  const commitResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "True if canonical database transaction committed successfully.",
    },
    {
      name: "data.document.id",
      type: "string (UUID)",
      description: "Document record UUID.",
    },
    {
      name: "data.document.status",
      type: "string (Enum)",
      description: "Updated terminal status: committed.",
    },
    {
      name: "data.document.committedAt",
      type: "string (ISO 8601)",
      description: "Timestamp when record was committed to the database.",
    },
    {
      name: "data.canonicalRecordId",
      type: "string (UUID)",
      description:
        "Primary key of the newly inserted canonical record (e.g. inside spatialMaps, parcels, or propertyCards). Use this UUID with the Digitized Records API.",
    },
  ];

  const commitResponse = `{
  "success": true,
  "data": {
    "document": {
      "id": "d52ef713-363e-46cf-a5dc-5e74ce9a6b12",
      "status": "committed",
      "committedAt": "2026-03-15T09:05:00.000Z",
      "updatedAt": "2026-03-15T09:05:00.000Z"
    },
    "canonicalRecordId": "a81d4576-92bf-412e-8d4b-70c32608316c"
  }
}`;

  const commitCurl = `curl -X POST "https://bhusamanvay.vercel.app/api/documents/d52ef713-363e-46cf-a5dc-5e74ce9a6b12/commit" \\
  -H "Authorization: Bearer bs_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{}'`;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
          >
            AI &amp; Canonicalization
          </Badge>
          <span className="text-xs text-muted-foreground">Extraction &amp; Commit</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Extraction &amp; Commit API
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          Trigger multimodal AI spatial OCR parsing on uploaded documents and commit verified
          records into canonical relational tables.
        </p>
      </div>

      <Alert className="border-border/80 bg-muted/30">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-foreground" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          Pipeline Context
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          These endpoints represent Stages 3 and 4 of the Digitization Pipeline. Calling{" "}
          <code className="font-mono text-foreground font-semibold">POST /documents/&#123;id&#125;/process</code> transitions
          the document from <code className="font-mono text-foreground">uploaded</code> to{" "}
          <code className="font-mono text-foreground">extracted</code>. Calling{" "}
          <code className="font-mono text-foreground font-semibold">POST /documents/&#123;id&#125;/commit</code> writes
          the final records into the database and marks the document <code className="font-mono text-foreground">committed</code>.
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Endpoint 1: Process Document */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Run Spatial AI Extraction
          </h2>
          <p className="text-xs text-muted-foreground">
            Executes Gemini vision OCR models to parse cadastral boundaries, survey numbers, parcels, and metadata.
          </p>
        </div>

        <EndpointCard
          method="POST"
          path="/documents/{id}/process"
          title="Trigger Document Extraction"
          description="Fetches raw file bytes from storage, streams to AI model, extracts structured attributes, and calculates a confidence score."
          scopeRequirement="extraction:run, ingest:*, admin:*"
          pathParams={processPathParams}
          responseParams={processResponseParams}
          responseExample={processResponse}
          responseStatus="200 OK"
          curlExample={processCurl}
        />
      </div>

      <Separator />

      {/* Endpoint 2: Commit Canonical Records */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Commit Verified Canonical Records
          </h2>
          <p className="text-xs text-muted-foreground">
            Inserts extracted attributes into production relational tables (spatialMaps, parcels, propertyCards) inside an atomic transaction.
          </p>
        </div>

        <EndpointCard
          method="POST"
          path="/documents/{id}/commit"
          title="Save Verified Extraction to Canonical DB"
          description="Commits extracted or manually verified land records into primary tables. Marks document as committed and locks the file from deletion."
          scopeRequirement="extraction:commit, ingest:*, admin:*"
          pathParams={commitPathParams}
          bodyParams={commitBodyParams}
          bodyExample={commitBodyExample}
          responseParams={commitResponseParams}
          responseExample={commitResponse}
          responseStatus="200 OK"
          curlExample={commitCurl}
        />
      </div>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
