import { firebaseApp, db, auth } from './config';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
export * from './firestore';
export { firebaseApp, db, auth };
export type { FirebaseApp, Firestore, Auth };
