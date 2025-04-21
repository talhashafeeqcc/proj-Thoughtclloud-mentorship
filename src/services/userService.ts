import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "./database/db";
import {
  User,
  RegisterData,
  LoginCredentials,
  Mentor,
  PortfolioItem,
  Education,
  Certification,
  WorkExperience,
} from "../types";
import { getMentorByUserId } from './mentorService';
import { getMenteeByUserId } from './menteeService';

// Define document types for internal use
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

interface MentorDocument {
  id: string;
  userId: string;
  expertise: string[];
  bio: string;
  sessionPrice: number;
  yearsOfExperience: number;
  portfolio: PortfolioItem[];
  education: Education[];
  certifications: Certification[];
  workExperience: WorkExperience[];
  createdAt: number;
  updatedAt: number;
}

interface Document<T> {
  toJSON(): T;
}

// Simple password comparison function
// In a real app, you would use bcrypt.compare or similar
const comparePasswords = (plain: string, hashed: string): boolean => {
  // For demo purposes, just check if the passwords match
  // In production, you'd use proper password hashing
  return plain === hashed || hashed.startsWith(`hashed_${plain}_`);
};

// Get all users (without passwords)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const db = await getDatabase();
    const userDocs = await db.users.find().exec();
    const users = userDocs.map((doc: Document<UserDocument>) => {
      const userData = doc.toJSON();
      // Remove password from response
      const { password, ...user } = userData;
      return user as User;
    });
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
};

// Add getUsers as an alias for getAllUsers to maintain backward compatibility
export const getUsers = getAllUsers;

// Get all mentors with their profiles
export const getAllMentors = async (): Promise<Mentor[]> => {
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
    throw new Error("Failed to fetch mentors");
  }
};

// Add getMentors as an alias for getAllMentors to maintain backward compatibility
export const getMentors = getAllMentors;

// Get mentor by ID with user data
export const getMentorById = async (
  id: string
): Promise<Mentor> => {
  try {
    const db = await getDatabase();
    
    // First try to get the mentor directly by ID
    let mentorDoc = await db.mentors.findOne(id).exec();
    
    // If not found by direct ID, try to find the mentor by userId
    if (!mentorDoc) {
      // Try to find the mentor using userId field
      const mentorDocs = await db.mentors
        .find({
          selector: {
            userId: id,
          },
        })
        .exec();
      
      if (mentorDocs.length === 0) {
        throw new Error(`Mentor not found with ID or userId: ${id}`);
      }
      
      mentorDoc = mentorDocs[0];
    }

    const mentor = mentorDoc.toJSON();
    
    // Get the full user record to combine user and mentor profile data
    const userDoc = await db.users.findOne(mentor.userId).exec();
    
    if (!userDoc) {
      console.error("User not found for mentor:", mentor.id);
      throw new Error(`User not found for mentor profile: ${mentor.id}`);
    }
    
    const userData = userDoc.toJSON();
    const { password, ...user } = userData;
    
    // Combine user data with mentor profile
    const combinedProfile: Mentor = {
      ...user,
      ...mentor,
      id: mentor.id,
      userId: user.id,
    };
    
    return combinedProfile;
  } catch (error) {
    console.error("Error fetching mentor by ID:", error);
    throw error;
  }
};

// Get mentor profile by ID (alias for getMentorById for backward compatibility)
export const getMentorProfile = async (id: string): Promise<Mentor> => {
  return getMentorById(id);
};

