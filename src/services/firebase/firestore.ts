import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config.js";

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

// Helper functions for working with Firestore
export const addDocument = async (
  collectionName: string,
  data: any
): Promise<string> => {
  try {
    const collectionRef = collection(db, collectionName);
    
    // Filter out undefined values from the data object
    const cleanData = Object.fromEntries(
      Object.entries({
        ...data,
        createdAt: Timestamp.now().toMillis(),
        updatedAt: Timestamp.now().toMillis(),
      }).filter(([_, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(collectionRef, cleanData);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

export const setDocument = async (
  collectionName: string,
  id: string,
  data: any
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    
    // Filter out undefined values from the data object
    const cleanData = Object.fromEntries(
      Object.entries({
        ...data,
        id,
        updatedAt: Timestamp.now().toMillis(),
      }).filter(([_, value]) => value !== undefined)
    );
    
    await setDoc(docRef, cleanData, { merge: true });
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
};

export const getDocument = async <T>(
  collectionName: string,
  id: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

export const getDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const results: T[] = [];
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as T);
    });

    return results;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async (
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);

    // First check if document exists to avoid permission issues
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      console.log(
        `Document ${id} in ${collectionName} doesn't exist. Creating it instead.`
      );
      // If document doesn't exist, create it instead
      return setDocument(collectionName, id, data);
    }

    // Filter out undefined values from the data object
    const cleanData = Object.fromEntries(
      Object.entries({
        ...data,
        updatedAt: Timestamp.now().toMillis(),
      }).filter(([_, value]) => value !== undefined)
    );

    // Document exists, update it
    await updateDoc(docRef, cleanData);
  } catch (error) {
    // Log the error but don't throw to avoid crashing the app
    console.error(`Error updating document in ${collectionName}:`, error);

    // Check if it's a permissions error
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes("permission") || errorMsg.includes("insufficient")) {
      console.warn(
        `Permission error updating ${collectionName}/${id}. Might need to check Firestore rules.`
      );
    }

    // Still throw the error for proper handling upstream
    throw error;
  }
};

export const deleteDocument = async (
  collectionName: string,
  id: string
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Query helpers
export const whereEqual = (field: string, value: any) =>
  where(field, "==", value);
export const whereIn = (field: string, values: any[]) =>
  where(field, "in", values);
export const orderByField = (
  field: string,
  direction: "asc" | "desc" = "asc"
) => orderBy(field, direction);
export const limitResults = (n: number) => limit(n);

// Timestamp helpers
export const timestampToMillis = (timestamp: Timestamp) => timestamp.toMillis();
export const millisToTimestamp = (millis: number) =>
  Timestamp.fromMillis(millis);
export const serverTimestamp = () => Timestamp.now().toMillis();
