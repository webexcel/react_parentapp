#!/usr/bin/env node
/**
 * Switch Brand - Quick brand switching for development
 *
 * Usage:
 *   node scripts/switch-brand.js <brand>
 *
 * Example:
 *   node scripts/switch-brand.js crescent
 *   node scripts/switch-brand.js stmarys
 *
 * This script:
 * 1. Updates BRAND_ID in .env (all other config comes from brand.config.json)
 * 2. Copies Firebase configurations
 * 3. Displays build instructions
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const BRANDS_DIR = path.join(ROOT_DIR, 'brands');
const ANDROID_APP_DIR = path.join(ROOT_DIR, 'android', 'app');
const IOS_DIR = path.join(ROOT_DIR, 'ios');

// Parse arguments
const [, , brand] = process.argv;

if (!brand || brand === '--help' || brand === '-h') {
  console.log(`
Switch Brand - Quick brand switching for development

Usage:
  node scripts/switch-brand.js <brand>

Arguments:
  brand - Brand name (folder in brands/)

Example:
  node scripts/switch-brand.js crescent

Available brands:
${getAvailableBrands()
  .map(b => `  - ${b}`)
  .join('\n')}
  `);
  process.exit(brand === '--help' || brand === '-h' ? 0 : 1);
}

// Validate brand exists
const brandDir = path.join(BRANDS_DIR, brand);
if (!fs.existsSync(brandDir)) {
  console.error(`Error: Brand "${brand}" not found in ${BRANDS_DIR}`);
  console.error(`\nAvailable brands:\n${getAvailableBrands().join(', ')}`);
  process.exit(1);
}

console.log('\n========================================');
console.log(`  Switching to: ${brand}`);
console.log('========================================\n');

// Update BRAND_ID in .env file (preserve other values like API_BASE_URL override and secrets)
const envDest = path.join(ROOT_DIR, '.env');
let envContent = '';

if (fs.existsSync(envDest)) {
  envContent = fs.readFileSync(envDest, 'utf8');
  // Update BRAND_ID if it exists, otherwise add it
  if (envContent.includes('BRAND_ID=')) {
    envContent = envContent.replace(/BRAND_ID=.*/g, `BRAND_ID=${brand}`);
  } else {
    envContent = `BRAND_ID=${brand}\n${envContent}`;
  }
} else {
  // Create new .env with just BRAND_ID
  envContent = `# Brand Configuration\nBRAND_ID=${brand}\n\n# Optional: Override API URL for local development\n# API_BASE_URL=http://localhost:3005/api\n`;
}

fs.writeFileSync(envDest, envContent);
console.log(`Environment: BRAND_ID set to "${brand}"`);

// Copy Firebase configs
const firebaseAndroid = path.join(brandDir, 'assets', 'google-services.json');
const firebaseIOS = path.join(brandDir, 'assets', 'GoogleService-Info.plist');

if (fs.existsSync(firebaseAndroid)) {
  fs.copyFileSync(
    firebaseAndroid,
    path.join(ANDROID_APP_DIR, 'google-services.json'),
  );
  console.log('Firebase: google-services.json copied');
} else {
  console.warn('Warning: google-services.json not found');
}

if (fs.existsSync(firebaseIOS)) {
  fs.copyFileSync(firebaseIOS, path.join(IOS_DIR, 'GoogleService-Info.plist'));
  console.log('Firebase: GoogleService-Info.plist copied');
} else {
  console.warn('Warning: GoogleService-Info.plist not found');
}

console.log('\n========================================');
console.log('  Brand switched successfully!');
console.log('========================================');
console.log(`
To run the app:

  Android:
    npx react-native run-android --variant=${brand}Debug

  iOS:
    npx react-native run-ios

  Or use npm scripts:
    npm run android:${brand}
`);

/**
 * Get list of available brands
 */
function getAvailableBrands() {
  if (!fs.existsSync(BRANDS_DIR)) return [];
  return fs
    .readdirSync(BRANDS_DIR)
    .filter(
      dir =>
        !dir.startsWith('_') &&
        !dir.startsWith('.') &&
        fs.statSync(path.join(BRANDS_DIR, dir)).isDirectory(),
    );
}
