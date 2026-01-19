#!/usr/bin/env node
/**
 * Icon Generator - Creates all required icon sizes from a source image
 *
 * Usage:
 *   node scripts/generate-icons.js <brand>
 *
 * Example:
 *   node scripts/generate-icons.js crescent
 *
 * Prerequisites:
 *   npm install sharp --save-dev
 *
 * This script:
 * 1. Reads the source icon (1024x1024) from brands/{brand}/assets/icon.png
 * 2. Generates all Android mipmap sizes
 * 3. Generates all iOS icon sizes
 * 4. Copies icons to the correct locations
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const BRANDS_DIR = path.join(ROOT_DIR, 'brands');
const ANDROID_RES_DIR = path.join(ROOT_DIR, 'android', 'app', 'src');

// Parse arguments
const [, , brand] = process.argv;

if (!brand || brand === '--help' || brand === '-h') {
  console.log(`
Icon Generator - Generate app icons for all platforms

Usage:
  node scripts/generate-icons.js <brand>

Arguments:
  brand - Brand name (folder in brands/)

Prerequisites:
  npm install sharp --save-dev

Example:
  node scripts/generate-icons.js crescent
  `);
  process.exit(brand === '--help' || brand === '-h' ? 0 : 1);
}

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('Error: sharp is not installed.');
  console.error('Please run: npm install sharp --save-dev');
  process.exit(1);
}

// Validate brand exists
const brandDir = path.join(BRANDS_DIR, brand);
if (!fs.existsSync(brandDir)) {
  console.error(`Error: Brand "${brand}" not found in ${BRANDS_DIR}`);
  process.exit(1);
}

// Check source icon exists
const sourceIcon = path.join(brandDir, 'assets', 'icon.png');
if (!fs.existsSync(sourceIcon)) {
  console.error(`Error: Source icon not found: ${sourceIcon}`);
  console.error('Please add a 1024x1024 PNG icon to brands/{brand}/assets/icon.png');
  process.exit(1);
}

// Android icon sizes (mipmap folders)
const androidSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// iOS icon sizes
const iosSizes = [
  {size: 20, scales: [1, 2, 3]},
  {size: 29, scales: [1, 2, 3]},
  {size: 40, scales: [1, 2, 3]},
  {size: 60, scales: [2, 3]},
  {size: 76, scales: [1, 2]},
  {size: 83.5, scales: [2]},
  {size: 1024, scales: [1]},
];

/**
 * Main function
 */
async function generateIcons() {
  console.log('\n========================================');
  console.log('  Icon Generator');
  console.log('========================================');
  console.log(`  Brand: ${brand}`);
  console.log(`  Source: ${sourceIcon}`);
  console.log('========================================\n');

  // Generate Android icons
  await generateAndroidIcons();

  // Generate iOS icons
  await generateIOSIcons();

  console.log('\n========================================');
  console.log('  Icon generation complete!');
  console.log('========================================\n');
}

/**
 * Generate Android icons
 */
async function generateAndroidIcons() {
  console.log('Generating Android icons...');

  const androidBrandResDir = path.join(ANDROID_RES_DIR, brand, 'res');

  for (const [folder, size] of Object.entries(androidSizes)) {
    const outputDir = path.join(androidBrandResDir, folder);

    // Create directory if it doesn't exist
    fs.mkdirSync(outputDir, {recursive: true});

    // Generate regular icon
    const regularIconPath = path.join(outputDir, 'ic_launcher.png');
    await sharp(sourceIcon).resize(size, size).png().toFile(regularIconPath);

    // Generate round icon (circular mask)
    const roundIconPath = path.join(outputDir, 'ic_launcher_round.png');
    const roundedBuffer = await sharp(sourceIcon)
      .resize(size, size)
      .composite([
        {
          input: Buffer.from(
            `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`,
          ),
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();

    await sharp(roundedBuffer).toFile(roundIconPath);

    console.log(`  ${folder}: ${size}x${size}px`);
  }

  console.log(`  Output: ${androidBrandResDir}`);
}

/**
 * Generate iOS icons
 */
async function generateIOSIcons() {
  console.log('\nGenerating iOS icons...');

  const iosIconsDir = path.join(brandDir, 'assets', 'ios-icons');
  fs.mkdirSync(iosIconsDir, {recursive: true});

  // Contents.json for asset catalog
  const contentsJson = {
    images: [],
    info: {
      version: 1,
      author: 'brand-builder',
    },
  };

  for (const {size, scales} of iosSizes) {
    for (const scale of scales) {
      const pixelSize = Math.round(size * scale);
      const filename = `icon-${size}@${scale}x.png`;
      const iconPath = path.join(iosIconsDir, filename);

      await sharp(sourceIcon).resize(pixelSize, pixelSize).png().toFile(iconPath);

      // Determine idiom
      let idiom = 'iphone';
      if (size === 76 || size === 83.5) {
        idiom = 'ipad';
      }
      if (size === 1024) {
        idiom = 'ios-marketing';
      }

      contentsJson.images.push({
        size: `${size}x${size}`,
        idiom,
        filename,
        scale: `${scale}x`,
      });

      console.log(`  ${filename}: ${pixelSize}x${pixelSize}px`);
    }
  }

  // Write Contents.json
  const contentsPath = path.join(iosIconsDir, 'Contents.json');
  fs.writeFileSync(contentsPath, JSON.stringify(contentsJson, null, 2));

  console.log(`  Output: ${iosIconsDir}`);
  console.log(`\n  Note: Copy ios-icons folder to ios/CrescentParentApp/Images.xcassets/AppIcon.appiconset/`);
}

// Run
generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
