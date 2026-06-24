import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep heavyweight Node-only packages out of the bundler so they load
  // natively at runtime (App Engine / server actions / route handlers).
  serverExternalPackages: ["firebase-admin", "@google-cloud/storage", "sharp"],
  images: {
    // Uploaded avatars are served from the public Cloud Storage bucket.
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;
