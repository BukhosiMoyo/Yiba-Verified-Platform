import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Workaround for Turbopack cache corruption issues
  // To use Webpack instead of Turbopack, run: npm run dev -- --webpack
  // Or update package.json script to: "dev": "next dev --webpack"
};

export default nextConfig;