// Get user by ID (without password)
export const getUserById = async (id: string): Promise<User> => {
  try {
    const db = await getDatabase();
    const userDoc = await db.users.findOne(id).exec();
    
    if (!userDoc) {
      throw new Error(`User not found with ID: ${id}`);
    }
    
    const userData = userDoc.toJSON();
    const { password, ...user } = userData;
    
    return user as User;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
};

// Login user
export const login = async (
  credentials: LoginCredentials
): Promise<User | null> => {
  try {
    const db = await getDatabase();
    
    // Find user by email
    const userDocs = await db.users
      .find({
        selector: {
          email: credentials.email,
        },
      })
      .exec();
    
    // User not found
    if (userDocs.length === 0) {
      return null;
    }
    
    const userData = userDocs[0].toJSON();
    
    // Check password
    if (userData.password !== credentials.password) {
      return null;
    }
    
    // Create safe user object without password
    const { password, ...safeUser } = userData;
    
    return safeUser as User;
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Login failed");
  }
};

// Add loginUser as an alias for login to maintain backward compatibility
export const loginUser = login;

// Create a new user account
export const register = async (
  userData: RegisterData
): Promise<{ user: User; mentorId?: string; menteeId?: string }> => {
  try {
    const db = await getDatabase();
    
    // Check if email exists
    const existingDocs = await db.users
      .find({
        selector: {
          email: userData.email,
        },
      })
      .exec();
    
    if (existingDocs.length > 0) {
      throw new Error("Email already exists");
    }
    
    // Create user account
    const userId = uuidv4();
    const now = Date.now();
    
    const newUser = {
      id: userId,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: userData.role || "user",
      profilePicture: userData.profilePicture || "",
      bio: userData.bio || "",
      createdAt: now,
      updatedAt: now,
    };
    
    await db.users.insert(newUser);
    
    // Create mentor/mentee profile if applicable
    let mentorId;
    let menteeId;
    
    if (userData.role === "mentor" || userData.role === "both") {
      const mentorData = {
        id: uuidv4(),
        userId: userId,
        title: userData.title || "",
        expertise: userData.expertise || [],
        education: userData.education || [],
        experience: userData.experience || [],
        certifications: userData.certifications || [],
        rate: userData.rate || 0,
        availability: [],
        profileComplete: false,
        paymentConnected: false,
        stripeAccountId: "",
        createdAt: now,
        updatedAt: now,
      };
      
      await db.mentors.insert(mentorData);
      mentorId = mentorData.id;
    }
    
    if (userData.role === "mentee" || userData.role === "both") {
      const menteeData = {
        id: uuidv4(),
        userId: userId,
        interests: userData.interests || [],
        goals: userData.goals || [],
        experience: userData.experience || "",
        createdAt: now,
        updatedAt: now,
      };
      
      await db.mentees.insert(menteeData);
      menteeId = menteeData.id;
    }
    
    // Return user data without password
    const { password, ...safeUser } = newUser;
    return {
      user: safeUser as User,
      mentorId,
      menteeId,
    };
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

// Add registerUser as an alias for register to maintain backward compatibility
export const registerUser = register;

// Update user profile
export const updateUser = async (
  userId: string,
  updates: Partial<User & { password?: string }>
): Promise<User> => {
  try {
    const db = await getDatabase();
    const userDoc = await db.users.findOne(userId).exec();
    
    if (!userDoc) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    // Don't allow id updates through this method
    const { id, password, ...allowedUpdates } = updates;
    
    const now = Date.now();
    await userDoc.update({
      $set: {
        ...allowedUpdates,
        updatedAt: now,
      },
    });
    
    // Fetch the updated user
    const updatedDoc = await db.users.findOne(userId).exec();
    const updatedData = updatedDoc.toJSON();
    
    // Return without password
    const { password: pwd, ...safeUser } = updatedData;
    return safeUser as User;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

// Update user profile (alias for updateUser for backward compatibility)
export const updateProfile = async (
  userId: string,
  updates: Partial<User & { password?: string }>
): Promise<User> => {
  return updateUser(userId, updates);
};

// Create a mentor profile
export const createMentorProfile = async (
  userId: string,
  updates: Partial<Mentor>
): Promise<Mentor> => {
  try {
    const db = await getDatabase();
    const now = Date.now();
    
    // Create a new mentor profile
    const mentorId = uuidv4();
    const mentorData = {
      id: mentorId,
      userId: userId,
      title: updates.title || "",
      expertise: updates.expertise || [],
      education: updates.education || [],
      experience: updates.experience || [],
      certifications: updates.certifications || [],
      rate: updates.rate || 0,
      bio: updates.bio || "",
      portfolio: updates.portfolio || [],
      workExperience: updates.workExperience || [],
      sessionPrice: updates.sessionPrice || 0,
      availability: [],
      ratings: [],
      profileComplete: false,
      paymentConnected: false,
      stripeAccountId: "",
      createdAt: now,
      updatedAt: now,
    };
    
    await db.mentors.insert(mentorData);
    
    // Return the newly created mentor profile with user data
    return getMentorById(mentorId);
  } catch (error) {
    console.error("Error creating mentor profile:", error);
    throw error;
  }
};

// Update mentor profile (only profile data, not auth data)
export const updateMentorProfile = async (
  userId: string,
  updates: Partial<Mentor>
): Promise<Mentor> => {
  try {
    const db = await getDatabase();
    
    // First get the user to ensure it exists
    const userDoc = await db.users.findOne(userId).exec();
    
    if (!userDoc) {
      throw new Error(`User not found with ID: ${userId}`);
    }
    
    // Find the mentor profile
    const mentorDocs = await db.mentors
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();
    
    if (mentorDocs.length === 0) {
      // If mentor profile doesn't exist, create one
      return createMentorProfile(userId, updates);
    }
    
    const mentorDoc = mentorDocs[0];
    const mentorData = mentorDoc.toJSON();
    
    // Don't allow updating these fields directly
    const { id, ...allowedUpdates } = updates;
    
    const now = Date.now();
    
    // Handle mentor fields that should be arrays if they aren't
    const mentorFields = {
      ...allowedUpdates,
    };
    
    // Ensure arrays are handled properly
    if (updates.expertise !== undefined && !Array.isArray(updates.expertise)) {
      mentorFields.expertise = [];
    }
    
    if (updates.education !== undefined && !Array.isArray(updates.education)) {
      mentorFields.education = [];
    }
    
    if (
      updates.experience !== undefined &&
      !Array.isArray(updates.experience)
    ) {
      mentorFields.experience = [];
    }
    
    if (
      updates.certifications !== undefined &&
      !Array.isArray(updates.certifications)
    ) {
      mentorFields.certifications = [];
    }
    
    // Check if profile is now complete
    let profileComplete = mentorData.profileComplete;
    
    // Update profile complete status if we have all required fields
    if (
      'title' in mentorFields || 
      'expertise' in mentorFields || 
      'education' in mentorFields || 
      'experience' in mentorFields || 
      'rate' in mentorFields
    ) {
      const currentData = {
        ...mentorData,
        ...mentorFields,
      };
      
      profileComplete = !!(
        currentData.title &&
        currentData.expertise &&
        currentData.expertise.length > 0 &&
        currentData.education &&
        currentData.education.length > 0 &&
        ('experience' in currentData) &&
        (Array.isArray(currentData.experience) ? currentData.experience.length > 0 : !!currentData.experience) &&
        currentData.rate &&
        currentData.rate > 0
      );
    }
    
    await mentorDoc.update({
      $set: {
        ...mentorFields,
        profileComplete,
        updatedAt: now,
      },
    });
    
    // Get the updated mentor profile
    const updatedMentorDoc = await db.mentors.findOne(mentorData.id).exec();
    
    // Return the combined user and mentor profile
    const userData = userDoc.toJSON();
    const { password, ...user } = userData;
    const updatedMentor = updatedMentorDoc.toJSON();
    
    return {
      ...user,
      ...updatedMentor,
      id: updatedMentor.id,
      userId: user.id,
    } as Mentor;
  } catch (error) {
    console.error(`Failed to update mentor with user ID ${userId}:`, error);
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

// Re-export functions from other services
export { getMentorByUserId, getMenteeByUserId };