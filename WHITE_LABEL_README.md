# White-Label Build System

A comprehensive multi-tenant build system for deploying separate branded mobile apps for each school from a single codebase.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [School Management](#school-management)
- [Build Commands](#build-commands)
- [Configuration](#configuration)
- [Folder Structure](#folder-structure)
- [Adding a New School](#adding-a-new-school)
- [Customization Options](#customization-options)
- [Feature Flags](#feature-flags)
- [Theming](#theming)
- [Firebase Setup](#firebase-setup)
- [Troubleshooting](#troubleshooting)

---

## Overview

This system allows you to:
- Maintain a **single codebase** for 15+ schools
- Generate **separate apps** with unique package names and branding
- Configure **feature toggles** per school (modules, auth type, etc.)
- Apply **custom themes** (colors, fonts) per school
- Use **different Firebase projects** per school

---

## Quick Start

### List all configured schools
```bash
npm run school:list
```

### Add a new school (interactive)
```bash
npm run school:add
```

### Build for a specific school
```bash
# Debug build
npm run android:crescent

# Release build
npm run build:crescent:android
```

---

## School Management

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run school:add` | Add a new school interactively |
| `npm run school:edit <id>` | Edit an existing school |
| `npm run school:list` | List all configured schools |
| `npm run school:delete <id>` | Delete a school |
| `npm run school:sync` | Sync build.gradle with all schools |

### Add a New School

```bash
npm run school:add
```

You'll be prompted for:
- School ID (lowercase, e.g., `stmarys`)
- School Display Name
- Package ID (Android)
- Bundle ID (iOS)
- Auth type (OTP / Password / Both)
- Database name
- API URL
- Primary color
- Firebase project
- Module toggles

### Edit a School

```bash
npm run school:edit stmarys
```

### Delete a School

```bash
npm run school:delete stmarys
```

### Sync Build Configuration

After adding/removing schools, sync the build files:
```bash
npm run school:sync
```

This updates:
- `android/app/build.gradle` (product flavors)
- `package.json` (build scripts)

---

## Build Commands

### Development (Debug)

```bash
# Run on connected device/emulator
npm run android:crescent
npm run android:stmarys
npm run android:greenvalley

# Or use react-native directly
npx react-native run-android --variant=crescentDebug
```

### Production (Release)

```bash
# Build release APK
npm run build:crescent:android
npm run build:stmarys:android

# Build release AAB (for Play Store)
npm run build:crescent:aab
npm run build:stmarys:aab
npm run build:greenvalley:aab

# Or with debug APK
npm run build:crescent:android:debug
```

**Output locations:**
- APK: `android/app/build/outputs/apk/{flavor}/release/`
- AAB: `android/app/build/outputs/bundle/{flavor}Release/`

### Switch Brand for Development

To quickly switch between brands during development:

```bash
npm run brand:switch crescent
npm run brand:switch stmarys
npm run brand:switch railwaybalabhavan
```

This updates `BRAND_ID` in your `.env` file while preserving:
- `API_BASE_URL` override (for local development)
- `GEMINI_API_KEY` and other secrets

The brand switch persists across sessions - when you return tomorrow, the last brand will still be active.

### Other Useful Commands

```bash
# Validate brand configuration
npm run brand:validate crescent
npm run brand:validate:all

# Generate app icons from source
npm run brand:icons crescent
```

---

## Configuration

### Brand Config File

Each school has a configuration file at `brands/{school_id}/brand.config.json`:

```json
{
  "brand": {
    "id": "stmarys",
    "name": "St. Mary's School",
    "shortName": "St. Mary's",
    "tagline": "Excellence in Education"
  },
  "app": {
    "android": {
      "applicationId": "com.schooltree.stmarysapp",
      "versionCode": 1,
      "versionName": "1.0.0"
    },
    "ios": {
      "bundleId": "com.schooltree.stmarys",
      "version": "1.0.0",
      "buildNumber": "1"
    }
  },
  "api": {
    "baseUrl": "https://dev1.schooltree.in/api",
    "databaseName": "stmarys_db"
  },
  "firebase": {
    "projectId": "schooltrees-69f4b",
    "configGroup": "group-a"
  },
  "auth": {
    "type": "otp",           // "otp" | "password" | "both"
    "otpLength": 6,
    "countryCode": "+91"
  },
  "theme": {
    "colors": {
      "primary": "#137fec",
      "primaryDark": "#0b4dc9",
      "primarySoft": "#EFF6FF",
      "accent": "#10b981",
      "background": "#f6f7f8",
      "surface": "#ffffff",
      "text": "#111418",
      "textSecondary": "#617589",
      "success": "#10b981",
      "warning": "#f59e0b",
      "error": "#ef4444",
      "info": "#3b82f6"
    }
  },
  "features": {
    "modules": {
      "dashboard": { "enabled": true },
      "circulars": { "enabled": true },
      "homework": { "enabled": true },
      "attendance": { "enabled": true },
      "exams": { "enabled": true },
      "marks": { "enabled": true },
      "fees": { "enabled": true, "showPaymentGateway": false },
      "calendar": { "enabled": true },
      "gallery": { "enabled": true },
      "timetable": { "enabled": true },
      "chat": { "enabled": false },
      "profile": { "enabled": true }
    },
    "notifications": {
      "enabled": true,
      "topics": ["circulars", "homework", "attendance"]
    },
    "offlineMode": true,
    "darkMode": false
  }
}
```

### Environment Configuration

**All configuration comes from `brand.config.json`** - the `.env` file only needs `BRAND_ID`.

**Root `.env` file:**
```env
# Required: Which brand to use
BRAND_ID=stmarys

# Optional: Override API URL for local development
API_BASE_URL=http://localhost:3005/api

# Secrets (not stored in brand.config.json)
GEMINI_API_KEY=your-api-key
```

**What comes from `brand.config.json`:**
- API base URL (unless overridden in `.env`)
- Database name
- Auth type (OTP/password/both)
- Firebase project ID
- Theme colors
- Feature flags
- All other brand-specific settings

**Brand env files** (`brands/{school_id}/env/`) are minimal:
```env
# All config comes from brand.config.json - only BRAND_ID is needed here
BRAND_ID=stmarys
```

---

## Folder Structure

```
app/
├── brands/                              # All brand configurations
│   ├── _template/                       # Template for new brands
│   │   ├── brand.config.json
│   │   ├── assets/
│   │   │   ├── icon.png                # 1024x1024 source icon
│   │   │   ├── google-services.json    # Firebase (Android)
│   │   │   └── GoogleService-Info.plist # Firebase (iOS)
│   │   └── env/
│   │       ├── .env.development
│   │       └── .env.production
│   │
│   ├── crescent/                        # School 1
│   ├── stmarys/                         # School 2
│   └── greenvalley/                     # School 3
│
├── scripts/                             # Build scripts
│   ├── school-manager.js                # School CRUD operations
│   ├── brand-builder.js                 # Build orchestrator
│   ├── generate-icons.js                # Icon generation
│   ├── validate-brand.js                # Config validator
│   └── switch-brand.js                  # Quick brand switch
│
├── src/
│   ├── core/
│   │   └── brand/                       # Brand system
│   │       ├── BrandConfig.ts           # Types & loader
│   │       ├── BrandContext.tsx         # React context
│   │       ├── featureFlags.ts          # Feature flag hooks
│   │       └── index.ts
│   │
│   └── design-system/
│       └── theme/
│           ├── colors.ts                # Static colors (legacy)
│           └── ThemeContext.tsx         # Dynamic theming
│
└── android/
    └── app/
        ├── build.gradle                 # Product flavors
        └── src/
            ├── crescent/res/            # Crescent icons
            ├── stmarys/res/             # St. Mary's icons
            └── greenvalley/res/         # Green Valley icons
```

---

## Adding a New School

### Method 1: Interactive (Recommended)

```bash
npm run school:add
```

Follow the prompts to configure your school.

### Method 2: Manual

1. **Copy template folder:**
   ```bash
   cp -r brands/_template brands/newschool
   ```

2. **Edit `brands/newschool/brand.config.json`**

3. **Add app icon:**
   - Place a 1024x1024 PNG at `brands/newschool/assets/icon.png`

4. **Add Firebase configs (optional):**
   - `brands/newschool/assets/google-services.json`
   - `brands/newschool/assets/GoogleService-Info.plist`

5. **Sync build configuration:**
   ```bash
   npm run school:sync
   ```

6. **Generate icons:**
   ```bash
   npm run brand:icons newschool
   ```

7. **Build:**
   ```bash
   npm run build:newschool:android
   ```

---

## Customization Options

### Auth Types

| Type | Description |
|------|-------------|
| `otp` | OTP-only login (mobile number → OTP) |
| `password` | Password-only login (mobile number → password) |
| `both` | Both options available |

### Modules

| Module | Description |
|--------|-------------|
| `dashboard` | Home screen with overview |
| `circulars` | School announcements |
| `homework` | Homework assignments |
| `attendance` | Attendance calendar |
| `exams` | Exam schedule |
| `marks` | Academic results |
| `fees` | Fee details and payment |
| `calendar` | School calendar |
| `gallery` | Photo gallery |
| `timetable` | Class timetable |
| `chat` | AI chatbot |
| `profile` | User profile & settings |

---

## Feature Flags

### In Components

```tsx
import { useBrand, useIsModuleEnabled, useAuthType } from '@/core/brand';

const MyComponent = () => {
  const { isModuleEnabled } = useBrand();
  const authType = useAuthType();

  // Check if module is enabled
  if (isModuleEnabled('fees')) {
    // Show fees section
  }

  // Check auth type
  if (authType === 'otp' || authType === 'both') {
    // Show OTP option
  }
};
```

### Module Guard Component

```tsx
import { ModuleGuard } from '@/core/brand';

<ModuleGuard module="fees">
  <FeesButton />
</ModuleGuard>
```

### Auth Guard Component

```tsx
import { AuthGuard } from '@/core/brand';

<AuthGuard types={['otp', 'both']}>
  <OtpInput />
</AuthGuard>
```

---

## Theming

### Using Dynamic Colors

```tsx
import { useTheme } from '@/design-system/theme/ThemeContext';

const MyComponent = () => {
  const { colors } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.primary }}>
        Hello
      </Text>
    </View>
  );
};
```

### Available Colors

| Color | Description |
|-------|-------------|
| `primary` | Main brand color |
| `primaryDark` | Darker variant |
| `primarySoft` | Light variant |
| `accent` | Secondary color |
| `background` | Screen background |
| `surface` | Card/surface background |
| `text` | Primary text |
| `textSecondary` | Secondary text |
| `success` | Success state |
| `warning` | Warning state |
| `error` | Error state |
| `info` | Info state |

---

## Firebase Setup

### Multiple Firebase Projects

You can share Firebase projects across schools:

```
Firebase Projects:
├── schooltree-prod-a     (Schools 1-5)
├── schooltree-prod-b     (Schools 6-10)
└── schooltree-prod-c     (Schools 11-15)
```

### Adding Firebase Config

1. Download `google-services.json` from Firebase Console
2. Place in `brands/{school_id}/assets/google-services.json`
3. Download `GoogleService-Info.plist` for iOS
4. Place in `brands/{school_id}/assets/GoogleService-Info.plist`

The build system automatically copies the correct Firebase config during build.

---

## Troubleshooting

### Build fails with "flavor not found"

Run sync to update build.gradle:
```bash
npm run school:sync
```

### Icons not showing

Generate icons from source:
```bash
npm run brand:icons <school_id>
```

### Environment variables not loading

1. Check `.env` file in project root has correct `BRAND_ID`:
   ```env
   BRAND_ID=<school_id>
   ```

2. Check `brands/{school_id}/brand.config.json` exists and is valid

3. Rebuild the app:
   ```bash
   cd android && ./gradlew clean
   npm run android:<school_id>
   ```

### Validate configuration

```bash
npm run brand:validate <school_id>
```

### Module not showing in app

1. Check `brand.config.json` has module enabled:
   ```json
   "features": {
     "modules": {
       "fees": { "enabled": true }
     }
   }
   ```

2. Rebuild the app

### Wrong theme colors

1. Update colors in `brand.config.json`
2. Rebuild the app (theme is loaded at build time from env)

---

## Release Checklist

Before releasing a new school app:

- [ ] School ID configured (`npm run school:add`)
- [ ] App icon added (1024x1024 PNG)
- [ ] Icons generated (`npm run brand:icons <id>`)
- [ ] Firebase configs added
- [ ] Environment files configured
- [ ] Build validated (`npm run brand:validate <id>`)
- [ ] Debug build tested (`npm run android:<id>`)
- [ ] Release keystore created (for production)
- [ ] Release build created (`npm run build:<id>:android`)
- [ ] APK tested on device

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `school:add` | Add new school interactively |
| `school:edit <id>` | Edit school configuration |
| `school:list` | List all schools |
| `school:delete <id>` | Delete a school |
| `school:sync` | Sync build.gradle and package.json |
| `brand:validate <id>` | Validate brand configuration |
| `brand:validate:all` | Validate all brands |
| `brand:icons <id>` | Generate app icons |
| `brand:switch <id>` | Switch brand for development |
| `brand:build <id> <platform> <type>` | Build app |
| `android:<id>` | Run debug build on Android |
| `build:<id>:android` | Build release APK |
| `build:<id>:android:debug` | Build debug APK |
| `build:<id>:aab` | Build release AAB (Play Store) |

---

## Support

For issues or questions:
1. Check this README
2. Run `npm run brand:validate <school_id>` to diagnose issues
3. Check console logs during build

---

*Last updated: January 2025*
