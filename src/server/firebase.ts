// Server-side Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration using environment variables or fallback to hardcoded values
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyCn7_9_r6GguO2wUN1ZLz14DsPFWF1BucU",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "thoughtcloud-mentorship.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "thoughtcloud-mentorship",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "thoughtcloud-mentorship.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "873546730713",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:873546730713:web:183e4713cae29ea0b402c8",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VGXXCZSZLW"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(firebaseApp);

export { firebaseApp, db }; 