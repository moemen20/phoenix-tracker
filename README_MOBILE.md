# Phoenix Tracker - Mobile App Setup

This guide will help you convert the Phoenix Tracker web app into a native mobile application using Capacitor.

## Prerequisites

### For Android Development:
- **Java JDK 17+**: Download from [Oracle](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html) or use OpenJDK
- **Android Studio**: Download from [developer.android.com](https://developer.android.com/studio)
- Set `ANDROID_SDK_ROOT` environment variable to your Android SDK path

### For iOS Development (macOS only):
- **Xcode 13+**: Available on the Mac App Store
- **iOS Simulator** or physical iOS device for testing

### Node.js and Dependencies:
- Node.js 18+
- npm or yarn

## Quick Start - Run on Your Phone

### Step 1: Prerequisites Check
1. Install **Android Studio** from https://developer.android.com/studio
2. Install **Java JDK 17** (specifically JDK 17, not JDK 24)
   - Download from: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
   - Set `JAVA_HOME` to JDK 17 installation path
3. Set up Android SDK (Android Studio will guide you)

### Step 2: Build and Run with Android Studio
```bash
# Install dependencies (if not done already)
npm install

# Build the web app for mobile
npm run build

# Sync web assets to Android project
npx cap sync android

# Open in Android Studio (RECOMMENDED - uses bundled JDK)
npm run android
# or
npx cap open android
```

### Step 3: Build APK in Android Studio
1. **Wait for Android Studio to load the project**
2. **In Android Studio toolbar, click "Build" → "Make Project"**
3. **Or click the green "Run" button to build and deploy directly to device**
4. **Find APK in**: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Deploy to Your Phone
1. **Connect Android phone** via USB with "Developer Options" → "USB Debugging" enabled
2. **In Android Studio**: Select your device from dropdown → Click green "Run" button
3. **Or manually**: Transfer APK to phone and install

**Note**: Android Studio includes its own compatible JDK, so you don't need to worry about Java version conflicts!

### Step 3: Run on Your Phone
1. **Enable Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build number" 7 times
   - Go back to Settings → Developer options
   - Enable "USB debugging"

2. **Connect your phone** via USB cable

3. **In Android Studio**:
   - Select your connected device from the device dropdown
   - Click the green "Run" button (play icon)
   - Or press Shift+F10

4. **Your app will install and run** on your phone!

## Alternative: Build APK Without Android Studio

If you don't want to use Android Studio:

```bash
# Build debug APK
cd android
./gradlew assembleDebug

# The APK will be created at:
# android/app/build/outputs/apk/debug/app-debug.apk

# Transfer to your phone and install
```

## Troubleshooting

### Java Version Issue (RESOLVED):
✅ **Java 24 detected**: Your system has Java 24, which is even newer than required!
✅ **JAVA_HOME set**: `C:\Program Files\Java\jdk-24`

**But still getting "Unsupported class file major version 68"?**

This error means Gradle 8.0.2 (used by Capacitor) doesn't support Java 24. We need to either:

1. **Use Java 17 or 21** (recommended for compatibility)
2. **Update Gradle wrapper** to version 8.5+ that supports Java 24

### Quick Fix - Use Compatible Java Version:
```bash
# Install Java 17 JDK (most compatible with Android development)
# Download from: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html
# Install and set JAVA_HOME to the JDK 17 installation path

# Then rebuild:
cd android
./gradlew assembleDebug
```

**Alternative**: Use Android Studio which includes compatible JDK

**Current Issue**: Even Gradle 8.10.2 has issues with Java 24. Java 17 is the most stable choice for Android development.

### Alternative: Use Android Studio
Android Studio comes with its own Java JDK:
1. Install Android Studio
2. Run `npm run android` - it will use Android Studio's JDK

### Android Studio Not Found:
1. Install Android Studio from https://developer.android.com/studio
2. Or set environment variable:
   ```bash
   set CAPACITOR_ANDROID_STUDIO_PATH="C:\Program Files\Android\Android Studio\bin\studio64.exe"
   ```

### Build Errors:
- Make sure you've run `npm run build` first
- Check that `out/` directory exists with your built app
- Verify Java JDK 17+ is installed

### Device Connection Issues:
- Enable USB debugging on your phone
- Try different USB cable
- Accept authorization prompt on phone
- Restart ADB: `adb kill-server && adb start-server`

### App Crashes on Phone:
- Check device logs: `adb logcat`
- Make sure Firebase config allows mobile connections
- Test web version first to ensure functionality

## Production Build

### Create Signed Release APK:
1. Open Android Studio: `npx cap open android`
2. Build → Generate Signed Bundle/APK
3. Follow the wizard to create keystore and sign your app
4. Choose APK format for testing, AAB for Google Play Store

## What You Get

- ✅ **Native Android App** - Installs like any other app
- ✅ **Offline Support** - Works without internet
- ✅ **Push Notifications** - Ready for Firebase
- ✅ **Device Integration** - Camera, contacts, storage access
- ✅ **App Store Ready** - Can be published on Google Play

## Current Status

✅ **Capacitor Setup**: Configured for Android
✅ **Web App Built**: Static export ready
✅ **Android Project**: Created and synced
✅ **Ready to Run**: Just need Android Studio setup

**Next Steps:**
1. Install Android Studio
2. Run `npm run android` to open the project
3. Connect your phone and click "Run"
4. Your Phoenix Tracker will be running as a native Android app!

## Files Created

- `android/` - Native Android project
- `capacitor.config.json` - Capacitor configuration
- `README_MOBILE.md` - This guide

Your CRM app is now ready to run natively on Android phones! 🚀