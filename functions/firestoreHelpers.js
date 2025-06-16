import { doc, getDoc } from "firebase/firestore";
import { db, COLLECTIONS } from "./firebaseConfig.js";

/**
 * Get a mentor document from Firestore
 * @param {string} mentorId - The mentor's ID
 * @returns {Promise<Object|null>} The mentor document or null if not found
 */
export const getMentorById = async (mentorId) => {
  try {
    const docRef = doc(db, COLLECTIONS.MENTORS, mentorId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log(`Mentor with ID ${mentorId} not found`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting mentor ${mentorId}:`, error);
    throw error;
  }
};

/**
 * Get a user document from Firestore
 * @param {string} userId - The user's ID
 * @returns {Promise<Object|null>} The user document or null if not found
 */
export const getUserById = async (userId) => {
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log(`User with ID ${userId} not found`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting user ${userId}:`, error);
    throw error;
  }
}; 