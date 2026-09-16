import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import * as apiKeysService from "@/lib/services/api-keys.service";
import { ApiKeysView } from "@/components/api-keys/api-keys-view";

export const metadata = {
  title: "API Keys | BhuSamanvay",
  description: "Manage service tokens and M2M authentication for external systems",
};

export default async function ApiKeysPage() {
  const authResult = await requireAuth();

  if (!authResult.success) {
    redirect("/auth/sign-in");
  }

  const listResult = await apiKeysService.list();
  const initialKeys = listResult.success ? listResult.data : [];

  return <ApiKeysView initialKeys={initialKeys} user={authResult.data} />;
}
