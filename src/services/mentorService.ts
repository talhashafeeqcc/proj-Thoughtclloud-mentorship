import { v4 as uuidv4 } from "uuid";
import type { MentorProfile } from "../types";
import { getDatabase } from "./database/db";
import type { RxDocument } from "rxdb";

// Extended MentorProfile with additional fields from our database schema
interface ExtendedMentorProfile extends MentorProfile {
  yearsOfExperience?: number;
  userId?: string;
}

// Helper types for RxDB documents
interface MentorDocument {
  id: string;
  userId: string;
  expertise: string[];
  bio: string;
  sessionPrice: number;
  yearsOfExperience: number;
  portfolio: any[];
  certifications: any[];
  education: any[];
  workExperience: any[];
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

interface AvailabilityDocument {
  id: string;
  mentorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  createdAt: number;
  updatedAt: number;
}

// Mock data for mentors

// Helper to initialize local storage
// This function is no longer needed with RxDB, so removing it
// const initLocalStorage = () => {
//   if (typeof window !== "undefined") {
//     if (!localStorage.getItem("mentors")) {
//       localStorage.setItem("mentors", JSON.stringify(MOCK_MENTORS));
//     }
//   }
// };

/**
 * Get all mentors with combined user and mentor data
 */
export const getMentors = async (): Promise<MentorProfile[]> => {
  try {
    const db = await getDatabase();
    const mentorDocs = await db.mentors.find().exec();

    // Get the mentor profiles
    const mentorProfiles = mentorDocs.map((doc: RxDocument<MentorDocument>) =>
      doc.toJSON()
    );

    // Get user data for all mentors
    const userIds = mentorProfiles.map(
      (mentor: MentorDocument) => mentor.userId
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

    // Map users to their respective mentor profiles
    return Promise.all(
      mentorProfiles.map(async (mentor: MentorDocument) => {
        const userDoc = userDocs.find(
          (u: RxDocument<UserDocument>) => u.id === mentor.userId
        );

        if (!userDoc) {
          // If we don't have user data, create a placeholder with required fields
          return {
            id: mentor.id,
            email: "unknown@example.com",
            name: "Unknown Mentor",
            role: "mentor" as const,
            expertise: mentor.expertise,
            bio: mentor.bio,
            sessionPrice: mentor.sessionPrice,
            yearsOfExperience: mentor.yearsOfExperience,
          } as ExtendedMentorProfile;
        }

        const user = userDoc.toJSON();
        // Don't include password in the returned object
        const { password, ...safeUser } = user;

        // Get availability slots for this mentor
        const availabilityDocs = await db.availability
          .find({
            selector: {
              mentorId: mentor.id,
            },
          })
          .exec();

        const availability = availabilityDocs.map(
          (doc: RxDocument<AvailabilityDocument>) => doc.toJSON()
        );

        // Combine mentor and user data
        return {
          ...mentor,
          id: mentor.id,
          email: safeUser.email,
          name: safeUser.name,
          role: "mentor" as const,
          profilePicture: safeUser.profilePicture || "",
          availability: availability,
        } as ExtendedMentorProfile;
      })
    );
  } catch (error) {
    console.error("Failed to get mentors:", error);
    throw new Error("Failed to get mentors");
  }
};

/**
 * Get a mentor by ID with combined user and mentor data
 */
export const getMentorById = async (
  id: string
): Promise<MentorProfile | null> => {
  try {
    const db = await getDatabase();
    const mentorDoc = await db.mentors.findOne(id).exec();

    if (!mentorDoc) {
      return null;
    }

    const mentor = mentorDoc.toJSON() as MentorDocument;

    // Get user data
    const userDoc = await db.users.findOne(mentor.userId).exec();

    // Get availability slots for this mentor
    const availabilityDocs = await db.availability
      .find({
        selector: {
          mentorId: id,
        },
      })
      .exec();

    const availability = availabilityDocs.map(
      (doc: RxDocument<AvailabilityDocument>) => doc.toJSON()
    );

    if (!userDoc) {
      // If we don't have user data, create a placeholder with required fields
      return {
        id: mentor.id,
        email: "unknown@example.com",
        name: "Unknown Mentor",
        role: "mentor" as const,
        expertise: mentor.expertise,
        bio: mentor.bio,
        sessionPrice: mentor.sessionPrice,
        yearsOfExperience: mentor.yearsOfExperience,
        availability: availability,
      } as ExtendedMentorProfile;
    }

    const user = userDoc.toJSON() as UserDocument;
    // Don't include password in the returned object
    const { password, ...safeUser } = user;

    // Combine mentor and user data
    return {
      ...mentor,
      id: mentor.id,
      email: safeUser.email,
      name: safeUser.name,
      role: "mentor" as const,
      profilePicture: safeUser.profilePicture || "",
      availability: availability,
    } as ExtendedMentorProfile;
  } catch (error) {
    console.error(`Failed to get mentor with ID ${id}:`, error);
    throw new Error(`Failed to get mentor with ID ${id}`);
  }
};

/**
 * Create a new mentor profile
 */
export const createMentorProfile = async (
  mentorData: Partial<ExtendedMentorProfile>
): Promise<MentorProfile> => {
  try {
    const db = await getDatabase();

    // Create the user first if it doesn't exist
    if (!mentorData.userId) {
      // Check if user exists with email
      if (!mentorData.email) {
        throw new Error("Email is required to create a new mentor profile");
      }

      const existingUserDocs = await db.users
        .find({
          selector: {
            email: mentorData.email,
          },
        })
        .exec();

      if (existingUserDocs.length > 0) {
        // User exists, use their ID
        mentorData.userId = existingUserDocs[0].id;
      } else {
        // Create new user
        const now = Date.now();
        const userId = uuidv4();

        const newUser = {
          id: userId,
          email: mentorData.email,
          name: mentorData.name || `New Mentor`,
          role: "mentor",
          password: `hashed_defaultpassword_${now}`, // This is a placeholder - in real app, proper registration flow needed
          profilePicture: mentorData.profilePicture || "",
          createdAt: now,
          updatedAt: now,
        };

        await db.users.insert(newUser);
        mentorData.userId = userId;
      }
    }

    // Create the mentor profile
    const now = Date.now();
    const mentorId = uuidv4();

    const newMentor = {
      id: mentorId,
      userId: mentorData.userId,
      expertise: mentorData.expertise || [],
      bio: mentorData.bio || "",
      sessionPrice: mentorData.sessionPrice || 0,
      yearsOfExperience: mentorData.yearsOfExperience || 0,
      portfolio: mentorData.portfolio || [],
      certifications: mentorData.certifications || [],
      education: mentorData.education || [],
      workExperience: mentorData.workExperience || [],
      createdAt: now,
      updatedAt: now,
    };

    await db.mentors.insert(newMentor);

    // Create availability slots if provided
    if (mentorData.availability && mentorData.availability.length > 0) {
      const availabilitySlots = mentorData.availability.map((slot) => ({
        id: uuidv4(),
        mentorId: mentorId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked || false,
        createdAt: now,
        updatedAt: now,
      }));

      await db.availability.bulkInsert(availabilitySlots);
    }

    // Return the complete mentor profile
    const mentorProfile = await getMentorById(mentorId);
    if (!mentorProfile) {
      throw new Error(
        "Failed to create mentor profile: could not retrieve after creation"
      );
    }
    return mentorProfile;
  } catch (error) {
    console.error("Failed to create mentor profile:", error);
    throw new Error("Failed to create mentor profile");
  }
};

/**
 * Update a mentor profile
 */
export const updateMentorProfile = async (
  id: string,
  mentorData: Partial<ExtendedMentorProfile>
): Promise<MentorProfile | null> => {
  try {
    const db = await getDatabase();

    // Get existing mentor
    const mentorDoc = await db.mentors.findOne(id).exec();

    if (!mentorDoc) {
      return null;
    }

    const mentor = mentorDoc.toJSON() as MentorDocument;
    const now = Date.now();

    // Update mentor data
    const updatedMentor = {
      ...mentor,
      expertise:
        mentorData.expertise !== undefined
          ? mentorData.expertise
          : mentor.expertise,
      bio: mentorData.bio !== undefined ? mentorData.bio : mentor.bio,
      sessionPrice:
        mentorData.sessionPrice !== undefined
          ? mentorData.sessionPrice
          : mentor.sessionPrice,
      yearsOfExperience:
        mentorData.yearsOfExperience !== undefined
          ? mentorData.yearsOfExperience
          : mentor.yearsOfExperience,
      portfolio:
        mentorData.portfolio !== undefined
          ? mentorData.portfolio
          : mentor.portfolio,
      certifications:
        mentorData.certifications !== undefined
          ? mentorData.certifications
          : mentor.certifications,
      education:
        mentorData.education !== undefined
          ? mentorData.education
          : mentor.education,
      workExperience:
        mentorData.workExperience !== undefined
          ? mentorData.workExperience
          : mentor.workExperience,
      updatedAt: now,
    };

    await mentorDoc.update({
      $set: updatedMentor,
    });

    // Update user data if provided
    if (mentorData.name || mentorData.email || mentorData.profilePicture) {
      const userDoc = await db.users.findOne(mentor.userId).exec();

      if (userDoc) {
        const user = userDoc.toJSON() as UserDocument;
        const updatedUser = {
          ...user,
          name: mentorData.name !== undefined ? mentorData.name : user.name,
          email: mentorData.email !== undefined ? mentorData.email : user.email,
          profilePicture:
            mentorData.profilePicture !== undefined
              ? mentorData.profilePicture
              : user.profilePicture,
          updatedAt: now,
        };

        await userDoc.update({
          $set: updatedUser,
        });
      }
    }

    // Update availability if provided
    if (mentorData.availability) {
      // Delete existing availability
      const existingAvailabilityDocs = await db.availability
        .find({
          selector: {
            mentorId: id,
          },
        })
        .exec();

      for (const doc of existingAvailabilityDocs) {
        await doc.remove();
      }

      // Add new availability
      if (mentorData.availability.length > 0) {
        const availabilitySlots = mentorData.availability.map((slot) => ({
          id: uuidv4(),
          mentorId: id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: slot.isBooked || false,
          createdAt: now,
          updatedAt: now,
        }));

        await db.availability.bulkInsert(availabilitySlots);
      }
    }

    // Return updated mentor profile
    return getMentorById(id);
  } catch (error) {
    console.error(`Failed to update mentor with ID ${id}:`, error);
    throw new Error(`Failed to update mentor with ID ${id}`);
  }
};

/**
 * Get mentor by user ID
 */
export const getMentorByUserId = async (
  userId: string
): Promise<ExtendedMentorProfile | null> => {
  try {
    const db = await getDatabase();

    // Find the mentor document with the given userId
    const mentorDocs = await db.mentors
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    // If no mentor found with this userId
    if (mentorDocs.length === 0) {
      return null;
    }

    // Get the first mentor document
    const mentorDoc = mentorDocs[0];
    const mentor = mentorDoc.toJSON() as MentorDocument;

    // Get user data
    const userDoc = await db.users.findOne(userId).exec();

    // Get availability slots for this mentor
    const availabilityDocs = await db.availability
      .find({
        selector: {
          mentorId: mentor.id,
        },
      })
      .exec();

    const availability = availabilityDocs.map(
      (doc: RxDocument<AvailabilityDocument>) => doc.toJSON()
    );

    if (!userDoc) {
      // If we don't have user data, create a placeholder with required fields
      return {
        id: mentor.id,
        email: "unknown@example.com",
        name: "Unknown Mentor",
        role: "mentor" as const,
        expertise: mentor.expertise,
        bio: mentor.bio,
        sessionPrice: mentor.sessionPrice,
        yearsOfExperience: mentor.yearsOfExperience,
        availability: availability,
      } as ExtendedMentorProfile;
    }

    const user = userDoc.toJSON() as UserDocument;
    // Don't include password in the returned object
    const { password, ...safeUser } = user;

    // Combine mentor and user data
    return {
      ...mentor,
      id: mentor.id,
      email: safeUser.email,
      name: safeUser.name,
      role: "mentor" as const,
      profilePicture: safeUser.profilePicture || "",
      availability: availability,
    } as ExtendedMentorProfile;
  } catch (error) {
    console.error(`Failed to get mentor with user ID ${userId}:`, error);
    throw new Error(`Failed to get mentor with user ID ${userId}`);
  }
};
