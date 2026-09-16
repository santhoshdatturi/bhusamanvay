"use client";

import { Fragment } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { FieldConfidenceBadge } from "@/components/documents/field-confidence-badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { Layers01Icon } from "@hugeicons/core-free-icons";
import type {
  StructuredLandRecordExtraction,
  ParcelRecordItem,
} from "@/lib/validations/extractions";

export interface CanonicalExtractedFieldsViewProps {
  documentType: string;
  data: StructuredLandRecordExtraction | null;
  isEditing?: boolean;
  onChange?: (updated: StructuredLandRecordExtraction) => void;
}

interface ExtractedFieldRow {
  id: string;
  name: string;
  confidence?: number;
  value?: string | null;
  evidence?: string | null;
  onChange?: (val: string) => void;
  isMono?: boolean;
}

interface RecordGroup {
  title: string;
  subtitle?: string;
  fields: ExtractedFieldRow[];
}

export function CanonicalExtractedFieldsView({
  documentType,
  data,
  isEditing = false,
  onChange,
}: CanonicalExtractedFieldsViewProps) {
  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-xs text-muted-foreground">
        No extracted data available for this document.
      </div>
    );
  }

  const handleUpdate = (
    updater: (prev: StructuredLandRecordExtraction) => StructuredLandRecordExtraction
  ) => {
    if (!onChange) return;
    const clone: StructuredLandRecordExtraction = JSON.parse(JSON.stringify(data));
    const next = updater(clone);
    onChange(next);
  };

  const updateRecordField = (
    idx: number,
    field: keyof ParcelRecordItem,
    value: string
  ) => {
    handleUpdate((prev) => {
      if (!prev.records || prev.records.length === 0) {
        prev.records = JSON.parse(JSON.stringify(data.records || []));
      }
      if (prev.records[idx]) {
        (prev.records[idx] as unknown as Record<string, unknown>)[field] = value;
        prev.records[idx].confidence = 100;
      }
      if (idx === 0 && prev.owners?.[0]) {
        if (field === "ownerName") prev.owners[0].name = value;
        if (field === "relativeName") prev.owners[0].relativeName = value;
        if (field === "relationshipType") prev.owners[0].relationshipType = value;
      }
      return prev;
    });
  };

  // Build canonical field groups based on documentType
  const groups: RecordGroup[] = [];

  // 1. General Jurisdiction & Location (Applicable across canonical tables)
  const loc = data.location;
  const pId = data.parcelIdentifiers;
  const extent = data.extent;

  const generalFields: ExtractedFieldRow[] = [
    {
      id: "state",
      name: "State / Jurisdiction",
      confidence: loc?.state?.confidence,
      value: loc?.state?.value,
      evidence: loc?.state?.evidence,
      onChange: (val) =>
        handleUpdate((prev) => {
          if (!prev.location) prev.location = {};
          prev.location.state = {
            value: val,
            confidence: 100,
            evidence: prev.location.state?.evidence || "Manual edit",
          };
          return prev;
        }),
    },
    {
      id: "district",
      name: "District",
      confidence: loc?.district?.confidence,
      value: loc?.district?.value,
      evidence: loc?.district?.evidence,
      onChange: (val) =>
        handleUpdate((prev) => {
          if (!prev.location) prev.location = {};
          prev.location.district = {
            value: val,
            confidence: 100,
            evidence: prev.location.district?.evidence || "Manual edit",
          };
          return prev;
        }),
    },
    {
      id: "taluk",
      name: "Tehsil / Taluk",
      confidence: loc?.taluk?.confidence,
      value: loc?.taluk?.value,
      evidence: loc?.taluk?.evidence,
      onChange: (val) =>
        handleUpdate((prev) => {
          if (!prev.location) prev.location = {};
          prev.location.taluk = {
            value: val,
            confidence: 100,
            evidence: prev.location.taluk?.evidence || "Manual edit",
          };
          return prev;
        }),
    },
    {
      id: "village",
      name: "Village / Mauza",
      confidence: loc?.village?.confidence,
      value: loc?.village?.value,
      evidence: loc?.village?.evidence,
      onChange: (val) =>
        handleUpdate((prev) => {
          if (!prev.location) prev.location = {};
          prev.location.village = {
            value: val,
            confidence: 100,
            evidence: prev.location.village?.evidence || "Manual edit",
          };
          return prev;
        }),
    },
  ];

  if (pId?.khataNumber?.value || isEditing) {
    generalFields.push({
      id: "khataNumber",
      name: "Khata Number",
      confidence: pId?.khataNumber?.confidence,
      value: pId?.khataNumber?.value,
      evidence: pId?.khataNumber?.evidence,
      isMono: true,
      onChange: (val) =>
        handleUpdate((prev) => {
          if (!prev.parcelIdentifiers) prev.parcelIdentifiers = {};
          prev.parcelIdentifiers.khataNumber = {
            value: val,
            confidence: 100,
            evidence: prev.parcelIdentifiers.khataNumber?.evidence || "Manual edit",
          };
          return prev;
        }),
    });
  }

  // 2. Specific Document Type Layouts
  if (documentType === "property_card") {
    // Urban Property Card (property_cards schema)
    const primaryOwner = data.owners?.[0];
    const propertyFields: ExtractedFieldRow[] = [
      ...generalFields,
      {
        id: "propertyId",
        name: "Property ID / CTS No",
        confidence: pId?.plotNumber?.confidence || pId?.surveyNumber?.confidence,
        value: pId?.plotNumber?.value || pId?.surveyNumber?.value,
        evidence: pId?.plotNumber?.evidence || pId?.surveyNumber?.evidence,
        isMono: true,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.parcelIdentifiers) prev.parcelIdentifiers = {};
            prev.parcelIdentifiers.plotNumber = {
              value: val,
              confidence: 100,
              evidence: prev.parcelIdentifiers.plotNumber?.evidence || "Manual edit",
            };
            return prev;
          }),
      },
      {
        id: "ownerName",
        name: "Registered Owner Name",
        confidence: primaryOwner?.confidence,
        value: primaryOwner?.name,
        evidence: primaryOwner?.evidence,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.owners || prev.owners.length === 0) {
              prev.owners = [
                {
                  surveyNumber: "",
                  subDivision: "",
                  khataNumber: "",
                  name: val,
                  relationshipType: "",
                  relativeName: "",
                  share: "",
                  ownershipType: "",
                  idReference: "",
                  confidence: 100,
                  evidence: "Manual edit",
                },
              ];
            } else {
              prev.owners[0].name = val;
              prev.owners[0].confidence = 100;
            }
            return prev;
          }),
      },
      {
        id: "relationshipType",
        name: "Relationship Type",
        confidence: primaryOwner?.confidence,
        value: primaryOwner?.relationshipType || "Son of",
        evidence: primaryOwner?.evidence,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (prev.owners?.[0]) prev.owners[0].relationshipType = val;
            return prev;
          }),
      },
      {
        id: "relativeName",
        name: "Father / Husband Name",
        confidence: primaryOwner?.confidence,
        value: primaryOwner?.relativeName,
        evidence: primaryOwner?.evidence,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (prev.owners?.[0]) prev.owners[0].relativeName = val;
            return prev;
          }),
      },
      {
        id: "usage",
        name: "Land / Building Usage",
        confidence: extent?.landClassification?.confidence,
        value: extent?.landClassification?.value || "Urban Residential",
        evidence: extent?.landClassification?.evidence,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.extent) prev.extent = {};
            prev.extent.landClassification = {
              value: val,
              confidence: 100,
              evidence: prev.extent.landClassification?.evidence || "Manual edit",
            };
            return prev;
          }),
      },
      {
        id: "totalArea",
        name: "Built-up / Plot Area",
        confidence: extent?.totalArea?.confidence,
        value: extent?.totalArea?.value ? `${extent.totalArea.value} ${extent.areaUnit?.value || "Sq. Mtr"}` : null,
        evidence: extent?.totalArea?.evidence,
        isMono: true,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.extent) prev.extent = {};
            prev.extent.totalArea = {
              value: val,
              confidence: 100,
              evidence: prev.extent.totalArea?.evidence || "Manual edit",
            };
            return prev;
          }),
      },
      {
        id: "taxAssessment",
        name: "Property Tax Assessment",
        confidence: extent?.landRevenueTax?.confidence,
        value: extent?.landRevenueTax?.value,
        evidence: extent?.landRevenueTax?.evidence,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.extent) prev.extent = {};
            prev.extent.landRevenueTax = {
              value: val,
              confidence: 100,
              evidence: prev.extent.landRevenueTax?.evidence || "Manual edit",
            };
            return prev;
          }),
      },
      {
        id: "remarks",
        name: "Remarks & Encumbrances",
        value: data.remarks && data.remarks.length > 0 ? data.remarks.join("; ") : null,
        onChange: (val) =>
          handleUpdate((prev) => {
            prev.remarks = val ? val.split(";").map((s) => s.trim()) : [];
            return prev;
          }),
      },
    ];

    groups.push({
      title: "Property Card Details",
      subtitle: pId?.plotNumber?.value ? `CTS: ${pId.plotNumber.value}` : undefined,
      fields: propertyFields,
    });
  } else if (documentType === "parcel") {
    // Cadastral Parcel (parcels schema)
    const parcelFields: ExtractedFieldRow[] = [
      ...generalFields,
      {
        id: "surveyNumber",
        name: "Survey Number",
        confidence: pId?.surveyNumber?.confidence,
        value: pId?.surveyNumber?.value,
        evidence: pId?.surveyNumber?.evidence,
        isMono: true,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.parcelIdentifiers) prev.parcelIdentifiers = {};
            prev.parcelIdentifiers.surveyNumber = {
              value: val,
              confidence: 100,
              evidence: prev.parcelIdentifiers.surveyNumber?.evidence || "Manual edit",
            };
            return prev;
          }),
      },
      {
        id: "subDivision",
        name: "Sub-Division / Hissa",
        confidence: pId?.subDivision?.confidence,
        value: pId?.subDivision?.value,
        evidence: pId?.subDivision?.evidence,
        isMono: true,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.parcelIdentifiers) prev.parcelIdentifiers = {};
            prev.parcelIdentifiers.subDivision = {
              value: val,
              confidence: 100,
              evidence: prev.parcelIdentifiers.subDivision?.evidence || "Manual edit",
            };
            return prev;
          }),
      },
      {
        id: "plotNumber",
        name: "Plot Number",
        confidence: pId?.plotNumber?.confidence,
        value: pId?.plotNumber?.value,
        evidence: pId?.plotNumber?.evidence,
        isMono: true,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.parcelIdentifiers) prev.parcelIdentifiers = {};
            prev.parcelIdentifiers.plotNumber = {
              value: val,
              confidence: 100,
              evidence: prev.parcelIdentifiers.plotNumber?.evidence || "Manual edit",
            };
            return prev;
          }),
      },
      {
        id: "totalArea",
        name: "Total Extent Area",
        confidence: extent?.totalArea?.confidence,
        value: extent?.totalArea?.value ? `${extent.totalArea.value} ${extent.areaUnit?.value || "Ha"}` : null,
        evidence: extent?.totalArea?.evidence,
        isMono: true,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.extent) prev.extent = {};
            prev.extent.totalArea = {
              value: val,
              confidence: 100,
              evidence: prev.extent.totalArea?.evidence || "Manual edit",
            };
            return prev;
          }),
      },
      {
        id: "landClassification",
        name: "Land Classification",
        confidence: extent?.landClassification?.confidence,
        value: extent?.landClassification?.value,
        evidence: extent?.landClassification?.evidence,
        onChange: (val) =>
          handleUpdate((prev) => {
            if (!prev.extent) prev.extent = {};
            prev.extent.landClassification = {
              value: val,
              confidence: 100,
              evidence: prev.extent.landClassification?.evidence || "Manual edit",
            };
            return prev;
          }),
      },
      {
        id: "cultivatedArea",
        name: "Cultivated Extent",
        confidence: extent?.cultivatedArea?.confidence,
        value: extent?.cultivatedArea?.value,
        evidence: extent?.cultivatedArea?.evidence,
        isMono: true,
      },
    ];

    groups.push({
      title: "Cadastral Parcel Identification",
      subtitle: pId?.surveyNumber?.value ? `Survey No: ${pId.surveyNumber.value}` : undefined,
      fields: parcelFields,
    });
  } else if (documentType === "mutation") {
    // Mutation / Transfer
    const mut = data.mutationInformation;
    const mutationFields: ExtractedFieldRow[] = [
      ...generalFields,
      {
        id: "mutationNumber",
        name: "Mutation Order Number",
        confidence: mut?.mutationNumber?.confidence,
        value: mut?.mutationNumber?.value,
        evidence: mut?.mutationNumber?.evidence,
        isMono: true,
      },
      {
        id: "mutationDate",
        name: "Mutation Date",
        confidence: mut?.mutationDate?.confidence,
        value: mut?.mutationDate?.value,
        evidence: mut?.mutationDate?.evidence,
      },
      {
        id: "mutationType",
        name: "Transfer / Transaction Type",
        confidence: mut?.mutationType?.confidence,
        value: mut?.mutationType?.value,
        evidence: mut?.mutationType?.evidence,
      },
      {
        id: "transferor",
        name: "Transferor / Previous Owner",
        confidence: mut?.transferorOrPreviousOwner?.confidence,
        value: mut?.transferorOrPreviousOwner?.value,
        evidence: mut?.transferorOrPreviousOwner?.evidence,
      },
      {
        id: "transferee",
        name: "Transferee / New Owner",
        confidence: data.owners?.[0]?.confidence,
        value: data.owners?.[0]?.name,
        evidence: data.owners?.[0]?.evidence,
      },
      {
        id: "authority",
        name: "Sanctioning Authority",
        confidence: mut?.approvalAuthority?.confidence,
        value: mut?.approvalAuthority?.value,
        evidence: mut?.approvalAuthority?.evidence,
      },
    ];

    groups.push({
      title: "Mutation Information",
      subtitle: mut?.mutationNumber?.value ? `Mutation: ${mut.mutationNumber.value}` : undefined,
      fields: mutationFields,
    });
  } else if (documentType === "account_holding") {
    // Account Holding (Khata / 8-A)
    const accFields: ExtractedFieldRow[] = [
      ...generalFields,
      {
        id: "accountNumber",
        name: "Account Number",
        confidence: pId?.khataNumber?.confidence,
        value: pId?.khataNumber?.value,
        evidence: pId?.khataNumber?.evidence,
        isMono: true,
      },
      {
        id: "ownerName",
        name: "Account Holder Name",
        confidence: data.owners?.[0]?.confidence,
        value: data.owners?.[0]?.name,
        evidence: data.owners?.[0]?.evidence,
      },
      {
        id: "relativeName",
        name: "Father / Husband Name",
        confidence: data.owners?.[0]?.confidence,
        value: data.owners?.[0]?.relativeName,
        evidence: data.owners?.[0]?.evidence,
      },
      {
        id: "totalArea",
        name: "Total Holding Area",
        confidence: extent?.totalArea?.confidence,
        value: extent?.totalArea?.value ? `${extent.totalArea.value} ${extent.areaUnit?.value || "Ha"}` : null,
        evidence: extent?.totalArea?.evidence,
        isMono: true,
      },
      {
        id: "taxAssessment",
        name: "Tax Assessment",
        confidence: extent?.landRevenueTax?.confidence,
        value: extent?.landRevenueTax?.value,
        evidence: extent?.landRevenueTax?.evidence,
      },
    ];

    groups.push({
      title: "Khata Account Holdings",
      subtitle: pId?.khataNumber?.value ? `Account: ${pId.khataNumber.value}` : undefined,
      fields: accFields,
    });
  } else {
    // Default & Multi-Record Documents (ownership / RoR / Jamabandi / cultivation)
    // 1. First add the general location / jurisdiction fields
    groups.push({
      title: "Jurisdiction & Location",
      subtitle: pId?.khataNumber?.value ? `Khata: ${pId.khataNumber.value}` : undefined,
      fields: generalFields,
    });

    // 2. Add Multi-Record groups if records exist
    const rawRecords = data.records && data.records.length > 0
      ? data.records
      : data.owners && data.owners.length > 0
      ? data.owners.map((o) => ({
          surveyNumber: o.surveyNumber || pId?.surveyNumber?.value || "",
          subDivision: o.subDivision || pId?.subDivision?.value || "",
          plotNumber: pId?.plotNumber?.value || "",
          khataNumber: o.khataNumber || pId?.khataNumber?.value || "",
          ownerName: o.name,
          relativeName: o.relativeName,
          relationshipType: o.relationshipType,
          address: "",
          area: extent?.totalArea?.value || "",
          areaUnit: extent?.areaUnit?.value || "Ha",
          natureOfPossession: o.ownershipType || "",
          landClassification: extent?.landClassification?.value || "",
          remarksOrEncumbrances: "",
          share: o.share,
          confidence: o.confidence,
          evidence: o.evidence,
        }))
      : [];

    if (rawRecords.length > 0) {
      rawRecords.forEach((rec, idx) => {
        const recordFields: ExtractedFieldRow[] = [
          {
            id: `ownerName_${idx}`,
            name: "Khatedar / Owner Name",
            confidence: rec.confidence,
            value: rec.ownerName,
            evidence: rec.evidence,
            onChange: (val) => updateRecordField(idx, "ownerName", val),
          },
          {
            id: `relationshipType_${idx}`,
            name: "Relationship Type",
            confidence: rec.confidence,
            value: rec.relationshipType || "Son of",
            evidence: rec.evidence,
            onChange: (val) => updateRecordField(idx, "relationshipType", val),
          },
          {
            id: `relativeName_${idx}`,
            name: "Father / Husband Name",
            confidence: rec.confidence,
            value: rec.relativeName,
            evidence: rec.evidence,
            onChange: (val) => updateRecordField(idx, "relativeName", val),
          },
          {
            id: `surveyNumber_${idx}`,
            name: "Survey / Plot Number",
            confidence: rec.confidence,
            value: rec.plotNumber || rec.surveyNumber,
            evidence: rec.evidence,
            isMono: true,
            onChange: (val) => updateRecordField(idx, "surveyNumber", val),
          },
          {
            id: `subDivision_${idx}`,
            name: "Sub-Division / Hissa",
            confidence: rec.confidence,
            value: rec.subDivision,
            evidence: rec.evidence,
            isMono: true,
            onChange: (val) => updateRecordField(idx, "subDivision", val),
          },
          {
            id: `area_${idx}`,
            name: "Plot Extent Area",
            confidence: rec.confidence,
            value: rec.area ? `${rec.area} ${rec.areaUnit || "Ha"}` : null,
            evidence: rec.evidence,
            isMono: true,
            onChange: (val) => updateRecordField(idx, "area", val),
          },
          {
            id: `landClassification_${idx}`,
            name: "Land Classification",
            confidence: rec.confidence,
            value: rec.landClassification || extent?.landClassification?.value,
            evidence: rec.evidence,
            onChange: (val) => updateRecordField(idx, "landClassification", val),
          },
          {
            id: `natureOfPossession_${idx}`,
            name: "Nature of Possession",
            confidence: rec.confidence,
            value: rec.natureOfPossession,
            evidence: rec.evidence,
            onChange: (val) => updateRecordField(idx, "natureOfPossession", val),
          },
          {
            id: `share_${idx}`,
            name: "Ownership Share",
            confidence: rec.confidence,
            value: rec.share,
            evidence: rec.evidence,
            isMono: true,
            onChange: (val) => updateRecordField(idx, "share", val),
          },
          {
            id: `address_${idx}`,
            name: "Address / Locality",
            confidence: rec.confidence,
            value: rec.address || loc?.village?.value,
            evidence: rec.evidence,
            onChange: (val) => updateRecordField(idx, "address", val),
          },
          {
            id: `remarks_${idx}`,
            name: "Remarks / Encumbrances",
            confidence: rec.confidence,
            value: rec.remarksOrEncumbrances,
            evidence: rec.evidence,
            onChange: (val) => updateRecordField(idx, "remarksOrEncumbrances", val),
          },
        ];

        groups.push({
          title: `Record ${idx + 1} of ${rawRecords.length}`,
          subtitle: rec.plotNumber || rec.surveyNumber ? `Survey/Plot: ${rec.plotNumber || rec.surveyNumber}` : undefined,
          fields: recordFields,
        });
      });
    }

    // 3. Add liabilities if present
    if (data.liabilities && data.liabilities.length > 0) {
      data.liabilities.forEach((liab, idx) => {
        groups.push({
          title: `Liability / Charge #${idx + 1}`,
          subtitle: liab.amount ? `Amount: ${liab.amount}` : undefined,
          fields: [
            {
              id: `inst_${idx}`,
              name: "Financial Institution",
              confidence: liab.confidence,
              value: liab.institution,
              evidence: liab.evidence,
            },
            {
              id: `amt_${idx}`,
              name: "Charge / Loan Amount",
              confidence: liab.confidence,
              value: liab.amount,
              evidence: liab.evidence,
              isMono: true,
            },
            {
              id: `desc_${idx}`,
              name: "Liability Description",
              confidence: liab.confidence,
              value: liab.description,
              evidence: liab.evidence,
            },
          ],
        });
      });
    }
  }

  return (
    <TooltipProvider delay={150}>
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            <TableRow className="border-b border-border">
              <TableHead className="w-[36%] text-xs font-semibold text-foreground py-2 px-3">
                Field Name
              </TableHead>
              <TableHead className="w-[18%] text-xs font-semibold text-foreground py-2 px-3">
                Confidence
              </TableHead>
              <TableHead className="w-[46%] text-xs font-semibold text-foreground py-2 px-3">
                Value
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {groups.map((group, groupIdx) => (
              <Fragment key={groupIdx}>
                {/* Clean Record Separator Row */}
                <TableRow className="bg-muted/40 hover:bg-muted/40 border-y border-border">
                  <TableCell colSpan={3} className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <HugeiconsIcon icon={Layers01Icon} className="size-3.5 text-primary" />
                        <span>{group.title}</span>
                      </span>
                      {group.subtitle && (
                        <span className="text-[11px] font-mono text-muted-foreground font-medium">
                          {group.subtitle}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>

                {/* Field Rows */}
                {group.fields.map((field) => (
                  <TableRow
                    key={field.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Column 1: Field Name + Source Hover */}
                    <TableCell className="py-2 px-3 text-xs font-medium text-muted-foreground align-middle">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{field.name}</span>
                        {field.evidence && (
                          <Tooltip>
                            <TooltipTrigger
                              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground bg-muted/60 hover:bg-muted/90 border border-border/60 transition-all cursor-help select-none"
                            >
                              src
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              sideOffset={8}
                              className="max-w-xs space-y-1.5 p-2.5"
                            >
                              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                                <span>OCR Evidence</span>
                              </div>
                              <div className="rounded bg-muted/50 p-2 text-[11px] font-mono leading-relaxed text-foreground border border-border/40 whitespace-pre-wrap break-words">
                                &ldquo;{field.evidence}&rdquo;
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>

                    {/* Column 2: Confidence */}
                    <TableCell className="py-2 px-3 align-middle">
                      {field.confidence !== undefined ? (
                        <FieldConfidenceBadge confidence={field.confidence} />
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          —
                        </span>
                      )}
                    </TableCell>

                    {/* Column 3: Value (Text or Full-Width Comfortable Input in Edit Mode) */}
                    <TableCell className="py-1.5 px-3 align-middle">
                      {isEditing && field.onChange ? (
                        <Input
                          value={field.value || ""}
                          onChange={(e) => field.onChange?.(e.target.value)}
                          className="h-8 text-xs bg-background w-full border-border focus-visible:ring-1"
                          placeholder={`Enter ${field.name.toLowerCase()}...`}
                        />
                      ) : (
                        <span
                          className={`text-xs ${
                            field.isMono
                              ? "font-mono font-medium"
                              : "font-semibold"
                          } text-foreground break-words`}
                        >
                          {field.value || "—"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
