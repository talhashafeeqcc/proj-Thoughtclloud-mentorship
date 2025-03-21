import { User, Mentor, LoginCredentials, RegisterData } from "../types";
import { getDatabase } from "./database/db";
import { v4 as uuidv4 } from "uuid";
import { getMentorByUserId } from "./mentorService";
import type { RxDocument } from "rxdb";

// Define document interfaces
interface UserDocument {
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
  profilePicture?: string;
  createdAt: number;
  updatedAt: number;
  toJSON: () => UserDocument;
}

interface MentorDocument {
  id: string;
  userId: string;
  expertise: string[];
  bio: string;
  sessionPrice: number;
  yearsOfExperience?: number;
  portfolio: any[];
  certifications: any[];
  education: any[];
  workExperience: any[];
  createdAt: number;
  updatedAt: number;
  toJSON: () => MentorDocument;
}

// Simple password comparison function
// In a real app, you would use bcrypt.compare or similar
const comparePasswords = (plain: string, hashed: string): boolean => {
  // Check if the hashed password starts with our mock prefix
  return hashed.startsWith(`hashed_${plain}_`);
};

// Get all users (without passwords)
export const getUsers = async (): Promise<User[]> => {
  try {
    const db = await getDatabase();
    const users = await db.users.find().exec();

    // Return users without passwords
    return users.map((user: RxDocument<UserDocument>) => {
      const { password, ...safeUser } = user.toJSON();
      return safeUser as User;
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Get all mentors with their profiles
export const getMentors = async (): Promise<Partial<Mentor>[]> => {
  try {
    const db = await getDatabase();
    const mentorProfiles = await db.mentors.find().exec();
    const userProfiles = await db.users
      .find({
        selector: {
          role: "mentor",
        },
      })
      .exec();

    // Map user data to mentor profiles
    return await Promise.all(
      mentorProfiles.map(async (mentorDoc: RxDocument<MentorDocument>) => {
        const mentor = mentorDoc.toJSON();
        const userDoc = userProfiles.find(
          (u: RxDocument<UserDocument>) => u.id === mentor.userId
        );

        if (!userDoc) return mentor;

        const user = userDoc.toJSON();
        const { password, ...safeUser } = user;

        // Combine user and mentor data
        return {
          ...mentor,
          email: safeUser.email,
          name: safeUser.name,
          role: safeUser.role,
          profilePicture: safeUser.profilePicture,
        };
      })
    );
  } catch (error) {
    console.error("Error fetching mentors:", error);
    throw error;
  }
};

// Get mentor by ID
export const getMentorById = async (
  id: string
): Promise<Partial<Mentor> | null> => {
  try {
    const db = await getDatabase();
    const mentorDoc = await db.mentors.findOne(id).exec();

    if (!mentorDoc) return null;

    const mentor = mentorDoc.toJSON();
    const userDoc = await db.users.findOne(mentor.userId).exec();

    if (!userDoc) return mentor;

    const user = userDoc.toJSON();
    const { password, ...safeUser } = user;

    // Combine user and mentor data
    return {
      ...mentor,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
      profilePicture: safeUser.profilePicture,
    };
  } catch (error) {
    console.error("Error fetching mentor by ID:", error);
    throw error;
  }
};

// Get mentor profile by ID (alias for getMentorById for backward compatibility)
export const getMentorProfileById = async (
  id: string
): Promise<Partial<Mentor> | null> => {
  return getMentorById(id);
};

// Get user by ID (without password)
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const db = await getDatabase();
    const userDoc = await db.users.findOne(id).exec();

    if (!userDoc) return null;

    const user = userDoc.toJSON();
    const { password, ...safeUser } = user;
    return safeUser as User;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

// Login user
export const loginUser = async (
  credentials: LoginCredentials
): Promise<User> => {
  try {
    const db = await getDatabase();
    const users = await db.users
      .find({
        selector: {
          email: credentials.email,
        },
      })
      .exec();

    if (users.length === 0) {
      throw new Error("Invalid email or password");
    }

    const user = users[0].toJSON();

    // Compare password
    if (!comparePasswords(credentials.password, user.password)) {
      throw new Error("Invalid email or password");
    }

    // Return user without password
    const { password, ...safeUser } = user;
    return safeUser as User;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

// Extended RegisterData with optional profilePicture
interface ExtendedRegisterData extends RegisterData {
  profilePicture?: string;
}

// Register user
export const registerUser = async (userData: RegisterData): Promise<User> => {
  try {
    const db = await getDatabase();

    // Check if user already exists
    const existingUsers = await db.users
      .find({
        selector: {
          email: userData.email,
        },
      })
      .exec();

    if (existingUsers.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Generate a unique ID
    const userId = uuidv4();
    const now = Date.now();

    // Create new user with hashed password
    const newUser = {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      password: `hashed_${userData.password}_${now}`, // In real app, use proper hashing
      profilePicture: (userData as ExtendedRegisterData).profilePicture || "",
      createdAt: now,
      updatedAt: now,
    };

    // Insert user
    await db.users.insert(newUser);

    // If it's a mentor, create a mentor profile
    if (userData.role === "mentor") {
      const newMentorProfile = {
        id: uuidv4(),
        userId: userId,
        expertise: [],
        bio: "",
        sessionPrice: 0,
        yearsOfExperience: 0,
        portfolio: [],
        certifications: [],
        education: [],
        workExperience: [],
        createdAt: now,
        updatedAt: now,
      };

      await db.mentors.insert(newMentorProfile);
    }

    // If it's a mentee, create a mentee profile
    if (userData.role === "mentee") {
      const newMenteeProfile = {
        id: uuidv4(),
        userId: userId,
        interests: [],
        bio: "",
        goals: [],
        currentPosition: "",
        createdAt: now,
        updatedAt: now,
      };

      await db.mentees.insert(newMenteeProfile);
    }

    // Return user without password
    const { password, ...safeUser } = newUser;
    return safeUser as User;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
};

// Update user profile
export const updateUser = async (
  userId: string,
  profileData: Partial<User>
): Promise<User> => {
  try {
    const db = await getDatabase();
    const userDoc = await db.users.findOne(userId).exec();

    if (!userDoc) {
      throw new Error("User not found");
    }

    const user = userDoc.toJSON();

    // Update only allowed fields, preserving password and other fields
    const updatedUser = {
      ...user,
      ...profileData,
      password: user.password, // Preserve existing password
      updatedAt: Date.now(),
    };

    // Save updated user
    await userDoc.update({
      $set: updatedUser,
    });

    // Return user without password
    const { password, ...safeUser } = updatedUser;
    return safeUser as User;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Update user profile (alias for updateUser for backward compatibility)
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<User>
): Promise<User> => {
  return updateUser(userId, profileData);
};

// Extended Mentor type to include yearsOfExperience
interface ExtendedMentor extends Partial<Mentor> {
  yearsOfExperience?: number;
}

// Update mentor profile
export const updateMentorProfile = async (
  userId: string,
  profileData: ExtendedMentor
): Promise<Partial<Mentor>> => {
  try {
    const db = await getDatabase();

    // First get the mentor profile by user ID
    const mentorDocs = await db.mentors
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    if (mentorDocs.length === 0) {
      throw new Error("Mentor profile not found");
    }

    const mentorDoc = mentorDocs[0];
    const mentor = mentorDoc.toJSON();
    const now = Date.now();

    // Update mentor profile
    const updatedProfile: Record<string, any> = {
      ...mentor,
      bio: profileData.bio !== undefined ? profileData.bio : mentor.bio,
      expertise:
        profileData.expertise !== undefined
          ? profileData.expertise
          : mentor.expertise,
      sessionPrice:
        profileData.sessionPrice !== undefined
          ? profileData.sessionPrice
          : mentor.sessionPrice,
      updatedAt: now,
    };

    // Only include these fields if they are in the updates
    if (profileData.portfolio) updatedProfile.portfolio = profileData.portfolio;
    if (profileData.certifications)
      updatedProfile.certifications = profileData.certifications;
    if (profileData.education) updatedProfile.education = profileData.education;
    if (profileData.workExperience)
      updatedProfile.workExperience = profileData.workExperience;
    if (profileData.yearsOfExperience)
      updatedProfile.yearsOfExperience = profileData.yearsOfExperience;

    // Save updated profile
    await mentorDoc.update({
      $set: updatedProfile,
    });

    // Update user data if provided
    if (profileData.name || profileData.email || profileData.profilePicture) {
      const userDoc = await db.users.findOne(userId).exec();

      if (userDoc) {
        const user = userDoc.toJSON();
        const updatedUser = {
          ...user,
          name: profileData.name !== undefined ? profileData.name : user.name,
          email:
            profileData.email !== undefined ? profileData.email : user.email,
          profilePicture:
            profileData.profilePicture !== undefined
              ? profileData.profilePicture
              : user.profilePicture,
          updatedAt: now,
        };

        await userDoc.update({
          $set: updatedUser,
        });
      }
    }

    // Return the full updated mentor profile
    const updatedMentor = await getMentorByUserId(userId);
    return updatedMentor || updatedProfile;
  } catch (error: unknown) {
    console.error(`Failed to update mentor profile:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update mentor profile: ${error.message}`);
    } else {
      throw new Error(`Failed to update mentor profile: Unknown error`);
    }
  }
};

// Get current user from localStorage
export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userJson = localStorage.getItem("currentUser");
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          resolve(user);
        } catch (error) {
          console.error("Error parsing user data from localStorage:", error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    }, 300);
  });
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      localStorage.removeItem("currentUser");
      resolve();
    }, 300);
  });
};
