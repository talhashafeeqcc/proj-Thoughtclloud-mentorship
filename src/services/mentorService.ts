import { v4 as uuidv4 } from "uuid";
import type { MentorProfile, AvailabilitySlot } from "../types";
import { getDatabase } from "./database/db";
import { Document } from "../types/database";
import { getMentorRatings, getMentorAverageRating } from "./ratingService";
import { db } from "./firebase/config";
import {
  doc,
  getDoc,
  updateDoc as firestoreUpdateDoc,
} from "firebase/firestore";
import {
  COLLECTIONS,
  setDocument,
  getDocument,
  getDocuments,
  whereEqual,
  deleteDocument,
} from "./firebase";
import { API_BASE_URL, getApiUrl } from "./config";

// Extended MentorProfile with additional fields from our database schema
interface ExtendedMentorProfile extends MentorProfile {
  userId: string; // Ensure userId is part of this extended interface or inherited correctly
  yearsOfExperience?: number;
  name: string;
  email: string;
  profilePicture?: string;
}

// Define the interface for a mentor document in Firestore
interface MentorDocument {
  id: string; // This will be the same as userId (Firebase Auth UID)
  userId: string; // Explicitly storing the Firebase Auth UID, serves as foreign key
  stripeAccountId?: string;
  expertise?: string[];
  bio?: string;
  sessionPrice?: number;
  balance?: number;
  // Denormalized fields from the User document
  name: string;
  email: string;
  profilePicture?: string;
  // Fields from original ExtendedMentorProfile that are not in User document
  yearsOfExperience?: number;
  // Timestamps
  createdAt: number;
  updatedAt: number;
  [key: string]: any; // Allow other fields if necessary
}

// Assume UserDataForMentor contains the necessary fields from the user to denormalize
interface UserDataForMentor {
  uid: string; // Firebase Auth UID
  email: string;
  name: string;
  profilePicture?: string;
}

/**
 * Get all mentors. Data is denormalized, so no separate user fetch needed.
 */
