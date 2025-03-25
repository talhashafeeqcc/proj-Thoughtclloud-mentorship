import { getDatabase } from "./database/db";
import { v4 as uuidv4 } from "uuid";
import type {
  User,
  Mentor,
  LoginCredentials,
  RegisterData,
  AvailabilitySlot,
  Mentee,
} from "../types";

// Type for updatedMentor with index signature to fix the indexing issue
interface UpdatedMentorFields {
  [key: string]: any; // Add index signature to allow string indexing
  expertise?: string[];
  bio?: string;
  sessionPrice?: number;
  yearsOfExperience?: number;
  portfolio?: any[];
  certifications?: any[];
  education?: any[];
  workExperience?: any[];
  availability?: AvailabilitySlot[];
  updatedAt: number;
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

    // Return users without passwords and convert to plain objects
    return users.map((user: any) => {
      const userData = user.toJSON();
      const { password, ...safeUser } = userData;
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
    const results = await Promise.all(
      mentorProfiles.map(async (mentorDoc: any) => {
        const mentor = mentorDoc.toJSON();
        // Convert readonly arrays to mutable arrays
        const processedMentor = JSON.parse(JSON.stringify(mentor));

        // Find the matching user
        const userDoc = userProfiles.find((u: any) => u.id === mentor.userId);

        if (!userDoc) {
          console.warn(
            `No user profile found for mentor with userId: ${mentor.userId}`
          );
          return processedMentor;
        }

        const userData = userDoc.toJSON();
        const { password, ...safeUser } = userData;

        // Return combined data
        return {
          ...processedMentor,
          email: safeUser.email,
          name: safeUser.name,
          role: "mentor" as const, // Cast to the expected type
          profilePicture: safeUser.profilePicture,
        };
      })
    );

    return results;
  } catch (error) {
    console.error("Error fetching mentors:", error);
    throw error;
  }
};

// Get mentor by ID with user data
export const getMentorById = async (
  id: string
): Promise<Partial<Mentor> | null> => {
  try {
    const db = await getDatabase();
    console.log("Fetching mentor by ID:", id);

    // First try to find by direct ID
    let mentorDoc = await db.mentors.findOne(id).exec();

    // If not found, try to find by userId
    if (!mentorDoc) {
      console.log("Mentor not found by ID, trying to find by userId");
      const mentorDocs = await db.mentors
        .find({
          selector: {
            userId: id,
          },
        })
        .exec();

      if (mentorDocs.length === 0) {
        console.log("No mentor found for ID or userId:", id);
        return null;
      }

      mentorDoc = mentorDocs[0];
    }

    const mentor = mentorDoc.toJSON();

    // Convert readonly arrays to regular arrays
    const processedMentor = JSON.parse(JSON.stringify(mentor));

    // Get user data
    const userDoc = await db.users.findOne(mentor.userId).exec();
    if (!userDoc) {
      console.log("User not found for mentor:", mentor.id);
      return processedMentor;
    }

    const user = userDoc.toJSON();
    const { password, ...safeUser } = user;

    // Combine user and mentor data
    const combinedProfile = {
      ...processedMentor,
      email: safeUser.email,
      name: safeUser.name,
      role: "mentor" as const, // Force the type to be "mentor"
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

// Create a new user account
export const registerUser = async (userData: RegisterData): Promise<User> => {
  try {
    const db = await getDatabase();
    console.log("Registering new user:", userData.email);

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

    const now = Date.now();
    const userId = uuidv4();

    // Create user record - using type assertion to handle the profilePicture property
    const userDoc = await db.users.insert({
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      password: userData.password, // In a real app, hash this password
      profilePicture: "", // Set a default empty string
      createdAt: now,
      updatedAt: now,
    });

    const user = userDoc.toJSON();
    console.log("User created successfully:", userId);

    // Create corresponding profile based on role
    if (userData.role === "mentor") {
      console.log("Creating mentor profile for user:", userId);
      const mentorId = uuidv4();
      await db.mentors.insert({
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
      });
      console.log("Mentor profile created successfully:", mentorId);
    } else if (userData.role === "mentee") {
      console.log("Creating mentee profile for user:", userId);
      const menteeId = uuidv4();
      await db.mentees.insert({
        id: menteeId,
        userId: userId,
        interests: [],
        bio: "",
        goals: "",
        currentPosition: "",
        createdAt: now,
        updatedAt: now,
      });
      console.log("Mentee profile created successfully:", menteeId);
    }

    // Return user without password
    const { password, ...safeUser } = user;
    return safeUser as User;
  } catch (error) {
    console.error("Error registering user:", error);
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

// Update mentor profile (only profile data, not auth data)
export const updateMentorProfile = async (
  userId: string,
  profileData: ExtendedMentor
): Promise<Partial<Mentor>> => {
  try {
    console.log("Updating mentor profile for user:", userId);
    const db = await getDatabase();

    // Get user doc first to verify it exists
    const userDoc = await db.users.findOne(userId).exec();
    if (!userDoc) {
      throw new Error("User not found");
    }

    // Find the mentor profile by userId
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
    const mentorId = mentorDoc.id;

    console.log("Found mentor profile:", mentorId);

    // Update fields that are allowed to be updated - using the interface with index signature
    const updatedMentor: UpdatedMentorFields = {
      expertise: profileData.expertise,
      bio: profileData.bio,
      sessionPrice: profileData.sessionPrice,
      yearsOfExperience: profileData.yearsOfExperience,
      portfolio: profileData.portfolio,
      certifications: profileData.certifications,
      education: profileData.education,
      workExperience: profileData.workExperience,
      availability: profileData.availability,
      updatedAt: Date.now(),
    };

    // Remove undefined fields
    Object.keys(updatedMentor).forEach((key) => {
      if (updatedMentor[key] === undefined) {
        delete updatedMentor[key];
      }
    });

    console.log("Updating mentor with data:", updatedMentor);

    // Update the document using update method instead of atomicPatch
    await mentorDoc.update({
      $set: updatedMentor,
    });

    console.log("Mentor profile updated successfully");

    // Get the updated mentor profile with null check
    const updatedDoc = await db.mentors.findOne(mentorId).exec();
    if (!updatedDoc) {
      throw new Error("Failed to retrieve updated mentor profile");
    }

    const updatedMentorData = updatedDoc.toJSON();

    // Convert to plain JS object to avoid readonly arrays
    const processedMentor = JSON.parse(JSON.stringify(updatedMentorData));

    // Get the user data to combine
    const user = userDoc.toJSON();
    const { password, ...safeUser } = user;

    // Combine and return
    const combinedProfile = {
      ...processedMentor,
      email: safeUser.email,
      name: safeUser.name,
      role: "mentor" as const, // Force the type to be "mentor"
      profilePicture: safeUser.profilePicture,
    };

    return combinedProfile;
  } catch (error) {
    console.error("Error updating mentor profile:", error);
    throw error;
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

    // Convert to plain JS object to avoid readonly arrays
    const processedMentor = JSON.parse(JSON.stringify(mentor));

    // Combine user and mentor data with proper type cast for role
    return {
      ...processedMentor,
      email: safeUser.email,
      name: safeUser.name,
      role: "mentor" as const, // Force the role to be "mentor"
      profilePicture: safeUser.profilePicture,
    };
  } catch (error) {
    console.error("Error fetching mentor by user ID:", error);
    throw error;
  }
};

// Get mentee by user ID
export const getMenteeByUserId = async (
  userId: string
): Promise<Partial<Mentee> | null> => {
  try {
    const db = await getDatabase();
    console.log("Fetching mentee profile for user:", userId);

    // First get the mentee profile
    const menteeDocs = await db.mentees
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    if (menteeDocs.length === 0) {
      console.error("No mentee profile found for user:", userId);
      return null;
    }

    const menteeDoc = menteeDocs[0];
    const mentee = menteeDoc.toJSON();

    // Then get the user data
    const userDoc = await db.users.findOne(userId).exec();
    if (!userDoc) {
      console.error("User not found for ID:", userId);
      return null;
    }

    const user = userDoc.toJSON();
    const { password, ...safeUser } = user;

    // Convert to plain JS object to avoid readonly arrays
    const processedMentee = JSON.parse(JSON.stringify(mentee));

    // Combine user and mentee data with proper type cast for role
    return {
      ...processedMentee,
      email: safeUser.email,
      name: safeUser.name,
      role: "mentee" as const, // Force the role to be "mentee"
      profilePicture: safeUser.profilePicture,
    };
  } catch (error) {
    console.error("Error fetching mentee by user ID:", error);
    throw error;
  }
};
