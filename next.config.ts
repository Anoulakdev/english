import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  basePath: isProd ? "/english" : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/english" : "",
  },
};

export default nextConfig;

