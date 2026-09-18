import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CodeBlock } from "@/components/docs/code-block";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Shield01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";

export const metadata = {
  title: "Authentication & Security",
  description:
    "Bearer token authorization, SHA-256 hashing, token lifecycle, and state-level scoping rules.",
};

export default function AuthenticationDocsPage() {
  const headerCurl = `curl -X GET "https://bhusamanvay.vercel.app/api/digitized/spatial-maps?state=TELANGANA" \\
  -H "Authorization: Bearer bs_live_..."`;

  const unauthorizedResponse = `{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "userMessage": "Missing or malformed Authorization header",
    "details": null
  }
}`;

  const forbiddenStateResponse = `{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "userMessage": "Access forbidden for requested state. API Key is scoped to TELANGANA.",
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
            Security Model
          </Badge>
          <span className="text-xs text-muted-foreground">Bearer Token Auth</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Authentication & Security
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          All requests to the BhuSamanvay API are authenticated using API keys passed via
          the standard HTTP Authorization header.
        </p>
      </div>

      <Separator />

      {/* Bearer Header Standard */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Authorization Header
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Include your secret API key in the <code className="font-mono text-foreground font-semibold">Authorization</code> header
          as a Bearer token with every HTTP request.
        </p>

        <div className="rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs text-foreground">
          <code>Authorization: Bearer &lt;API_KEY&gt;</code>
        </div>

        <CodeBlock code={headerCurl} language="bash" filename="cURL Header Example" />

        <Alert className="border-border/80 bg-muted/30">
          <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-foreground" />
          <AlertTitle className="text-xs font-semibold text-foreground">
            Secret Key Exposure Warning
          </AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            API keys must only be used in server-to-server calls or secure backend environments.
            Never expose secret tokens in client-side code, public browser apps, or repositories.
          </AlertDescription>
        </Alert>
      </div>

      <Separator />

      {/* Key Structure & Validation */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Token Structure & Validation Lifecycle
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          When an API key is issued, the platform provisions a cryptographically strong
          token with the live prefix:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <span className="font-mono text-[11px] text-muted-foreground uppercase">
                Prefix
              </span>
              <CardTitle className="font-mono text-sm font-bold text-foreground">
                bs_live_...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                Live environment prefix identifying production keys across services.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <span className="font-mono text-[11px] text-muted-foreground uppercase">
                Storage
              </span>
              <CardTitle className="font-mono text-sm font-bold text-foreground">
                SHA-256 Hashed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                Keys are hashed before database lookup. Plaintext secrets are never stored.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader className="pb-2">
              <span className="font-mono text-[11px] text-muted-foreground uppercase">
                Status Check
              </span>
              <CardTitle className="font-mono text-sm font-bold text-foreground">
                Active Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-muted-foreground">
                Verifies <code className="font-mono text-foreground">revokedAt</code> is null
                and <code className="font-mono text-foreground">expiresAt</code> is in the future.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-foreground">
            Validation Flow
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground">
            <li>The server extracts the token from the Bearer header.</li>
            <li>The token is hashed using SHA-256 and matched against stored key hashes.</li>
            <li>The server verifies that the key is active and not revoked or expired.</li>
            <li>Required permission scopes are verified against the token scopes.</li>
            <li>State boundaries are enforced against the token&apos;s geographical scope.</li>
          </ol>
        </div>
      </div>

      <Separator />

      {/* State Scoping */}
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Shield01Icon} className="size-4 text-foreground" />
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Geographical State Scoping (allowedState)
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            To enforce jurisdictional privacy and government compliance, each API key can be
            assigned an optional single-state restriction (<code className="font-mono text-foreground">allowedState</code>).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/80 p-4 space-y-2 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                State-Restricted Key
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                e.g. TELANGANA
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If an API key has{" "}
              <code className="font-mono text-foreground">
                allowedState: &quot;TELANGANA&quot;
              </code>
              , the request query parameter{" "}
              <code className="font-mono text-foreground">state</code> must match{" "}
              <code className="font-mono text-foreground">TELANGANA</code>. If omitted or set
              to another state, access is immediately denied.
            </p>
          </div>

          <div className="rounded-lg border border-border/80 p-4 space-y-2 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                Global Key
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                allowedState: null
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If <code className="font-mono text-foreground">allowedState</code> is null, the key possesses
              all-India query privileges and can access records for any supported state.
            </p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="text-xs font-medium text-muted-foreground">
            State Scoping Violation (403 Forbidden)
          </div>
          <CodeBlock
            code={forbiddenStateResponse}
            language="json"
            filename="403-forbidden.json"
          />
        </div>
      </div>

      <Separator />

      {/* Authentication Failure Examples */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Missing or Invalid Token Error
        </h2>
        <p className="text-xs text-muted-foreground">
          Requests lacking a Bearer token or presenting an invalid/expired key return a 401 Unauthorized status.
        </p>
        <CodeBlock
          code={unauthorizedResponse}
          language="json"
          filename="401-unauthorized.json"
        />
      </div>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
