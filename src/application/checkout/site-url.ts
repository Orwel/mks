import { getClientEnv } from "@/shared/config/env";

export function getSiteUrl(): string {
  const url = getClientEnv().NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}
