import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/run": ["./assets/fonts/*.woff"] },
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default nextConfig;
