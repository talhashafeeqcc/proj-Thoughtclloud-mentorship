// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Read Firebase config from environment variables if available
const useEnvConfig = import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Firebase configuration
const firebaseConfig = useEnvConfig ? {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
} : {
    apiKey: "AIzaSyCn7_9_r6GguO2wUN1ZLz14DsPFWF1BucU",
    authDomain: "thoughtcloud-mentorship.firebaseapp.com",
    projectId: "thoughtcloud-mentorship",
    storageBucket: "thoughtcloud-mentorship.firebasestorage.app",
    messagingSenderId: "873546730713",
    appId: "1:873546730713:web:183e4713cae29ea0b402c8",
    measurementId: "G-VGXXCZSZLW"
};

// Log which configuration we're using (only in development)
if (import.meta.env.DEV) {
    console.log(`Using Firebase config from ${useEnvConfig ? 'environment variables' : 'hardcoded values'}`);
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(firebaseApp);

export { firebaseApp, db }; 