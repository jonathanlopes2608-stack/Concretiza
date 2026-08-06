import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["tesseract.js", "pdf-parse"],
};

export default nextConfig;
