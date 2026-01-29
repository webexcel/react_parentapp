#!/usr/bin/env node
/**
 * School Manager - CLI tool to add, modify, and manage school configurations
 *
 * Usage:
 *   node scripts/school-manager.js <command> [options]
 *
 * Commands:
 *   add         - Add a new school
 *   edit <id>   - Edit an existing school
 *   list        - List all schools
 *   delete <id> - Delete a school
 *   sync        - Sync build.gradle with all schools
 *
 * Examples:
 *   node scripts/school-manager.js add
 *   node scripts/school-manager.js edit crescent
 *   node scripts/school-manager.js list
 *   node scripts/school-manager.js delete stmarys
 *   node scripts/school-manager.js sync
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Paths
const ROOT_DIR = path.join(__dirname, '..');
const BRANDS_DIR = path.join(ROOT_DIR, 'brands');
const TEMPLATE_DIR = path.join(BRANDS_DIR, '_template');
const BRAND_REGISTRY_PATH = path.join(BRANDS_DIR, 'index.ts');
const BUILD_GRADLE_PATH = path.join(ROOT_DIR, 'android', 'app', 'build.gradle');

// Parse arguments
const [, , command, ...args] = process.argv;

// Create readline interface for interactive prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisified question
const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

// Main entry point
async function main() {
  try {
    switch (command) {
      case 'add':
        await addSchool();
        break;
      case 'edit':
        await editSchool(args[0]);
        break;
      case 'list':
        listSchools();
        break;
      case 'delete':
        await deleteSchool(args[0]);
        break;
      case 'sync':
        await syncBuildGradle();
        break;
      case '--help':
      case '-h':
      case undefined:
        showHelp();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
School Manager - CLI tool to manage school configurations

Usage:
  node scripts/school-manager.js <command> [options]

Commands:
  add              Add a new school interactively
  edit <school_id> Edit an existing school's configuration
  list             List all configured schools
  delete <school_id> Delete a school (with confirmation)
  sync             Sync build.gradle with all school flavors

Examples:
  node scripts/school-manager.js add
  node scripts/school-manager.js edit crescent
  node scripts/school-manager.js list
  node scripts/school-manager.js delete stmarys
  node scripts/school-manager.js sync

Or use npm scripts:
  npm run school:add
  npm run school:edit crescent
  npm run school:list
  npm run school:delete stmarys
  npm run school:sync
  `);
}

/**
 * Get list of all schools
 */
function getSchools() {
  if (!fs.existsSync(BRANDS_DIR)) return [];
  return fs
    .readdirSync(BRANDS_DIR)
    .filter(
      (dir) =>
        !dir.startsWith('_') &&
        !dir.startsWith('.') &&
        fs.statSync(path.join(BRANDS_DIR, dir)).isDirectory() &&
        fs.existsSync(path.join(BRANDS_DIR, dir, 'brand.config.json'))
    );
}

/**
 * Load school configuration
 */
