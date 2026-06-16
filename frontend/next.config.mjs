import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Avoid devtools segment explorer RSC manifest errors in npm workspaces.
  devIndicators: false,
  experimental: {
    devtoolSegmentExplorer: false,
  },
  // Standalone output is for production Docker builds only; using it in dev
  // can corrupt the .next cache and break `next dev`.
  ...(process.env.NODE_ENV === "production"
    ? { output: "standalone" }
    : {}),
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
