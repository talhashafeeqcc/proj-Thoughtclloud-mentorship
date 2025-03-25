import { v4 as uuidv4 } from "uuid";
import type { Mentee } from "../types";
import { getDatabase } from "./database/db";

// Define interfaces for RxDB document types
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
    const db = await getDatabase();
    const menteeDocs = await db.mentees.find().exec();

    // Get the mentee profiles
    const menteeProfiles = menteeDocs.map((doc) =>
      doc.toJSON()
    );

    // Get user data for all mentees
    const userIds = menteeProfiles.map(
      (mentee) => mentee.userId
    );
    const userDocs = await db.users
      .find({
        selector: {
          id: {
            $in: userIds,
          },
        },
      })
      .exec();

    // Map users to their respective mentee profiles with type assertion
    return menteeProfiles.map((mentee) => {
      const userDoc = userDocs.find(
        (u) => u.id === mentee.userId
      );

      if (!userDoc) {
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

      const user = userDoc.toJSON();
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
    const db = await getDatabase();
    const menteeDoc = await db.mentees.findOne(id).exec();

    if (!menteeDoc) {
      return null;
    }

    const mentee = menteeDoc.toJSON() as MenteeDocument;

    // Get user data
    const userDoc = await db.users.findOne(mentee.userId).exec();

    if (!userDoc) {
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

    const user = userDoc.toJSON() as UserDocument;
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
    const db = await getDatabase();
    const menteeDocs = await db.mentees
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    if (menteeDocs.length === 0) {
      return null;
    }

    const menteeDoc = menteeDocs[0];
    const mentee = menteeDoc.toJSON() as MenteeDocument;

    // Get user data
    const userDoc = await db.users.findOne(userId).exec();

    if (!userDoc) {
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

    const user = userDoc.toJSON() as UserDocument;
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
    const db = await getDatabase();
    const now = Date.now();

    // Check if user already exists
    const existingUsers = await db.users
      .find({
        selector: {
          email: userData.email,
        },
      })
      .exec();

    let userId: string;

    if (existingUsers.length > 0) {
      // User exists, use their ID
      const existingUser = existingUsers[0].toJSON();
      userId = existingUser.id;

      // Update user if needed (except password)
      if (userData.name || userData.profilePicture) {
        await existingUsers[0].update({
          $set: {
            name: userData.name,
            profilePicture: userData.profilePicture,
            updatedAt: now,
          },
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
      await db.users.insert(newUser);
    }

    // Check if mentee profile already exists for this user
    const existingMentees = await db.mentees
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    if (existingMentees.length > 0) {
      // Mentee profile already exists, return it
      return getMenteeByUserId(userId) as Promise<ExtendedMentee>;
    }

    // Create the mentee profile
    const menteeId = uuidv4();
    const newMentee = {
      id: menteeId,
      userId: userId,
      interests: menteeData.interests || [],
      bio: menteeData.bio || "",
      goals: menteeData.goals || [],
      currentPosition: menteeData.currentPosition || "",
      createdAt: now,
      updatedAt: now,
    };

    await db.mentees.insert(newMentee);

    // Return the complete mentee profile
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
 * Update a mentee profile
 */
export const updateMenteeProfile = async (
  userId: string,
  updates: Partial<ExtendedMentee>
): Promise<ExtendedMentee | null> => {
  try {
    const db = await getDatabase();
    console.log("Updating mentee profile for user:", userId);

    // First find the mentee profile by userId instead of menteeId
    const menteeDocs = await db.mentees
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    if (menteeDocs.length === 0) {
      console.error("Mentee profile not found for user:", userId);
      
      // If no mentee profile exists, create one
      console.log("Creating new mentee profile for user:", userId);
      const now = Date.now();
      const menteeId = uuidv4();
      const newMentee = {
        id: menteeId,
        userId: userId,
        interests: updates.interests || [],
        bio: updates.bio || "",
        goals: updates.goals || [],
        currentPosition: updates.currentPosition || "",
        createdAt: now,
        updatedAt: now,
      };

      await db.mentees.insert(newMentee);
      console.log("Created new mentee profile with ID:", menteeId);
      
      // Continue with user update
      if (updates.name || updates.email || updates.profilePicture) {
        const userDoc = await db.users.findOne(userId).exec();

        if (userDoc) {
          const user = userDoc.toJSON();
          const userUpdates: Partial<UserDocument> = {
            name: updates.name !== undefined ? updates.name : user.name,
            email: updates.email !== undefined ? updates.email : user.email,
            profilePicture:
              updates.profilePicture !== undefined
                ? updates.profilePicture
                : user.profilePicture,
            updatedAt: now,
          };

          console.log("Updating user data:", userUpdates);

          await userDoc.update({
            $set: userUpdates,
          });
        }
      }
      
      // Return the newly created mentee profile
      return getMenteeByUserId(userId);
    }

    const menteeDoc = menteeDocs[0];
    const mentee = menteeDoc.toJSON() as MenteeDocument;
    const now = Date.now();

    // Prepare mentee updates
    const menteeUpdates: Partial<MenteeDocument> = {
      interests:
        updates.interests !== undefined ? updates.interests : mentee.interests,
      bio: updates.bio !== undefined ? updates.bio : mentee.bio,
      goals: updates.goals !== undefined ? updates.goals : mentee.goals,
      currentPosition:
        updates.currentPosition !== undefined
          ? updates.currentPosition
          : mentee.currentPosition,
      updatedAt: now,
    };

    console.log("Updating mentee data:", menteeUpdates);

    // Update mentee data
    await menteeDoc.update({
      $set: menteeUpdates,
    });

    // Update user data if provided
    if (updates.name || updates.email || updates.profilePicture) {
      const userDoc = await db.users.findOne(userId).exec();

      if (userDoc) {
        const user = userDoc.toJSON();
        const userUpdates: Partial<UserDocument> = {
          name: updates.name !== undefined ? updates.name : user.name,
          email: updates.email !== undefined ? updates.email : user.email,
          profilePicture:
            updates.profilePicture !== undefined
              ? updates.profilePicture
              : user.profilePicture,
          updatedAt: now,
        };

        console.log("Updating user data:", userUpdates);

        await userDoc.update({
          $set: userUpdates,
        });
      }
    }

    // Return updated mentee profile
    return getMenteeByUserId(userId);
  } catch (error) {
    console.error(`Failed to update mentee with user ID ${userId}:`, error);
    throw new Error(`Failed to update mentee with user ID ${userId}`);
  }
};
