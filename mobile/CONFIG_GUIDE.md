# Mobile App Configuration Guide

## 🔗 Backend URL Configuration

### For Android Emulator (Pixel 6a API 34)

The Android emulator runs in a virtual network. To access your host machine from inside the emulator:

**File:** `mobile/src/config/api.js`

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://10.0.2.2:5000/api',
};
```

**Why 10.0.2.2?**
- `10.0.2.2` is the special alias that Android emulator uses to reference the host machine
- `localhost` or `127.0.0.1` won't work - they refer to the emulator itself, not your computer

---

### For Physical Device (Android Phone)

**File:** `mobile/src/config/api.js`

1. **Find Your Computer's IP Address**

   Open PowerShell and run:
   ```powershell
   ipconfig
   ```

   Look for "IPv4 Address" under your active network adapter. Example output:
   ```
   Ethernet adapter Ethernet:
      IPv4 Address. . . . . . . . . . : 192.168.1.100
      Subnet Mask . . . . . . . . . . : 255.255.255.0
   ```

2. **Update Config**

   ```javascript
   export const API_CONFIG = {
     BASE_URL: 'http://192.168.1.100:5000/api',  // Replace with YOUR IP
   };
   ```

3. **Ensure Connection**
   - Phone and computer must be on the same WiFi network
   - Backend must be running on port 5000
   - Firewall might block port 5000 - allow it through

---

### For iOS Simulator

iOS simulator runs on your Mac, so it has direct access to localhost:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
};
```

---

## 🧪 Testing the Connection

### Test from Expo Console

After the app starts, check the console logs in Expo terminal:
- Look for successful login response
- Watch for API call errors
- Check network tab in debugger (if needed)

### Manual Test

1. **From your computer, test the backend is running:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status":"ok","message":"Server is running"}`

2. **From Android Emulator:**
   - Open device browser in emulator
   - Go to: `http://10.0.2.2:5000/api/health`
   - Should load successfully

3. **From Physical Device:**
   - Use browser on phone
   - Go to: `http://<YOUR_IP>:5000/api/health`
   - Should load successfully

---

## 🚀 Quick Commands

### Start Mobile App Dev Server
```bash
cd mobile
npm start
```

### Run on Android Emulator
```bash
# From Expo menu, press 'a'
# Or run directly:
npm run android
```

### Run on iOS Simulator
```bash
# From Expo menu, press 'i'
# Or run directly:
npm run ios
```

### Run on Physical Device
```bash
# From Expo menu, press 's'
# Scan QR code with Expo Go app
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Failed to connect to backend"

**Solution 1: Wrong API URL**
- Check `mobile/src/config/api.js`
- For emulator: use `10.0.2.2`, not `localhost`
- For device: use your computer's IP

**Solution 2: Backend not running**
```bash
cd backend
npm run dev
```

**Solution 3: Port 5000 blocked**
- Check if another app is using port 5000
- Change backend to different port in `.env`
- Update mobile app config to match

### Issue: "Network request failed"

**Android Emulator:**
- Verify you're using `10.0.2.2:5000`, not `localhost:5000`
- Check emulator network settings
- Restart emulator

**Physical Device:**
- Ensure phone is on same WiFi as computer
- Check firewall allows port 5000
- Verify IP address is correct

### Issue: "Cannot find module axios"

```bash
cd mobile
npm install --legacy-peer-deps
```

---

## 📊 Architecture Overview

```
Physical Device/Emulator
    ↓
Expo App
    ↓
API Client (axios)
    ↓
http://10.0.2.2:5000/api (Emulator)
   OR
http://192.168.x.x:5000/api (Physical Device)
    ↓
Your Backend Server
    ↓
MongoDB Atlas
```

---

## 🔐 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
NODE_ENV=development
```

### Mobile (src/config/api.js)
```javascript
BASE_URL: 'http://10.0.2.2:5000/api'
```

---

## ✅ Checklist Before Running

- [ ] Backend running on port 5000
- [ ] Mobile API URL configured correctly
- [ ] Android Emulator booted (if testing on emulator)
- [ ] Expo installed: `npm install -g expo-cli`
- [ ] Dependencies installed: `npm install` in mobile folder
- [ ] No firewall blocking port 5000

---

## 📞 Still Having Issues?

1. Check backend health: `curl http://localhost:5000/api/health`
2. Check mobile logs in Expo console
3. Verify network connection between device and backend
4. Try restarting emulator or app
5. Check backend error logs for API failures
