import { v4 as uuidv4 } from "uuid";
import type { Mentee } from "../types";
import { db } from "./firebase/config";
import {
  doc,
  getDoc,
  updateDoc as firestoreUpdateDoc,
} from "firebase/firestore";
import {
  getDocument,
  getDocuments,
  setDocument,
  updateDocument,
  whereEqual,
  COLLECTIONS,
} from "./firebase";

// Define interfaces for Firestore document types
interface MenteeDocument {
  id: string;
  userId: string;
  interests: string[];
  bio: string;
  goals: string[];
  currentPosition: string;
  createdAt: number;
  updatedAt: number;
}

interface UserDocument {
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
  profilePicture?: string;
  createdAt: number;
  updatedAt: number;
}

// Extended Mentee interface to include additional fields we're using
export interface ExtendedMentee extends Mentee {
  bio: string;
  goals: string[];
  currentPosition: string;
}

/**
 * Get all mentees with combined user data
 */
export const getMentees = async (): Promise<ExtendedMentee[]> => {
  try {
    // Get the mentee profiles
    const menteeProfiles = await getDocuments<MenteeDocument>(
      COLLECTIONS.MENTEES
    );

    // Get user data for all mentees
    const userIds = menteeProfiles.map((mentee) => mentee.userId);
    const users = await getDocuments<UserDocument>(COLLECTIONS.USERS, [
      whereEqual("id", userIds),
    ]);

    // Map users to their respective mentee profiles with type assertion
    return menteeProfiles.map((mentee) => {
      const user = users.find((u) => u.id === mentee.userId);

      if (!user) {
        // If we don't have user data, create a placeholder with required fields
        return {
          id: mentee.id,
          email: "unknown@example.com",
          name: "Unknown Mentee",
          role: "mentee" as const,
          interests: Array.isArray(mentee.interests)
            ? [...mentee.interests]
            : [],
          bio: mentee.bio || "",
          goals: Array.isArray(mentee.goals) ? [...mentee.goals] : [],
          currentPosition: mentee.currentPosition || "",
          sessions: [],
        } as ExtendedMentee;
      }

      // Don't include password in the returned object
      const { password, ...safeUser } = user;

      // Combine mentee and user data with type assertion
      return {
        ...mentee,
        id: mentee.id,
        email: safeUser.email,
        name: safeUser.name,
        role: "mentee" as const,
        profilePicture: safeUser.profilePicture || "",
        interests: Array.isArray(mentee.interests) ? [...mentee.interests] : [],
        goals: Array.isArray(mentee.goals) ? [...mentee.goals] : [],
        sessions: [], // We'll need to fetch sessions separately if needed
      } as ExtendedMentee;
    });
  } catch (error) {
    console.error("Failed to get mentees:", error);
    throw new Error("Failed to get mentees");
  }
};

/**
 * Get a mentee by ID with combined user data
 */
export const getMenteeById = async (
  id: string
): Promise<ExtendedMentee | null> => {
  try {
    const mentee = await getDocument<MenteeDocument>(COLLECTIONS.MENTEES, id);

    if (!mentee) {
      return null;
    }

    // Get user data
    const user = await getDocument<UserDocument>(
      COLLECTIONS.USERS,
      mentee.userId
    );

    if (!user) {
      // If we don't have user data, create a placeholder
      return {
        id: mentee.id,
        email: "unknown@example.com",
        name: "Unknown Mentee",
        role: "mentee" as const,
        interests: mentee.interests,
        bio: mentee.bio,
        goals: mentee.goals,
        currentPosition: mentee.currentPosition,
        sessions: [],
      };
    }

    // Don't include password in the returned object
    const { password, ...safeUser } = user;

    // Combine mentee and user data
    return {
      ...mentee,
      id: mentee.id,
      email: safeUser.email,
      name: safeUser.name,
      role: "mentee" as const,
      profilePicture: safeUser.profilePicture || "",
      sessions: [], // We'll need to fetch sessions separately if needed
    };
  } catch (error) {
    console.error(`Failed to get mentee with ID ${id}:`, error);
    throw new Error(`Failed to get mentee with ID ${id}`);
  }
};

