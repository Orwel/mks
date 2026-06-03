import type { NextConfig } from "next";

import { imageRemotePatterns } from "./src/shared/constants/next-image-remotes";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/brand/favicon.png",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: imageRemotePatterns,
  },
};

export default nextConfig;
