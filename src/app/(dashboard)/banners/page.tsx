import { redirect } from "next/navigation";

/** Ruta legada: el contenido del hero se gestiona en Destacados. */
export default function LegacyBannersPage() {
  redirect("/destacados");
}
