import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/docs/code-block";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Key01Icon,
  Shield01Icon,
  Layers01Icon,
  File01Icon,
  Upload01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

export const metadata = {
  title: "API Overview",
  description:
    "Introduction to the BhuSamanvay Land Records API platform, authentication, endpoints, and digitization lifecycle.",
};

export default function DocsOverviewPage() {
  const quickStartCurl = `# 1. Query canonical digitized records with Bearer token
curl -X GET "https://bhusamanvay.vercel.app/api/digitized/spatial-maps?state=TELANGANA&limit=10" \\
  -H "Authorization: Bearer bs_live_..." \\
  -H "Accept: application/json"`;

  const quickStartResponse = `{
  "success": true,
  "data": [
    {
      "id": "e3057e93-0ec3-4418-971c-77281f6bdf6a",
      "state": "TELANGANA",
      "district": "Rangareddy",
      "mandal": "Gandipet",
      "village": "Kokapet",
      "surveyNo": "128/A",
      "canonicalData": {
        "surveyNumber": "128/A",
        "totalExtentAcres": 4.5,
        "boundaryCoordinates": [...]
      },
      "createdAt": "2026-03-10T14:20:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 1
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
            Getting Started
          </Badge>
          <span className="text-xs text-muted-foreground">Version 1.0</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          BhuSamanvay API Reference
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          The BhuSamanvay REST API enables government departments, verified institutions,
          and authorized platforms to ingest raw land record documents, execute AI spatial
          OCR extraction, and query canonical digitized land records and boundary maps across Indian states.
        </p>
      </div>

      <Separator />

      {/* Base URL */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-foreground">
          Base URL
        </h2>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-xs text-foreground">
          <code>https://bhusamanvay.vercel.app/api</code>
          <Badge variant="secondary" className="font-mono text-[10px] text-muted-foreground">
            HTTPS Only
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          All endpoints documented in this reference are relative to this base URL. Requests over plain HTTP are
          automatically rejected.
        </p>
      </div>

      {/* Digitization Lifecycle Callout Banner */}
      <div className="rounded-lg border border-border/80 bg-muted/20 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Layers01Icon} className="size-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              Digitization &amp; Ingestion Pipeline
            </h2>
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            4 Stages
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The platform operates a 4-stage ingestion pipeline: upload raw files to storage,
          register document metadata, trigger AI spatial OCR extraction, and commit verified records
          into relational database tables.
        </p>
        <div className="pt-1">
          <Link
            href="/docs/pipeline"
            className="text-xs font-medium text-foreground flex items-center gap-1 hover:underline"
          >
            <span>Read the End-to-End Pipeline Architecture Guide</span>
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-3" />
          </Link>
        </div>
      </div>

      {/* Quickstart */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Quickstart Query
          </h2>
          <p className="text-xs text-muted-foreground">
            Authenticate using standard HTTP Bearer authentication with your secret API token.
          </p>
        </div>

        <CodeBlock code={quickStartCurl} language="bash" filename="cURL Request" />

        <div className="space-y-2 pt-1">
          <div className="text-xs font-medium text-muted-foreground">
            Sample 200 OK Response
          </div>
          <CodeBlock
            code={quickStartResponse}
            language="json"
            filename="response.json"
          />
        </div>
      </div>

      <Separator />

      {/* Architecture Highlights */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Core Architecture Principles
          </h2>
          <p className="text-xs text-muted-foreground">
            Built for enterprise-grade integrity, state-level isolation, and automated verification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Key01Icon} className="size-4 text-foreground" />
                <CardTitle className="text-sm font-semibold">
                  Hashed Token Security
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Live keys start with the <code className="font-mono text-foreground">bs_live_</code> prefix
                and are SHA-256 hashed before lookup. Plaintext keys are never stored.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Shield01Icon} className="size-4 text-foreground" />
                <CardTitle className="text-sm font-semibold">
                  Granular Scoping
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Fine-grained scopes like <code className="font-mono text-foreground">digitized:read</code>,
                <code className="font-mono text-foreground ml-1">document:upload</code>, and
                <code className="font-mono text-foreground ml-1">ingest:*</code> bound caller privileges.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Layers01Icon} className="size-4 text-foreground" />
                <CardTitle className="text-sm font-semibold">
                  State-Level Data Scoping
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tokens can be restricted to specific Indian states. Cross-state queries from
                restricted tokens are blocked with 403 Forbidden.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={File01Icon} className="size-4 text-foreground" />
                <CardTitle className="text-sm font-semibold">
                  Standardized Envelopes
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Every success response delivers canonical payload metadata in a predictable
                JSON wrapper with error codes and diagnostics.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Explore Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-foreground">
          API Endpoint Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/docs/files"
            className="group flex flex-col justify-between rounded-lg border border-border/80 p-4 transition-colors hover:border-foreground/40 hover:bg-muted/30"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 pb-1">
                <HugeiconsIcon icon={Upload01Icon} className="size-3.5 text-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Files API
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Multipart binary upload and presigned S3 URLs.
              </p>
            </div>
            <div className="pt-3 flex items-center text-[11px] font-medium text-foreground">
              <span>View endpoints</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-3 ml-1 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>

          <Link
            href="/docs/documents"
            className="group flex flex-col justify-between rounded-lg border border-border/80 p-4 transition-colors hover:border-foreground/40 hover:bg-muted/30"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 pb-1">
                <HugeiconsIcon icon={File01Icon} className="size-3.5 text-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Documents API
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Register documents, filter staging records, and update metadata.
              </p>
            </div>
            <div className="pt-3 flex items-center text-[11px] font-medium text-foreground">
              <span>View endpoints</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-3 ml-1 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>

          <Link
            href="/docs/extraction"
            className="group flex flex-col justify-between rounded-lg border border-border/80 p-4 transition-colors hover:border-foreground/40 hover:bg-muted/30"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 pb-1">
                <HugeiconsIcon icon={Layers01Icon} className="size-3.5 text-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Extraction API
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Trigger Gemini AI spatial OCR and commit canonical records.
              </p>
            </div>
            <div className="pt-3 flex items-center text-[11px] font-medium text-foreground">
              <span>View endpoints</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-3 ml-1 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>

          <Link
            href="/docs/digitized-records"
            className="group flex flex-col justify-between rounded-lg border border-border/80 p-4 transition-colors hover:border-foreground/40 hover:bg-muted/30"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 pb-1">
                <HugeiconsIcon icon={File01Icon} className="size-3.5 text-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Digitized Records
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Query canonical records by document type and state filters.
              </p>
            </div>
            <div className="pt-3 flex items-center text-[11px] font-medium text-foreground">
              <span>View endpoints</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-3 ml-1 text-muted-foreground group-hover:translate-x-0.5 transition-transform"
              />
            </div>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
