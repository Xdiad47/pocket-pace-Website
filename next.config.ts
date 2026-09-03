import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin's dependency tree doesn't bundle cleanly for serverless
  // functions — this tells Next.js to leave it as a plain Node require()
  // instead, resolved from node_modules at runtime.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
