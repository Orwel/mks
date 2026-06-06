import { createSupabaseServerClient } from "@/infrastructure/supabase/server";
import {
  ContactMessagesAdmin,
  type ContactMessageRow,
} from "@/presentation/components/dashboard/contact-messages-admin";
import { DashboardPageHeader } from "@/presentation/components/layout/dashboard-page-header";

export default async function DashboardContactoPage() {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, created_at")
    .order("created_at", { ascending: false });

  const messages = (rows ?? []) as ContactMessageRow[];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Contáctanos"
        description="Mensajes enviados desde el formulario público de contacto."
      />
      {error ? <p className="text-sm font-bold text-[var(--mks-pink)]">{error.message}</p> : null}
      <ContactMessagesAdmin messages={messages} />
    </div>
  );
}
