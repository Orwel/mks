"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/infrastructure/supabase/server";

function revalidatePublicSite() {
  for (const path of ["/", "/catalogo", "/carrito", "/landing2", "/landing3", "/landing4"]) {
    revalidatePath(path, "layout");
  }
}

export async function createAnnouncement(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  const display_mode = String(formData.get("display_mode") ?? "modal") as "modal" | "toast" | "bar";
  const frequency = String(formData.get("frequency") ?? "once_per_session") as
    | "once_per_session"
    | "once_per_user"
    | "always";
  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    cta_label: String(formData.get("cta_label") ?? "").trim() || null,
    cta_url: String(formData.get("cta_url") ?? "").trim() || null,
    display_mode,
    frequency,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
    starts_at: String(formData.get("starts_at") ?? "").trim() || null,
    ends_at: String(formData.get("ends_at") ?? "").trim() || null,
  });
  if (error) {
    console.error("[createAnnouncement]", error.message);
    return;
  }
  revalidatePath("/anuncios");
  revalidatePublicSite();
}

export async function updateAnnouncement(id: string, formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  const display_mode = String(formData.get("display_mode") ?? "modal") as "modal" | "toast" | "bar";
  const frequency = String(formData.get("frequency") ?? "once_per_session") as
    | "once_per_session"
    | "once_per_user"
    | "always";
  const { error } = await supabase
    .from("announcements")
    .update({
      title,
      body,
      image_url: String(formData.get("image_url") ?? "").trim() || null,
      cta_label: String(formData.get("cta_label") ?? "").trim() || null,
      cta_url: String(formData.get("cta_url") ?? "").trim() || null,
      display_mode,
      frequency,
      sort_order: Number(formData.get("sort_order") ?? 0) || 0,
      is_active: formData.get("is_active") === "on",
      starts_at: String(formData.get("starts_at") ?? "").trim() || null,
      ends_at: String(formData.get("ends_at") ?? "").trim() || null,
    })
    .eq("id", id);
  if (error) {
    console.error("[updateAnnouncement]", error.message);
    return;
  }
  revalidatePath("/anuncios");
  revalidatePublicSite();
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) {
    console.error("[deleteAnnouncement]", error.message);
    return;
  }
  revalidatePath("/anuncios");
  revalidatePublicSite();
}

export async function deleteAnnouncementForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteAnnouncement(id);
}
