# 🚀 Quick Start Guide - Mobile App

## ✅ What's Been Created

Your React Native mobile app is ready! Here's what you got:

```
✓ React Native project with Expo
✓ Authentication system (Login/Logout)
✓ Bottom tab navigation (Dashboard, Classes, Profile)
✓ Dashboard screen with stats
✓ Classes list with details
✓ User profile screen
✓ API integration with your backend
✓ Automatic token management
✓ Dark theme UI (matching web app)
```

## 📋 Next Steps

### Step 1: Complete NPM Installation

Wait for npm dependencies to finish installing (this can take 5-10 minutes):
```bash
cd mobile
npm install  # Already running in terminal
```

### Step 2: Update Backend URL (IMPORTANT)

Edit `mobile/src/config/api.js` and update the URL:

**For Android Emulator (Pixel 6a):**
```javascript
BASE_URL: 'http://10.0.2.2:5000/api'
```

**For Physical Device:**
1. Find your computer's IP: Open PowerShell and run:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update the config:
   ```javascript
   BASE_URL: 'http://192.168.1.100:5000/api'
   ```

### Step 3: Start Expo Dev Server

Once npm install completes, run:
```bash
npm start
```

Menu options:
- Press `a` → Run on Android Emulator (Pixel 6a)
- Press `i` → Run on iOS Simulator
- Scan QR code → Run on physical device with Expo Go app

### Step 4: Open Android Emulator

1. Launch Android Studio
2. Click "Virtual Device Manager"
3. Click play icon on "Pixel 6a" emulator
4. Wait for it to boot (about 30 seconds)
5. Go back to Expo terminal, press `a`
6. App will install and start automatically

## 🎯 Test Login

Once app starts:
1. Login with your admin credentials (same as web app)
2. You should see Dashboard with stats
3. Tab through Dashboard → Classes → Profile
4. Try logout and login again

## 📱 Screen Guide

### Login Screen
- Username/Email input
- Password input
- Sign In button
- Dark theme matching web app

### Dashboard
- Welcome message
- Statistics cards:
  - Total Students
  - Total Classes
  - Total Teachers
  - Total Revenue
- Logout button

### Classes
- List of all classes
- Class name and code
- Grade, Teacher, Capacity
- Pull to refresh

### Profile
- User avatar with initials
- User information
- Role badge
- Logout option

## 🔧 Troubleshooting

### App won't connect to backend
```
Check:
1. Backend running? cd backend && npm run dev
2. Correct API URL in src/config/api.js?
3. Emulator can reach backend: http://10.0.2.2:5000/api/health
```

### "Cannot find module" errors
```bash
cd mobile
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port already in use
- Check if backend is running on port 5000
- Or update backend port in .env file

## 📚 File Structure

```
mobile/
├── App.js                              # Main app with navigation
├── app.json                            # Expo config
├── src/
│   ├── config/
│   │   └── api.js                     # API URL config (EDIT THIS!)
│   ├── context/
│   │   └── AuthContext.js             # Login/logout logic
│   ├── screens/
│   │   ├── LoginScreen.js             # Login form
│   │   ├── DashboardScreen.js         # Dashboard with stats
│   │   ├── ClassesScreen.js           # Classes list
│   │   └── ProfileScreen.js           # User profile
│   └── utils/
│       └── api.js                     # API client (handles requests)
└── MOBILE_README.md                    # Detailed documentation
```

## 🚀 Next Features (Optional)

Want to add more features? Here are some ideas:

- [ ] Attendance management
- [ ] Payment tracking
- [ ] Announcements/Notifications
- [ ] Teacher schedule
- [ ] Exam marks
- [ ] File uploads
- [ ] Dark/Light theme toggle
- [ ] Push notifications
- [ ] Offline support

## ⏳ Time to App Running

Estimated time from now:
1. NPM install: 5-10 minutes (if not done)
2. Emulator boot: 1-2 minutes
3. App install and start: 1-2 minutes
4. **Total: ~8-15 minutes**

## 🎉 You're All Set!

Once everything is running:
1. ✅ Backend on localhost:5000
2. ✅ Frontend on localhost:5173
3. ✅ Mobile app on Android Emulator

All three running together! 🚀
