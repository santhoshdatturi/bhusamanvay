"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CodeBlock } from "@/components/docs/code-block";
import { DocsPager } from "@/components/docs/docs-pager";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon, Copy01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

interface StateItem {
  enumValue: string;
  name: string;
  type: "State" | "Union Territory";
}

const INDIAN_STATES_DATA: StateItem[] = [
  { enumValue: "ANDHRA_PRADESH", name: "Andhra Pradesh", type: "State" },
  { enumValue: "ARUNACHAL_PRADESH", name: "Arunachal Pradesh", type: "State" },
  { enumValue: "ASSAM", name: "Assam", type: "State" },
  { enumValue: "BIHAR", name: "Bihar", type: "State" },
  { enumValue: "CHHATTISGARH", name: "Chhattisgarh", type: "State" },
  { enumValue: "GOA", name: "Goa", type: "State" },
  { enumValue: "GUJARAT", name: "Gujarat", type: "State" },
  { enumValue: "HARYANA", name: "Haryana", type: "State" },
  { enumValue: "HIMACHAL_PRADESH", name: "Himachal Pradesh", type: "State" },
  { enumValue: "JHARKHAND", name: "Jharkhand", type: "State" },
  { enumValue: "KARNATAKA", name: "Karnataka", type: "State" },
  { enumValue: "KERALA", name: "Kerala", type: "State" },
  { enumValue: "MADHYA_PRADESH", name: "Madhya Pradesh", type: "State" },
  { enumValue: "MAHARASHTRA", name: "Maharashtra", type: "State" },
  { enumValue: "MANIPUR", name: "Manipur", type: "State" },
  { enumValue: "MEGHALAYA", name: "Meghalaya", type: "State" },
  { enumValue: "MIZORAM", name: "Mizoram", type: "State" },
  { enumValue: "NAGALAND", name: "Nagaland", type: "State" },
  { enumValue: "ODISHA", name: "Odisha", type: "State" },
  { enumValue: "PUNJAB", name: "Punjab", type: "State" },
  { enumValue: "RAJASTHAN", name: "Rajasthan", type: "State" },
  { enumValue: "SIKKIM", name: "Sikkim", type: "State" },
  { enumValue: "TAMIL_NADU", name: "Tamil Nadu", type: "State" },
  { enumValue: "TELANGANA", name: "Telangana", type: "State" },
  { enumValue: "TRIPURA", name: "Tripura", type: "State" },
  { enumValue: "UTTAR_PRADESH", name: "Uttar Pradesh", type: "State" },
  { enumValue: "UTTARAKHAND", name: "Uttarakhand", type: "State" },
  { enumValue: "WEST_BENGAL", name: "West Bengal", type: "State" },
  {
    enumValue: "ANDAMAN_AND_NICOBAR_ISLANDS",
    name: "Andaman and Nicobar Islands",
    type: "Union Territory",
  },
  { enumValue: "CHANDIGARH", name: "Chandigarh", type: "Union Territory" },
  {
    enumValue: "DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU",
    name: "Dadra and Nagar Haveli and Daman and Diu",
    type: "Union Territory",
  },
  { enumValue: "DELHI", name: "Delhi", type: "Union Territory" },
  {
    enumValue: "JAMMU_AND_KASHMIR",
    name: "Jammu and Kashmir",
    type: "Union Territory",
  },
  { enumValue: "LADAKH", name: "Ladakh", type: "Union Territory" },
  { enumValue: "LAKSHADWEEP", name: "Lakshadweep", type: "Union Territory" },
  { enumValue: "PUDUCHERRY", name: "Puducherry", type: "Union Territory" },
];

export default function StatesDocsPage() {
  const [search, setSearch] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredStates = INDIAN_STATES_DATA.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.enumValue.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const queryExample = `curl -X GET "https://bhusamanvay.vercel.app/api/digitized/spatial-maps?state=TELANGANA" \\
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
            Reference Enums
          </Badge>
          <span className="text-xs text-muted-foreground">36 Jurisdictions</span>
        </div>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Supported Indian States
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
          Complete reference of supported Indian States and Union Territories. When passing
          the <code className="font-mono text-foreground font-semibold">state</code> query parameter or configuring
          an API token restriction, use the exact uppercase enum string.
        </p>
      </div>

      <Separator />

      {/* Query Example */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Query Parameter Usage
        </h2>
        <CodeBlock code={queryExample} language="bash" filename="cURL Example" />
      </div>

      <Separator />

      {/* Search and Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Enum Directory
            </h2>
            <p className="text-xs text-muted-foreground">
              Click any enum code to copy it to your clipboard.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Input
              type="search"
              placeholder="Search states or enums..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredStates.map((item) => {
            const isCopied = copiedCode === item.enumValue;
            return (
              <div
                key={item.enumValue}
                onClick={() => handleCopy(item.enumValue)}
                className="group flex flex-col justify-between rounded-lg border border-border/80 bg-card p-3 transition-colors hover:border-foreground/30 hover:bg-muted/30 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {item.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono px-1 py-0 text-muted-foreground shrink-0"
                  >
                    {item.type === "State" ? "State" : "UT"}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <code className="font-mono text-[11px] text-muted-foreground group-hover:text-foreground">
                    {item.enumValue}
                  </code>
                  <span className="text-muted-foreground/60 group-hover:text-foreground transition-colors">
                    {isCopied ? (
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        className="size-3 text-emerald-500"
                      />
                    ) : (
                      <HugeiconsIcon icon={Copy01Icon} className="size-3" />
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredStates.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            No matching states found for &quot;{search}&quot;.
          </div>
        )}
      </div>

      <Separator />

      {/* Enforcement Callout */}
      <Alert className="border-border/80 bg-muted/30">
        <HugeiconsIcon icon={InformationCircleIcon} className="size-4 text-foreground" />
        <AlertTitle className="text-xs font-semibold text-foreground">
          Case Sensitivity & Validation
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Enum parameters are case-sensitive. Supplying an unrecognized or misspelled state string
          will fail validation with a 400 Bad Request response.
        </AlertDescription>
      </Alert>

      <Separator />

      {/* Page Navigation */}
      <DocsPager />
    </div>
  );
}
