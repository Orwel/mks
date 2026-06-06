"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

export async function deleteContactMessage(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.from("contact_messages").delete().eq("id", id);
  revalidatePath("/contacto");
}
