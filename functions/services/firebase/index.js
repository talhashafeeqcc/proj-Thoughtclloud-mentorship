// Firebase services index file
import { firebaseApp, db, auth } from './config';
// Re-export the firestore related functions
export * from './firestore';
// Export Firebase instances
export { firebaseApp, db, auth };
