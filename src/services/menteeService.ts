import { v4 as uuidv4 } from "uuid";
import type { Mentee } from "../types";
import {
  getDocument,
  getDocuments,
  setDocument,
  updateDocument,
  whereEqual,
  COLLECTIONS
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
    const menteeProfiles = await getDocuments<MenteeDocument>(COLLECTIONS.MENTEES);

    // Get user data for all mentees
    const userIds = menteeProfiles.map(mentee => mentee.userId);
    const users = await getDocuments<UserDocument>(
      COLLECTIONS.USERS,
      [whereEqual('id', userIds)]
    );

    // Map users to their respective mentee profiles with type assertion
    return menteeProfiles.map((mentee) => {
      const user = users.find(u => u.id === mentee.userId);

      if (!user) {
        // If we don't have user data, create a placeholder with required fields
        return {
          id: mentee.id,
          email: "unknown@example.com",
          name: "Unknown Mentee",
          role: "mentee" as const,
          interests: Array.isArray(mentee.interests) ? [...mentee.interests] : [],
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
    const user = await getDocument<UserDocument>(COLLECTIONS.USERS, mentee.userId);

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
    const mentees = await getDocuments<MenteeDocument>(
      COLLECTIONS.MENTEES,
      [whereEqual('userId', userId)]
    );

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
    email: string;
    name: string;
    password: string;
    profilePicture?: string;
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

    // Check if user already exists
    const existingUsers = await getDocuments<UserDocument>(
      COLLECTIONS.USERS,
      [whereEqual('email', userData.email)]
    );

    let userId: string;

    if (existingUsers.length > 0) {
      // User exists, use their ID
      const existingUser = existingUsers[0];
      userId = existingUser.id;

      // Update user if needed (except password)
      if (userData.name || userData.profilePicture) {
        await updateDocument(COLLECTIONS.USERS, userId, {
          name: userData.name,
          profilePicture: userData.profilePicture,
          updatedAt: now,
        });
      }
    } else {
      // Create new user
      userId = uuidv4();
      const newUser = {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: "mentee" as const,
        password: `hashed_${userData.password}_${now}`, // Use proper hashing in production
        profilePicture: userData.profilePicture || "",
        createdAt: now,
        updatedAt: now,
      };
      await setDocument(COLLECTIONS.USERS, userId, newUser);
    }

    // Check if mentee profile already exists for this user
    const existingMentees = await getDocuments<MenteeDocument>(
      COLLECTIONS.MENTEES,
      [whereEqual('userId', userId)]
    );

    if (existingMentees.length > 0) {
      // Mentee profile already exists, return it
      return getMenteeByUserId(userId) as Promise<ExtendedMentee>;
    }

    // Create the mentee profile
    const menteeId = uuidv4();
    const newMentee: MenteeDocument = {
      id: menteeId,
      userId: userId,
      interests: menteeData.interests || [],
      bio: menteeData.bio || "",
      goals: menteeData.goals || [],
      currentPosition: menteeData.currentPosition || "",
      createdAt: now,
      updatedAt: now,
    };

    await setDocument(COLLECTIONS.MENTEES, menteeId, newMentee);

    // Return the full mentee profile
    return {
      ...newMentee,
      email: userData.email,
      name: userData.name,
      role: "mentee" as const,
      profilePicture: userData.profilePicture || "",
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
    const mentees = await getDocuments<MenteeDocument>(
      COLLECTIONS.MENTEES,
      [whereEqual('userId', userId)]
    );
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
  userId: string,
  updates: Partial<ExtendedMentee>
): Promise<ExtendedMentee | null> => {
  try {
    // Get the mentee document for this user
    const mentees = await getDocuments<MenteeDocument>(
      COLLECTIONS.MENTEES,
      [whereEqual('userId', userId)]
    );

    if (mentees.length === 0) {
      throw new Error(`No mentee profile found for user ${userId}`);
    }

    const mentee = mentees[0];
    const now = Date.now();

    // Prepare mentee updates
    const menteeUpdates: Partial<MenteeDocument> = {
      interests: updates.interests !== undefined ? updates.interests : mentee.interests,
      bio: updates.bio !== undefined ? updates.bio : mentee.bio,
      goals: updates.goals !== undefined ? updates.goals : mentee.goals,
      currentPosition:
        updates.currentPosition !== undefined
          ? updates.currentPosition
          : mentee.currentPosition,
      updatedAt: now,
    };

    // Update the mentee document
    await updateDocument(COLLECTIONS.MENTEES, mentee.id, menteeUpdates);

    // Update user data if provided
    if (updates.name || updates.email || updates.profilePicture) {
      const user = await getDocument<UserDocument>(COLLECTIONS.USERS, userId);

      if (user) {
        const userUpdates: Partial<UserDocument> = {
          name: updates.name !== undefined ? updates.name : user.name,
          email: updates.email !== undefined ? updates.email : user.email,
          profilePicture:
            updates.profilePicture !== undefined
              ? updates.profilePicture
              : user.profilePicture,
          updatedAt: now,
        };

        await updateDocument(COLLECTIONS.USERS, userId, userUpdates);
      }
    }

    // Return updated mentee profile
    return getMenteeByUserId(userId);
  } catch (error) {
    console.error(`Failed to update mentee with user ID ${userId}:`, error);
    throw new Error(`Failed to update mentee with user ID ${userId}`);
  }
};
