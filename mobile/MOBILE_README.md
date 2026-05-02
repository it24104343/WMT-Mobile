# Tuition Class Management - Mobile App

A React Native mobile application for the Tuition Class Management System built with Expo.

## Features

- 📱 Cross-platform mobile app (Android & iOS)
- 🔐 Authentication with JWT
- 📊 Dashboard with statistics
- 📚 Classes management
- 👤 User profile
- 🔄 Auto-refresh capability
- 🎨 Modern dark UI

## Prerequisites

Before running the mobile app, ensure you have:

1. **Node.js** installed (v16 or higher)
2. **Expo CLI** installed:
   ```bash
   npm install -g expo-cli
   ```
3. **Android Studio** with Android SDK (for Android emulator)
4. **Backend server** running on your machine (see backend README)

## Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   └── api.js              # API configuration
│   ├── screens/
│   │   ├── LoginScreen.js      # Login screen
│   │   ├── DashboardScreen.js  # Dashboard
│   │   ├── ClassesScreen.js    # Classes list
│   │   └── ProfileScreen.js    # User profile
│   ├── context/
│   │   └── AuthContext.js      # Authentication context
│   ├── utils/
│   │   └── api.js              # API client with interceptors
│   └── services/               # API services (optional)
├── App.js                       # Main app file
└── app.json                     # Expo configuration
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Backend URL

The app is configured to connect to your backend. Edit `src/config/api.js`:

**For Android Emulator:**
```javascript
BASE_URL: 'http://10.0.2.2:5000/api'
```

**For Physical Device or iOS Simulator:**
1. Get your machine's IP address:
   ```bash
   ipconfig  # On Windows
   ifconfig  # On Mac/Linux
   ```
2. Update the config file:
   ```javascript
   BASE_URL: 'http://YOUR_IP:5000/api'  // e.g., http://192.168.1.100:5000/api
   ```

### 3. Start the Backend

Ensure your backend server is running:
```bash
cd backend
npm run dev
```

### 4. Start Expo Dev Server

```bash
npm start
```

This will show you a menu with options:
- Press `a` to open Android Emulator
- Press `i` to open iOS Simulator
- Scan QR code with Expo Go app on physical device

## Running on Android Emulator

1. **Open Android Studio**
2. **Launch Android Emulator** (e.g., Pixel 6a with Android 34)
3. **From Expo menu, press `a`** to run app
4. App will install and launch automatically

## Running on Physical Device

1. **Install Expo Go** app on your Android/iOS device
2. **Ensure your device and computer are on the same network**
3. **From Expo menu, press `s`** to send link
4. **Scan QR code** with Expo Go app
5. App will load on your device

## Login Credentials

Use the same credentials as your web app:
- Username/Email: `admin`
- Password: (your admin password)

## Development Tips

- **Hot Reload**: Changes to code are automatically reloaded
- **Developer Menu**: Shake device or press Ctrl+M (Android) to access developer menu
- **Console Logs**: View logs in Expo terminal
- **API Debugging**: Check backend terminal for request logs

## Building for Production

### Android APK:
```bash
eas build --platform android --local
```

### iOS:
```bash
eas build --platform ios --local
```

## Troubleshooting

### Connection Error to Backend
- Check backend is running: `http://localhost:5000/api/health`
- Verify API URL in `src/config/api.js`
- For emulator: use `10.0.2.2`, not `localhost`
- For device: use your machine IP, not localhost

### Dependencies Issues
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port Already in Use
Backend running on different port? Update `src/config/api.js` accordingly.

## Dependencies

- **react-native**: Mobile app framework
- **expo**: Development platform
- **@react-navigation**: Navigation library
- **axios**: HTTP client
- **@react-native-async-storage**: Local storage
- **jsonwebtoken**: JWT handling

## Support

For issues or questions about the mobile app, check:
1. Backend is running and accessible
2. API URL is correctly configured
3. Network connectivity between device and backend
4. Firebase/environment variables if applicable
