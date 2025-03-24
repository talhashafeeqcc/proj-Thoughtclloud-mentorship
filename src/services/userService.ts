import {
  User,
  Mentor,
  LoginCredentials,
  RegisterData,
  AvailabilitySlot,
} from "../types";
import { getDatabase } from "./database/db";
import { v4 as uuidv4 } from "uuid";
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
  availability?: AvailabilitySlot[];
  ratings?: any[];
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
    console.log("Fetching all mentors");

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

        if (!userDoc) {
          console.log("No user found for mentor:", mentor.id);
          return mentor;
        }

        const user = userDoc.toJSON();
        const { password, ...safeUser } = user;

        // Combine user and mentor data with all fields
        return {
          ...mentor,
          email: safeUser.email,
          name: safeUser.name,
          role: safeUser.role,
          profilePicture: safeUser.profilePicture,
          // Ensure these fields are included or defaulted
          portfolio: mentor.portfolio || [],
          certifications: mentor.certifications || [],
          education: mentor.education || [],
          workExperience: mentor.workExperience || [],
          availability: mentor.availability || [],
          yearsOfExperience: mentor.yearsOfExperience || 0,
          ratings: mentor.ratings || [],
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
    console.log("Fetching mentor profile by ID:", id);

    // First get the mentor profile
    const mentorDoc = await db.mentors.findOne(id).exec();
    if (!mentorDoc) {
      console.error("Mentor profile not found for ID:", id);
      return null;
    }

    const mentor = mentorDoc.toJSON();
    console.log("Found mentor profile:", mentor);

    // Then get the user data
    const userDoc = await db.users.findOne(mentor.userId).exec();
    if (!userDoc) {
      console.error("User not found for mentor ID:", id);
      return null;
    }

    const user = userDoc.toJSON();
    const { password, ...safeUser } = user;

    // Combine user and mentor data
    const combinedProfile = {
      ...mentor,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
      profilePicture: safeUser.profilePicture,
    };

    console.log("Combined mentor profile:", combinedProfile);
    return combinedProfile;
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
    console.log("Attempting login for:", credentials.email);

    // Find user by email
    const users = await db.users
      .find({
        selector: {
          email: credentials.email,
        },
      })
      .exec();

    if (users.length === 0) {
      throw new Error("User not found");
    }

    const userDoc = users[0];
    const user = userDoc.toJSON();

    // Verify password
    if (!comparePasswords(credentials.password, user.password)) {
      throw new Error("Invalid password");
    }

    // Remove password and create safe user object
    const { password, ...safeUser } = user;

    // Save to localStorage
    localStorage.setItem("currentUser", JSON.stringify(safeUser));

    console.log("Login successful for user:", safeUser.id);
    return safeUser as User;
  } catch (error) {
    console.error("Login error:", error);
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
      const mentorId = uuidv4();
      const newMentorProfile = {
        id: mentorId,
        userId: userId,
        expertise: [],
        bio: "",
        sessionPrice: 0,
        yearsOfExperience: 0,
        portfolio: [],
        certifications: [],
        education: [],
        workExperience: [],
        availability: [],
        createdAt: now,
        updatedAt: now,
      };

      console.log("Creating new mentor profile:", newMentorProfile);
      await db.mentors.insert(newMentorProfile);
    }

    // If it's a mentee, create a mentee profile
    if (userData.role === "mentee") {
      const menteeId = uuidv4();
      const newMenteeProfile = {
        id: menteeId,
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
    console.log("Updating mentor profile for user:", userId);

    // First get the mentor profile by user ID
    const mentorDocs = await db.mentors
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    if (mentorDocs.length === 0) {
      console.error("Mentor profile not found for user:", userId);
      throw new Error("Mentor profile not found");
    }

    const mentorDoc = mentorDocs[0];
    const mentor = mentorDoc.toJSON();
    const now = Date.now();

    // Update mentor profile with all possible fields
    const updatedProfile: Record<string, any> = {
      bio: profileData.bio !== undefined ? profileData.bio : mentor.bio,
      expertise:
        profileData.expertise !== undefined
          ? profileData.expertise
          : mentor.expertise,
      sessionPrice:
        profileData.sessionPrice !== undefined
          ? Number(profileData.sessionPrice)
          : mentor.sessionPrice,
      yearsOfExperience:
        profileData.yearsOfExperience !== undefined
          ? Number(profileData.yearsOfExperience)
          : mentor.yearsOfExperience,
      portfolio:
        profileData.portfolio !== undefined
          ? profileData.portfolio
          : mentor.portfolio || [],
      certifications:
        profileData.certifications !== undefined
          ? profileData.certifications
          : mentor.certifications || [],
      education:
        profileData.education !== undefined
          ? profileData.education
          : mentor.education || [],
      workExperience:
        profileData.workExperience !== undefined
          ? profileData.workExperience
          : mentor.workExperience || [],
      availability:
        profileData.availability !== undefined
          ? profileData.availability
          : mentor.availability || [],
      updatedAt: now,
    };

    console.log("Updating mentor profile with data:", updatedProfile);

    // Save updated profile
    await mentorDoc.update({
      $set: updatedProfile,
    });

    // Get the updated mentor profile directly from the database
    const updatedMentorDoc = await db.mentors.findOne(mentor.id).exec();
    if (!updatedMentorDoc) {
      throw new Error("Failed to fetch updated mentor profile");
    }

    const updatedMentor = updatedMentorDoc.toJSON();

    // Get user data
    const userDoc = await db.users.findOne(userId).exec();
    if (!userDoc) {
      throw new Error("User not found");
    }

    const user = userDoc.toJSON();
    const { password, ...safeUser } = user;

    // Combine user and mentor data
    const combinedProfile = {
      ...updatedMentor,
      email: safeUser.email,
      name: safeUser.name,
      role: safeUser.role,
      profilePicture: safeUser.profilePicture,
    };

    // Update localStorage with the new user data
    localStorage.setItem("currentUser", JSON.stringify(combinedProfile));

    return combinedProfile;
  } catch (error: unknown) {
    console.error(`Failed to update mentor profile:`, error);
    if (error instanceof Error) {
      throw new Error(`Failed to update mentor profile: ${error.message}`);
    } else {
      throw new Error(`Failed to update mentor profile: Unknown error`);
    }
  }
};

// Get current user from localStorage and database
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const db = await getDatabase();
    const userJson = localStorage.getItem("currentUser");

    if (!userJson) {
      return null;
    }

    const user = JSON.parse(userJson);

    // Verify user exists in database
    const userDoc = await db.users.findOne(user.id).exec();
    if (!userDoc) {
      localStorage.removeItem("currentUser");
      return null;
    }

    const dbUser = userDoc.toJSON();
    const { password, ...safeUser } = dbUser;

    return safeUser as User;
  } catch (error) {
    console.error("Error getting current user:", error);
    localStorage.removeItem("currentUser");
    return null;
  }
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

// Get mentor by user ID
export const getMentorByUserId = async (
  userId: string
): Promise<Partial<Mentor> | null> => {
  try {
    const db = await getDatabase();
    console.log("Fetching mentor profile for user:", userId);

    // First get the mentor profile
    const mentorDocs = await db.mentors
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    if (mentorDocs.length === 0) {
      console.error("No mentor profile found for user:", userId);
      return null;
    }

    const mentorDoc = mentorDocs[0];
    const mentor = mentorDoc.toJSON();

    // Then get the user data
    const userDoc = await db.users.findOne(userId).exec();
    if (!userDoc) {
      console.error("User not found for ID:", userId);
      return null;
    }

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
    console.error("Error fetching mentor by user ID:", error);
    throw error;
  }
};