/**
 * Get mentee profile by user ID
 */
export const getMenteeByUserId = async (
  userId: string
): Promise<ExtendedMentee | null> => {
  try {
    // Get mentees filtered by userId
    const mentees = await getDocuments<MenteeDocument>(COLLECTIONS.MENTEES, [
      whereEqual("userId", userId),
    ]);

    if (mentees.length === 0) {
      return null;
    }

    const mentee = mentees[0];

    // Get user data
    const user = await getDocument<UserDocument>(COLLECTIONS.USERS, userId);

    if (!user) {
      return {
        id: mentee.id,
        email: "unknown@example.com",
        name: "Unknown Mentee",
        role: "mentee" as const,
        interests: mentee.interests,
        bio: mentee.bio,
        goals: mentee.goals,
        currentPosition: mentee.currentPosition,
        sessions: [],
      };
    }

    // Don't include password in the returned object
    const { password, ...safeUser } = user;

    // Combine mentee and user data
    return {
      ...mentee,
      id: mentee.id,
      email: safeUser.email,
      name: safeUser.name,
      role: "mentee" as const,
      profilePicture: safeUser.profilePicture || "",
      sessions: [], // Fetch sessions separately if needed
    };
  } catch (error) {
    console.error(`Failed to get mentee with user ID ${userId}:`, error);
    throw new Error(`Failed to get mentee with user ID ${userId}`);
  }
};

/**
 * Create a new mentee profile
 */
export const createMenteeProfile = async (
  userData: {
    // This userId should ideally come from the authenticated Firebase user (auth.currentUser.uid)
    // and be passed into this function, not generated or re-fetched if already known.
    // For this refactor, we'll assume `userData.id` can be this Firebase Auth UID.
    id: string; // Expecting Firebase Auth UID to be passed here
    email: string;
    name: string;
    // Password handling should be done via Firebase Auth, not stored here directly.
    // profilePicture?: string; // This should be part of user document
  },
  menteeData: {
    interests?: string[];
    bio?: string;
    goals?: string[];
    currentPosition?: string;
  }
): Promise<ExtendedMentee> => {
  try {
    const now = Date.now();
    const userId = userData.id; // This IS the Firebase Auth UID

    // User document should already exist or be created by Firebase Auth flows.
    // This service should not typically create user auth entries or user documents from scratch
    // if standard Firebase Auth (createUserWithEmailAndPassword) is used.
    // For now, we'll assume the user document in /users/{userId} is managed elsewhere or
    // is correctly updated if necessary.

    // Check if mentee profile already exists for this user
    // The document ID for the mentee profile will be the userId
    const menteeDocRef = doc(db, COLLECTIONS.MENTEES, userId);
    const menteeDocSnap = await getDoc(menteeDocRef);

    if (menteeDocSnap.exists()) {
      // Mentee profile already exists, update it or return it
      console.log(
        `Mentee profile for user ${userId} already exists. Consider updating or just returning.`
      );
      // For simplicity, let's return the existing one. Update logic can be separate.
      const existingMenteeData = menteeDocSnap.data() as MenteeDocument;
      const userDoc = await getDocument<UserDocument>(
        COLLECTIONS.USERS,
        userId
      );
      return {
        ...existingMenteeData,
        id: userId, // mentee profile ID is the userId
        email: userDoc?.email || userData.email,
        name: userDoc?.name || userData.name,
        role: "mentee" as const,
        profilePicture: userDoc?.profilePicture || "",
        sessions: [],
      };
    }

    // Create the new mentee profile with userId as its document ID
    const newMentee: MenteeDocument = {
      id: userId, // Document ID is the userId
      userId: userId, // Link to the user document
      interests: menteeData.interests || [],
      bio: menteeData.bio || "",
      goals: menteeData.goals || [],
      currentPosition: menteeData.currentPosition || "",
      createdAt: now,
      updatedAt: now,
    };

    await setDocument(COLLECTIONS.MENTEES, userId, newMentee); // Use userId as doc ID

    // Fetch the associated user document to return complete data
    const userDoc = await getDocument<UserDocument>(COLLECTIONS.USERS, userId);

    return {
      ...newMentee,
      // id field is already userId from newMentee
      email: userDoc?.email || userData.email,
      name: userDoc?.name || userData.name,
      role: "mentee" as const,
      profilePicture: userDoc?.profilePicture || "",
      sessions: [],
    };
  } catch (error) {
    console.error("Failed to create mentee profile:", error);
    throw new Error("Failed to create mentee profile");
  }
};

