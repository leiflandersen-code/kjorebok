/**
 * Generates app icons for iOS App Store from an SVG source.
 * Run: node scripts/generate-icons.mjs
 * Requires: npm install sharp
 */
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'fs'

// App icon SVG — car on dark green background
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <!-- Background -->
  <rect width="1024" height="1024" rx="230" fill="#0F172A"/>

  <!-- Glow -->
  <ellipse cx="512" cy="560" rx="320" ry="200" fill="#22c55e" opacity="0.08"/>

  <!-- Road line -->
  <rect x="470" y="580" width="84" height="16" rx="8" fill="#334155"/>
  <rect x="470" y="620" width="84" height="16" rx="8" fill="#334155"/>
  <rect x="470" y="660" width="84" height="16" rx="8" fill="#334155"/>

  <!-- Car body -->
  <rect x="280" y="490" width="464" height="180" rx="28" fill="#1E293B"/>

  <!-- Car roof -->
  <path d="M370 490 L420 360 L604 360 L654 490 Z" fill="#1E293B"/>
  <path d="M390 490 L432 380 L592 380 L634 490 Z" fill="#0F172A" opacity="0.5"/>

  <!-- Windows -->
  <rect x="408" y="388" width="90" height="88" rx="10" fill="#22c55e" opacity="0.25"/>
  <rect x="516" y="388" width="90" height="88" rx="10" fill="#22c55e" opacity="0.25"/>

  <!-- Green stripe -->
  <rect x="280" y="530" width="464" height="6" rx="3" fill="#22c55e"/>

  <!-- Wheels -->
  <circle cx="370" cy="668" r="58" fill="#0F172A" stroke="#334155" stroke-width="8"/>
  <circle cx="370" cy="668" r="32" fill="#1E293B"/>
  <circle cx="370" cy="668" r="12" fill="#22c55e"/>

  <circle cx="654" cy="668" r="58" fill="#0F172A" stroke="#334155" stroke-width="8"/>
  <circle cx="654" cy="668" r="32" fill="#1E293B"/>
  <circle cx="654" cy="668" r="12" fill="#22c55e"/>

  <!-- Headlights -->
  <rect x="280" y="530" width="36" height="24" rx="8" fill="#22c55e" opacity="0.9"/>
  <rect x="280" y="530" width="36" height="24" rx="8" fill="#ffffff" opacity="0.3"/>

  <!-- Taillights -->
  <rect x="708" y="530" width="36" height="24" rx="8" fill="#ef4444" opacity="0.8"/>

  <!-- Location pin above car -->
  <circle cx="512" cy="270" r="48" fill="#22c55e"/>
  <circle cx="512" cy="270" r="20" fill="#0F172A"/>
  <path d="M512 318 L492 290 L532 290 Z" fill="#22c55e"/>
</svg>`

const SIZES = [
  { size: 1024, name: 'icon-1024.png' },   // App Store
  { size: 180,  name: 'icon-180.png' },    // iPhone @3x
  { size: 167,  name: 'icon-167.png' },    // iPad Pro @2x
  { size: 152,  name: 'icon-152.png' },    // iPad @2x
  { size: 120,  name: 'icon-120.png' },    // iPhone @2x
  { size: 87,   name: 'icon-87.png' },     // iPhone Settings @3x
  { size: 80,   name: 'icon-80.png' },     // Spotlight @2x
  { size: 76,   name: 'icon-76.png' },     // iPad @1x
  { size: 60,   name: 'icon-60.png' },     // iPhone @1x
  { size: 58,   name: 'icon-58.png' },     // Settings @2x
  { size: 40,   name: 'icon-40.png' },     // Spotlight @1x
  { size: 29,   name: 'icon-29.png' },     // Settings @1x
  { size: 20,   name: 'icon-20.png' },     // Notification @1x
]

const outDir = 'public/icons'
mkdirSync(outDir, { recursive: true })

// Save SVG for reference
writeFileSync(`${outDir}/icon.svg`, SVG)
console.log('✓ SVG saved')

const svgBuffer = Buffer.from(SVG)

for (const { size, name } of SIZES) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(`${outDir}/${name}`)
  console.log(`✓ ${name} (${size}×${size})`)
}

console.log(`\nAlle ikoner lagret i ./${outDir}/`)
console.log('Last opp icon-1024.png til App Store Connect.')
