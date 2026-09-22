import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuditExplorer } from "@/components/audit/audit-explorer";
import * as auditService from "@/lib/services/audit.service";

export const metadata = {
  title: "Audit Logs & Chain of Custody | BhuSamanvay",
  description: "DILRMP & Land Records Digitization Audit Trail & Verification Logs",
};

export default async function AuditPage() {
  const authResult = await requireAuth();

  if (!authResult.success) {
    redirect("/auth/sign-in");
  }

  const listResult = await auditService.list({ page: 1, limit: 20 });
  const initialData = listResult.success
    ? listResult.data
    : {
        logs: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
        stats: {
          total: 0,
          uploads: 0,
          extractions: 0,
          verifications: 0,
          commits: 0,
        },
      };

  return <AuditExplorer initialData={initialData} user={authResult.data} />;
}
