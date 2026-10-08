const nextConfig = {
  distDir: process.env.CODEFORGE_BUILD_DIR || ".next",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default nextConfig;
