import { imageRemotePatterns } from "@/shared/constants/next-image-remotes";

function matchHostname(pattern: string, hostname: string): boolean {
  if (pattern.startsWith("*.")) {
    const suffix = pattern.slice(1);
    const bare = pattern.slice(2);
    return hostname === bare || hostname.endsWith(suffix);
  }
  return hostname === pattern;
}

function matchPathname(pattern: string | undefined, pathname: string): boolean {
  if (!pattern) return true;
  if (pattern.endsWith("/**")) {
    return pathname.startsWith(pattern.slice(0, -3));
  }
  return pathname === pattern;
}

/** Indica si `next/image` puede optimizar esta URL según la config del proyecto. */
export function canUseNextImage(src: string): boolean {
  if (src.startsWith("/")) return true;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }

  return imageRemotePatterns.some(
    (p) =>
      url.protocol === `${p.protocol}:` &&
      matchHostname(p.hostname, url.hostname) &&
      matchPathname(p.pathname, url.pathname),
  );
}
