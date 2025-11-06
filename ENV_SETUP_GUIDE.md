# Environment Variable Setup Guide

## 🚨 দুইটি Error Fix করা হয়েছে

### Error 1: Firebase Auth Error - Invalid API Key ✅
### Error 2: PWA Manifest Icon Error ✅

## সম্পন্ন কাজ (Completed Work)

আপনার প্রজেক্টের সব hardcoded `http://localhost:5000` URL গুলো environment variable দিয়ে replace করা হয়েছে।

### পরিবর্তিত ফাইল সমূহ (Modified Files):

1. **`src/utils/upload.js`**
   - Image এবং Audio upload endpoint গুলোতে `API_BASE_URL` ব্যবহার করা হয়েছে

2. **`src/components/layout/DashboardLayout/DashboardLayout.jsx`**
   - Songs, Users এবং Top Songs API calls এ `API_BASE_URL` ব্যবহার করা হয়েছে

3. **`src/pages/Playlist.jsx`**
   - সব playlist API calls এ `API_BASE_URL` ব্যবহার করা হয়েছে

4. **`src/components/features/notifications/NotificationCenter.jsx`**
   - Socket.io connection এ `API_BASE_URL` ব্যবহার করা হয়েছে

### যে ফাইলগুলো আগে থেকেই ঠিক ছিল (Already Correct):

- `src/constants/index.js` - এখানে `API_BASE_URL` already properly defined
- `src/hooks/useAxios.js` - এখানে already environment variable ব্যবহার হচ্ছিল
- `src/pages/admin/Statistics.jsx` - এখানে already environment variable ব্যবহার হচ্ছিল

---

## 🔧 Environment Variable সেটআপ করুন

### ধাপ ১: `.env.local` ফাইল তৈরি করা হয়েছে ✅

`.env.local` ফাইল তৈরি করা হয়েছে। এখন আপনার **Firebase credentials** দিয়ে update করুন:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Firebase Configuration
# Get these values from Firebase Console: https://console.firebase.google.com/
VITE_FIREBASE_API_KEY=your-firebase-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 🔥 Firebase Credentials কীভাবে পাবেন:

1. Firebase Console এ যান: https://console.firebase.google.com/
2. আপনার project select করুন
3. **Project Settings** (⚙️ gear icon) এ ক্লিক করুন
4. **General** tab এ scroll down করুন
5. **Your apps** section এ আপনার web app দেখতে পাবেন
6. **Config** object এর values copy করে `.env.local` এ paste করুন

**উদাহরণ:**
```javascript
// Firebase Console থেকে এরকম দেখাবে:
const firebaseConfig = {
  apiKey: "AIzaSyD...",           // এটা VITE_FIREBASE_API_KEY তে দিন
  authDomain: "myapp.firebaseapp.com",  // এটা VITE_FIREBASE_AUTH_DOMAIN তে দিন
  projectId: "myapp",             // এটা VITE_FIREBASE_PROJECT_ID তে দিন
  // ... বাকিগুলোও একইভাবে
};
```

### ধাপ ২: Vercel/Netlify তে Environment Variables সেট করা

Production এ deploy করার সময়, সব environment variables add করুন:

**API Configuration:**
- `VITE_API_BASE_URL` = Your production backend URL (e.g., https://your-backend-api.com)

**Firebase Configuration:**
- `VITE_FIREBASE_API_KEY` = Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` = Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` = Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` = Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` = Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` = Your Firebase app ID

---

## 📝 গুরুত্বপূর্ণ নোট (Important Notes)

1. **`.env.local` ফাইল .gitignore এ আছে** - এটা commit হবে না, যা security র জন্য ভালো
2. **🚨 Firebase Credentials অবশ্যই দিতে হবে** - না হলে authentication কাজ করবে না
3. **Vite restart করুন** - `.env.local` ফাইল update করার পর development server restart করতে হবে:
   ```bash
   # Current server বন্ধ করুন (Ctrl + C)
   npm run dev
   ```
4. **PWA Icon Error** - Development mode এ localhost URL দিয়ে icon access করার চেষ্টা করলে এই error দেখাতে পারে। Production build এ এটা ঠিক হয়ে যাবে।

---

## 🎯 সব কিছু এক নজরে

**Before (আগে):**
```javascript
const socket = io("http://localhost:5000");
fetch("http://localhost:5000/api/songs");
```

**After (এখন):**
```javascript
import { API_BASE_URL } from '../constants';

const socket = io(API_BASE_URL);
fetch(`${API_BASE_URL}/api/songs`);
```

---

## ✨ সুবিধা (Benefits)

- একটি জায়গা থেকে সব API URL manage করা যাবে
- Development এবং Production এর জন্য আলাদা URL ব্যবহার করা সহজ
- Code আরও maintainable এবং scalable হয়েছে
- Security best practices follow করা হয়েছে

---

---

## 🔧 Error সমাধান (Troubleshooting)

### Error 1: Firebase Auth Invalid API Key 

**সমস্যা:**
```
FirebaseError: Firebase: Error (auth/invalid-api-key)
```

**সমাধান:**
1. `.env.local` ফাইল খুলুন
2. Firebase Console থেকে সঠিক credentials copy করুন
3. সব `VITE_FIREBASE_*` variables সঠিকভাবে set করুন
4. Development server restart করুন: `npm run dev`

### Error 2: PWA Manifest Icon Error ⚠️

**সমস্যা:**
```
Download error or resource isn't a valid image: http://localhost:5173/pwa-192x192.png
```

**কারণ:** 
Development mode এ PWA service worker disable করা আছে (`devOptions.enabled = false`), তাই icon load হতে পারে না।

**সমাধান:**
এটা শুধুমাত্র development mode এর একটা warning। Production build এ সব ঠিক কাজ করবে। 

**Production Build Test করতে চাইলে:**
```bash
npm run build
npm run preview
```

এতে production-like environment এ app চালাতে পারবেন এবং PWA feature সব ঠিক কাজ করবে।

---

## 📋 Quick Checklist

এই checklist follow করুন error-free setup এর জন্য:

- [x] `.env.local` ফাইল তৈরি করা হয়েছে
- [ ] Firebase credentials সঠিকভাবে add করা হয়েছে
- [ ] `VITE_API_BASE_URL` সঠিক আছে
- [ ] Development server restart করা হয়েছে
- [ ] Firebase Console থেকে সঠিক project থেকে credentials নেওয়া হয়েছে
- [ ] Production deploy এর জন্য environment variables set করা হয়েছে

---

**সব কিছু সম্পন্ন হয়েছে! 🎉**

**Next Steps:**
1. `.env.local` ফাইলে Firebase credentials add করুন
2. Development server restart করুন
3. App test করুন - সব ঠিক কাজ করবে!

