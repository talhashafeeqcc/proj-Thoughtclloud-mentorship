import { getDatabase } from "./database/db";
import { v4 as uuidv4 } from "uuid";
import type {
  User,
  Mentor,
  LoginCredentials,
  RegisterData,
  AvailabilitySlot,
  Mentee,
  PortfolioItem,
  Education,
  Certification,
  WorkExperience,
} from "../types";

// Add these type definitions at the top of the file
interface MentorDocument {
  id: string;
  userId: string;
  expertise: string[];
  bio: string;
  sessionPrice: number;
  yearsOfExperience: number;
  hourlyRate: number;
  availability: AvailabilitySlot[];
  portfolio: PortfolioItem[];
  education: Education[];
  certifications: Certification[];
  workExperience: WorkExperience[];
  createdAt: number;
  updatedAt: number;
}

interface UserDocument {
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
  profilePicture: string;
  createdAt: number;
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
    let userDoc = await db.users.findOne(userId).exec();

    // If user doesn't exist, throw an error instead of creating one
    if (!userDoc) {
      console.log("User not found in database with ID:", userId);
      throw new Error(`Cannot update user: User with ID ${userId} not found`);
    }

    const user = userDoc.toJSON();

    // Update fields
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

// Update the ExtendedMentor interface
interface ExtendedMentor extends Partial<Mentor> {
  yearsOfExperience?: number;
  hourlyRate?: number;
  sessionPrice?: number;
}

// Update mentor profile (only profile data, not auth data)
export const updateMentorProfile = async (
  userId: string,
  updates: Partial<ExtendedMentor>
): Promise<ExtendedMentor | null> => {
  try {
    const db = await getDatabase();
    console.log("Updating mentor profile for user:", userId);

    // First check if user exists
    let userDoc = await db.users.findOne(userId).exec();
    
    // If user doesn't exist, throw an error
    if (!userDoc) {
      console.log("User not found in database with ID:", userId);
      throw new Error(`Cannot update mentor profile: User with ID ${userId} not found`);
    }

    // Find or create mentor profile
    const mentorDocs = await db.mentors
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    const now = Date.now();
    let mentorDoc;

    if (mentorDocs.length === 0) {
      // Create new mentor profile
      const mentorId = uuidv4();
      
      // Ensure all fields match the expected schema
      // Ensure arrays are properly initialized
      const expertiseArray = Array.isArray(updates.expertise) ? updates.expertise : [];
      const portfolioArray = Array.isArray(updates.portfolio) ? updates.portfolio : [];
      const certificationsArray = Array.isArray(updates.certifications) ? updates.certifications : [];
      const educationArray = Array.isArray(updates.education) ? updates.education : [];
      const workExperienceArray = Array.isArray(updates.workExperience) ? updates.workExperience : [];
      const availabilityArray = Array.isArray(updates.availability) ? updates.availability : [];
      
      // Debug log for all fields
      console.log("Debug - mentor fields:", {
        expertise: {
          value: expertiseArray, 
          type: typeof expertiseArray, 
          isArray: Array.isArray(expertiseArray)
        },
        portfolio: {
          value: portfolioArray, 
          type: typeof portfolioArray, 
          isArray: Array.isArray(portfolioArray)
        },
        education: {
          value: educationArray, 
          type: typeof educationArray, 
          isArray: Array.isArray(educationArray)
        },
        certifications: {
          value: certificationsArray, 
          type: typeof certificationsArray, 
          isArray: Array.isArray(certificationsArray)
        },
        workExperience: {
          value: workExperienceArray, 
          type: typeof workExperienceArray, 
          isArray: Array.isArray(workExperienceArray)
        },
        bio: {
          value: updates.bio || "",
          type: typeof (updates.bio || "")
        },
        sessionPrice: {
          value: typeof updates.sessionPrice === 'number' ? updates.sessionPrice : 0,
          type: typeof (typeof updates.sessionPrice === 'number' ? updates.sessionPrice : 0)
        }
      });
      
      // Create new mentor profile with properly initialized fields
      try {
        // Use JSON serialization/deserialization to ensure we have a clean object
        // This helps avoid RxError VD2 schema validation issues
        const safeNewMentor = JSON.parse(JSON.stringify({
          id: mentorId,
          userId: userId,
          expertise: expertiseArray,
          bio: updates.bio || "",
          hourlyRate: typeof updates.hourlyRate === 'number' ? updates.hourlyRate : 0,
          sessionPrice: typeof updates.sessionPrice === 'number' ? updates.sessionPrice : 0,
          yearsOfExperience: typeof updates.yearsOfExperience === 'number' ? updates.yearsOfExperience : 0,
          availability: availabilityArray,
          portfolio: portfolioArray,
          education: educationArray,
          certifications: certificationsArray,
          workExperience: workExperienceArray,
          createdAt: now,
          updatedAt: now,
        }));
        
        console.log("Safe mentor object to insert:", safeNewMentor);
        
        mentorDoc = await db.mentors.insert(safeNewMentor);
        console.log("Successfully created mentor profile with ID:", mentorId);
      } catch (err: any) {
        console.error("Failed to create mentor profile:", err);
        // Show more details about the error
        if (err.parameters) {
          console.error("Error parameters:", err.parameters);
        }
        if (err.rxdb) {
          console.error("RxDB error details:", err.rxdb);
        }
        throw new Error(`Failed to create mentor profile: ${err.message}`);
      }
    } else {
      mentorDoc = mentorDocs[0];
    }

    const mentor = mentorDoc.toJSON() as MentorDocument;

    // Prepare mentor updates with proper array and type handling
    const mentorUpdates: Partial<MentorDocument> = {
      expertise: Array.isArray(updates.expertise) ? updates.expertise : mentor.expertise,
      bio: updates.bio !== undefined ? updates.bio : mentor.bio,
      hourlyRate: typeof updates.hourlyRate === 'number' ? updates.hourlyRate : mentor.hourlyRate,
      sessionPrice: typeof updates.sessionPrice === 'number' ? updates.sessionPrice : mentor.sessionPrice,
      yearsOfExperience: typeof updates.yearsOfExperience === 'number' ? updates.yearsOfExperience : mentor.yearsOfExperience,
      availability: Array.isArray(updates.availability) ? updates.availability : mentor.availability,
      portfolio: Array.isArray(updates.portfolio) ? updates.portfolio : mentor.portfolio,
      education: Array.isArray(updates.education) ? updates.education : mentor.education,
      certifications: Array.isArray(updates.certifications) ? updates.certifications : mentor.certifications,
      workExperience: Array.isArray(updates.workExperience) ? updates.workExperience : mentor.workExperience,
      updatedAt: now,
    };

    console.log("Updating mentor with:", {
      expertise: mentorUpdates.expertise,
      // other fields logged for debugging
    });

    // Update mentor data
    try {
      await mentorDoc.update({
        $set: mentorUpdates,
      });
      console.log("Successfully updated mentor profile");
    } catch (err: any) {
      console.error("Failed to update mentor profile:", err);
      throw new Error(`Failed to update mentor profile: ${err.message}`);
    }

    // Update user data if provided
    if (updates.name || updates.email || updates.profilePicture) {
      const updatedUserDoc = await db.users.findOne(userId).exec();

      if (updatedUserDoc) {
        const user = updatedUserDoc.toJSON();
        const userUpdates: Partial<UserDocument> = {
          name: updates.name !== undefined ? updates.name : user.name,
          email: updates.email !== undefined ? updates.email : user.email,
          profilePicture: updates.profilePicture !== undefined ? updates.profilePicture : user.profilePicture,
          updatedAt: now,
        };

        await updatedUserDoc.update({
          $set: userUpdates,
        });
      }
    }

    // Return updated mentor profile
    return getMentorById(userId);
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

    let menteeDoc;
    let menteeData;

    // If no mentee profile exists, create a new one
    if (menteeDocs.length === 0) {
      console.log("Mentee profile not found, creating new one");
      // Check if the user exists first
      const userDoc = await db.users.findOne(userId).exec();
      if (!userDoc) {
        console.error("User not found for ID:", userId);
        return null;
      }

      // Create a new mentee profile
      const newMenteeProfile = {
        id: uuidv4(),
        userId: userId,
        interests: [],
        bio: "", // Required field
        goals: [],
        currentPosition: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      menteeDoc = await db.mentees.insert(newMenteeProfile);
      menteeData = menteeDoc.toJSON();
      console.log("Created new mentee profile:", menteeData.id);
    } else {
      menteeDoc = menteeDocs[0];
      menteeData = menteeDoc.toJSON();
      console.log("Found mentee profile:", menteeData.id);
    }

    // Then get the user data
    const userDoc = await db.users.findOne(userId).exec();
    if (!userDoc) {
      console.error("User not found for ID:", userId);
      return null;
    }

    const user = userDoc.toJSON();
    const { password, ...safeUser } = user;

    // Convert to plain JS object to avoid readonly arrays
    const processedMentee = JSON.parse(JSON.stringify(menteeData));

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

// Export the reference to getMentorByUserId from mentorService for backward compatibility
export { getMentorByUserId } from './mentorService';
