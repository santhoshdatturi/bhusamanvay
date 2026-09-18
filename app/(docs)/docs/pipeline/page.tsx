import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/docs/code-block";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  File01Icon,
  Layers01Icon,
  Database01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

export const metadata = {
  title: "Digitization Pipeline Architecture",
  description:
    "End-to-end ingestion and digitization lifecycle from raw file upload to canonical database commit.",
};

export default function DigitizationPipelinePage() {
  const step1Curl = `# Step 1: Upload raw PDF or map scan via multipart form-data
curl -X POST "https://bhusamanvay.vercel.app/api/files/upload" \\
  -H "Authorization: Bearer bs_live_..." \\
  -F "file=@village_spatial_map.pdf;type=application/pdf"`;

  const step1Response = `{
  "success": true,
  "data": {
    "fileId": "6c442cf2-4417-4889-b05b-80074218eb85",
    "file": {
      "id": "6c442cf2-4417-4889-b05b-80074218eb85",
      "name": "village_spatial_map.pdf",
      "sizeBytes": 2849102,
      "mimeType": "application/pdf",
      "bucket": "documents",
      "status": "uploaded",
      "key": "documents/6c442cf2-4417-4889-b05b-80074218eb85.pdf",
      "createdAt": "2026-03-15T09:00:00.000Z"
    }
  }
}`;

  const step2Curl = `# Step 2: Register document metadata using the fileId from Step 1
curl -X POST "https://bhusamanvay.vercel.app/api/documents" \\
  -H "Authorization: Bearer bs_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileId": "6c442cf2-4417-4889-b05b-80074218eb85",
    "title": "Kokapet Village Cadastral Map",
    "fileName": "village_spatial_map.pdf",
    "documentType": "spatial_map",
    "state": "TELANGANA"
  }'`;

  const step2Response = `{
  "success": true,
  "data": {
    "id": "d52ef713-363e-46cf-a5dc-5e74ce9a6b12",
    "fileId": "6c442cf2-4417-4889-b05b-80074218eb85",
    "title": "Kokapet Village Cadastral Map",
    "fileName": "village_spatial_map.pdf",
    "documentType": "spatial_map",
    "status": "uploaded",
    "state": "TELANGANA",
    "uploadedBy": "usr_99a812...",
    "createdAt": "2026-03-15T09:02:10.000Z"
  }
}`;

  const step3Curl = `# Step 3: Trigger AI spatial OCR extraction on the registered document
curl -X POST "https://bhusamanvay.vercel.app/api/documents/d52ef713-363e-46cf-a5dc-5e74ce9a6b12/process" \\
  -H "Authorization: Bearer bs_live_..."`;

  const step3Response = `{
  "success": true,
  "data": {
    "id": "d52ef713-363e-46cf-a5dc-5e74ce9a6b12",
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
      }
    },
    "updatedAt": "2026-03-15T09:02:45.000Z"
  }
}`;

  const step4Curl = `# Step 4: Commit verified canonical data into the relational database
curl -X POST "https://bhusamanvay.vercel.app/api/documents/d52ef713-363e-46cf-a5dc-5e74ce9a6b12/commit" \\
  -H "Authorization: Bearer bs_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{}'`;

  const step4Response = `{
  "success": true,
  "data": {
    "document": {
      "id": "d52ef713-363e-46cf-a5dc-5e74ce9a6b12",
      "status": "committed",
      "committedAt": "2026-03-15T09:05:00.000Z"
    },
    "canonicalRecordId": "a81d4576-92bf-412e-8d4b-70c32608316c"
  }
}`;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
          >
            Core Architecture
          </Badge>
          <span className="text-xs text-muted-foreground">Ingest &amp; Digitization</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Digitization Pipeline Architecture
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          The BhuSamanvay digitization lifecycle transforms raw, unstructured land record scans
          into verified canonical database records through a strict 4-stage pipeline.
        </p>
      </div>

      <Separator />

      {/* 4 Stage Visual Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          The 4 Stage Pipeline
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                STAGE 01
              </span>
              <HugeiconsIcon icon={Upload01Icon} className="size-4 text-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Upload Raw File</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Uploads PDF/TIFF/JPG to S3 and returns a secure file UUID (<code className="font-mono text-foreground">fileId</code>).
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                STAGE 02
              </span>
              <HugeiconsIcon icon={File01Icon} className="size-4 text-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Register Document</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Creates the document record linking <code className="font-mono text-foreground">fileId</code> with
              document type and state.
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                STAGE 03
              </span>
              <HugeiconsIcon icon={Layers01Icon} className="size-4 text-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">AI Spatial OCR</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Gemini multimodal AI extracts geometry, boundaries, survey numbers, and confidence score.
            </p>
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-muted-foreground font-semibold">
                STAGE 04
              </span>
              <HugeiconsIcon icon={Database01Icon} className="size-4 text-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Canonical Commit</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Transactional insert into canonical tables (<code className="font-mono text-foreground">spatialMaps</code>, <code className="font-mono text-foreground">parcels</code>).
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Deep Step-by-Step Walkthrough */}
      <div className="space-y-8">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Step-by-Step API Execution
        </h2>

        {/* Step 1 */}
        <div className="space-y-3 rounded-lg border border-border/80 p-5 bg-card">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              Step 1
            </Badge>
            <h3 className="text-base font-semibold text-foreground">
              Upload Raw File to Secure Storage
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Source files can be uploaded directly via <code className="font-mono text-foreground">POST /files/upload</code> using multipart form data (or registered via the file record API).
            The server generates an S3 object key, stores the file bytes, creates an unlinked file record,
            and returns the newly generated <code className="font-mono text-foreground">fileId</code>.
          </p>
          <CodeBlock code={step1Curl} language="bash" filename="1-upload-file.sh" />
          <CodeBlock code={step1Response} language="json" filename="1-upload-response.json" />
        </div>

        {/* Step 2 */}
        <div className="space-y-3 rounded-lg border border-border/80 p-5 bg-card">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              Step 2
            </Badge>
            <h3 className="text-base font-semibold text-foreground">
              Register Document Metadata
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Take the <code className="font-mono text-foreground">fileId</code> from Step 1 and call{" "}
            <code className="font-mono text-foreground">POST /documents</code>. Provide the human title,
            file name, document type (e.g. <code className="font-mono text-foreground">spatial_map</code> or <code className="font-mono text-foreground">property_card</code>),
            and state. The document is registered in the database with status <code className="font-mono text-foreground">uploaded</code>.
          </p>
          <CodeBlock code={step2Curl} language="bash" filename="2-register-document.sh" />
          <CodeBlock code={step2Response} language="json" filename="2-register-response.json" />
        </div>

        {/* Step 3 */}
        <div className="space-y-3 rounded-lg border border-border/80 p-5 bg-card">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              Step 3
            </Badge>
            <h3 className="text-base font-semibold text-foreground">
              Execute AI Spatial Extraction
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Trigger AI processing via <code className="font-mono text-foreground">POST /documents/&#123;id&#125;/process</code>.
            The extraction service streams the file bytes directly from storage to the AI model, extracts structured
            attributes (GeoJSON polygons, survey coordinates, area, ownership details), sets a confidence score,
            and updates the document status to <code className="font-mono text-foreground">extracted</code>.
          </p>
          <CodeBlock code={step3Curl} language="bash" filename="3-extract-data.sh" />
          <CodeBlock code={step3Response} language="json" filename="3-extract-response.json" />
        </div>

        {/* Step 4 */}
        <div className="space-y-3 rounded-lg border border-border/80 p-5 bg-card">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              Step 4
            </Badge>
            <h3 className="text-base font-semibold text-foreground">
              Commit Verified Canonical Records
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Once human or automated review confirms the extraction accuracy, call{" "}
            <code className="font-mono text-foreground">POST /documents/&#123;id&#125;/commit</code>.
            You can optionally supply manual corrections in the request body, or pass an empty body to commit the AI extracted data.
            The server inserts the canonical entity inside a strict database transaction, updates the document status to
            <code className="font-mono text-foreground">committed</code>, and links the underlying file record to prevent deletion.
          </p>
          <CodeBlock code={step4Curl} language="bash" filename="4-commit-canonical.sh" />
          <CodeBlock code={step4Response} language="json" filename="4-commit-response.json" />
        </div>
      </div>

      <Separator />

      {/* State Machine */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Document Status Lifecycle
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Every document transitions through four possible states during its lifetime:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-1">
              <Badge variant="outline" className="font-mono text-[10px] w-fit">
                uploaded
              </Badge>
              <CardTitle className="text-xs font-semibold pt-1">
                Initial State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                Document registered with raw file. Ready for AI processing.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-1">
              <Badge variant="secondary" className="font-mono text-[10px] w-fit">
                extracted
              </Badge>
              <CardTitle className="text-xs font-semibold pt-1">
                Parsed by AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                OCR and spatial coordinates parsed. Stored in staging jsonb.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-1">
              <Badge className="font-mono text-[10px] w-fit bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                committed
              </Badge>
              <CardTitle className="text-xs font-semibold pt-1">
                Permanent Canonical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                Inserted into canonical tables. Accessible via public read API.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-1">
              <Badge variant="destructive" className="font-mono text-[10px] w-fit">
                failed
              </Badge>
              <CardTitle className="text-xs font-semibold pt-1">
                Processing Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                File read or OCR failure. Contains diagnostic errorDetails.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Querying After Commit */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Step 5: Querying Committed Records
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Once committed, records are immediately searchable through the Digitized Records API using standard filters:
        </p>

        <div className="rounded-lg border border-border/80 p-4 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-foreground">
              Read Digitized Records
            </span>
            <p className="text-[11px] text-muted-foreground">
              Explore query parameters, district/mandal filters, and pagination.
            </p>
          </div>
          <Link
            href="/docs/digitized-records"
            className="text-xs font-medium text-foreground flex items-center gap-1 hover:underline"
          >
            <span>View Digitized Records API</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
          </Link>
        </div>
      </div>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
