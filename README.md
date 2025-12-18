This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# React Native Step Counter - Platform-Specific Setup

## Key Features

**Android**: Foreground service keeps tracking even when app is closed
**iOS**: HealthKit reads system-tracked steps (no foreground service needed)
**Both**: Auto-start tracking when app opens, persist steps across restarts

---

## Android Setup (Foreground Service)

### 1. Install dependencies

```bash
npm install
```

### 2. Update `android/app/src/main/AndroidManifest.xml`

Add these permissions inside the `<manifest>` tag:

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
```

### 3. Run the app

```bash
npm run android
```

### How it works:

- Persistent notification keeps app alive in background
- Steps continue tracking even when app is closed
- Auto-restarts when you reopen the app

---

## iOS Setup (HealthKit)

### 1. Install dependencies and pods

```bash
npm install
cd ios && pod install && cd ..
```

### 2. Enable HealthKit in Xcode

- Open `ios/YourApp.xcworkspace` in Xcode
- Select your project target
- Go to "Signing & Capabilities"
- Click "+ Capability" → Add "HealthKit"

### 3. Update `ios/YourApp/Info.plist`

Add these keys:

```xml
<key>NSHealthShareUsageDescription</key>
<string>We need access to your step count to track your daily activity</string>
<key>NSHealthUpdateUsageDescription</key>
<string>We need access to update your step count</string>
<key>NSMotionUsageDescription</key>
<string>We need access to your motion data to track steps</string>
```

### 4. Run the app

```bash
npm run ios
```

### How it works:

- iOS tracks steps automatically in background via Core Motion
- App queries HealthKit for today's steps when opened
- Updates every 5 seconds while app is open
- More battery efficient than foreground service

---

## Troubleshooting

**Android: Steps not tracking when app is closed**

- Check notification permission is granted
- Check foreground service permission
- Verify persistent notification is visible

**iOS: Not getting step data**

- Grant HealthKit permissions
- Check NSHealthShareUsageDescription in Info.plist
- Ensure HealthKit capability is enabled in Xcode

**Both: Steps reset to zero**

- This is intentional - steps reset at midnight each day
- Check date logic in storage.ts if you need different behavior
