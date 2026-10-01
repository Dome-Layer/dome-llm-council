const { withSentryConfig } = require("@sentry/nextjs");

/**
 * A static export (Sprint H phase 2): Cloudflare serves out/ as static assets and the Worker in
 * worker/ adds the per-request CSP nonce and the security headers that middleware.ts and
 * vercel.json used to set. Nothing here may need a server at request time.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  disableSourceMapUpload: true,
});
