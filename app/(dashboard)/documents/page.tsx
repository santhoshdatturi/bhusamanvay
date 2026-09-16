import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DocumentListView } from "@/components/documents/document-list-view";
import * as documentsService from "@/lib/services/documents.service";

export const metadata = {
  title: "Documents | BhuSamanvay",
  description: "Land Record Digitization & Verification Workspace",
};

export default async function DocumentsPage() {
  const authResult = await requireAuth();

  if (!authResult.success) {
    redirect("/auth/sign-in");
  }

  // Fetch initial documents & KPI stats
  const listResult = await documentsService.list({ page: 1, limit: 20 });
  const initialData = listResult.success ? listResult.data : null;

  return (
    <DocumentListView
      initialDocuments={initialData?.documents || []}
      initialStats={initialData?.stats}
      user={authResult.data}
    />
  );
}
