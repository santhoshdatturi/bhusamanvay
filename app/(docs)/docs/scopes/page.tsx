import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, Layers01Icon } from "@hugeicons/core-free-icons";

export const metadata = {
  title: "Scopes & Permissions",
  description:
    "Complete reference of API scopes, access levels, and target endpoints in BhuSamanvay.",
};

const SCOPES_DATA = [
  {
    slug: "digitized:read",
    label: "Read Digitized Records",
    description:
      "Read-only access to query, filter, and fetch committed canonical land records, spatial maps, and settlement registers.",
    role: "Read-Only",
  },
  {
    slug: "document:upload",
    label: "Upload Documents",
    description:
      "Upload source PDF/image files to storage and register land record document metadata. Does not trigger AI extraction.",
    role: "Write",
  },
  {
    slug: "extraction:run",
    label: "Run Spatial AI Extraction",
    description:
      "Trigger AI spatial map extraction, OCR segmentation, and document parsing jobs on registered documents.",
    role: "Compute",
  },
  {
    slug: "extraction:commit",
    label: "Save Verified Extraction",
    description:
      "Save and commit verified canonical metadata, spatial boundaries, and parcel data back to canonical database tables.",
    role: "Write",
  },
  {
    slug: "ingest:*",
    label: "Ingest Land Records",
    description:
      "Composite umbrella scope covering the complete ingestion lifecycle from raw file upload through AI extraction to canonical commit.",
    role: "Pipeline",
  },
  {
    slug: "admin:*",
    label: "Full Administrator Access",
    description:
      "Unrestricted administrative access to all system APIs, documents, extraction workflows, and key management.",
    role: "Admin",
  },
];

export default function ScopesDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
          >
            Access Control
          </Badge>
          <span className="text-xs text-muted-foreground">Permission Scopes</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          API Scopes &amp; Permissions
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          BhuSamanvay models security scopes around named workflows and canonical data services,
          rather than internal database tables. Each API token is granted one or more discrete
          scopes authorizing specific actions.
        </p>
      </div>

      <Separator />

      {/* Scope Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Available Scopes
        </h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[180px] font-medium text-foreground">
                  Scope Slug
                </TableHead>
                <TableHead className="w-[190px] font-medium text-foreground">
                  Label
                </TableHead>
                <TableHead className="font-medium text-foreground">
                  Description
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCOPES_DATA.map((scope) => (
                <TableRow key={scope.slug} className="hover:bg-muted/30">
                  <TableCell className="align-top">
                    <div className="flex flex-col gap-1 items-start">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                        {scope.slug}
                      </code>
                      <Badge
                        variant={scope.role === "Admin" ? "destructive" : "secondary"}
                        className="px-1.5 py-0 text-[10px] font-mono uppercase tracking-wider"
                      >
                        {scope.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="align-top font-medium text-xs text-foreground">
                    {scope.label}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground leading-relaxed">
                    <p className="text-foreground/90">{scope.description}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Understanding ingest:* */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Layers01Icon} className="size-4 text-foreground" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Understanding the ingest:* Scope
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Notice that there is no literal single endpoint called <code className="font-mono text-foreground">/ingest/*</code>.
          Instead, <code className="font-mono text-foreground font-semibold">ingest:*</code> represents a composite workflow
          scope that grants access to all sequential stages of land record ingestion.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                Stage 1
              </span>
              <CardTitle className="text-xs font-semibold">
                File Storage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Upload raw PDF or map scan into secure object storage and provision a file UUID.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                Stage 2
              </span>
              <CardTitle className="text-xs font-semibold">
                Document Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Register document record linking the file UUID with document classification and state.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                Stage 3
              </span>
              <CardTitle className="text-xs font-semibold">
                AI Extraction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Trigger Gemini AI spatial OCR extraction to parse boundaries, parcels, and coordinates.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                Stage 4
              </span>
              <CardTitle className="text-xs font-semibold">
                Canonical Commit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Commit verified canonical attributes into production relational database tables.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Scope Enforcement Callout */}
      <Alert className="border-border/80 bg-muted/30">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-foreground" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          Principle of Least Privilege
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          For clients that only query already-digitized records (such as public registries or citizen portals),
          issue tokens strictly scoped to <code className="font-mono text-foreground">digitized:read</code>.
          Reserve <code className="font-mono text-foreground">ingest:*</code> and <code className="font-mono text-foreground">admin:*</code> for
          automated ingestion pipelines, scanning vendors, and government administrators.
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
