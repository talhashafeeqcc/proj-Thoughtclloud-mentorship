import { v4 as uuidv4 } from "uuid";
import type { MentorProfile, AvailabilitySlot } from "../types";
import { getDatabase } from "./database/db";
import { Document } from "../types/database"; // Import the Document type
import { getMentorRatings, getMentorAverageRating } from "./ratingService";
import { deleteDocument, COLLECTIONS } from "./firebase/firestore";
import {
  getDocuments,
  whereEqual,
} from './firebase';
import { API_BASE_URL } from './config';

// Extended MentorProfile with additional fields from our database schema
interface ExtendedMentorProfile extends MentorProfile {
  yearsOfExperience?: number;
  userId?: string;
}

// Define the interface for a mentor document
interface MentorDocument {
  id: string;
  userId?: string;
  stripeAccountId?: string;
  expertise?: string[];
  bio?: string;
  sessionPrice?: number;
  balance?: number;
  [key: string]: any;
}

/**
 * Get all mentors with combined user and mentor data
 */
export const getMentors = async (): Promise<MentorProfile[]> => {
  try {
    const db = await getDatabase();
    const mentorDocs = await db.mentors.find().exec();

    // Get the mentor profiles and convert to plain objects to avoid readonly issues
    const mentorProfiles = mentorDocs.map((doc: Document) => {
      // Use JSON parse/stringify to convert readonly arrays to mutable ones
      return JSON.parse(JSON.stringify(doc.toJSON()));
    });

    // Get user data for all mentors
    const userIds = mentorProfiles.map((mentor: ExtendedMentorProfile) => mentor.userId);

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
      mentorProfiles.map(async (mentor: ExtendedMentorProfile) => {
        const userDoc = userDocs.find((u: Document) => u.id === mentor.userId);

        // Get ratings for this mentor
        const ratings = await getMentorRatings(mentor.id);
        const averageRating = await getMentorAverageRating(mentor.id);

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
            ratings: ratings,
            averageRating: averageRating,
          } as ExtendedMentorProfile;
        }

        const user = JSON.parse(JSON.stringify(userDoc.toJSON()));
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

        const availability = availabilityDocs.map((doc: Document) =>
          JSON.parse(JSON.stringify(doc.toJSON()))
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
          ratings: ratings,
          averageRating: averageRating,
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

    // Convert to plain JS object to avoid readonly issues
    const mentor = JSON.parse(JSON.stringify(mentorDoc.toJSON()));

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

    const availability = availabilityDocs.map((doc: Document) =>
      JSON.parse(JSON.stringify(doc.toJSON()))
    );

    // Get mentor ratings
    const ratings = await getMentorRatings(id);
    const averageRating = await getMentorAverageRating(id);

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
        ratings: ratings,
        averageRating: averageRating,
      } as ExtendedMentorProfile;
    }

    // Convert to plain JS object to avoid readonly issues
    const user = JSON.parse(JSON.stringify(userDoc.toJSON()));
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
      ratings: ratings,
      averageRating: averageRating,
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

    const mentor = JSON.parse(JSON.stringify(mentorDoc.toJSON()));
    const now = Date.now();

    // Update mentor data - remove availability from the update
    const { availability, ...mentorDataWithoutAvailability } = mentorData;
    const updatedMentor = {
      ...mentor,
      expertise:
        mentorDataWithoutAvailability.expertise !== undefined
          ? mentorDataWithoutAvailability.expertise
          : mentor.expertise,
      bio: mentorDataWithoutAvailability.bio !== undefined ? mentorDataWithoutAvailability.bio : mentor.bio,
      sessionPrice:
        mentorDataWithoutAvailability.sessionPrice !== undefined
          ? mentorDataWithoutAvailability.sessionPrice
          : mentor.sessionPrice,
      yearsOfExperience:
        mentorDataWithoutAvailability.yearsOfExperience !== undefined
          ? mentorDataWithoutAvailability.yearsOfExperience
          : mentor.yearsOfExperience,
      portfolio:
        mentorDataWithoutAvailability.portfolio !== undefined
          ? mentorDataWithoutAvailability.portfolio
          : mentor.portfolio,
      certifications:
        mentorDataWithoutAvailability.certifications !== undefined
          ? mentorDataWithoutAvailability.certifications
          : mentor.certifications,
      education:
        mentorDataWithoutAvailability.education !== undefined
          ? mentorDataWithoutAvailability.education
          : mentor.education,
      workExperience:
        mentorDataWithoutAvailability.workExperience !== undefined
          ? mentorDataWithoutAvailability.workExperience
          : mentor.workExperience,
      updatedAt: now,
    };

    await mentorDoc.update({
      $set: updatedMentor,
    });

    // Update user data if provided
    if (mentorDataWithoutAvailability.name || mentorDataWithoutAvailability.email || mentorDataWithoutAvailability.profilePicture) {
      const userDoc = await db.users.findOne(mentor.userId).exec();

      if (userDoc) {
        const user = JSON.parse(JSON.stringify(userDoc.toJSON()));
        const updatedUser = {
          ...user,
          name: mentorDataWithoutAvailability.name !== undefined ? mentorDataWithoutAvailability.name : user.name,
          email: mentorDataWithoutAvailability.email !== undefined ? mentorDataWithoutAvailability.email : user.email,
          profilePicture:
            mentorDataWithoutAvailability.profilePicture !== undefined
              ? mentorDataWithoutAvailability.profilePicture
              : user.profilePicture,
          updatedAt: now,
        };

        await userDoc.update({
          $set: updatedUser,
        });
      }
    }

    // Handle availability updates separately
    if (availability) {
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
      if (availability.length > 0) {
        const availabilitySlots = availability.map((slot) => ({
          id: slot.id || uuidv4(),
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
export const getMentorByUserId = async (userId: string) => {
  try {
    // Find mentors with matching userId
    const mentors = await getDocuments<MentorDocument>(
      COLLECTIONS.MENTORS,
      [whereEqual('userId', userId)]
    );

    if (mentors.length === 0) {
      return null;
    }

    return mentors[0];
  } catch (error) {
    console.error("Error getting mentor by user ID:", error);
    throw error;
  }
};

/**
 * Create or get a Stripe Connect account for a mentor
 */
export const createMentorStripeAccount = async (mentorId: string) => {
  try {
    // Call the server API to create/get a Stripe account
    const response = await fetch(`${API_BASE_URL}/api/mentor-stripe-account/${mentorId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create Stripe account');
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Stripe account for mentor:", error);
    throw error;
  }
};

/**
 * Create a payout (withdrawal) for a mentor
 */
export const createMentorPayout = async (mentorId: string, amount: number, currency: string = 'usd') => {
  try {
    // Call the server API to create a payout
    const response = await fetch(`${API_BASE_URL}/api/mentor-payout/${mentorId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payout');
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating payout for mentor:", error);
    throw error;
  }
};

// Get mentor availability slots
export const getMentorAvailabilitySlots = async (mentorId: string): Promise<AvailabilitySlot[]> => {
  try {
    const db = await getDatabase();

    // Query availability collection
    const availabilityDocs = await db.availability
      .find({
        selector: {
          mentorId: mentorId
        }
      })
      .exec();

    // Convert to plain objects using JSON parse/stringify to handle readonly issues
    const slots = availabilityDocs.map((doc: Document) => {
      const slotData = JSON.parse(JSON.stringify(doc.toJSON()));

      // Normalize date format to YYYY-MM-DD for consistency
      let normalizedDate = slotData.date || "";
      if (normalizedDate.includes('T')) {
        normalizedDate = normalizedDate.split('T')[0];
      }

      return {
        id: slotData.id,
        mentorId: slotData.mentorId,
        date: normalizedDate, // Use normalized date
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        isBooked: slotData.isBooked || false
      } as AvailabilitySlot;
    });

    return slots;
  } catch (error) {
    console.error("Error fetching mentor availability slots:", error);
    throw error;
  }
};

// Add availability slot
export const addAvailabilitySlot = async (slot: AvailabilitySlot): Promise<AvailabilitySlot> => {
  try {
    const db = await getDatabase();

    // First verify the mentor exists
    const mentorDoc = await db.mentors.findOne(slot.mentorId).exec();
    if (!mentorDoc) {
      throw new Error("Mentor not found");
    }

    // Format date consistently as YYYY-MM-DD (without time component)
    let formattedDate = slot.date;
    if (formattedDate.includes('T')) {
      // If it already has a T, strip the time part
      formattedDate = formattedDate.split('T')[0];
    } else {
      // Ensure it's a valid date format but avoid timezone shifts
      try {
        // Parse the date directly into year, month, day components
        const dateObj = new Date(formattedDate);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } catch (e) {
        console.error("Error formatting date:", e);
        // Keep original if parsing fails
      }
    }

    // Create the slot with proper date handling
    const newSlot = {
      id: slot.id || uuidv4(),
      mentorId: slot.mentorId,
      date: formattedDate, // Store as YYYY-MM-DD format consistently
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.isBooked || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Insert the slot into the availability collection
    const insertedDoc = await db.availability.insert(newSlot);

    return JSON.parse(JSON.stringify(insertedDoc.toJSON()));
  } catch (error) {
    console.error("Error adding availability slot:", error);
    throw error;
  }
};

// Add a function to delete an availability slot
export const deleteAvailabilitySlot = async (slotId: string): Promise<void> => {
  try {
    const db = await getDatabase();

    // Find the slot
    const slotDoc = await db.availability.findOne(slotId).exec();

    if (!slotDoc) {
      throw new Error(`Availability slot with ID ${slotId} not found`);
    }

    // Try the collection-level remove method first
    if (typeof db.availability.remove === 'function') {
      await db.availability.remove(slotDoc);
    }
    // Fall back to the document-level remove method if available
    else if (slotDoc && typeof slotDoc.remove === 'function') {
      await slotDoc.remove();
    }
    // Last resort - try direct deletion
    else {
      await deleteDocument(COLLECTIONS.AVAILABILITY, slotId);
    }
  } catch (error) {
    console.error("Error deleting availability slot:", error);
    throw error;
  }
};

// Get mentor availability slots with dates
export const getMentorAvailability = async (mentorId: string): Promise<AvailabilitySlot[]> => {
  try {
    const db = await getDatabase();

    // First try to get from mentor profile
    const mentorDoc = await db.mentors.findOne(mentorId).exec();
    if (mentorDoc) {
      const mentor = JSON.parse(JSON.stringify(mentorDoc.toJSON()));
      return [...(mentor.availability || [])];
    }

    // Fallback to availability collection
    const slots = await db.availability
      .find({
        selector: {
          mentorId: mentorId,
          date: { $exists: true }
        },
        sort: [{ date: "asc" }]
      })
      .exec();

    return slots.map((doc: Document) => JSON.parse(JSON.stringify(doc.toJSON())));
  } catch (error) {
    console.error("Error getting mentor availability:", error);
    throw error;
  }
};
