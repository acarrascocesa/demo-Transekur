import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  // Include locally compiled native bindings when npm used a source build.
  // Otherwise tracing can keep only a prebuilt binary that is incompatible
  // with the local Node/macOS runtime.
  outputFileTracingIncludes: {
    "/api/login": ["./node_modules/argon2/build/Release/*.node"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default config;
