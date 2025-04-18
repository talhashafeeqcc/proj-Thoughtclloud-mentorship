// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration using environment variables or fallback to hardcoded values
const firebaseConfig = {
  apiKey: process?.env?.FIREBASE_API_KEY || "AIzaSyCn7_9_r6GguO2wUN1ZLz14DsPFWF1BucU",
  authDomain: process?.env?.FIREBASE_AUTH_DOMAIN || "thoughtcloud-mentorship.firebaseapp.com",
  projectId: process?.env?.FIREBASE_PROJECT_ID || "thoughtcloud-mentorship",
  storageBucket: process?.env?.FIREBASE_STORAGE_BUCKET || "thoughtcloud-mentorship.firebasestorage.app",
  messagingSenderId: process?.env?.FIREBASE_MESSAGING_SENDER_ID || "873546730713",
  appId: process?.env?.FIREBASE_APP_ID || "1:873546730713:web:183e4713cae29ea0b402c8",
  measurementId: process?.env?.FIREBASE_MEASUREMENT_ID || "G-VGXXCZSZLW"
};

// Log which configuration we're using (only in development)
if (process?.env?.NODE_ENV === 'development') {
  console.log(`Using Firebase config from ${process?.env?.FIREBASE_API_KEY ? 'environment variables' : 'hardcoded values'}`);
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(firebaseApp);

export { firebaseApp, db }; 