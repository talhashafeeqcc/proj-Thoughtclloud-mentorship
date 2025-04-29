import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
declare let firebaseApp: FirebaseApp;
declare let db: Firestore;
declare let auth: Auth;
export { firebaseApp, db, auth };
