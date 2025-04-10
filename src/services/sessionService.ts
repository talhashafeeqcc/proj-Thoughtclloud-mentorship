import { Session, AvailabilitySlot } from "../types";
import { getDatabase } from "./database/db";
import { v4 as uuidv4 } from "uuid";
import type { RxDocument } from "rxdb";
import { createGoogleMeetLink } from "./googleMeetService";

// Helper types for RxDB documents
interface SessionDocument {
  id: string;
  mentorId: string;
  menteeId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  paymentAmount: number;
  notes?: string;
  meetingLink?: string;
  availabilityId: string;
  createdAt: number;
  updatedAt: number;
}

interface UserDocument {
  id: string;
  email: string;
  name: string;
  role: string;
  profilePicture?: string;
  password?: string;
}

interface AvailabilityDocument {
  id: string;
  mentorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

// Extended session type for internal use
interface ExtendedSession extends Session {
  mentorName?: string;
  menteeName?: string;
  availabilitySlotId: string;
  meetingLink?: string;
  title?: string;
}

/**
 * Helper function to convert a readonly array to a mutable array
 * This resolves type compatibility issues when returning RxDB documents
 */
function toMutableArray<T>(array: readonly T[] | undefined | null): T[] {
  if (!array) return [];
  return JSON.parse(JSON.stringify(array)) as T[];
}

// Helper function to check if a session should be marked as completed
const shouldMarkSessionCompleted = (session: SessionDocument): boolean => {
  // Check if the session is already completed or cancelled
  if (session.status !== "scheduled") {
    return false;
  }

  // Check if payment is completed
  if (session.paymentStatus !== "completed") {
    return false;
  }

  // Get current date and time
  const now = new Date();
  const sessionDate = new Date(`${session.date}T${session.endTime}`);

  // If the session end time has passed, it should be marked as completed
  return now > sessionDate;
};

// Get all sessions for a user (either as mentor or mentee)
export const getSessions = async (userId: string): Promise<Session[]> => {
  try {
    const db = await getDatabase();
    console.log("Fetching sessions for user:", userId);

    // Variables to store profile IDs
    let mentorId = null;
    let menteeId = null;

    // Check if the user is a mentor
    const mentorProfileDocs = await db.mentors
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    if (mentorProfileDocs.length > 0) {
      mentorId = mentorProfileDocs[0].toJSON().id;
      console.log(`User ${userId} is a mentor with mentor ID: ${mentorId}`);
    }

    // Check if the user is a mentee
    const menteeProfileDocs = await db.mentees
      .find({
        selector: {
          userId: userId,
        },
      })
      .exec();

    if (menteeProfileDocs.length > 0) {
      menteeId = menteeProfileDocs[0].toJSON().id;
      console.log(`User ${userId} is a mentee with mentee ID: ${menteeId}`);
    }

    // Build the query conditions
    const conditions = [];
    if (mentorId) conditions.push({ mentorId });
    if (menteeId) conditions.push({ menteeId });


    // If no conditions, return empty array early
    if (conditions.length === 0) {
      console.log("No mentor or mentee profile found for user", userId);
      return [];
    }

    console.log("Query conditions:", JSON.stringify(conditions));

    // Find sessions where the user is either mentor or mentee
    const sessionDocs = await db.sessions
      .find({
        selector: {
          $or: conditions,
        },
      })
      .exec();

    console.log(`Found ${sessionDocs.length} sessions for user ${userId}`);

    const sessionData = sessionDocs.map(
      (doc: RxDocument<any>) => doc.toJSON() as SessionDocument
    );

    // Extract unique user IDs from the sessions
    const userIds = new Set<string>();
    sessionData.forEach((session: SessionDocument) => {
      userIds.add(session.mentorId);
      userIds.add(session.menteeId);
    });

    // Get user information for all involved users
    const userDocs = await db.users
      .find({
        selector: {
          id: {
            $in: Array.from(userIds),
          },
        },
      })
      .exec();

    const userData = userDocs.map((doc: RxDocument<any>) => {
      const user = doc.toJSON();
      const { password, ...safeUser } = user;
      return safeUser;
    });

    // Map session data to full Session objects with user names
    const mappedSessions = sessionData.map((session: SessionDocument) => {
      const mentor = userData.find((u: UserDocument) => u.id === session.mentorId);
      const mentee = userData.find((u: UserDocument) => u.id === session.menteeId);

      return {
        id: session.id,
        mentorId: session.mentorId,
        menteeId: session.menteeId,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status as "scheduled" | "completed" | "cancelled",
        paymentStatus: session.paymentStatus as "pending" | "completed" | "refunded",
        paymentAmount: session.paymentAmount,
        notes: session.notes || "",
        availabilitySlotId: session.availabilityId,
        mentorName: mentor?.name || "Unknown Mentor",
        menteeName: mentee?.name || "Unknown Mentee",
        title: session.notes || "Mentoring Session",
      } as Session;
    });

    // Check and update session status for completed sessions
    const nowTime = Date.now();
    for (const doc of sessionDocs) {
      const session = doc.toJSON() as SessionDocument;

      // Check if the session should be marked as completed
      if (shouldMarkSessionCompleted(session)) {
        await doc.update({
          $set: {
            status: "completed",
            updatedAt: nowTime,
          },
        });
      }
    }

    console.log(`Successfully mapped ${mappedSessions.length} sessions for user ${userId}`);
    return mappedSessions;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    throw error;
  }
};

// Get session by ID
export const getSessionById = async (id: string): Promise<Session> => {
  try {
    const db = await getDatabase();
    const sessionDoc = await db.sessions.findOne(id).exec();

    if (!sessionDoc) {
      throw new Error(`Session with ID ${id} not found`);
    }

    const session = sessionDoc.toJSON() as SessionDocument;

    // Get mentor information - first check if mentor ID is a user ID
    let mentorDoc = await db.users.findOne(session.mentorId).exec();
    let mentorName = "Unknown Mentor";

    // If mentor not found in users, try looking in mentors collection
    if (!mentorDoc) {
      console.log("Mentor not found directly in users, checking mentors collection");

      // Try to find mentor directly by ID
      const mentorProfileDoc = await db.mentors
        .findOne(session.mentorId)
        .exec();

      if (mentorProfileDoc) {
        // If found, get the associated user
        const mentorProfile = mentorProfileDoc.toJSON();
        const mentorUserDoc = await db.users.findOne(mentorProfile.userId).exec();

        if (mentorUserDoc) {
          mentorDoc = mentorUserDoc;
          mentorName = mentorUserDoc.toJSON().name;
        }
      } else {
        // Try finding mentor by userId
        const mentorProfileDocs = await db.mentors
          .find({
            selector: {
              userId: session.mentorId,
            },
          })
          .exec();

        if (mentorProfileDocs.length > 0) {
          // If found this way, the session.mentorId is actually a userId
          mentorDoc = await db.users.findOne(session.mentorId).exec();
          if (mentorDoc) {
            mentorName = mentorDoc.toJSON().name;
          }
        }
      }
    } else {
      mentorName = mentorDoc.toJSON().name;
    }

    // Get mentee information
    const menteeDoc = await db.users.findOne(session.menteeId).exec();
    let menteeName = "Unknown Mentee";

    if (menteeDoc) {
      menteeName = menteeDoc.toJSON().name;
    }

    // Don't throw error if users not found, just use default names
    // This is more resilient and won't block viewing session details

    // Get the session slot information if needed
    if (session.availabilityId) {
      try {
        const availabilityDoc = await db.availability
          .findOne(session.availabilityId)
          .exec();

        if (availabilityDoc) {
          // We could use this data if needed in future
          console.log(`Found availability for session ${id}`);
        }
      } catch (err) {
        console.warn(`Could not load availability details for session ${id}:`, err);
      }
    }

    // Construct the full session object
    return {
      id: session.id,
      mentorId: session.mentorId,
      menteeId: session.menteeId,
      date: session.date || "",
      startTime: session.startTime || "",
      endTime: session.endTime || "",
      status: session.status as "scheduled" | "completed" | "cancelled",
      paymentStatus: session.paymentStatus as
        | "pending"
        | "completed"
        | "refunded",
      paymentAmount: session.paymentAmount || 0,
      notes: session.notes || "",
      availabilitySlotId: session.availabilityId || "",
      mentorName: mentorName,
      menteeName: menteeName,
      title: session.notes || "Mentoring Session",
      meetingLink: session.meetingLink || "",
    } as Session;
  } catch (error) {
    console.error("Error fetching session by ID:", error);
    throw error;
  }
};

// Create a new session
export const createSession = async (
  sessionData: Omit<ExtendedSession, "id">
): Promise<Session> => {
  try {
    const db = await getDatabase();

    // Basic validation
    if (!sessionData.mentorId || !sessionData.menteeId) {
      throw new Error("Mentor and mentee IDs are required");
    }

    // First check if there's already a session with this availability slot
    if (sessionData.availabilitySlotId) {
      const existingSessions = await db.sessions
        .find({
          selector: {
            availabilityId: sessionData.availabilitySlotId,
          },
        })
        .exec();

      if (existingSessions.length > 0) {
        console.warn(`Session already exists for availability slot ${sessionData.availabilitySlotId}`);
        throw new Error("This time slot is already booked");
      }
    }

    // Check if the mentor exists in the mentors collection
    const mentorDoc = await db.mentors.findOne(sessionData.mentorId).exec();
    let mentorProfileId = sessionData.mentorId;

    if (!mentorDoc) {
      console.log("Mentor not found by ID, trying to find by userId");
      // Try alternative lookup by userId
      const mentorDocs = await db.mentors
        .find({
          selector: {
            userId: sessionData.mentorId,
          },
        })
        .exec();

      if (mentorDocs.length === 0) {
        throw new Error(`Mentor with ID ${sessionData.mentorId} not found`);
      }

      // Use the actual mentor profile ID instead of the userId
      mentorProfileId = mentorDocs[0].toJSON().id;
    }

    // Check if the mentee exists and get the proper mentee profile ID
    let menteeProfileId = sessionData.menteeId;
    let menteeUser = null;

    // First, check if the menteeId is a mentee profile ID
    const menteeProfileDoc = await db.mentees.findOne(sessionData.menteeId).exec();

    if (menteeProfileDoc) {
      // If it's a valid mentee profile ID, use it and get the associated user
      menteeUser = await db.users.findOne(menteeProfileDoc.toJSON().userId).exec();
      if (!menteeUser) {
        throw new Error(`User not found for mentee profile ${sessionData.menteeId}`);
      }
    } else {
      // If not found as a profile ID, check if it's a user ID and find the corresponding mentee profile
      menteeUser = await db.users.findOne(sessionData.menteeId).exec();

      if (!menteeUser) {
        throw new Error(`Mentee with ID ${sessionData.menteeId} not found`);
      }

      // Look up the mentee profile for this user
      const menteeProfileDocs = await db.mentees
        .find({
          selector: {
            userId: sessionData.menteeId,
          },
        })
        .exec();

      if (menteeProfileDocs.length > 0) menteeProfileId = menteeProfileDocs[0].toJSON().id;
      else {
        // Throw error instead of creating a new profile
        throw new Error(`No mentee profile found for user ${sessionData.menteeId}. Please create a mentee profile first.`);
      }
    }

    // Get mentor and mentee names for the session
    let mentorName = "Unnamed Mentor";
    if (mentorDoc) {
      // Get the user document for this mentor to get their name
      const mentorUserDoc = await db.users.findOne(mentorDoc.toJSON().userId).exec();
      if (mentorUserDoc) {
        mentorName = mentorUserDoc.toJSON().name;
      }
    }

    const menteeName = menteeUser ? menteeUser.toJSON().name : "Unnamed Mentee";

    // Check if the availability slot exists and is not booked
    const availabilityDoc = await db.availability
      .findOne(sessionData.availabilitySlotId)
      .exec();

    if (!availabilityDoc) {
      throw new Error(
        `Availability slot with ID ${sessionData.availabilitySlotId} not found`
      );
    }

    const availability = availabilityDoc.toJSON() as AvailabilityDocument;

    if (availability.isBooked) {
      throw new Error("This time slot is already booked");
    }

    // Generate a unique ID
    const sessionId = uuidv4();
    const now = Date.now();

    // Generate Google Meet link
    const sessionTitle = sessionData.notes || "Mentoring Session";
    const dateStr = sessionData.date;
    const startDateTime = new Date(`${dateStr}T${sessionData.startTime}`).toISOString();
    const endDateTime = new Date(`${dateStr}T${sessionData.endTime}`).toISOString();

    // Create Google Meet link
    let meetingLink = "";
    try {
      meetingLink = await createGoogleMeetLink(
        sessionTitle,
        startDateTime,
        endDateTime,
        sessionData.mentorName || "Mentor",
        sessionData.menteeName || "Mentee"
      );
      console.log("Created Google Meet link:", meetingLink);
    } catch (error) {
      console.error("Failed to create Google Meet link:", error);
      // Continue without the meet link if there's an error
      meetingLink = "";
    }

    // Create the session document
    const newSession = {
      id: sessionId,
      mentorId: mentorProfileId,
      menteeId: menteeProfileId,
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      status: sessionData.status,
      paymentStatus: sessionData.paymentStatus,
      paymentAmount: sessionData.paymentAmount,
      notes: sessionData.notes || "",
      meetingLink: meetingLink, // Use the generated Google Meet link
      availabilityId: sessionData.availabilitySlotId,
      createdAt: now,
      updatedAt: now,
    };

    // Mark the availability slot as booked
    await availabilityDoc.update({
      $set: {
        isBooked: true,
        updatedAt: now,
      },
    });

    // Insert the session
    await db.sessions.insert(newSession);

    // Return the full session object
    return {
      ...sessionData,
      id: sessionId,
      mentorId: mentorProfileId,
      menteeId: menteeProfileId,
      title: sessionData.notes || "Mentoring Session", // Use notes as title or default
      mentorName: mentorName,
      menteeName: menteeName,
      meetingLink: meetingLink, // Include the meeting link in the response
    } as Session;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};

// Update a session
export const updateSession = async (
  id: string,
  updates: Partial<ExtendedSession>
): Promise<Session> => {
  try {
    const db = await getDatabase();
    const sessionDoc = await db.sessions.findOne(id).exec();

    if (!sessionDoc) {
      throw new Error(`Session with ID ${id} not found`);
    }

    const session = sessionDoc.toJSON() as SessionDocument;
    const now = Date.now();

    // Prepare update object with only database fields
    const dbUpdates: Partial<SessionDocument> = {
      status: updates.status,
      paymentStatus: updates.paymentStatus,
      paymentAmount: updates.paymentAmount,
      notes: updates.notes,
      meetingLink: updates.meetingLink,
      updatedAt: now,
    };

    // Filter out undefined values
    Object.keys(dbUpdates).forEach((key) => {
      if (dbUpdates[key as keyof typeof dbUpdates] === undefined) {
        delete dbUpdates[key as keyof typeof dbUpdates];
      }
    });

    // Update the session
    await sessionDoc.update({
      $set: dbUpdates,
    });

    // Handle change in availability if the status is changed to 'cancelled'
    if (updates.status === "cancelled" && session.status !== "cancelled") {
      const availabilityDoc = await db.availability
        .findOne(session.availabilityId)
        .exec();

      if (availabilityDoc) {
        await availabilityDoc.update({
          $set: {
            isBooked: false,
            updatedAt: now,
          },
        });
      }
    }

    // Get the updated session
    return getSessionById(id);
  } catch (error) {
    console.error("Error updating session:", error);
    throw error;
  }
};

// Cancel a session
export const cancelSession = async (id: string): Promise<void> => {
  try {
    const db = await getDatabase();
    const sessionDoc = await db.sessions.findOne(id).exec();

    if (!sessionDoc) {
      throw new Error(`Session with ID ${id} not found`);
    }

    const session = sessionDoc.toJSON() as SessionDocument;
    const now = Date.now();

    // Update session status to cancelled
    await sessionDoc.update({
      $set: {
        status: "cancelled",
        updatedAt: now,
      },
    });

    // Free up the availability slot
    const availabilityDoc = await db.availability
      .findOne(session.availabilityId)
      .exec();

    if (availabilityDoc) {
      await availabilityDoc.update({
        $set: {
          isBooked: false,
          updatedAt: now,
        },
      });
    }
  } catch (error) {
    console.error("Error cancelling session:", error);
    throw error;
  }
};

// Get mentor availability
export const getMentorAvailability = async (
  mentorId: string
): Promise<AvailabilitySlot[]> => {
  try {
    const db = await getDatabase();
    console.log("Fetching availability for mentor:", mentorId);

    // Try to directly find the mentor document by ID first
    let mentorDoc = await db.mentors.findOne(mentorId).exec();

    // If not found, try finding it by userId
    if (!mentorDoc) {
      console.log("Mentor not found by ID, trying to find by userId");
      const mentorDocs = await db.mentors
        .find({
          selector: {
            userId: mentorId,
          },
        })
        .exec();

      if (mentorDocs.length === 0) {
        console.error("Mentor profile not found for ID or userId:", mentorId);
        return [];
      }

      mentorDoc = mentorDocs[0];
    }

    const mentor = mentorDoc.toJSON();
    console.log(
      "Found mentor profile with availability count:",
      mentor.availability ? mentor.availability.length : 0
    );

    // Return the availability slots directly from the mentor profile
    // Ensure we're returning the raw data without any date modifications
    if (mentor.availability) {
      // Log each availability slot to help with debugging
      console.log("Availability slots:");
      mentor.availability.forEach((slot: any, index: number) => {
        console.log(`Slot ${index + 1}:`, {
          id: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: slot.isBooked,
        });
      });
    }

    // Convert from DeepReadonlyArray to mutable array
    return toMutableArray<AvailabilitySlot>(mentor.availability);
  } catch (error) {
    console.error("Error fetching mentor availability:", error);
    throw error;
  }
};

// Function to check and update session statuses
export const checkAndUpdateSessionStatuses = async (): Promise<void> => {
  try {
    const db = await getDatabase();

    // Get all scheduled sessions with completed payment
    const scheduledSessions = await db.sessions
      .find({
        selector: {
          status: "scheduled",
          paymentStatus: "completed",
        },
      })
      .exec();

    const now = Date.now();
    const currentDate = new Date();

    for (const doc of scheduledSessions) {
      const session = doc.toJSON() as SessionDocument;

      // Check if the session end time has passed
      const sessionDate = new Date(`${session.date}T${session.endTime}`);

      if (currentDate > sessionDate) {
        // Mark the session as completed
        await doc.update({
          $set: {
            status: "completed",
            updatedAt: now,
          },
        });

        console.log(`Automatically marked session ${session.id} as completed`);
      }
    }
  } catch (error) {
    console.error("Error checking and updating session statuses:", error);
    throw error;
  }
};
