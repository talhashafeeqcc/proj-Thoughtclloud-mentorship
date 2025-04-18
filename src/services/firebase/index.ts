// Firebase services index file
import { firebaseApp, db, auth } from './config';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

// Re-export the firestore related functions
export * from './firestore';

// Export Firebase instances
export { 
  firebaseApp, 
  db, 
  auth
};

// Export Firebase types
export type { 
  FirebaseApp,
  Firestore,
  Auth
};