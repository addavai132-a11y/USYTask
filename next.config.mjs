/** @type {import('next').NextConfig} */

// Content Security Policy (CSP) restrictiva basada en el escaneo exhaustivo de orígenes
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel.app;
  object-src 'none';
  base-uri 'self';
  frame-src 'none';
  frame-ancestors 'none';
  form-action 'self';
`
  .replace(/\s{2,}/g, ' ')
  .trim()

// Cabeceras HTTP de seguridad centralizadas para solventar la auditoría web
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspHeader,
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
]

const nextConfig = {
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Aplica todas las cabeceras de seguridad a todas las rutas y respuestas del servidor
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
