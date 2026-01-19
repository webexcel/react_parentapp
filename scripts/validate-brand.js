#!/usr/bin/env node
/**
 * Brand Validator - Validates brand configuration and assets
 *
 * Usage:
 *   node scripts/validate-brand.js <brand>
 *   node scripts/validate-brand.js --all
 *
 * Examples:
 *   node scripts/validate-brand.js crescent
 *   node scripts/validate-brand.js --all
 *
 * This script checks:
 * - brand.config.json exists and is valid JSON
 * - Required fields are present
 * - Asset files exist
 * - Environment files exist
 */

const fs = require('fs');
const path = require('path');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const BRANDS_DIR = path.join(ROOT_DIR, 'brands');

// Parse arguments
const [, , brandArg] = process.argv;

if (!brandArg || brandArg === '--help' || brandArg === '-h') {
  console.log(`
Brand Validator - Validate brand configuration

Usage:
  node scripts/validate-brand.js <brand>
  node scripts/validate-brand.js --all

Arguments:
  brand  - Brand name (folder in brands/)
  --all  - Validate all brands

Example:
  node scripts/validate-brand.js crescent
  node scripts/validate-brand.js --all
  `);
  process.exit(brandArg === '--help' || brandArg === '-h' ? 0 : 1);
}

// Get brands to validate
let brandsToValidate = [];
if (brandArg === '--all') {
  brandsToValidate = getAvailableBrands();
  if (brandsToValidate.length === 0) {
    console.error('No brands found to validate.');
    process.exit(1);
  }
} else {
  brandsToValidate = [brandArg];
}

// Validate each brand
let hasErrors = false;
for (const brand of brandsToValidate) {
  const result = validateBrand(brand);
  if (!result.valid) {
    hasErrors = true;
  }
}

process.exit(hasErrors ? 1 : 0);

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

/**
 * Validate a single brand
 */
function validateBrand(brand) {
  const errors = [];
  const warnings = [];
  const brandDir = path.join(BRANDS_DIR, brand);

  console.log('\n========================================');
  console.log(`  Validating: ${brand}`);
  console.log('========================================');

  // Check brand directory exists
  if (!fs.existsSync(brandDir)) {
    console.error(`  ERROR: Brand directory not found: ${brandDir}`);
    return {valid: false, errors: ['Brand directory not found'], warnings: []};
  }

  // Check brand.config.json
  const configPath = path.join(brandDir, 'brand.config.json');
  if (!fs.existsSync(configPath)) {
    errors.push('Missing brand.config.json');
  } else {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      validateConfig(config, errors, warnings);
    } catch (e) {
      errors.push(`Invalid JSON in brand.config.json: ${e.message}`);
    }
  }

  // Check required assets
  const requiredAssets = ['assets/icon.png'];
  const optionalAssets = [
    'assets/logo.png',
    'assets/splash-logo.png',
    'assets/google-services.json',
    'assets/GoogleService-Info.plist',
  ];

  for (const asset of requiredAssets) {
    const assetPath = path.join(brandDir, asset);
    if (!fs.existsSync(assetPath)) {
      errors.push(`Missing required asset: ${asset}`);
    }
  }

  for (const asset of optionalAssets) {
    const assetPath = path.join(brandDir, asset);
    if (!fs.existsSync(assetPath)) {
      warnings.push(`Missing optional asset: ${asset}`);
    }
  }

  // Check environment files
  const envFiles = ['env/.env.development', 'env/.env.production'];
  for (const envFile of envFiles) {
    const envPath = path.join(brandDir, envFile);
    if (!fs.existsSync(envPath)) {
      warnings.push(`Missing environment file: ${envFile}`);
    }
  }

  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('  Status: VALID');
    console.log('  All checks passed!');
  } else {
    if (errors.length > 0) {
      console.log(`\n  ERRORS (${errors.length}):`);
      errors.forEach(e => console.log(`    - ${e}`));
    }
    if (warnings.length > 0) {
      console.log(`\n  WARNINGS (${warnings.length}):`);
      warnings.forEach(w => console.log(`    - ${w}`));
    }
  }

  const valid = errors.length === 0;
  console.log(`\n  Result: ${valid ? 'PASS' : 'FAIL'}`);

  return {valid, errors, warnings};
}

/**
 * Validate config object
 */
function validateConfig(config, errors, warnings) {
  // Required top-level fields
  const requiredFields = [
    'brand',
    'app',
    'api',
    'firebase',
    'auth',
    'theme',
    'features',
  ];

  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate brand section
  if (config.brand) {
    if (!config.brand.id) errors.push('Missing brand.id');
    if (!config.brand.name) errors.push('Missing brand.name');
    if (config.brand.id && !/^[a-z][a-z0-9_]*$/.test(config.brand.id)) {
      errors.push(
        'Invalid brand.id format (must be lowercase, start with letter, use only letters/numbers/underscores)',
      );
    }
  }

  // Validate app section
  if (config.app) {
    if (!config.app.android?.applicationId) {
      errors.push('Missing app.android.applicationId');
    }
    if (!config.app.ios?.bundleId) {
      errors.push('Missing app.ios.bundleId');
    }
  }

  // Validate api section
  if (config.api) {
    if (!config.api.baseUrl) errors.push('Missing api.baseUrl');
    if (!config.api.databaseName) warnings.push('Missing api.databaseName');
  }

  // Validate auth section
  if (config.auth) {
    if (!config.auth.type) {
      errors.push('Missing auth.type');
    } else if (!['otp', 'password', 'both'].includes(config.auth.type)) {
      errors.push(
        `Invalid auth.type: ${config.auth.type}. Must be 'otp', 'password', or 'both'`,
      );
    }
  }

  // Validate theme colors
  if (config.theme?.colors) {
    const requiredColors = [
      'primary',
      'primaryDark',
      'background',
      'surface',
      'text',
    ];
    for (const color of requiredColors) {
      if (!config.theme.colors[color]) {
        warnings.push(`Missing recommended color: theme.colors.${color}`);
      }
    }

    // Validate color format
    for (const [key, value] of Object.entries(config.theme.colors)) {
      if (typeof value === 'string' && !isValidColor(value)) {
        warnings.push(`Invalid color format for theme.colors.${key}: ${value}`);
      }
    }
  }

  // Validate features
  if (config.features?.modules) {
    const requiredModules = ['dashboard', 'profile'];
    for (const mod of requiredModules) {
      if (config.features.modules[mod]?.enabled === undefined) {
        warnings.push(`Missing module config: features.modules.${mod}`);
      }
    }
  }
}

/**
 * Check if a string is a valid hex color
 */
function isValidColor(color) {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}
