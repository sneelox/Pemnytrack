# PennyTrack Android app

PennyTrack is a native React Native app built with Expo. It stores transaction records and the monthly budget on the device using AsyncStorage.

## Features
- Add expense and income transactions
- Categories, date, and optional notes
- Current-month spending, income, and balance
- Spending breakdown by category
- Search and filter transaction history
- Monthly budget progress
- Delete records
- Local device storage; no bank login or server required

## Build an installable APK (cloud build)
You need a computer with Node.js installed and an Expo account. The APK is built by Expo's cloud build service.

1. Install Node.js LTS from https://nodejs.org/
2. Extract this project folder.
3. Open a terminal in the extracted `pennytrack_android` folder and run:
   ```bash
   npm install
   npx eas-cli login
   npx eas-cli build:configure
   npx eas-cli build -p android --profile preview
   ```
4. Wait for the cloud build to finish. Open the build link Expo provides and download the `.apk` file to your Android phone.
5. Open the APK on your phone and approve installing apps from that source if Android asks.

The `preview` profile is configured to create an APK (not an app-store AAB).

## Run for development
```bash
npm install
npx expo start
```

## Important
- This source project is not itself a compiled APK. A cloud build must compile it into an APK.
- Records are stored locally on the device. They are not synced between phones. Export/cloud sync is not implemented in this native starter.
- Deleting app data or uninstalling the app may remove local records. Back up important information separately.
- No bank accounts, passwords, or payment details are collected.
