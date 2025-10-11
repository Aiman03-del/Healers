// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  getIdToken,
} from "firebase/auth";
import { auth } from "../config";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services";
import { TOAST_MESSAGES, ROUTES, USER_ROLES } from "../constants";
import { Loading } from "../components/common";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Save user to database
const saveUserToDB = async (userObj) => {
  try {
    await apiService.users.create(userObj);
  } catch (err) {
    console.error("Failed to save user to DB", err);
  }
};

// Get user from database
const fetchUserFromDB = async (uid) => {
  try {
    const res = await apiService.users.getById(uid);
    return res.data.user;
  } catch {
    return null;
  }
};

// Ensure user exists in DB, but only update if not present
const ensureUserInDB = async (userObj) => {
  const dbUser = await fetchUserFromDB(userObj.uid);
  if (!dbUser) {
    await saveUserToDB(userObj);
    await delay(300);
    return { user: await fetchUserFromDB(userObj.uid), isNew: true };
  }
  return { user: dbUser, isNew: false };
};



// Set backend JWT cookie
const setBackendJWT = async (firebaseUser) => {
  if (!firebaseUser) return;
  const idToken = await getIdToken(firebaseUser);
  await apiService.auth.login(idToken);
};

// Helper: delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry logic
const fetchUserFromDBWithRetry = async (uid, retries = 3, delayMs = 400) => {
  for (let i = 0; i < retries; i++) {
    const user = await fetchUserFromDB(uid);
    if (user) return user;
    await delay(delayMs);
  }
  return null;
};

// Main context provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const register = async (email, password, extra = {}) => {
    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await setBackendJWT(userCred.user);
    // শুধু নতুন ইউজার হলে DB-তে সেভ হবে
    const userObj = {
      uid: userCred.user.uid,
      email,
      ...extra,
      type: "user",
      createdAt: new Date().toISOString(),
    };
    const { user: dbUser, isNew } = await ensureUserInDB(userObj);
    setUser(dbUser || null);
    toast.success(TOAST_MESSAGES.REGISTER_SUCCESS);
    
    // Always navigate to onboarding for new registrations
    navigate(ROUTES.ONBOARDING);
    return userCred;
  };

  const login = async (email, password) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    await setBackendJWT(userCred.user);
    // Check if the user is new and add to DB if not present
    const userObj = {
      uid: userCred.user.uid,
      email: userCred.user.email,
      name: userCred.user.displayName || "",
      image: userCred.user.photoURL || "",
      type: "user",
      createdAt: new Date().toISOString(),
    };
    const { user: dbUser, isNew } = await ensureUserInDB(userObj);
    setUser(dbUser || null);
    toast.success(TOAST_MESSAGES.LOGIN_SUCCESS);

    // If user is new or hasn't completed onboarding, navigate to onboarding
    if (isNew || !dbUser?.preferences?.onboardingCompleted) {
        navigate(ROUTES.ONBOARDING);
    } else {
        navigate(ROUTES.HOME);
    }
    return userCred;
  };

  const logout = async () => {
    await signOut(auth);
    toast(TOAST_MESSAGES.LOGOUT, {
      icon: "👋",
      style: { background: "#a21caf", color: "#fff" },
    });
    setUser(null);
  };

const googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const firebaseUser = result.user;

  await setBackendJWT(firebaseUser);
  await delay(400);

  const { user: dbUser, isNew } = await ensureUserInDB({
      uid: firebaseUser.uid,
      name: firebaseUser.displayName,
      email: firebaseUser.email,
      image: firebaseUser.photoURL,
      type: "user",
      createdAt: new Date().toISOString(),
      provider: "google.com",
  });

  setUser(dbUser || null);
  toast.success(TOAST_MESSAGES.LOGIN_SUCCESS);
  
  // Check if user needs onboarding
  if (isNew || !dbUser?.preferences?.onboardingCompleted) {
    navigate(ROUTES.ONBOARDING);
  } else {
    navigate(ROUTES.HOME);
  }
  
  return result;
};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // ✅ Step 1: Set backend JWT cookie first
        await setBackendJWT(currentUser);

        // ✅ Step 2: Wait a bit for cookie to be usable
        await delay(400); // Optional but safer

        // ✅ Step 3: Now fetch user from DB
        const dbUser = await fetchUserFromDBWithRetry(currentUser.uid, 4, 400);
        setUser(dbUser || null);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show loading spinner/message while loading
  if (loading) {
    return <Loading message="Authenticating..." />;
  }

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, googleLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}