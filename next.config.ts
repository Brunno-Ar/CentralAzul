import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? "C:/tmp/central-azul-next" : ".next",
};

export default nextConfig;
