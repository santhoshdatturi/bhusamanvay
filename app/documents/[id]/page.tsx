import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { DocumentWorkspace } from "@/components/documents/document-workspace";
import * as documentsService from "@/lib/services/documents.service";
import * as filesService from "@/lib/services/files.service";

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DocumentPageProps) {
  const { id } = await params;
  const docResult = await documentsService.get(id);
  if (!docResult.success) {
    return {
      title: "Document Not Found | BhuSamanvay",
    };
  }

  return {
    title: `${docResult.data.fileName} | BhuSamanvay`,
    description: `Digitized Land Record extraction for ${docResult.data.fileName}`,
  };
}

export default async function DocumentDetailPage({ params }: DocumentPageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;

  // 1. Fetch document record
  const docResult = await documentsService.get(id);
  if (!docResult.success) {
    notFound();
  }
  const document = docResult.data;

  // 2. Fetch file download URL for viewing
  let downloadUrl: string | null = null;
  try {
    const fileResult = await filesService.getDownloadUrl(document.fileId);
    if (fileResult.success) {
      downloadUrl = fileResult.data.downloadUrl;
    }
  } catch {
    // S3 or presigned URL gracefully handled
  }

  return (
    <DocumentWorkspace
      initialDocument={document}
      initialDownloadUrl={downloadUrl}
    />
  );
}
