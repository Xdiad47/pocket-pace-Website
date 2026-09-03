import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// These are public client identifiers, not secrets — Firebase access is
// controlled by Auth + the deployed Firestore security rules, not by
// hiding this config. Safe to ship in the browser bundle.
const firebaseConfig = {
  apiKey: "AIzaSyAHYQ_P8tbUN-zx3LWZZUOZFaYBRe8FXCk",
  authDomain: "pocketpace-14241.firebaseapp.com",
  projectId: "pocketpace-14241",
  storageBucket: "pocketpace-14241.firebasestorage.app",
  messagingSenderId: "138147415022",
  appId: "1:138147415022:web:a7ab220c1e282de0a0c4ff",
  measurementId: "G-7CC1VWGNP9",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
