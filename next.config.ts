import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    additionalData: '@use "@/styles/tokens" as *;',
  },
};

export default nextConfig;
