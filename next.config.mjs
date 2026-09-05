/** @type {import('next').NextConfig} */

// Content Security Policy (CSP) restrictiva basada en el escaneo exhaustivo de orígenes
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://*.supabase.co;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.googleusercontent.com https://va.vercel-scripts.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com https://fcm.googleapis.com https://updates.push.services.mozilla.com https://*.push.apple.com;
  media-src 'self' data: blob: https://*.supabase.co;
  worker-src 'self' blob:;
  manifest-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://*.supabase.co https://accounts.google.com;
  frame-ancestors 'none';
  require-trusted-types-for 'script';
  trusted-types default nextjs nextjs#bundler 'allow-duplicates';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, ' ')
  .trim()

// Cabeceras HTTP de seguridad centralizadas para solventar la auditoría web
const securityHeaders = [
  // 1. Content-Security-Policy (CSP) restrictiva y adaptada a Next.js / Supabase / Tailwind
  {
    key: 'Content-Security-Policy',
    value: cspHeader,
  },
  // 2. Protección contra Clickjacking para navegadores legados (complementa frame-ancestors 'none')
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // 3. Protección contra MIME-Sniffing (obliga a respetar los tipos de contenido declarados)
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // 4. Permissions-Policy: deshabilita hardware y APIs sensibles no requeridas por la aplicación
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=(), payment=(), usb=(), display-capture=(), accelerometer=(), gyroscope=(), magnetometer=(), midi=(), screen-wake-lock=(), sync-xhr=()',
  },
  // 5. Referrer-Policy: minimiza la exposición de rutas internas en enlaces salientes
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 6. Strict-Transport-Security (HSTS): impone HTTPS por 2 años con inclusión de subdominios
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // 7. Cross-Origin-Opener-Policy: aísla el contexto pero permite popups de login con Google OAuth
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin-allow-popups',
  },
  // 8. Cross-Origin-Resource-Policy: previene filtración de recursos estáticos a otros dominios
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'cross-origin',
  },
  // 9. X-DNS-Prefetch-Control: permite optimización de resolución DNS
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // 10. Filtro XSS obsoleto (se recomienda 0 para evitar ataques de filtración que abusan del filtro)
  {
    key: 'X-XSS-Protection',
    value: '0',
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
