import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, limit, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './config.js';
// Collections
export const COLLECTIONS = {
    USERS: 'users',
    MENTORS: 'mentors',
    MENTEES: 'mentees',
    SESSIONS: 'sessions',
    AVAILABILITY: 'availability',
    RATINGS: 'ratings',
    PAYMENTS: 'payments'
};
// Helper functions for working with Firestore
export const addDocument = async (collectionName, data) => {
    try {
        const collectionRef = collection(db, collectionName);
        const docRef = await addDoc(collectionRef, {
            ...data,
            createdAt: Timestamp.now().toMillis(),
            updatedAt: Timestamp.now().toMillis()
        });
        return docRef.id;
    }
    catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        throw error;
    }
};
export const setDocument = async (collectionName, id, data) => {
    try {
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, {
            ...data,
            id,
            updatedAt: Timestamp.now().toMillis()
        }, { merge: true });
    }
    catch (error) {
        console.error(`Error setting document in ${collectionName}:`, error);
        throw error;
    }
};
export const getDocument = async (collectionName, id) => {
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        else {
            return null;
        }
    }
    catch (error) {
        console.error(`Error getting document from ${collectionName}:`, error);
        throw error;
    }
};
export const getDocuments = async (collectionName, constraints = []) => {
    try {
        const collectionRef = collection(db, collectionName);
        const q = query(collectionRef, ...constraints);
        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
        });
        return results;
    }
    catch (error) {
        console.error(`Error getting documents from ${collectionName}:`, error);
        throw error;
    }
};
export const updateDocument = async (collectionName, id, data) => {
    try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now().toMillis()
        });
    }
    catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        throw error;
    }
};
export const deleteDocument = async (collectionName, id) => {
    try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
    }
    catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        throw error;
    }
};
// Query helpers
export const whereEqual = (field, value) => where(field, '==', value);
export const whereIn = (field, values) => where(field, 'in', values);
export const orderByField = (field, direction = 'asc') => orderBy(field, direction);
export const limitResults = (n) => limit(n);
// Timestamp helpers
export const timestampToMillis = (timestamp) => timestamp.toMillis();
export const millisToTimestamp = (millis) => Timestamp.fromMillis(millis);
export const serverTimestamp = () => Timestamp.now().toMillis();
