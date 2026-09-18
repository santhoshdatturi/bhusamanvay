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
import { CodeBlock } from "@/components/docs/code-block";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

export const metadata = {
  title: "Error Handling & Status Codes",
  description:
    "Standardized error response formats, HTTP status codes, and error code references.",
};

const ERROR_CODES_DATA = [
  {
    status: "401",
    code: "UNAUTHORIZED",
    meaning: "Authentication Failure",
    description:
      "The Bearer token is missing, malformed, expired, revoked, or failed cryptographic SHA-256 verification.",
  },
  {
    status: "403",
    code: "FORBIDDEN",
    meaning: "Permission / Scope Denied",
    description:
      "The token lacks the required scope (e.g., digitized:read) or the state parameter violates the key's allowedState restriction.",
  },
  {
    status: "400",
    code: "BAD_REQUEST",
    meaning: "Invalid Request Input",
    description:
      "Query parameters failed schema validation, numeric limits were out of bounds, or an invalid enum was passed.",
  },
  {
    status: "404",
    code: "NOT_FOUND",
    meaning: "Resource Not Found",
    description:
      "The requested record ID does not exist in the collection, or the document type slug was unrecognized.",
  },
  {
    status: "409",
    code: "CONFLICT",
    meaning: "Entity Conflict",
    description:
      "An entity with the given unique identifier or state key already exists in the canonical register.",
  },
  {
    status: "500",
    code: "INTERNAL_ERROR",
    meaning: "Server Exception",
    description:
      "An unexpected server error occurred during processing or database querying. Safe error message returned.",
  },
];

export default function ErrorsDocsPage() {
  const standardSchema = `{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED | FORBIDDEN | BAD_REQUEST | NOT_FOUND | INTERNAL_ERROR",
    "userMessage": "Human readable explanation of what failed.",
    "details": null
  }
}`;

  const sample401 = `{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "userMessage": "Missing or malformed Authorization header",
    "details": null
  }
}`;

  const sample403 = `{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "userMessage": "Access forbidden for requested state. API Key is scoped to TELANGANA.",
    "details": null
  }
}`;

  const sample400 = `{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "userMessage": "Invalid query parameters: limit must be less than or equal to 100",
    "details": {
      "field": "limit",
      "received": 250,
      "max": 100
    }
  }
}`;

  const sample404 = `{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "userMessage": "The requested digitized record was not found.",
    "details": null
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
            Diagnostics
          </Badge>
          <span className="text-xs text-muted-foreground">Error Handling</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Standard Error Responses
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          All endpoints adhere to a unified JSON error envelope with machine-readable error codes
          and safe, human-readable explanations.
        </p>
      </div>

      <Separator />

      {/* Unified Error Envelope */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Error Envelope Schema
        </h2>
        <p className="text-xs text-muted-foreground">
          When an error occurs, the HTTP status code reflects the category and the response body
          contains an <code className="font-mono text-foreground font-semibold">error</code> object.
        </p>
        <CodeBlock
          code={standardSchema}
          language="json"
          filename="standard-error-envelope.json"
        />
      </div>

      <Separator />

      {/* Error Codes Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          HTTP Status & Error Codes
        </h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px] font-medium text-foreground">
                  Status
                </TableHead>
                <TableHead className="w-[180px] font-medium text-foreground">
                  Error Code
                </TableHead>
                <TableHead className="w-[180px] font-medium text-foreground">
                  Meaning
                </TableHead>
                <TableHead className="font-medium text-foreground">
                  Typical Cause
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ERROR_CODES_DATA.map((err) => (
                <TableRow key={err.code} className="hover:bg-muted/30">
                  <TableCell className="align-top font-mono text-xs font-semibold text-foreground">
                    <Badge
                      variant={
                        err.status.startsWith("4")
                          ? "secondary"
                          : "destructive"
                      }
                      className="font-mono text-[10px]"
                    >
                      {err.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top font-mono text-xs font-semibold text-foreground">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">
                      {err.code}
                    </code>
                  </TableCell>
                  <TableCell className="align-top text-xs font-medium text-foreground">
                    {err.meaning}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground leading-relaxed">
                    {err.description}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Examples by Status Code */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Response Examples
        </h2>
        <p className="text-xs text-muted-foreground">
          Inspect realistic payloads returned during authorization, validation, or resource lookup failures.
        </p>

        <Tabs defaultValue="401" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-md mb-4">
            <TabsTrigger value="401" className="text-xs">
              401 Unauthorized
            </TabsTrigger>
            <TabsTrigger value="403" className="text-xs">
              403 Forbidden
            </TabsTrigger>
            <TabsTrigger value="400" className="text-xs">
              400 Bad Request
            </TabsTrigger>
            <TabsTrigger value="404" className="text-xs">
              404 Not Found
            </TabsTrigger>
          </TabsList>

          <TabsContent value="401" className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Returned when Authorization Bearer token is missing, expired, or invalid.
            </div>
            <CodeBlock code={sample401} language="json" filename="401-unauthorized.json" />
          </TabsContent>

          <TabsContent value="403" className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Returned when scope is missing or state parameter violates allowedState.
            </div>
            <CodeBlock code={sample403} language="json" filename="403-forbidden.json" />
          </TabsContent>

          <TabsContent value="400" className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Returned when parameters fail validation or contain unrecognized values.
            </div>
            <CodeBlock code={sample400} language="json" filename="400-bad-request.json" />
          </TabsContent>

          <TabsContent value="404" className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Returned when a record ID does not exist for the queried document type.
            </div>
            <CodeBlock code={sample404} language="json" filename="404-not-found.json" />
          </TabsContent>
        </Tabs>
      </div>

      <Separator />

      {/* Best Practices Alert */}
      <Alert className="border-border/80 bg-muted/30">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-foreground" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          Client Error Handling Best Practice
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Always inspect the <code className="font-mono text-foreground">error.code</code> string
          rather than relying solely on HTTP status codes to differentiate between token-level errors
          and business logic restrictions.
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
