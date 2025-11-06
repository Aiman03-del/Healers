# 🔥 Firebase Setup Guide - দ্রুত সেটআপ

## ধাপ ১: Firebase Console এ যান

👉 https://console.firebase.google.com/

## ধাপ ২: Project Select করুন

আপনার existing project select করুন (যদি থাকে), অথবা নতুন project তৈরি করুন।

## ধাপ ৩: Web App Add করুন (যদি না থাকে)

1. **Project Overview** পেজে যান
2. **Web icon (</>) or ⚙️** click করুন
3. **"Add app"** বা **"Register app"** এ click করুন
4. App nickname দিন (e.g., "Healers Web App")
5. **Register app** button এ click করুন

## ধাপ ৪: Firebase Configuration Copy করুন

**Project Settings** > **General** > Scroll down করে **"Your apps"** section এ যান।

আপনি এরকম একটা config object দেখতে পাবেন:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD1234567890abcdefghijklmnop",
  authDomain: "my-awesome-app.firebaseapp.com",
  projectId: "my-awesome-app",
  storageBucket: "my-awesome-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## ধাপ ৫: `.env.local` ফাইলে Credentials Add করুন

আপনার project এ `.env.local` ফাইল খুলুন এবং Firebase config values দিয়ে replace করুন:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyD1234567890abcdefghijklmnop
VITE_FIREBASE_AUTH_DOMAIN=my-awesome-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-awesome-app
VITE_FIREBASE_STORAGE_BUCKET=my-awesome-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## ধাপ ৬: Authentication Enable করুন

Firebase Console এ **Authentication** section এ যান:

1. **Get Started** button click করুন
2. **Sign-in method** tab এ যান
3. **Email/Password** enable করুন
4. **Google** (optional) enable করুন

## ধাপ ৭: Development Server Restart করুন

Terminal এ:
```bash
# Ctrl + C দিয়ে current server বন্ধ করুন
npm run dev
```

## সম্পন্ন!

এখন আপনার app Firebase Authentication এর সাথে connected হয়ে গেছে! 🎉

---

## 🔐 Security Tips

1. **`.env.local` ফাইল কখনো GitHub এ commit করবেন না**
2. **Production এ deploy করার আগে Vercel/Netlify তে environment variables set করুন**
3. **Firebase Console এ proper security rules set করুন**

---

## 🆘 সমস্যা হলে

যদি এখনও error দেখেন:
1. Development server সম্পূর্ণভাবে restart করেছেন কিনা check করুন
2. `.env.local` ফাইলে সব values সঠিক আছে কিনা verify করুন
3. Firebase Console এ Authentication enable করা আছে কিনা check করুন
4. Browser cache clear করুন (Ctrl + Shift + Delete)

---

**Happy Coding! 🚀**

