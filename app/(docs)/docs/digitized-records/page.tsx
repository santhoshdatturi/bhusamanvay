import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EndpointCard } from "@/components/docs/endpoint-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

export const metadata = {
  title: "Digitized Records API",
  description:
    "Query canonical land records, spatial maps, property cards, and boundary registers via REST endpoints.",
};

export default function DigitizedRecordsDocsPage() {
  const listPathParams = [
    {
      name: "docType",
      type: "string",
      required: true,
      description:
        "The canonical document type slug representing the record collection to query.",
      allowedValues: [
        "spatial-maps",
        "property-cards",
        "account-holdings",
        "encumbrances",
        "village-maps",
        "survey-settlements",
      ],
    },
  ];

  const listQueryParams = [
    {
      name: "state",
      type: "string",
      required: false,
      description:
        "Valid Indian State enum string (e.g., TELANGANA). Required if the token is restricted by allowedState or if the document type requires state-level partitioning.",
    },
    {
      name: "district",
      type: "string",
      required: false,
      description: "Filter records by district administrative division.",
    },
    {
      name: "mandal",
      type: "string",
      required: false,
      description: "Filter by mandal, tehsil, or taluka name.",
    },
    {
      name: "village",
      type: "string",
      required: false,
      description: "Filter by revenue village or local administrative ward.",
    },
    {
      name: "surveyNo",
      type: "string",
      required: false,
      description: "Filter by land parcel survey or sub-division number.",
    },
    {
      name: "limit",
      type: "number",
      required: false,
      defaultValue: "50",
      description: "Maximum number of records to return. Min 1, Max 100.",
    },
    {
      name: "offset",
      type: "number",
      required: false,
      defaultValue: "0",
      description: "Number of records to skip for pagination offsets.",
    },
  ];

  const listHeader = [
    {
      name: "Authorization",
      type: "string",
      required: true,
      description:
        "Bearer token containing digitized:read or admin:* scope. Example: Bearer bs_live_...",
    },
  ];

  const listResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "Indicates whether the query executed successfully.",
    },
    {
      name: "data",
      type: "Array<CanonicalRecord>",
      description: "Array of canonical land records matching administrative filters.",
    },
    {
      name: "data[].id",
      type: "string (UUID)",
      description: "Unique canonical UUID of the record.",
    },
    {
      name: "data[].docType",
      type: "string",
      description: "Queried document type slug.",
    },
    {
      name: "data[].state",
      type: "string",
      description: "Indian state name.",
    },
    {
      name: "data[].district",
      type: "string",
      description: "District administrative division.",
    },
    {
      name: "data[].mandal",
      type: "string",
      description: "Mandal, tehsil, or taluka name.",
    },
    {
      name: "data[].village",
      type: "string",
      description: "Revenue village or ward.",
    },
    {
      name: "data[].surveyNo",
      type: "string",
      description: "Cadastral survey or plot number.",
    },
    {
      name: "data[].canonicalData",
      type: "object",
      description:
        "Document-specific canonical JSON payload (e.g. spatialPolygon coordinates, extent, adjacent plots, or property assessment).",
    },
    {
      name: "data[].createdAt",
      type: "string (ISO 8601)",
      description: "Timestamp when record was committed to canonical database.",
    },
    {
      name: "pagination.limit",
      type: "number",
      description: "Requested page size limit.",
    },
    {
      name: "pagination.offset",
      type: "number",
      description: "Requested page offset.",
    },
    {
      name: "pagination.count",
      type: "number",
      description: "Count of items returned in current response slice.",
    },
  ];

  const listResponseJson = `{
  "success": true,
  "data": [
    {
      "id": "a81d4576-92bf-412e-8d4b-70c32608316c",
      "docType": "spatial-maps",
      "state": "TELANGANA",
      "district": "Rangareddy",
      "mandal": "Gandipet",
      "village": "Kokapet",
      "surveyNo": "128/A",
      "canonicalData": {
        "spatialPolygon": {
          "type": "Polygon",
          "coordinates": [[[78.34, 17.38], [78.35, 17.38], [78.35, 17.39], [78.34, 17.39], [78.34, 17.38]]]
        },
        "areaAcres": 4.5,
        "adjacentSurveys": {
          "north": "129",
          "south": "127",
          "east": "130",
          "west": "Road"
        }
      },
      "createdAt": "2026-03-12T09:30:00.000Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}`;

  const listCurl = `curl -X GET "https://bhusamanvay.vercel.app/api/digitized/spatial-maps?state=TELANGANA&district=Rangareddy&village=Kokapet&limit=20" \\
  -H "Authorization: Bearer bs_live_..." \\
  -H "Accept: application/json"`;

  const getPathParams = [
    {
      name: "docType",
      type: "string",
      required: true,
      description: "One of the valid document type slugs.",
      allowedValues: [
        "spatial-maps",
        "property-cards",
        "account-holdings",
        "encumbrances",
        "village-maps",
        "survey-settlements",
      ],
    },
    {
      name: "id",
      type: "string (UUID)",
      required: true,
      description: "Unique canonical UUID of the digitized land record.",
    },
  ];

  const getResponseParams = [
    {
      name: "success",
      type: "boolean",
      description: "True if the record was retrieved successfully.",
    },
    {
      name: "data.id",
      type: "string (UUID)",
      description: "Canonical land record identifier.",
    },
    {
      name: "data.docType",
      type: "string",
      description: "Document type slug.",
    },
    {
      name: "data.state",
      type: "string",
      description: "State name.",
    },
    {
      name: "data.district",
      type: "string",
      description: "District division.",
    },
    {
      name: "data.mandal",
      type: "string",
      description: "Mandal / Taluka name.",
    },
    {
      name: "data.village",
      type: "string",
      description: "Village / Ward name.",
    },
    {
      name: "data.surveyNo",
      type: "string",
      description: "Parcel survey number.",
    },
    {
      name: "data.canonicalData",
      type: "object",
      description: "Detailed canonical data payload specific to the document collection.",
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

  const getResponseJson = `{
  "success": true,
  "data": {
    "id": "a81d4576-92bf-412e-8d4b-70c32608316c",
    "docType": "spatial-maps",
    "state": "TELANGANA",
    "district": "Rangareddy",
    "mandal": "Gandipet",
    "village": "Kokapet",
    "surveyNo": "128/A",
    "canonicalData": {
      "spatialPolygon": {
        "type": "Polygon",
        "coordinates": [[[78.34, 17.38], [78.35, 17.38], [78.35, 17.39], [78.34, 17.39], [78.34, 17.38]]]
      },
      "areaAcres": 4.5,
      "adjacentSurveys": {
        "north": "129",
        "south": "127",
        "east": "130",
        "west": "Road"
      }
    },
    "createdAt": "2026-03-12T09:30:00.000Z",
    "updatedAt": "2026-03-12T09:30:00.000Z"
  }
}`;

  const getCurl = `curl -X GET "https://bhusamanvay.vercel.app/api/digitized/spatial-maps/a81d4576-92bf-412e-8d4b-70c32608316c" \\
  -H "Authorization: Bearer bs_live_..." \\
  -H "Accept: application/json"`;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
          >
            API Endpoints
          </Badge>
          <span className="text-xs text-muted-foreground">Digitized Records</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Digitized Records API
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          Endpoints for querying and retrieving verified digitized land records, spatial boundaries,
          mutation logs, encumbrance certificates, and village settlement maps.
        </p>
      </div>

      <Alert className="border-border/80 bg-muted/30">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-foreground" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          Required Scope
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Both endpoints require a Bearer token possessing the{" "}
          <code className="font-mono text-foreground font-semibold">digitized:read</code> or{" "}
          <code className="font-mono text-foreground font-semibold">admin:*</code> scope.
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Endpoint 1: List Digitized Records */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            List Digitized Records
          </h2>
          <p className="text-xs text-muted-foreground">
            Search and filter records by document type, state, district, mandal, village, or survey number.
          </p>
        </div>

        <EndpointCard
          method="GET"
          path="/digitized/{docType}"
          title="List Records by Document Type"
          description="Fetch a paginated collection of digitized records matching administrative filters."
          scopeRequirement="digitized:read, admin:*"
          pathParams={listPathParams}
          queryParams={listQueryParams}
          headerParams={listHeader}
          responseParams={listResponseParams}
          responseExample={listResponseJson}
          responseStatus="200 OK"
          curlExample={listCurl}
        />
      </div>

      <Separator />

      {/* Endpoint 2: Get Single Record by ID */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Get Digitized Record by ID
          </h2>
          <p className="text-xs text-muted-foreground">
            Retrieve the full canonical payload for a specific digitized record by UUID.
          </p>
        </div>

        <EndpointCard
          method="GET"
          path="/digitized/{docType}/{id}"
          title="Get Record by ID"
          description="Fetch single canonical record details including geometry, attributes, and provenance."
          scopeRequirement="digitized:read, admin:*"
          pathParams={getPathParams}
          headerParams={listHeader}
          responseParams={getResponseParams}
          responseExample={getResponseJson}
          responseStatus="200 OK"
          curlExample={getCurl}
        />
      </div>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
