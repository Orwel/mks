import {
  buildLegalMetadata,
  LegalDocumentPage,
} from "@/presentation/components/legal/legal-document-page";

// El texto vive en `legal_documents` (is_current). Se revalida cada hora y al
// publicar una versión nueva desde el panel (revalidatePath en /legal).
export const revalidate = 3600;

export async function generateMetadata() {
  return buildLegalMetadata("privacy");
}

export default async function PrivacidadPage() {
  return <LegalDocumentPage type="privacy" />;
}
