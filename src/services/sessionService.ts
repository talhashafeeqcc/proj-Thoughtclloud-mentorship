import { Session, AvailabilitySlot } from "../types";
import { getDatabase } from "./database/db";
import { v4 as uuidv4 } from "uuid";
import { createGoogleMeetLink } from "./googleMeetService";

// Define a generic Document interface to replace RxDocument
interface Document<T> {
  toJSON(): T;
}

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
    }

    // Build the query conditions
    const conditions = [];
    if (mentorId) conditions.push({ mentorId });
    if (menteeId) conditions.push({ menteeId });

    // If no conditions, return empty array early
    if (conditions.length === 0) {
      return [];
    }

    // Find sessions where the user is either mentor or mentee
    const sessionDocs = await db.sessions
      .find({
        selector: {
          $or: conditions,
        },
      })
      .exec();

    const sessionData = sessionDocs.map(
      (doc: Document<any>) => doc.toJSON() as SessionDocument
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

    const userData = userDocs.map((doc: Document<any>) => {
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
    
    // Get the session
    const sessionDoc = await db.sessions.findOne(id).exec();
    
    if (!sessionDoc) {
      throw new Error(`Session not found with ID: ${id}`);
    }
    
    const session = sessionDoc.toJSON() as SessionDocument;
    
    // Get mentor data (first try directly by mentorId)
    let mentorData = null;
    const mentorDoc = await db.users.findOne(session.mentorId).exec();
    
    if (mentorDoc) {
      const mentorUser = mentorDoc.toJSON();
      mentorData = {
        id: mentorUser.id,
        name: mentorUser.name,
        email: mentorUser.email,
        profilePicture: mentorUser.profilePicture || "",
      };
    } else {
      // If mentor not found directly, try to get mentor doc and related user
      const mentorProfileDoc = await db.mentors.findOne(session.mentorId).exec();
      
      if (mentorProfileDoc) {
        const mentorProfile = mentorProfileDoc.toJSON();
        const mentorUserDoc = await db.users.findOne(mentorProfile.userId).exec();
        
        if (mentorUserDoc) {
          const mentorUser = mentorUserDoc.toJSON();
          mentorData = {
            id: mentorUser.id,
            name: mentorUser.name,
            email: mentorUser.email,
            profilePicture: mentorUser.profilePicture || "",
          };
        }
      }
    }
    
    // Get mentee data
    const menteeDoc = await db.users.findOne(session.menteeId).exec();
    let menteeData = null;
    
    if (menteeDoc) {
      const menteeUser = menteeDoc.toJSON();
      menteeData = {
        id: menteeUser.id,
        name: menteeUser.name,
        email: menteeUser.email,
        profilePicture: menteeUser.profilePicture || "",
      };
    }
    
    // Get availability slot details (if available)
    let availabilitySlot = null;
    try {
      if (session.availabilityId) {
        const availabilityDoc = await db.availability
          .findOne(session.availabilityId)
          .exec();
        
        if (availabilityDoc) {
          availabilitySlot = availabilityDoc.toJSON();
        }
      }
    } catch (err) {
      console.warn(`Could not load availability details for session ${id}:`, err);
    }
    
    const fullSession: Session = {
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
      mentorName: mentorData?.name || "Unknown Mentor",
      menteeName: menteeData?.name || "Unknown Mentee",
      meetingLink: session.meetingLink || "",
    };
    
    return fullSession;
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
    
    // Verify mentor exists
    let mentorDoc = await db.mentors.findOne(sessionData.mentorId).exec();
    
    if (!mentorDoc) {
      // Try to find mentor by userId (in case mentorId is actually a userId)
      const mentorDocs = await db.mentors
        .find({
          selector: {
            userId: sessionData.mentorId,
          },
        })
        .exec();
      
      if (mentorDocs.length === 0) {
        throw new Error(`Mentor not found with ID: ${sessionData.mentorId}`);
      }
      
      mentorDoc = mentorDocs[0];
      const mentorData = mentorDoc.toJSON();
      sessionData.mentorId = mentorData.id; // Update to use the correct mentorId
    }
    
    // Verify mentee exists
    let menteeDoc = await db.mentees.findOne(sessionData.menteeId).exec();
    
    if (!menteeDoc) {
      // Try to find mentee by userId (in case menteeId is actually a userId)
      const menteeDocs = await db.mentees
        .find({
          selector: {
            userId: sessionData.menteeId,
          },
        })
        .exec();
      
      if (menteeDocs.length === 0) {
        throw new Error(`Mentee not found with ID: ${sessionData.menteeId}`);
      }
      
      menteeDoc = menteeDocs[0];
      const menteeData = menteeDoc.toJSON();
      sessionData.menteeId = menteeData.id; // Update to use the correct menteeId
    }
    
    // Check if the slot is available and not already booked
    const isSlotAvailable = await isAvailabilitySlotBookable(
      sessionData.mentorId,
      sessionData.date,
      sessionData.startTime,
      sessionData.endTime
    );
    
    if (!isSlotAvailable) {
      throw new Error("This time slot is not available for booking");
    }
    
    // Create a meeting link
    let meetingLink = "";
    try {
      meetingLink = await createGoogleMeetLink({
        summary: `Mentoring session with ${sessionData.mentorName || "Mentor"}`,
        description: sessionData.notes || "Mentoring session",
        startDateTime: `${sessionData.date}T${sessionData.startTime}:00`,
        endDateTime: `${sessionData.date}T${sessionData.endTime}:00`,
        attendees: [], // In a real app, include mentor and mentee emails
      });
      
      if (meetingLink) {
        console.log("Created Google Meet link:", meetingLink);
      }
    } catch (error) {
      console.error("Failed to create Google Meet link:", error);
      // Continue without a meeting link if creation fails
    }
    
    // Update the availability slot to mark it as booked
    const availabilityDocs = await db.availability
      .find({
        selector: {
          mentorId: sessionData.mentorId,
          date: sessionData.date,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
        },
      })
      .exec();
    
    let availabilityId = sessionData.availabilitySlotId;
    
    if (availabilityDocs.length > 0) {
      const availabilityDoc = availabilityDocs[0];
      const availabilityData = availabilityDoc.toJSON();
      availabilityId = availabilityData.id;
      
      await availabilityDoc.update({
        $set: {
          isBooked: true,
          updatedAt: Date.now(),
        },
      });
    }
    
    // Create the session
    const now = Date.now();
    const sessionId = uuidv4();
    
    const newSession = {
      id: sessionId,
      mentorId: sessionData.mentorId,
      menteeId: sessionData.menteeId,
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      status: "scheduled",
      paymentStatus: "pending",
      paymentAmount: sessionData.paymentAmount,
      notes: sessionData.notes || "",
      meetingLink: meetingLink,
      availabilityId: availabilityId,
      createdAt: now,
      updatedAt: now,
    };
    
    await db.sessions.insert(newSession);
    
    return {
      id: sessionId,
      mentorId: sessionData.mentorId,
      menteeId: sessionData.menteeId,
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      status: "scheduled",
      paymentStatus: "pending",
      paymentAmount: sessionData.paymentAmount,
      notes: sessionData.notes || "",
      availabilitySlotId: availabilityId,
      mentorName: sessionData.mentorName || "Unknown Mentor",
      menteeName: sessionData.menteeName || "Unknown Mentee",
      meetingLink: meetingLink,
    };
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
    
    // Get existing session
    const sessionDoc = await db.sessions.findOne(id).exec();
    
    if (!sessionDoc) {
      throw new Error(`Session not found with ID: ${id}`);
    }
    
    const session = sessionDoc.toJSON() as SessionDocument;
    
    // Update only allowed fields (prevent changing mentorId, menteeId, etc.)
    const now = Date.now();
    const allowedUpdates = {
      status: updates.status,
      paymentStatus: updates.paymentStatus,
      notes: updates.notes,
      meetingLink: updates.meetingLink,
      updatedAt: now,
    };
    
    // Filter out undefined values
    const filteredUpdates = Object.entries(allowedUpdates).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );
    
    await sessionDoc.update({
      $set: filteredUpdates,
    });
    
    // If status is changed to cancelled, update availability slot
    if (updates.status === "cancelled" && session.status !== "cancelled") {
      if (session.availabilityId) {
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
    }
    
    // Return updated session
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
    
    // Get existing session
    const sessionDoc = await db.sessions.findOne(id).exec();
    
    if (!sessionDoc) {
      throw new Error(`Session not found with ID: ${id}`);
    }
    
    const session = sessionDoc.toJSON() as SessionDocument;
    
    // Only allow cancelling scheduled sessions
    if (session.status !== "scheduled") {
      throw new Error(`Cannot cancel a session with status: ${session.status}`);
    }
    
    const now = Date.now();
    
    // Update session status to cancelled
    await sessionDoc.update({
      $set: {
        status: "cancelled",
        updatedAt: now,
      },
    });
    
    // Update availability slot to be available again
    if (session.availabilityId) {
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
    
    // First try to get the mentor directly by ID
    let mentorDoc = await db.mentors.findOne(mentorId).exec();
    
    // If not found by direct ID, try to find the mentor by userId
    if (!mentorDoc) {
      const mentorDocs = await db.mentors
        .find({
          selector: {
            userId: mentorId,
          },
        })
        .exec();
      
      if (mentorDocs.length === 0) {
        throw new Error(`Mentor profile not found for ID or userId: ${mentorId}`);
      }
      
      mentorDoc = mentorDocs[0];
      const mentorData = mentorDoc.toJSON();
      mentorId = mentorData.id; // Use the actual mentor ID
    }
    
    // Get availability slots
    const availabilityDocs = await db.availability
      .find({
        selector: {
          mentorId: mentorId,
        },
      })
      .exec();
    
    // Convert documents to plain objects with array conversion for compatibility
    const slots: AvailabilitySlot[] = availabilityDocs.map((doc: Document<AvailabilityDocument>, index: number) => {
      const slot = doc.toJSON() as AvailabilityDocument;
      
      return {
        id: slot.id,
        mentorId: slot.mentorId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.isBooked,
      };
    });
    
    return slots;
  } catch (error) {
    console.error("Error fetching mentor availability:", error);
    throw error;
  }
};

// Function to check and update session statuses
export const checkAndUpdateSessionStatuses = async (): Promise<void> => {
  try {
    const db = await getDatabase();
    
    // Get all scheduled sessions
    const sessionDocs = await db.sessions
      .find({
        selector: {
          status: "scheduled",
        },
      })
      .exec();
    
    if (sessionDocs.length === 0) {
      return; // No scheduled sessions to update
    }
    
    // Current time
    const now = Date.now();
    const nowDate = new Date();
    
    for (const doc of sessionDocs) {
      const session = doc.toJSON() as SessionDocument;
      
      // Check if the session should be marked as completed
      if (shouldMarkSessionCompleted(session)) {
        await doc.update({
          $set: {
            status: "completed",
            updatedAt: now,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error checking and updating session statuses:", error);
    throw error;
  }
};

export const isAvailabilitySlotBookable = async (
  mentorId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> => {
  try {
    const db = await getDatabase();
    
    // First check if slot exists
    const availabilityDocs = await db.availability
      .find({
        selector: {
          mentorId,
          date,
          startTime,
          endTime,
        },
      })
      .exec();
    
    if (availabilityDocs.length === 0) {
      return false; // Slot doesn't exist
    }
    
    const availabilitySlot = availabilityDocs[0].toJSON();
    
    if (availabilitySlot.isBooked) {
      // Double-check if there's actually an active session for this slot
      // This is to fix potential data inconsistencies
      const existingSessions = await db.sessions
        .find({
          selector: {
            availabilityId: availabilitySlot.id,
            status: "scheduled", // Only consider active sessions
          },
        })
        .exec();
      
      if (existingSessions.length === 0) {
        // No active sessions found for this slot, even though it's marked as booked
        // Fix the inconsistency by marking it as not booked
        await availabilityDocs[0].update({
          $set: {
            isBooked: false,
            updatedAt: Date.now(),
          },
        });
        
        return true; // Slot is actually available
      }
      
      return false; // Slot is booked and has active sessions
    }
    
    return true; // Slot is available
  } catch (error) {
    console.error("Error checking slot availability:", error);
    throw error;
  }
};
