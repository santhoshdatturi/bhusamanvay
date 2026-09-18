"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/docs/code-block";
import { ParamsTable, type ParamItem } from "@/components/docs/params-table";
import { cn } from "@/lib/utils";

interface EndpointCardProps {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  title: string;
  description: string;
  scopeRequirement?: string;
  pathParams?: ParamItem[];
  queryParams?: ParamItem[];
  headerParams?: ParamItem[];
  bodyParams?: ParamItem[];
  bodyExample?: string;
  bodyType?: "json" | "form-data";
  responseParams?: ParamItem[];
  responseExample?: string;
  responseStatus?: string;
  curlExample?: string;
}

export function EndpointCard({
  method,
  path,
  title,
  description,
  scopeRequirement,
  pathParams,
  queryParams,
  headerParams,
  bodyParams,
  bodyExample,
  bodyType = "json",
  responseParams,
  responseExample,
  responseStatus = "200 OK",
  curlExample,
}: EndpointCardProps) {
  const methodColorMap: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
    POST: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
    PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    DELETE: "bg-destructive/10 text-destructive border-destructive/20",
    PATCH: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  };

  const hasBody = Boolean((bodyParams && bodyParams.length > 0) || bodyExample);
  const defaultTab = hasBody ? "body" : "parameters";

  return (
    <Card className="border border-border/80 bg-card shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <span
              className={`rounded-md border px-2 py-0.5 font-bold uppercase tracking-wider ${
                methodColorMap[method] || "bg-muted text-muted-foreground"
              }`}
            >
              {method}
            </span>
            <code className="text-sm font-semibold text-foreground tracking-tight break-all sm:break-normal">
              {path}
            </code>
          </div>
          {scopeRequirement && (
            <Badge
              variant="outline"
              className="font-mono text-[11px] text-muted-foreground"
            >
              Scope: {scopeRequirement}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base font-semibold text-foreground pt-1">
          {title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList
            className={cn(
              "grid w-full max-w-md mb-4",
              hasBody ? "grid-cols-4" : "grid-cols-3"
            )}
          >
            {hasBody && (
              <TabsTrigger value="body" className="text-xs">
                Request Body
              </TabsTrigger>
            )}
            <TabsTrigger value="parameters" className="text-xs">
              Parameters
            </TabsTrigger>
            <TabsTrigger value="response" className="text-xs">
              Response
            </TabsTrigger>
            <TabsTrigger value="example" className="text-xs">
              cURL
            </TabsTrigger>
          </TabsList>

          {hasBody && (
            <TabsContent value="body" className="space-y-4 pt-1">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Content-Type:{" "}
                  <code className="font-mono text-foreground">
                    {bodyType === "form-data"
                      ? "multipart/form-data"
                      : "application/json"}
                  </code>
                </span>
              </div>

              {bodyParams && bodyParams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                    Request Payload Schema
                  </h4>
                  <ParamsTable
                    parameters={bodyParams}
                    nameColumnLabel="Field Name"
                  />
                </div>
              )}

              {bodyExample && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                    Example Request Body
                  </h4>
                  <CodeBlock
                    code={bodyExample}
                    language={bodyType === "form-data" ? "bash" : "json"}
                    filename={
                      bodyType === "form-data"
                        ? "form-data-payload"
                        : "request-body.json"
                    }
                  />
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="parameters" className="space-y-4 pt-1">
            {headerParams && headerParams.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Header Parameters
                </h4>
                <ParamsTable
                  parameters={headerParams}
                  nameColumnLabel="Header"
                />
              </div>
            )}

            {pathParams && pathParams.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Path Parameters
                </h4>
                <ParamsTable
                  parameters={pathParams}
                  nameColumnLabel="Parameter"
                />
              </div>
            )}

            {queryParams && queryParams.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Query Parameters
                </h4>
                <ParamsTable
                  parameters={queryParams}
                  nameColumnLabel="Query Parameter"
                />
              </div>
            )}

            {!pathParams?.length &&
              !queryParams?.length &&
              !headerParams?.length && (
                <p className="text-xs text-muted-foreground italic py-2">
                  This endpoint does not require any additional URL parameters.
                </p>
              )}
          </TabsContent>

          <TabsContent value="response" className="space-y-4 pt-1">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-muted-foreground">
                HTTP Status
              </span>
              <Badge
                variant="outline"
                className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
              >
                {responseStatus}
              </Badge>
            </div>

            {responseParams && responseParams.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Response Payload Schema
                </h4>
                <ParamsTable
                  parameters={responseParams}
                  nameColumnLabel="Response Field"
                />
              </div>
            )}

            {responseExample ? (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                  Response Payload Example
                </h4>
                <CodeBlock code={responseExample} language="json" />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-2">
                No response body returned.
              </p>
            )}
          </TabsContent>

          <TabsContent value="example" className="pt-1">
            {curlExample ? (
              <CodeBlock code={curlExample} language="bash" />
            ) : (
              <p className="text-xs text-muted-foreground italic py-2">
                No cURL example available.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