function loadSchoolConfig(schoolId) {
  const configPath = path.join(BRANDS_DIR, schoolId, 'brand.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`School "${schoolId}" not found`);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Save school configuration
 */
function saveSchoolConfig(schoolId, config) {
  const schoolDir = path.join(BRANDS_DIR, schoolId);
  const configPath = path.join(schoolDir, 'brand.config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * List all schools
 */
function listSchools() {
  const schools = getSchools();

  console.log('\n========================================');
  console.log('  Configured Schools');
  console.log('========================================\n');

  if (schools.length === 0) {
    console.log('  No schools configured yet.');
    console.log('  Run "npm run school:add" to add a school.\n');
    return;
  }

  console.log('  ID              | Name                    | Auth Type | Package ID');
  console.log('  ----------------|-------------------------|-----------|---------------------------');

  for (const schoolId of schools) {
    try {
      const config = loadSchoolConfig(schoolId);
      const id = schoolId.padEnd(15);
      const name = (config.brand?.name || 'Unknown').slice(0, 22).padEnd(23);
      const authType = (config.auth?.type || 'otp').padEnd(9);
      const packageId = config.app?.android?.applicationId || 'N/A';
      console.log(`  ${id} | ${name} | ${authType} | ${packageId}`);
    } catch (e) {
      console.log(`  ${schoolId.padEnd(15)} | Error loading config`);
    }
  }

  console.log(`\n  Total: ${schools.length} school(s)\n`);
}

/**
 * Add a new school
 */
async function addSchool() {
  console.log('\n========================================');
  console.log('  Add New School');
  console.log('========================================\n');

  // School ID
  const schoolId = await question('School ID (lowercase, no spaces, e.g., "stmarys"): ');
  if (!schoolId || !/^[a-z][a-z0-9_]*$/.test(schoolId)) {
    throw new Error('Invalid school ID. Use lowercase letters, numbers, and underscores only.');
  }

  // Check if exists
  const schoolDir = path.join(BRANDS_DIR, schoolId);
  if (fs.existsSync(schoolDir)) {
    throw new Error(`School "${schoolId}" already exists. Use "edit" command to modify.`);
  }

  // School name
  const schoolName = await question('School Display Name (e.g., "St. Mary\'s School"): ');
  if (!schoolName) {
    throw new Error('School name is required.');
  }

  // Short name
  const shortName = await question(`Short Name (default: "${schoolName.slice(0, 10)}"): `) || schoolName.slice(0, 10);

  // Package ID
  const defaultPackageId = `com.schooltree.${schoolId}app`;
  const packageId = await question(`Android Package ID (default: "${defaultPackageId}"): `) || defaultPackageId;

  // iOS Bundle ID
  const defaultBundleId = `com.schooltree.${schoolId}`;
  const bundleId = await question(`iOS Bundle ID (default: "${defaultBundleId}"): `) || defaultBundleId;

  // Auth type
  console.log('\nAuth Types:');
  console.log('  1. otp      - OTP only');
  console.log('  2. password - Password only');
  console.log('  3. both     - Both OTP and Password');
  const authChoice = await question('Select auth type (1/2/3, default: 1): ') || '1';
  const authType = { '1': 'otp', '2': 'password', '3': 'both' }[authChoice] || 'otp';

  // Database name
  const defaultDbName = `${schoolId}_db`;
  const dbName = await question(`Database Name (default: "${defaultDbName}"): `) || defaultDbName;

  // API URL
  const apiUrl = await question('API Base URL (default: "https://dev1.schooltree.in/api"): ') || 'https://dev1.schooltree.in/api';

  // Primary color
  const primaryColor = await question('Primary Color (hex, default: "#137fec"): ') || '#137fec';

  // Firebase project
  const firebaseProject = await question('Firebase Project ID (default: "schooltrees-69f4b"): ') || 'schooltrees-69f4b';

  // Module selection
  console.log('\nModule Configuration (y/n for each):');
  const modules = {
    dashboard: { enabled: true },
    circulars: { enabled: await askYesNo('Enable Circulars?', true) },
    homework: { enabled: await askYesNo('Enable Homework?', true) },
    attendance: { enabled: await askYesNo('Enable Attendance?', true) },
    exams: { enabled: await askYesNo('Enable Exams?', true) },
    marks: { enabled: await askYesNo('Enable Marks?', true) },
    fees: { enabled: await askYesNo('Enable Fees?', true), showPaymentGateway: false },
    calendar: { enabled: await askYesNo('Enable Calendar?', true) },
    gallery: { enabled: await askYesNo('Enable Gallery?', true) },
    timetable: { enabled: await askYesNo('Enable Timetable?', true) },
    chat: { enabled: await askYesNo('Enable Chat?', false) },
    profile: { enabled: true },
  };

  // Create config
  const config = {
    $schema: '../brand.schema.json',
    brand: {
      id: schoolId,
      name: schoolName,
      shortName: shortName,
      tagline: 'Excellence in Education',
    },
    app: {
      android: {
        applicationId: packageId,
        versionCode: 1,
        versionName: '1.0.0',
      },
      ios: {
        bundleId: bundleId,
        version: '1.0.0',
        buildNumber: '1',
      },
    },
    api: {
      baseUrl: apiUrl,
      databaseName: dbName,
    },
    firebase: {
      projectId: firebaseProject,
      configGroup: 'group-a',
    },
    auth: {
      type: authType,
      otpLength: 6,
      countryCode: '+91',
    },
    theme: {
      colors: {
        primary: primaryColor,
        primaryDark: darkenColor(primaryColor, 0.2),
        primarySoft: lightenColor(primaryColor, 0.9),
        accent: '#10b981',
        background: '#f6f7f8',
        surface: '#ffffff',
        text: '#111418',
        textSecondary: '#617589',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
      },
      fonts: {
        primary: 'Lexend',
        secondary: 'Inter',
      },
    },
    features: {
      modules: modules,
      notifications: {
        enabled: true,
        topics: ['circulars', 'homework', 'attendance'],
      },
      offlineMode: true,
      darkMode: false,
    },
  };

  // Create directories
  console.log('\nCreating school configuration...');
  fs.mkdirSync(path.join(schoolDir, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(schoolDir, 'env'), { recursive: true });

  // Save config
  saveSchoolConfig(schoolId, config);

  // Create environment files (minimal - just BRAND_ID, all other config from brand.config.json)
  const envDev = `# Development Environment - ${schoolName}
# All config comes from brand.config.json - only BRAND_ID is needed here
BRAND_ID=${schoolId}
`;

  const envProd = `# Production Environment - ${schoolName}
# All config comes from brand.config.json - only BRAND_ID is needed here
BRAND_ID=${schoolId}
`;

  fs.writeFileSync(path.join(schoolDir, 'env', '.env.development'), envDev);
  fs.writeFileSync(path.join(schoolDir, 'env', '.env.production'), envProd);

  // Create Android resource directory
  const androidResDir = path.join(ROOT_DIR, 'android', 'app', 'src', schoolId, 'res');
  fs.mkdirSync(path.join(androidResDir, 'values'), { recursive: true });

  // Update brand registry
  updateBrandRegistry();

  console.log('\n========================================');
  console.log('  School Created Successfully!');
  console.log('========================================');
  console.log(`
  School ID: ${schoolId}
  Config: brands/${schoolId}/brand.config.json

  Next steps:
  1. Add app icon (1024x1024 PNG): brands/${schoolId}/assets/icon.png
  2. Add Firebase configs:
     - brands/${schoolId}/assets/google-services.json
     - brands/${schoolId}/assets/GoogleService-Info.plist
  3. Run: npm run school:sync (to update build.gradle)
  4. Generate icons: npm run brand:icons ${schoolId}
  5. Build: npm run build:${schoolId}:android
  `);
}

/**
 * Edit an existing school
 */
async function editSchool(schoolId) {
  if (!schoolId) {
    const schools = getSchools();
    console.log('\nAvailable schools:', schools.join(', '));
    schoolId = await question('Enter school ID to edit: ');
  }

  const config = loadSchoolConfig(schoolId);

  console.log('\n========================================');
  console.log(`  Edit School: ${config.brand.name}`);
  console.log('========================================\n');
  console.log('Press Enter to keep current value, or type new value.\n');

  // Edit fields
  config.brand.name = await question(`School Name (${config.brand.name}): `) || config.brand.name;
  config.brand.shortName = await question(`Short Name (${config.brand.shortName}): `) || config.brand.shortName;
  config.app.android.applicationId = await question(`Package ID (${config.app.android.applicationId}): `) || config.app.android.applicationId;
  config.app.ios.bundleId = await question(`Bundle ID (${config.app.ios.bundleId}): `) || config.app.ios.bundleId;

  console.log('\nAuth Types: 1=otp, 2=password, 3=both');
  const currentAuth = config.auth.type;
  const authChoice = await question(`Auth Type (current: ${currentAuth}): `);
  if (authChoice) {
    config.auth.type = { '1': 'otp', '2': 'password', '3': 'both' }[authChoice] || currentAuth;
  }

  config.api.baseUrl = await question(`API URL (${config.api.baseUrl}): `) || config.api.baseUrl;
  config.api.databaseName = await question(`Database Name (${config.api.databaseName}): `) || config.api.databaseName;
  config.theme.colors.primary = await question(`Primary Color (${config.theme.colors.primary}): `) || config.theme.colors.primary;

  // Update derived colors if primary changed
  config.theme.colors.primaryDark = darkenColor(config.theme.colors.primary, 0.2);
  config.theme.colors.primarySoft = lightenColor(config.theme.colors.primary, 0.9);

  // Edit modules
  const editModules = await askYesNo('\nEdit module settings?', false);
  if (editModules) {
    console.log('\nModule Configuration (y/n for each):');
    for (const mod of Object.keys(config.features.modules)) {
      if (mod !== 'dashboard' && mod !== 'profile') {
        const current = config.features.modules[mod].enabled;
        config.features.modules[mod].enabled = await askYesNo(
          `Enable ${mod}?`,
          current
        );
      }
    }
  }

  // Save
  saveSchoolConfig(schoolId, config);

  // Update environment files (minimal - just BRAND_ID, all other config from brand.config.json)
  const schoolDir = path.join(BRANDS_DIR, schoolId);
  const envDev = `# Development Environment - ${config.brand.name}
# All config comes from brand.config.json - only BRAND_ID is needed here
BRAND_ID=${schoolId}
`;
  fs.writeFileSync(path.join(schoolDir, 'env', '.env.development'), envDev);

  console.log('\n========================================');
  console.log('  School Updated Successfully!');
  console.log('========================================');
  console.log(`\n  Run "npm run school:sync" to update build.gradle if needed.\n`);
}

/**
 * Delete a school
 */
async function deleteSchool(schoolId) {
  if (!schoolId) {
    const schools = getSchools();
    console.log('\nAvailable schools:', schools.join(', '));
    schoolId = await question('Enter school ID to delete: ');
  }

  const schoolDir = path.join(BRANDS_DIR, schoolId);
  if (!fs.existsSync(schoolDir)) {
    throw new Error(`School "${schoolId}" not found`);
  }

  const config = loadSchoolConfig(schoolId);

  console.log('\n========================================');
  console.log(`  Delete School: ${config.brand.name}`);
  console.log('========================================\n');
  console.log('  WARNING: This will permanently delete:');
  console.log(`  - brands/${schoolId}/ folder and all contents`);
  console.log(`  - Android resources in android/app/src/${schoolId}/`);
  console.log('\n  This action cannot be undone!\n');

  const confirm = await question(`Type "${schoolId}" to confirm deletion: `);
  if (confirm !== schoolId) {
    console.log('\nDeletion cancelled.\n');
    return;
  }

  // Delete brand folder
  fs.rmSync(schoolDir, { recursive: true, force: true });

  // Delete Android resources
  const androidResDir = path.join(ROOT_DIR, 'android', 'app', 'src', schoolId);
  if (fs.existsSync(androidResDir)) {
    fs.rmSync(androidResDir, { recursive: true, force: true });
  }

  // Update brand registry
  updateBrandRegistry();

  console.log('\n========================================');
  console.log('  School Deleted Successfully!');
  console.log('========================================');
  console.log(`\n  Run "npm run school:sync" to update build.gradle.\n`);
}

/**
 * Sync build.gradle with all schools
 */
async function syncBuildGradle() {
  console.log('\n========================================');
  console.log('  Syncing build.gradle');
  console.log('========================================\n');

  const schools = getSchools();

  if (schools.length === 0) {
    console.log('  No schools to sync.\n');
    return;
  }

  // Read current build.gradle
  let buildGradle = fs.readFileSync(BUILD_GRADLE_PATH, 'utf8');

  // Generate product flavors
  let flavorsCode = '';
  let envConfigCode = '';
  let sourceSetCode = '';
  let debuggableVariants = [];

  for (const schoolId of schools) {
    const config = loadSchoolConfig(schoolId);
    const flavorName = schoolId;
    const capitalizedName = schoolId.charAt(0).toUpperCase() + schoolId.slice(1);

    debuggableVariants.push(`"${schoolId}Debug"`);

    flavorsCode += `
        // ${config.brand.name}
        ${flavorName} {
            dimension "brand"
            applicationId "${config.app.android.applicationId}"
            resValue "string", "app_name", "${config.brand.name} Parent"
            buildConfigField "String", "BRAND_ID", "\\"${schoolId}\\""
            buildConfigField "String", "AUTH_TYPE", "\\"${config.auth.type}\\""
            buildConfigField "String", "DB_NAME", "\\"${config.api.databaseName}\\""
        }
`;

    envConfigCode += `    ${schoolId}debug: "brands/${schoolId}/env/.env.development",
    ${schoolId}release: "brands/${schoolId}/env/.env.production",
`;

    sourceSetCode += `        ${schoolId} {
            res.srcDirs = ['src/${schoolId}/res']
        }
`;
  }

  // Update debuggableVariants
  const debuggableRegex = /debuggableVariants\s*=\s*\[.*?\]/s;
  const newDebuggable = `debuggableVariants = [${debuggableVariants.join(', ')}]`;
  buildGradle = buildGradle.replace(debuggableRegex, newDebuggable);

  // Update envConfigFiles
  const envConfigRegex = /project\.ext\.envConfigFiles\s*=\s*\[[\s\S]*?\]/;
  const newEnvConfig = `project.ext.envConfigFiles = [
${envConfigCode}]`;
  buildGradle = buildGradle.replace(envConfigRegex, newEnvConfig);

  // Update productFlavors
  const flavorsRegex = /productFlavors\s*\{[\s\S]*?(\n    \})\s*\n\s*signingConfigs/;
  const newFlavors = `productFlavors {${flavorsCode}
        // Add more school flavors using: npm run school:add
    }

    signingConfigs`;
  buildGradle = buildGradle.replace(flavorsRegex, newFlavors);

  // Update sourceSets
  const sourceSetRegex = /sourceSets\s*\{[\s\S]*?\n    \}/;
  const newSourceSets = `sourceSets {
${sourceSetCode}    }`;
  buildGradle = buildGradle.replace(sourceSetRegex, newSourceSets);

  // Write updated build.gradle
  fs.writeFileSync(BUILD_GRADLE_PATH, buildGradle);

  // Update package.json scripts
  await updatePackageJsonScripts(schools);

  // Update brand registry
  updateBrandRegistry();

  console.log(`  Updated ${schools.length} school flavor(s):`);
  schools.forEach((s) => console.log(`    - ${s}`));
  console.log('\n  build.gradle has been updated.');
  console.log('  package.json scripts have been updated.\n');
}

/**
 * Update package.json with school scripts
 */
async function updatePackageJsonScripts(schools) {
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Remove old school-specific scripts
  const scriptsToRemove = Object.keys(packageJson.scripts).filter(
    (key) =>
      key.startsWith('android:') ||
      key.startsWith('build:') && key.includes(':android')
  );
  scriptsToRemove.forEach((key) => delete packageJson.scripts[key]);

  // Add new scripts for each school
  for (const schoolId of schools) {
    packageJson.scripts[`android:${schoolId}`] = `react-native run-android --variant=${schoolId}Debug`;
    packageJson.scripts[`build:${schoolId}:android`] = `node scripts/brand-builder.js ${schoolId} android release`;
    packageJson.scripts[`build:${schoolId}:android:debug`] = `node scripts/brand-builder.js ${schoolId} android debug`;
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

/**
 * Helper: Ask yes/no question
 */
async function askYesNo(prompt, defaultValue = true) {
  const defaultStr = defaultValue ? 'Y/n' : 'y/N';
  const answer = await question(`${prompt} (${defaultStr}): `);
  if (!answer) return defaultValue;
  return answer.toLowerCase().startsWith('y');
}

/**
 * Update brand registry (brands/index.ts)
 */
function updateBrandRegistry() {
  const schools = getSchools();

  // Generate imports
  const imports = schools.map(
    (id) => `import ${id}Config from './${id}/brand.config.json';`
  ).join('\n');

  // Generate registry entries
  const entries = schools.map((id) => `  ${id}: ${id}Config,`).join('\n');

  // Generate exports
  const exports = schools.map((id) => `${id}Config`).join(', ');

  const content = `// Brand Registry - Auto-generated by school-manager.js
// DO NOT EDIT MANUALLY - Run "npm run school:add" to add new schools

${imports}

// Export all brand configs as a registry
export const brandRegistry: Record<string, any> = {
${entries}
};

// Export individual configs if needed
export { ${exports} };
`;

  fs.writeFileSync(BRAND_REGISTRY_PATH, content);
  console.log('  Updated brands/index.ts');
}

/**
 * Helper: Darken a hex color
 */
function darkenColor(hex, percent) {
  const cleanHex = hex.replace('#', '');
  const r = Math.round(parseInt(cleanHex.substring(0, 2), 16) * (1 - percent));
  const g = Math.round(parseInt(cleanHex.substring(2, 4), 16) * (1 - percent));
  const b = Math.round(parseInt(cleanHex.substring(4, 6), 16) * (1 - percent));
  const toHex = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Helper: Lighten a hex color
 */
function lightenColor(hex, percent) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const newR = Math.round(r + (255 - r) * percent);
  const newG = Math.round(g + (255 - g) * percent);
  const newB = Math.round(b + (255 - b) * percent);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

// Run main
main();
