import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBUaVPvFHA4yRdSc1MaeEZGKGuiOciRHc4",
  authDomain: "localomt-44ed6.firebaseapp.com",
  databaseURL: "https://localomt-44ed6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "localomt-44ed6",
  storageBucket: "localomt-44ed6.firebasestorage.app",
  messagingSenderId: "631442291706",
  appId: "1:631442291706:web:1657508e1b2af8ccbb4243",
  measurementId: "G-JBNLJ3NJGB"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const database = getDatabase(app);

// Initialize Analytics conditionally (it requires browser environment)
let analytics: ReturnType<typeof getAnalytics> | undefined;

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const provider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);

export { app, auth, database, analytics };
