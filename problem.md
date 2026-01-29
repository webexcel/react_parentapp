🔍 PROBLEM ANALYSIS
The Issue
The build is CORRECT but runtime is WRONG.

Step	Status	Value
Build reads env file	✅	brands/sivakasi/env/.env.production
BuildConfig.BRAND_ID	✅	"sivakasi"
gradleResValues.xml	✅	"sivakasi"
Runtime: Config.BRAND_ID	❌	undefined
Fallback	❌	'crescent'
Root Cause
In BrandConfig.ts:180:


export const getCurrentBrandId = (): string => {
  return Config.BRAND_ID || 'crescent';  // ← Config.BRAND_ID is undefined!
};
react-native-config is NOT reading the native values at runtime. The error you saw:


ReactConfig: Could not find BuildConfig class
This means the native bridge is broken - the JS side can't access the native config.

Solution Options
Option A: Fix react-native-config native linking
Rebuild native module
Check new architecture compatibility
Option B: Use native BuildConfig directly (Recommended)
Android BuildConfig.BRAND_ID is correct ("sivakasi")
Create a native module to expose it to JS
Bypass react-native-config entirely
Option C: Read from Application ID
com.schooltree.sivakasi → extract sivakasi
Use React Native's Platform.constants or a simple native module
My Recommendation
Option B - Create a simple native module to read BuildConfig.BRAND_ID directly, since that value is correct.

Changes needed:

Create android/app/src/main/java/.../BrandModule.kt (new file)
Register it in MainApplication.kt
Update BrandConfig.ts to use native module instead of react-native-config