export const getMentors = async (): Promise<MentorProfile[]> => {
  try {
    // Fetch directly from the /mentors collection.
    // Using the existing getDocuments wrapper which is assumed to fetch all if no constraints.
    const mentorDocuments = await getDocuments<MentorDocument>(
      COLLECTIONS.MENTORS
    );

    if (!mentorDocuments || mentorDocuments.length === 0) {
      return [];
    }

    // Map MentorDocument to MentorProfile
    // Ratings and averageRating might still need separate fetches if not denormalized too.
    const mentorProfiles = await Promise.all(
      mentorDocuments.map(async (mentorDoc) => {
        // Assuming getMentorRatings and getMentorAverageRating fetch based on mentorDoc.id
        const ratings = await getMentorRatings(mentorDoc.id);
        const averageRating = await getMentorAverageRating(mentorDoc.id);

        // Fetch availability separately if needed (current logic in getMentorById suggests this)
        // For a list view, full availability might be too much. Consider a summary or fetching on demand.
        // For now, defaulting to empty array as per previous structure for the list.
        const availability: AvailabilitySlot[] = []; // Placeholder, adjust if summary needed

        return {
          ...mentorDoc, // Spread all fields from MentorDocument (id, userId, name, email, profilePicture, expertise, etc.)
          role: "mentor" as const, // Ensure role is correctly set
          availability,
          ratings,
          averageRating,
          // Ensure any other MentorProfile specific fields are handled
        } as MentorProfile; // Cast to MentorProfile
      })
    );

    return mentorProfiles;
  } catch (error) {
    console.error("Failed to get mentors:", error);
    throw new Error(
      `Failed to get mentors: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Get a mentor by ID. Data is denormalized.
 */
export const getMentorById = async (
  mentorId: string // This is the user UID and document ID in /mentors
): Promise<MentorProfile | null> => {
  try {
    const mentorDoc = await getDocument<MentorDocument>(
      COLLECTIONS.MENTORS,
      mentorId
    );

    if (!mentorDoc) {
      return null;
    }

    // Data like name, email, profilePicture is now directly in mentorDoc.
    // Fetch availability, ratings, averageRating as previously
    const availability = await getMentorAvailabilitySlots(mentorId); // Assuming this fetches from /availability
    const ratings = await getMentorRatings(mentorId);
    const averageRating = await getMentorAverageRating(mentorId);

    return {
      ...mentorDoc, // Spread all fields from MentorDocument
      role: "mentor" as const, // Ensure role is correctly set
      availability,
      ratings,
      averageRating,
      // Ensure any other MentorProfile specific fields are handled
    } as MentorProfile; // Cast to MentorProfile
  } catch (error) {
    console.error(`Failed to get mentor with ID ${mentorId}:`, error);
    throw new Error(
      `Failed to get mentor with ID ${mentorId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Create a new mentor profile
 */
export const createMentorProfile = async (
  userData: UserDataForMentor, // Expecting UID, email, name, etc.
  mentorSpecificData: {
    expertise?: string[];
    bio?: string;
    sessionPrice?: number;
    yearsOfExperience?: number;
    stripeAccountId?: string; // Optional: if created at the same time
  }
): Promise<MentorProfile> => {
  try {
    const now = Date.now();
    const mentorId = userData.uid; // Document ID for /mentors will be the user's UID

    // Check if a mentor profile already exists for this user ID
    const existingMentorDoc = await getDocument<MentorDocument>(
      COLLECTIONS.MENTORS,
      mentorId
    );
    if (existingMentorDoc) {
      console.log(
        `Mentor profile already exists for user ID: ${mentorId}. Returning existing.`
      );
      // Potentially update it if necessary, or just return
      // For now, just return the existing profile mapped to MentorProfile type
      return {
        ...existingMentorDoc,
        id: existingMentorDoc.id, // which is mentorId
        role: "mentor" as const,
        // Ensure all fields required by MentorProfile type are present
        // This mapping might need adjustment based on MentorProfile definition in types.ts
        availability: [], // Default or fetch if needed
        ratings: [], // Default or fetch if needed
        averageRating: 0, // Default or fetch if needed
      } as MentorProfile; // Cast, ensure this matches your actual MentorProfile type
    }

    const newMentorDoc: MentorDocument = {
      id: mentorId, // Doc ID is user UID
      userId: userData.uid, // Link to user
      name: userData.name, // Denormalized
      email: userData.email, // Denormalized
      profilePicture: userData.profilePicture || "", // Denormalized
      expertise: mentorSpecificData.expertise || [],
      bio: mentorSpecificData.bio || "",
      sessionPrice: mentorSpecificData.sessionPrice || 0,
      yearsOfExperience: mentorSpecificData.yearsOfExperience,
      stripeAccountId: mentorSpecificData.stripeAccountId,
      balance: 0,
      createdAt: now,
      updatedAt: now,
    };

    await setDocument(COLLECTIONS.MENTORS, mentorId, newMentorDoc);

    // The document in /mentors now contains all necessary public info
    // Map newMentorDoc to the MentorProfile type for return
    return {
      ...newMentorDoc,
      role: "mentor" as const,
      // id is already mentorId
      // name, email, profilePicture are already in newMentorDoc
      // Ensure fields like availability, ratings, averageRating are handled
      // as per the MentorProfile type definition (e.g., fetched separately or defaulted)
      availability: [], // Default or fetch if needed
      ratings: [], // Default or fetch if needed
      averageRating: 0, // Default or fetch if needed
    } as MentorProfile; // Cast, ensure this matches your actual MentorProfile type
  } catch (error) {
    console.error("Failed to create mentor profile:", error);
    // Consider if this should throw a more specific error or a generic one
    throw new Error(
      `Failed to create mentor profile for user ${userData.uid}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Update an existing mentor profile
 */
export const updateMentorProfile = async (
  mentorId: string, // This IS the user's UID and the document ID in /mentors
  updates: Partial<Omit<ExtendedMentorProfile, "id" | "userId" | "email">> & {
    // Allow updates to denormalized fields if they change on the user model
    name?: string;
    email?: string; // Be cautious: updating email here only updates denormalized copy
    profilePicture?: string;
  }
): Promise<MentorProfile | null> => {
  try {
    const mentorDocRef = doc(db, COLLECTIONS.MENTORS, mentorId);
    const mentorDocSnap = await getDoc(mentorDocRef);

    if (!mentorDocSnap.exists()) {
      console.error(`No mentor profile found to update for ID: ${mentorId}`);
      // Optional: Attempt to create if it doesn't exist, if that's desired behavior.
      // This would require the full userData similar to createMentorProfile.
      // For now, we'll assume an update is only for existing profiles.
      throw new Error(
        `Mentor profile with ID ${mentorId} not found for update.`
      );
    }

    const now = Date.now();
    const updateData: Partial<MentorDocument> = {
      updatedAt: now,
    };

    // Apply updates for mentor-specific fields
    if (updates.expertise !== undefined)
      updateData.expertise = updates.expertise;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.sessionPrice !== undefined)
      updateData.sessionPrice = updates.sessionPrice;
    if (updates.yearsOfExperience !== undefined)
      updateData.yearsOfExperience = updates.yearsOfExperience;
    // Denormalized fields from User - these should be updated if the source User changes
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email; // Again, careful with email updates
    if (updates.profilePicture !== undefined)
      updateData.profilePicture = updates.profilePicture;
    // Do not update stripeAccountId, balance, createdAt, id, userId directly via this general update

    await firestoreUpdateDoc(mentorDocRef, updateData);

    const updatedMentorDoc = await getDocument<MentorDocument>(
      COLLECTIONS.MENTORS,
      mentorId
    );
    if (!updatedMentorDoc) {
      // This should ideally not happen if the updateDoc succeeded without error
      throw new Error("Failed to retrieve mentor profile after update.");
    }

    // Map updatedMentorDoc to the MentorProfile type for return
    return {
      ...updatedMentorDoc,
      role: "mentor" as const,
      // id is already mentorId
      // name, email, profilePicture are already in updatedMentorDoc
      // Ensure fields like availability, ratings, averageRating are handled
      availability: [], // Default or fetch if needed / or load existing
      ratings: [], // Default or fetch if needed / or load existing
      averageRating: 0, // Default or fetch if needed / or load existing
    } as MentorProfile; // Cast, ensure this matches your actual MentorProfile type
  } catch (error) {
    console.error(`Failed to update mentor profile for ID ${mentorId}:`, error);
    throw new Error(
      `Failed to update mentor profile for ID ${mentorId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Get mentor by user ID
 */
export const getMentorByUserId = async (userId: string) => {
  try {
    // Find mentors with matching userId
    const mentors = await getDocuments<MentorDocument>(COLLECTIONS.MENTORS, [
      whereEqual("userId", userId),
    ]);

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
    const response = await fetch(
      getApiUrl(`api/mentor-stripe-account/${mentorId}`),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        mode: "cors",
      }
    );

    if (!response.ok) {
      throw new Error("Error creating Stripe account");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating mentor Stripe account:", error);
    throw error;
  }
};

/**
 * Create a payout (withdrawal) for a mentor
 */
export const createMentorPayout = async (
  mentorId: string,
  amount: number,
  currency: string = "usd"
) => {
  try {
    const response = await fetch(getApiUrl(`api/mentor-payout/${mentorId}`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency,
      }),
      credentials: "include",
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error("Error creating payout");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating mentor payout:", error);
    throw error;
  }
};

// Get mentor availability slots
export const getMentorAvailabilitySlots = async (
  mentorId: string
): Promise<AvailabilitySlot[]> => {
  try {
    const db = await getDatabase();

    // Query availability collection
    const availabilityDocs = await db.availability
      .find({
        selector: {
          mentorId: mentorId,
        },
      })
      .exec();

    // Convert to plain objects using JSON parse/stringify to handle readonly issues
    const slots = availabilityDocs.map((doc: Document) => {
      const slotData = JSON.parse(JSON.stringify(doc.toJSON()));

      // Normalize date format to YYYY-MM-DD for consistency
      let normalizedDate = slotData.date || "";
      if (normalizedDate.includes("T")) {
        normalizedDate = normalizedDate.split("T")[0];
      }

      return {
        id: slotData.id,
        mentorId: slotData.mentorId,
        date: normalizedDate, // Use normalized date
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        isBooked: slotData.isBooked || false,
      } as AvailabilitySlot;
    });

    return slots;
  } catch (error) {
    console.error("Error fetching mentor availability slots:", error);
    throw error;
  }
};

// Add availability slot
export const addAvailabilitySlot = async (
  slot: AvailabilitySlot
): Promise<AvailabilitySlot> => {
  try {
    const db = await getDatabase();

    // First verify the mentor exists
    const mentorDoc = await db.mentors.findOne(slot.mentorId).exec();
    if (!mentorDoc) {
      throw new Error("Mentor not found");
    }

    // Format date consistently as YYYY-MM-DD (without time component)
    let formattedDate = slot.date;
    if (formattedDate.includes("T")) {
      // If it already has a T, strip the time part
      formattedDate = formattedDate.split("T")[0];
    } else {
      // Ensure it's a valid date format but avoid timezone shifts
      try {
        // Parse the date directly into year, month, day components
        const dateObj = new Date(formattedDate);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
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
    if (typeof db.availability.remove === "function") {
      await db.availability.remove(slotDoc);
    }
    // Fall back to the document-level remove method if available
    else if (slotDoc && typeof slotDoc.remove === "function") {
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
export const getMentorAvailability = async (
  mentorId: string
): Promise<AvailabilitySlot[]> => {
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
          date: { $exists: true },
        },
        sort: [{ date: "asc" }],
      })
      .exec();

    return slots.map((doc: Document) =>
      JSON.parse(JSON.stringify(doc.toJSON()))
    );
  } catch (error) {
    console.error("Error getting mentor availability:", error);
    throw error;
  }
};
