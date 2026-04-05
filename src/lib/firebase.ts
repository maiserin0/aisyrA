import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC4OSscCj6QXpabFrrCH1clf5GLhK4COeI",
  authDomain: "aisyra-d70bd.firebaseapp.com",
  databaseURL: "https://aisyra-d70bd-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "aisyra-d70bd",
  storageBucket: "aisyra-d70bd.firebasestorage.app",
  messagingSenderId: "843319400543",
  appId: "1:843319400543:web:33e19a6d7bf3e798c423ea",
  measurementId: "G-0T74QEGQGX"
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
