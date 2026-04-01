# Parent Mobile App - Agent Context

## Project Overview

React Native mobile app for parents to receive school-related information about their children.

- **Tech Stack:** React Native | TypeScript | React Query | Zustand | FCM
- **Architecture:** Atomic Design + Modular Plugin System
- **Target Users:** Parents (consumers of school information)
- **Root:** `C:\RN\app\`

## App Configuration

| Platform | Package/Bundle ID |
|----------|-------------------|
| Android | `com.schooltree.crescentapp` |
| iOS | `com.schooltree.crescent` |

## Environment Setup

```bash
cp .env.example .env          # Copy env template
npm run brand:switch crescent  # Switch brand (copies Firebase config)
```

**`.env` variables:**
| Variable | Required | Purpose |
|----------|----------|---------|
| `BRAND_ID` | Yes | Brand folder name in `brands/` |
| `API_BASE_URL` | No | Override API URL (local dev: `http://localhost:3005/api`) |
| `GEMINI_API_KEY` | No | AI chatbot features |

All other config (theme, Firebase, DB name) comes from `brands/{BRAND_ID}/brand.config.json`.

## Common Commands

```bash
npm install        # Install dependencies
npm start          # Start Metro bundler
npm run android    # Run on Android
npm run ios        # Run on iOS
npm test           # Run tests
npm run brand:switch <name>  # Switch brand
```

## Project Structure

```
src/
├── app/                    # Entry point, providers, root navigation
├── core/
│   ├── api/               # Axios client, endpoint definitions, API types
│   ├── auth/              # AuthContext, auth service
│   ├── storage/           # Secure/AsyncStorage/MMKV wrappers
│   ├── notifications/     # FCM setup and handlers
│   ├── hooks/             # Shared custom hooks
│   ├── utils/             # Helper utilities
│   └── constants/         # Route names, storage keys, config
├── design-system/
│   ├── atoms/             # Button, Text, Icon, Input, Avatar, Badge, Chip, Spinner, Divider
│   ├── molecules/         # SearchBar, StudentChip, OtpInput, AttachmentItem, AudioPlayer, StatCard, EmptyState
│   ├── organisms/         # ScreenHeader, StudentSelector, QuickAccessGrid, BottomNavigation, Cards, Modals
│   ├── templates/         # AuthTemplate, ListTemplate, DashboardTemplate
│   └── theme/             # colors, typography, spacing, shadows
└── modules/
    ├── auth/              # Login, OTP screens
    ├── dashboard/         # Main dashboard
    ├── students/          # Student context + selector
    ├── circulars/         # Circulars list + detail
    ├── homework/          # Homework list + confirm modal
    ├── attendance/        # Monthly attendance calendar
    ├── exams/             # Exam schedule
    ├── marks/             # Academic results
    ├── fees/              # Fee details and history
    ├── calendar/          # School events calendar
    ├── profile/           # Settings, logout
    └── chatbot/           # AI chatbot (Phase 3)
```

## Design System

### Theme Tokens (`src/design-system/theme/`)
```typescript
import { colors, typography, spacing } from '@/design-system/theme';
```

### Color Palette
```javascript
primary: '#137fec'       primaryDark: '#0b4dc9'    primarySoft: '#EFF6FF'
success: '#10b981'       warning: '#f59e0b'         error: '#ef4444'
textPrimary: '#111418'   textSecondary: '#617589'   backgroundLight: '#f6f7f8'
```

### Typography
- **Primary Font:** Lexend | **Secondary:** Inter
- **Sizes:** xs(10) sm(12) base(14) md(16) lg(18) xl(20) 2xl(24) 3xl(32)

### Spacing (base 4px)
xs(4) sm(8) md(12) base(16) lg(20) xl(24) 2xl(32)

## Implementation Rules

### Component Structure
```
ComponentName/
├── ComponentName.tsx
├── ComponentName.styles.ts
├── ComponentName.types.ts
└── index.ts
```

### Module Structure
```
moduleName/
├── screens/
├── components/
├── hooks/
├── services/
├── types/
├── navigation.tsx
└── index.ts
```
Register new modules in `ModuleRegistry.ts`.

### State Management
| Type | Tool |
|------|------|
| Server state (API data) | React Query (`@tanstack/react-query`) |
| Client/UI state | Zustand |
| Auth state | AuthContext (`core/auth/`) |
| Active student | StudentContext (`modules/students/`) |

### API Calls
- All API calls go through React Query hooks
- Base URL configured via `core/api/` (reads from brand config / `.env`)
- Auth header: `Authorization: Bearer {token}` (token from secure storage)
- Backend lives at `C:\RN\backend\` — see `backend/CLAUDE.md` for API details

## Screens (11 Total)

| Screen | Route | Template |
|--------|-------|----------|
| Login | /login | AuthTemplate |
| OTP Verification | /otp | AuthTemplate |
| Dashboard | /dashboard | DashboardTemplate |
| Circulars | /circulars | ListTemplate |
| Homework | /homework | ListTemplate |
| Homework Confirm | Modal | — |
| Attendance | /attendance | ListTemplate |
| Exam Schedule | /exams | ListTemplate |
| Calendar | /calendar | ListTemplate |
| View Marks | /marks | ListTemplate |
| Fee Details | /fees | ListTemplate |

## Key Dependencies

| Package | Purpose |
|---------|---------|
| react-native 0.73+ | Mobile framework |
| react-navigation 6.x | Navigation |
| @tanstack/react-query 5.x | Server state |
| zustand 4.x | Client state |
| @react-native-firebase/messaging 18.x | Push notifications |
| axios | HTTP client |

## Important Notes

- **Multi-student:** A parent can have multiple children — always scope data to selected student
- **Attachments:** Circulars can include PDFs, images, and audio (voice notes)
- **Offline:** Cache critical data; app must be usable on poor connections
- **Security:** Parent can only access their own children's data — never cross-pollinate
- **Notifications:** Handle FCM in foreground, background, and quit states
- **Multi-brand:** Never hard-code brand-specific values — use theme tokens and brand config

## Related Files

- `C:\RN\CLAUDE.md` — root project context (parent app overview)
- `C:\RN\backend\CLAUDE.md` — backend Node.js agent context
- `C:\RN\app\src\` — all source code
- `brands/` — per-school brand configurations
