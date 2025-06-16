import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (avoid multiple initializations)
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firestore
const db = getFirestore(app);

// Collections
export const COLLECTIONS = {
  USERS: "users",
  MENTORS: "mentors",
  MENTEES: "mentees",
  SESSIONS: "sessions",
  AVAILABILITY: "availability",
  RATINGS: "ratings",
  PAYMENTS: "payments",
};

export { db }; 