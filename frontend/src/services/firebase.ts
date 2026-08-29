import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";

// Web app's Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyBT4VGOqZRzHKFqngFbmmQYSa2UlbCMcuk",
  authDomain: "ruralmed-6cf34.firebaseapp.com",
  projectId: "ruralmed-6cf34",
  storageBucket: "ruralmed-6cf34.firebasestorage.app",
  messagingSenderId: "1015295738723",
  appId: "1:1015295738723:web:8a3aa287157cf6f327c956",
  measurementId: "G-CH8S3HXNH7"
};

// Initialize Firebase safely (avoid multiple initializations)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize analytics safely if browser environment supports it
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Non-blocking catch
  });
}

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  firebaseSignOut,
  onAuthStateChanged,
  type FirebaseUser,
};
