#!/usr/bin/env node
/**
 * Brand Builder - Main build orchestrator for white-label builds
 *
 * Usage:
 *   node scripts/brand-builder.js <brand> <platform> [buildType]
 *
 * Examples:
 *   node scripts/brand-builder.js crescent android debug
 *   node scripts/brand-builder.js stmarys android release
 *   node scripts/brand-builder.js greenvalley ios release
 *
 * This script:
 * 1. Validates the brand exists
 * 2. Copies environment files
 * 3. Copies Firebase configuration
 * 4. Runs the platform-specific build
 */

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const BRANDS_DIR = path.join(ROOT_DIR, 'brands');
const ANDROID_APP_DIR = path.join(ROOT_DIR, 'android', 'app');
const IOS_DIR = path.join(ROOT_DIR, 'ios');

// Parse arguments
const [, , brand, platform, buildType = 'debug'] = process.argv;

// Help text
if (!brand || !platform || brand === '--help' || brand === '-h') {
  console.log(`
Brand Builder - White-label build system

Usage:
  node scripts/brand-builder.js <brand> <platform> [buildType]

Arguments:
  brand      - Brand name (folder in brands/)
  platform   - Target platform: android | ios
  buildType  - Build type: debug | release (default: debug)

Examples:
  node scripts/brand-builder.js crescent android debug
  node scripts/brand-builder.js stmarys android release
  node scripts/brand-builder.js greenvalley ios release

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

// Load brand config
const configPath = path.join(brandDir, 'brand.config.json');
if (!fs.existsSync(configPath)) {
  console.error(`Error: brand.config.json not found for ${brand}`);
  process.exit(1);
}

let brandConfig;
try {
  brandConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error(`Error: Invalid JSON in brand.config.json: ${e.message}`);
  process.exit(1);
}

// Banner
console.log('\n========================================');
console.log(`  Brand Builder`);
console.log('========================================');
console.log(`  Brand:     ${brandConfig.brand.name}`);
console.log(`  Platform:  ${platform}`);
console.log(`  Build:     ${buildType}`);
console.log('========================================\n');

// Step 1: Copy environment file
const envFileName =
  buildType === 'release' ? '.env.production' : '.env.development';
const envSource = path.join(brandDir, 'env', envFileName);
const envDest = path.join(ROOT_DIR, '.env');

if (fs.existsSync(envSource)) {
  console.log(`[1/3] Copying environment: ${envFileName}`);
  fs.copyFileSync(envSource, envDest);
} else {
  console.warn(`Warning: Environment file not found: ${envSource}`);
}

// Step 2: Copy Firebase config
console.log('[2/3] Copying Firebase configuration...');
copyFirebaseConfig(brand, platform);

// Step 3: Build
console.log(`[3/3] Building ${platform} ${buildType}...`);
if (platform === 'android') {
  buildAndroid(brand, buildType);
} else if (platform === 'ios') {
  buildIOS(brand, buildType, brandConfig);
} else {
  console.error(`Error: Unknown platform: ${platform}`);
  console.error('Valid platforms: android, ios');
  process.exit(1);
}

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
        fs.statSync(path.join(BRANDS_DIR, dir)).isDirectory(),
    );
}

/**
 * Copy Firebase configuration for the brand
 */
function copyFirebaseConfig(brandName, targetPlatform) {
  const brandAssetsDir = path.join(BRANDS_DIR, brandName, 'assets');

  if (targetPlatform === 'android' || targetPlatform === 'both') {
    const androidSource = path.join(brandAssetsDir, 'google-services.json');
    const androidDest = path.join(ANDROID_APP_DIR, 'google-services.json');

    if (fs.existsSync(androidSource)) {
      fs.copyFileSync(androidSource, androidDest);
      console.log('  - Android: google-services.json copied');
    } else {
      console.warn('  - Warning: google-services.json not found');
    }
  }

  if (targetPlatform === 'ios' || targetPlatform === 'both') {
    const iosSource = path.join(brandAssetsDir, 'GoogleService-Info.plist');
    const iosDest = path.join(IOS_DIR, 'GoogleService-Info.plist');

    if (fs.existsSync(iosSource)) {
      fs.copyFileSync(iosSource, iosDest);
      console.log('  - iOS: GoogleService-Info.plist copied');
    } else {
      console.warn('  - Warning: GoogleService-Info.plist not found');
    }
  }
}

/**
 * Build Android app
 */
function buildAndroid(brandName, type) {
  // Capitalize first letter for Gradle task
  const flavorName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
  const buildTypeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);

  // Gradle task: assembleCrescentDebug or assembleCrescentRelease
  const gradleTask = `assemble${flavorName}${buildTypeCapitalized}`;

  const gradleWrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
  console.log(`\nRunning: ${gradleWrapper} ${gradleTask}\n`);

  try {
    execSync(`${gradleWrapper} ${gradleTask}`, {
      stdio: 'inherit',
      env: {...process.env},
      cwd: path.join(ROOT_DIR, 'android'),
    });

    // Find output APK
    const apkDir = path.join(
      ANDROID_APP_DIR,
      'build',
      'outputs',
      'apk',
      brandName,
      type,
    );
    const apkName = `app-${brandName}-${type}.apk`;
    const apkPath = path.join(apkDir, apkName);

    if (fs.existsSync(apkPath)) {
      console.log('\n========================================');
      console.log('  BUILD SUCCESSFUL!');
      console.log('========================================');
      console.log(`  APK: ${apkPath}`);
      console.log('========================================\n');
    }
  } catch (error) {
    console.error('\nBuild failed!');
    process.exit(1);
  }
}

/**
 * Build iOS app
 */
function buildIOS(brandName, type, config) {
  const configuration = type === 'release' ? 'Release' : 'Debug';

  // Use the brand name from config for scheme (remove spaces)
  const schemeName = config.brand.name.replace(/\s+/g, '') + 'ParentApp';

  console.log(`\nBuilding iOS with scheme: ${schemeName}\n`);
  console.log('Note: iOS requires manual setup of build schemes in Xcode.');
  console.log('See documentation for iOS white-label setup.\n');

  try {
    // First, install pods
    console.log('Installing CocoaPods dependencies...');
    execSync(`cd "${IOS_DIR}" && pod install`, {
      stdio: 'inherit',
    });

    // Build
    console.log(`\nBuilding ${configuration}...`);
    execSync(
      `cd "${IOS_DIR}" && xcodebuild -workspace CrescentParentApp.xcworkspace -scheme "${schemeName}" -configuration ${configuration} -destination 'generic/platform=iOS' build`,
      {
        stdio: 'inherit',
      },
    );

    console.log('\n========================================');
    console.log('  BUILD SUCCESSFUL!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\nBuild failed!');
    console.error('For iOS, ensure you have set up the build schemes in Xcode.');
    process.exit(1);
  }
}
