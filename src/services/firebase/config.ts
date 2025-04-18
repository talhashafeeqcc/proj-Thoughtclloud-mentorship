// @ts-nocheck
// Client-side Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Get environment variables or use defaults
const getEnvVar = (key: string, defaultValue: string): string => {
  // Check if we're in a browser environment with Vite
  if (typeof window !== 'undefined' && 'import' in window) {
    try {
      // @ts-ignore - Vite-specific environment access
      const envValue = import.meta?.env?.[key];
      return envValue || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
};

// Firebase configuration using environment variables or fallback to hardcoded values
const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', "AIzaSyCn7_9_r6GguO2wUN1ZLz14DsPFWF1BucU"),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', "thoughtcloud-mentorship.firebaseapp.com"),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', "thoughtcloud-mentorship"),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', "thoughtcloud-mentorship.firebasestorage.app"),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', "873546730713"),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', "1:873546730713:web:183e4713cae29ea0b402c8"),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', "G-VGXXCZSZLW")
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(firebaseApp);

export { firebaseApp, db }; 