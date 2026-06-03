/** Debe coincidir con `images.remotePatterns` en `next.config.ts`. */
export const imageRemotePatterns = [
  {
    protocol: "https" as const,
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
];
