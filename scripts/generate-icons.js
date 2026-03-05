#!/usr/bin/env node

/**
 * Icon Generation Script
 * Generates all required icon sizes from icon.png using Sharp
 * 
 * Installation: npm install sharp
 * Usage: node scripts/generate-icons.js
 * 
 * Generates:
 * - favicon-32x32.png, favicon-96x96.png
 * - android-icon-36x36.png through android-icon-192x192.png
 * - apple-icon-*.png (57x57 through 180x180)
 * - ms-icon-*.png (70x70, 150x150, 310x310)
 */

const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const SOURCE_ICON = path.join(__dirname, '../public/icon.png')
const PUBLIC_DIR = path.join(__dirname, '../public')

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
}

const ICON_CONFIGS = [
  // Favicon sizes
  { size: 32, name: 'favicon-32x32.png' },
  { size: 96, name: 'favicon-96x96.png' },
  
  // Android Chrome icons
  { size: 36, name: 'android-icon-36x36.png' },
  { size: 48, name: 'android-icon-48x48.png' },
  { size: 72, name: 'android-icon-72x72.png' },
  { size: 96, name: 'android-icon-96x96.png' },
  { size: 144, name: 'android-icon-144x144.png' },
  { size: 192, name: 'android-icon-192x192.png' },
  
  // Apple Touch Icons (iOS home screen)
  { size: 57, name: 'apple-icon-57x57.png' },
  { size: 60, name: 'apple-icon-60x60.png' },
  { size: 72, name: 'apple-icon-72x72.png' },
  { size: 76, name: 'apple-icon-76x76.png' },
  { size: 114, name: 'apple-icon-114x114.png' },
  { size: 120, name: 'apple-icon-120x120.png' },
  { size: 144, name: 'apple-icon-144x144.png' },
  { size: 152, name: 'apple-icon-152x152.png' },
  { size: 180, name: 'apple-icon-180x180.png' },
  { size: 192, name: 'apple-icon-192x192.png' },
  
  // Generic apple icon (default fallback)
  { size: 180, name: 'apple-icon.png' },
  
  // Windows Tiles / MS Icons
  { size: 70, name: 'ms-icon-70x70.png' },
  { size: 150, name: 'ms-icon-150x150.png' },
  { size: 310, name: 'ms-icon-310x310.png' },
]

async function generateIcons() {
  try {
    console.log('🎨 Starting icon generation...')
    console.log(`📦 Source: ${SOURCE_ICON}`)
    console.log(`📁 Output: ${PUBLIC_DIR}\n`)

    // Check if source icon exists
    if (!fs.existsSync(SOURCE_ICON)) {
      console.error(`❌ Error: Source icon not found at ${SOURCE_ICON}`)
      console.error('   Please ensure icon.png exists in /public directory')
      process.exit(1)
    }

    let successCount = 0
    let errorCount = 0

    for (const config of ICON_CONFIGS) {
      try {
        const outputPath = path.join(PUBLIC_DIR, config.name)
        
        await sharp(SOURCE_ICON)
          .resize(config.size, config.size, {
            fit: 'cover',
            position: 'center',
          })
          .png({ quality: 90 })
          .toFile(outputPath)

        console.log(`✅ Generated: ${config.name} (${config.size}x${config.size})`)
        successCount++
      } catch (error) {
        console.error(`❌ Failed: ${config.name}`)
        console.error(`   Error: ${error.message}`)
        errorCount++
      }
    }

    console.log(`\n📊 Generation complete!`)
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`\n🚀 All icons are ready at /public/\n`)

    if (errorCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

generateIcons()
