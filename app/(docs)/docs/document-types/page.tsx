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
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

export const metadata = {
  title: "Document Types Reference",
  description:
    "Supported document type slugs, canonical database tables, and filter capabilities.",
};

const DOC_TYPE_DATA = [
  {
    slug: "spatial-maps",
    name: "Spatial Maps",
    table: "spatialMaps",
    stateSupported: true,
    description:
      "Geo-referenced spatial vector maps, GIS parcel boundaries, coordinate polygons, and survey plot extents.",
    keyFields: ["spatialPolygon", "surveyNo", "totalExtentAcres", "adjacentSurveys"],
  },
  {
    slug: "property-cards",
    name: "Property Cards / Record of Rights",
    table: "propertyCards",
    stateSupported: true,
    description:
      "Urban property cards, municipal land records, and rural 7/12 / Patta passbooks reflecting canonical ownership.",
    keyFields: ["cardNo", "ownerName", "assessmentTax", "builtUpAreaSqFt"],
  },
  {
    slug: "account-holdings",
    name: "Account Holdings",
    table: "accountHoldings",
    stateSupported: true,
    description:
      "Revenue account registers (Khata / 8-A / Jamabandi) linking landowners to all survey numbers held in a revenue village.",
    keyFields: ["khataNumber", "accountHolderName", "totalParcelsCount", "totalArea"],
  },
  {
    slug: "encumbrances",
    name: "Encumbrance Certificates",
    table: "encumbranceCertificates",
    stateSupported: true,
    description:
      "Historical records of registered transactions, bank mortgages, legal liens, and execution deeds over a specified period.",
    keyFields: ["ecNumber", "periodFrom", "periodTo", "registeredDeedsCount"],
  },
  {
    slug: "village-maps",
    name: "Village Boundary Maps",
    table: "villageMaps",
    stateSupported: true,
    description:
      "Revenue village master maps depicting village outer boundaries, roads, rivers, forest buffer zones, and cluster layouts.",
    keyFields: ["villageLgdCode", "boundaryPolygon", "totalCadastralParcels"],
  },
  {
    slug: "survey-settlements",
    name: "Survey Settlement Registers",
    table: "surveySettlementRegisters",
    stateSupported: true,
    description:
      "Original settlement records, classification of soil fertility, water source rights, and land revenue assessment slabs.",
    keyFields: ["settlementYear", "soilTariffClass", "irrigationSource", "cessAssessed"],
  },
];

export default function DocumentTypesDocsPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
          >
            Data Schema
          </Badge>
          <span className="text-xs text-muted-foreground">Document Types</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Supported Document Types
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          Every land record query targets a specific canonical document type. Use the
          URL slug in the path parameter <code className="font-mono text-foreground font-semibold">/digitized/&#123;docType&#125;</code>.
        </p>
      </div>

      <Separator />

      {/* Slugs Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Document Slugs & Database Mapping
        </h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[180px] font-medium text-foreground">
                  Slug
                </TableHead>
                <TableHead className="w-[190px] font-medium text-foreground">
                  Canonical Entity
                </TableHead>
                <TableHead className="w-[110px] font-medium text-foreground">
                  State Filter
                </TableHead>
                <TableHead className="font-medium text-foreground">
                  Description & Key Fields
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DOC_TYPE_DATA.map((item) => (
                <TableRow key={item.slug} className="hover:bg-muted/30">
                  <TableCell className="align-top">
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                      {item.slug}
                    </code>
                  </TableCell>
                  <TableCell className="align-top text-xs space-y-1">
                    <div className="font-medium text-foreground">{item.name}</div>
                    <code className="font-mono text-[11px] text-muted-foreground">
                      table: {item.table}
                    </code>
                  </TableCell>
                  <TableCell className="align-top">
                    {item.stateSupported ? (
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      >
                        Supported
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="px-1.5 py-0 text-[10px] font-mono text-muted-foreground"
                      >
                        Linked Join
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-xs space-y-2 text-muted-foreground">
                    <p className="text-foreground/90">{item.description}</p>
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[11px] font-mono text-muted-foreground">Fields:</span>
                      {item.keyFields.map((field) => (
                        <code
                          key={field}
                          className="rounded bg-muted/60 px-1 py-0.2 font-mono text-[10px] text-foreground"
                        >
                          {field}
                        </code>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Usage Note */}
      <Alert className="border-border/80 bg-muted/30">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-foreground" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          State Scoping Enforcement
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          When querying document types with a state-scoped API key, passing a matching
          <code className="font-mono text-foreground mx-1">?state=...</code> query parameter is required.
          If the slug does not match one of the recognized identifiers above, the API returns a
          400 Bad Request or 404 Not Found error.
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