/**
 * Check if user has a mentee profile
 */
export const hasMenteeProfile = async (userId: string): Promise<boolean> => {
  try {
    const mentees = await getDocuments<MenteeDocument>(COLLECTIONS.MENTEES, [
      whereEqual("userId", userId),
    ]);
    return mentees.length > 0;
  } catch (error) {
    console.error(`Failed to check mentee profile for user ${userId}:`, error);
    return false;
  }
};

/**
 * Update mentee profile
 */
export const updateMenteeProfile = async (
  userId: string, // This is the Firebase Auth UID and thus the mentee document ID
  updates: Partial<ExtendedMentee>
): Promise<ExtendedMentee | null> => {
  try {
    const menteeDocRef = doc(db, COLLECTIONS.MENTEES, userId); // Use userId as doc ID
    const menteeDocSnap = await getDoc(menteeDocRef);

    if (!menteeDocSnap.exists()) {
      // If profile doesn't exist, perhaps we should create it?
      // Or throw a more specific error / handle as per product requirements.
      // For now, let's assume ProfileSettings will call create if hasMenteeProfile is false.
      console.error(`No mentee profile found for user ${userId} to update.`);
      // throw new Error(`No mentee profile found for user ${userId} to update.`);
      // Attempt to create it if it's missing, using the updates provided
      // This mirrors a "get or create" pattern that might be intended by ProfileSettings
      console.log(
        `Attempting to create mentee profile for ${userId} during update.`
      );
      const createdProfile = await createMenteeProfile(
        {
          id: userId,
          email: updates.email || "", // Need to ensure these are available or handled
          name: updates.name || "",
          // password should not be handled here
        },
        {
          interests: updates.interests,
          bio: updates.bio,
          goals: updates.goals,
          currentPosition: updates.currentPosition,
        }
      );
      return createdProfile;
    }

    const mentee = menteeDocSnap.data() as MenteeDocument;
    const now = Date.now();

    // Prepare mentee updates
    const menteeUpdates: Partial<MenteeDocument> = {
      // id and userId fields should not change
      updatedAt: now,
    };
    if (updates.interests !== undefined)
      menteeUpdates.interests = updates.interests;
    if (updates.bio !== undefined) menteeUpdates.bio = updates.bio;
    if (updates.goals !== undefined) menteeUpdates.goals = updates.goals;
    if (updates.currentPosition !== undefined)
      menteeUpdates.currentPosition = updates.currentPosition;

    // Update the mentee document (its ID is userId)
    await firestoreUpdateDoc(menteeDocRef, menteeUpdates);

    // Update user data in /users/{userId} if provided
    if (updates.name || updates.email || updates.profilePicture) {
      const userDocRef = doc(db, COLLECTIONS.USERS, userId);
      const userToUpdate: Partial<UserDocument> = { updatedAt: now };
      if (updates.name !== undefined) userToUpdate.name = updates.name;
      if (updates.email !== undefined) userToUpdate.email = updates.email;
      if (updates.profilePicture !== undefined)
        userToUpdate.profilePicture = updates.profilePicture;

      await firestoreUpdateDoc(userDocRef, userToUpdate);
    }

    // Return updated mentee profile
    return getMenteeByUserId(userId);
  } catch (error) {
    console.error(
      `Failed to update mentee profile for user ID ${userId}:`,
      error
    );
    // Provide a more specific error message if possible
    if (
      error instanceof Error &&
      error.message.includes("No mentee profile found")
    ) {
      throw error; // Re-throw specific error if it was about not finding the profile initially
    }
    throw new Error(
      `Failed to update mentee profile for user ID ${userId}. Original error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
