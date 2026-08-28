/**
 * generate-icons.mjs
 * Generates all required PWA icon PNGs from the SVG using sharp.
 * Run with: node generate-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, 'public')
const svgBuffer = readFileSync(path.join(publicDir, 'icon.svg'))

const icons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'icon-maskable-192.png', size: 192 },
  { name: 'icon-maskable-512.png', size: 512 },
  // Apple Touch Icons (iOS Homescreen & Splash)
  { name: 'apple-icon.png', size: 180 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-precomposed.png', size: 180 },
  // Favicons
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon.png', size: 48 },
]

for (const icon of icons) {
  await sharp(svgBuffer)
    .resize(icon.size, icon.size)
    .png()
    .toFile(path.join(publicDir, icon.name))
  console.log(`✅ Generated: /public/${icon.name} (${icon.size}x${icon.size})`)
}

console.log('\n🎉 All icons generated successfully!')
