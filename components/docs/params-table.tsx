import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export interface ParamItem {
  name: string;
  type: string;
  required?: boolean;
  defaultValue?: string;
  description: React.ReactNode;
  allowedValues?: string[];
}

interface ParamsTableProps {
  parameters: ParamItem[];
  className?: string;
  nameColumnLabel?: string;
}

export function ParamsTable({
  parameters,
  className,
  nameColumnLabel = "Field",
}: ParamsTableProps) {
  if (!parameters || parameters.length === 0) {
    return null;
  }

  return (
    <div className={`overflow-hidden rounded-lg border border-border ${className ?? ""}`}>
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[190px] font-medium text-foreground">
              {nameColumnLabel}
            </TableHead>
            <TableHead className="w-[140px] font-medium text-foreground">
              Type
            </TableHead>
            <TableHead className="font-medium text-foreground">
              Description &amp; Constraints
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parameters.map((param) => (
            <TableRow key={param.name} className="hover:bg-muted/30">
              <TableCell className="align-top font-mono text-xs font-semibold text-foreground">
                <div className="flex flex-col gap-1 items-start">
                  <span>{param.name}</span>
                  {param.required !== undefined && (
                    param.required ? (
                      <Badge
                        variant="destructive"
                        className="px-1.5 py-0 text-[10px] font-mono uppercase tracking-wider"
                      >
                        Required
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 text-[10px] font-mono text-muted-foreground uppercase tracking-wider"
                      >
                        Optional
                      </Badge>
                    )
                  )}
                </div>
              </TableCell>
              <TableCell className="align-top font-mono text-xs text-muted-foreground">
                <div className="flex flex-col gap-0.5">
                  <span className="text-foreground/90">{param.type}</span>
                  {param.defaultValue && (
                    <span className="text-[11px] text-muted-foreground">
                      default: {param.defaultValue}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="align-top text-xs leading-relaxed text-muted-foreground">
                <div className="space-y-1.5">
                  <div className="text-foreground/90">{param.description}</div>
                  {param.allowedValues && param.allowedValues.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[11px] text-muted-foreground">Allowed values:</span>
                      {param.allowedValues.map((val) => (
                        <code
                          key={val}
                          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                        >
                          {val}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
