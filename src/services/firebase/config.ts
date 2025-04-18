// @ts-nocheck
// Client-side Firebase configuration and initialization
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';

// Get environment variables or use defaults
const getEnvVar = (key: string, defaultValue: string): string => {
  // Check if we're in a browser environment with Vite
  if (typeof window !== 'undefined' && 'import' in window) {
    try {
      // @ts-ignore - Vite-specific environment access
      const envValue = import.meta?.env?.[key];
      return envValue || defaultValue;
    } catch (e) {
      console.warn(`Error accessing environment variable ${key}:`, e);
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
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', "thoughtcloud-mentorship.firebasestorage.com"),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', "873546730713"),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', "1:873546730713:web:183e4713cae29ea0b402c8"),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', "G-VGXXCZSZLW")
};

// Validate essential configuration parameters
const validateFirebaseConfig = (config: any) => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Firebase configuration is missing required fields: ${missingFields.join(', ')}`);
  }
  
  console.log("Firebase configuration validated successfully");
  return config;
};

let firebaseApp: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  // Validate configuration before initializing
  validateFirebaseConfig(firebaseConfig);
  
  // Initialize Firebase
  firebaseApp = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");
  
  // Initialize Firestore
  db = getFirestore(firebaseApp);
  console.log("Firestore initialized successfully");
  
  // Initialize Auth
  auth = getAuth(firebaseApp);
  console.log("Firebase Auth initialized successfully");

  // Check if we should use emulators for local development
  const useEmulators = getEnvVar('VITE_USE_FIREBASE_EMULATORS', 'false') === 'true';
  
  if (useEmulators) {
    // Connect to emulators when in development
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log("Connected to Firebase emulators");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw new Error(`Firebase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}

// Export Firebase instances for use in the app
export { firebaseApp, db, auth }; 