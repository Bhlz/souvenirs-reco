// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'turismo.guadalajaravisit.com' },
      // agrega otros hosts que realmente uses:
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
    ],
    // Si quieres evitar el optimizador de Next/Vercel temporalmente:
    // unoptimized: true,
  },
  experimental: { optimizePackageImports: ['lucide-react'] },

  // Para evitar el warning de "inferred workspace root" en ESM:
  // (usa process.cwd(), ya que __dirname no existe en .mjs)
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
