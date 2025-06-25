import { Session, AvailabilitySlot } from "../types";
import { getDatabase } from "./database/db";
import { v4 as uuidv4 } from "uuid";
import { createGoogleMeetLink } from "./googleMeetService";
import { 
  COLLECTIONS, 
  getDocuments, 
  whereEqual, 
  updateDocument, 
  setDocument, 
  getDocument 
} from "./firebase";

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
// Assumes session.mentorId and session.menteeId store Firebase Auth UIDs.
// Assumes session documents will have denormalized mentorName and menteeName.
export const getSessions = async (userId: string): Promise<Session[]> => {
  try {
    console.log(`Fetching sessions for user: ${userId}`);
    
    // Fetch sessions where the user is the mentor
    const mentorSessions = await getDocuments<SessionDocument>(
      COLLECTIONS.SESSIONS,
      [whereEqual("mentorId", userId)]
    );
    console.log(`Found ${mentorSessions.length} sessions as mentor`);

    // Fetch sessions where the user is the mentee
    const menteeSessions = await getDocuments<SessionDocument>(
      COLLECTIONS.SESSIONS,
      [whereEqual("menteeId", userId)]
    );
    console.log(`Found ${menteeSessions.length} sessions as mentee`);

    // Combine and deduplicate sessions
    const allSessionDocsMap = new Map<string, SessionDocument>();
    mentorSessions.forEach((session: SessionDocument) =>
      allSessionDocsMap.set(session.id, session)
    );
    menteeSessions.forEach((session: SessionDocument) =>
      allSessionDocsMap.set(session.id, session)
    );

    const allUserSessionDocs = Array.from(allSessionDocsMap.values());
    console.log(`Total unique sessions: ${allUserSessionDocs.length}`);

    if (!allUserSessionDocs || allUserSessionDocs.length === 0) {
      console.log("No sessions found for user");
      return [];
    }

    // Map SessionDocument to Session type
    const mappedSessions = allUserSessionDocs.map((sessionDoc) => {
      const session = {
        id: sessionDoc.id,
        mentorId: sessionDoc.mentorId,
        menteeId: sessionDoc.menteeId,
        date: sessionDoc.date,
        startTime: sessionDoc.startTime,
        endTime: sessionDoc.endTime,
        status: sessionDoc.status as "scheduled" | "completed" | "cancelled",
        paymentStatus: sessionDoc.paymentStatus as
          | "pending"
          | "completed"
          | "refunded",
        paymentAmount: sessionDoc.paymentAmount,
        notes: sessionDoc.notes || "",
        availabilitySlotId: sessionDoc.availabilityId,
        mentorName: (sessionDoc as any).mentorName || "Mentor Name",
        menteeName: (sessionDoc as any).menteeName || "Mentee Name",
        title: sessionDoc.notes || "Mentoring Session",
        meetingLink: sessionDoc.meetingLink,
      } as Session;
      
      console.log(`Mapped session: ${session.id} - Status: ${session.status} - Mentor: ${session.mentorId}`);
      return session;
    });

    // Check for sessions that should be marked as completed (simplified - no RxDB)
    const nowTime = Date.now();
    for (const session of mappedSessions) {
      if (shouldMarkSessionCompleted(session as any)) {
        try {
          // Update the session status using Firestore
          await updateDocument(COLLECTIONS.SESSIONS, session.id, { 
            status: "completed", 
            updatedAt: nowTime 
          });
          // Update the local session object
          session.status = "completed";
          console.log(`Marked session ${session.id} as completed`);
        } catch (updateError) {
          console.warn(`Could not update session ${session.id} status:`, updateError);
        }
      }
    }

    console.log(`Returning ${mappedSessions.length} sessions for user ${userId}`);
    return mappedSessions;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    
    // Check for permission errors
    if (
      error instanceof Error &&
      error.message.includes("Missing or insufficient permissions")
    ) {
      throw new Error(
        "Permission denied fetching sessions. This might be a Firestore rules issue or an issue with how session participants are identified."
      );
    }
    throw error; // Re-throw original error or a new one
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
      const mentorProfileDoc = await db.mentors
        .findOne(session.mentorId)
        .exec();

      if (mentorProfileDoc) {
        const mentorProfile = mentorProfileDoc.toJSON();
        const mentorUserDoc = await db.users
          .findOne(mentorProfile.userId)
          .exec();

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
      console.warn(
        `Could not load availability details for session ${id}:`,
        err
      );
    }

    const fullSession: Session = {
      id: session.id,
      mentorId: session.mentorId,
      menteeId: session.menteeId,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status as "scheduled" | "completed" | "cancelled",
      paymentStatus: session.paymentStatus as
        | "pending"
        | "completed"
        | "refunded",
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
    // Use direct Firestore functions instead of the RxDB-like wrapper
    // This avoids the "n.indexOf is not a function" error that happens in the wrapper
    
    // 1. Get mentor and mentee data
    const mentorId = sessionData.mentorId;
    const menteeId = sessionData.menteeId;
    
    console.log(`Creating session with mentorId: ${mentorId}, menteeId: ${menteeId}`);
    
    // First try to get mentor by document ID directly
    let mentorData = await getDocument<any>(COLLECTIONS.MENTORS, mentorId);
    let mentorAuthUid;
    let mentorDocId;
    
    if (mentorData) {
      // If we found the mentor by document ID, get their Auth UID
      mentorAuthUid = mentorData.userId;
      mentorDocId = mentorId; // Store the document ID
      console.log(`Found mentor by document ID ${mentorId}. Auth UID: ${mentorAuthUid}`);
    } else {
      // If not found by document ID, try to find by Auth UID (userId field)
      const mentors = await getDocuments<any>(COLLECTIONS.MENTORS, [
        whereEqual("userId", mentorId)
      ]);
      
      if (mentors.length === 0) {
        // If still not found, try a general search to debug
        console.log(`Mentor not found with ID ${mentorId}. Trying to list all mentors...`);
        const allMentors = await getDocuments<any>(COLLECTIONS.MENTORS, []);
        console.log(`Found ${allMentors.length} mentors in total`);
        
        if (allMentors.length > 0) {
          // Use the first mentor as a fallback (for debugging only)
          mentorData = allMentors[0];
          mentorAuthUid = mentorData.userId;
          mentorDocId = mentorData.id;
          console.log(`Using fallback mentor with ID ${mentorData.id} and Auth UID ${mentorAuthUid}`);
        } else {
          throw new Error(`No mentors found in the database`);
        }
      } else {
        mentorData = mentors[0];
        mentorAuthUid = mentorId; // In this case, the mentorId was already the Auth UID
        mentorDocId = mentorData.id;
        console.log(`Found mentor by Auth UID: ${mentorAuthUid}`);
      }
    }
    
    // First try to get mentee by document ID
    let menteeData = await getDocument<any>(COLLECTIONS.MENTEES, menteeId);
    let menteeAuthUid;
    let menteeDocId;
    
    if (menteeData) {
      // If we found the mentee by document ID, get their Auth UID
      menteeAuthUid = menteeData.userId;
      menteeDocId = menteeId; // Store the document ID
      console.log(`Found mentee by document ID ${menteeId}. Auth UID: ${menteeAuthUid}`);
    } else {
      // If not found by document ID, try to find by Auth UID (userId field)
      const mentees = await getDocuments<any>(COLLECTIONS.MENTEES, [
        whereEqual("userId", menteeId)
      ]);
      
      if (mentees.length === 0) {
        // If still not found, try a general search to debug
        console.log(`Mentee not found with ID ${menteeId}. Trying to list all mentees...`);
        const allMentees = await getDocuments<any>(COLLECTIONS.MENTEES, []);
        console.log(`Found ${allMentees.length} mentees in total`);
        
        if (allMentees.length > 0) {
          // Use the first mentee as a fallback (for debugging only)
          menteeData = allMentees[0];
          menteeAuthUid = menteeData.userId;
          menteeDocId = menteeData.id;
          console.log(`Using fallback mentee with ID ${menteeData.id} and Auth UID ${menteeAuthUid}`);
        } else {
          throw new Error(`No mentees found in the database`);
        }
      } else {
        menteeData = mentees[0];
        menteeAuthUid = menteeId; // In this case, the menteeId was already the Auth UID
        menteeDocId = menteeData.id;
        console.log(`Found mentee by Auth UID: ${menteeAuthUid}`);
      }
    }
    
    // 2. Prevent mentors from booking with themselves
    if (mentorAuthUid === menteeAuthUid) {
      throw new Error("You cannot book a session with yourself.");
    }
    
    // 3. Generate session ID early so we can embed it in availability doc
    const sessionId = uuidv4();

    // 4. Check if the slot is available
    // Use the mentorId from the document for availability lookup
    const availabilitySlots = await getDocuments<any>(COLLECTIONS.AVAILABILITY, [
      whereEqual("mentorId", mentorDocId), // Use document ID for availability
      whereEqual("date", sessionData.date),
      whereEqual("startTime", sessionData.startTime),
      whereEqual("endTime", sessionData.endTime)
    ]);
    
    let availabilityId = sessionData.availabilitySlotId;
    if (availabilitySlots.length > 0) {
      availabilityId = availabilitySlots[0].id;
      console.log(`Found matching availability slot: ${availabilityId}`);
      
      const now = Date.now();
      // Instead of creating a duplicate availability entry, simply mark the
      // original slot as booked and reference it in the session. This prevents
      // the mentor's calendar from showing replicated slots.
      await setDocument(
        COLLECTIONS.AVAILABILITY,
        availabilityId,
        {
          ...availabilitySlots[0],
          isBooked: true,
          sessionId: sessionId,
          updatedAt: now,
          id: availabilityId,
        }
      );
    } else {
      console.log(`No matching availability slot found, using provided ID: ${availabilityId}`);
    }
    
    // 5. Create a meeting link (simplified)
    let meetingLink = "";
    try {
      meetingLink = await createGoogleMeetLink({
        summary: `Mentoring session with ${sessionData.mentorName || mentorData.name || "Mentor"}`,
        description: sessionData.notes || "Mentoring session",
        startDateTime: `${sessionData.date}T${sessionData.startTime}:00`,
        endDateTime: `${sessionData.date}T${sessionData.endTime}:00`,
        attendees: []
      });
    } catch (error) {
      console.error("Failed to create Google Meet link:", error);
    }
    
    // 6. Create the session document
    const now = Date.now();
    
    // Log the IDs we're using for clarity
    console.log(`Creating session with mentorId: ${mentorAuthUid}, menteeId: ${menteeAuthUid}`);

    const newSession = {
      id: sessionId,
      mentorId: mentorAuthUid,  // Always use Auth UID
      menteeId: menteeAuthUid,  // Always use Auth UID
      mentorDocId: mentorDocId, // Store the document ID for reference
      menteeDocId: menteeDocId, // Store the document ID for reference
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      status: "scheduled",
      paymentStatus: "pending",
      paymentAmount: sessionData.paymentAmount,
      notes: sessionData.notes || "",
      meetingLink: meetingLink,
      availabilityId: availabilityId,
      mentorName: sessionData.mentorName || mentorData.name || "Unknown Mentor",
      menteeName: sessionData.menteeName || menteeData.name || "Unknown Mentee",
      createdAt: now,
      updatedAt: now
    };
    
    // Use direct Firestore function to create the session
    await setDocument(COLLECTIONS.SESSIONS, sessionId, newSession);
    console.log(`Session created successfully with ID: ${sessionId}`);
    
    // No second update to availability needed

    return {
      id: sessionId,
      mentorId: mentorAuthUid,
      menteeId: menteeAuthUid,
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      status: "scheduled",
      paymentStatus: "pending",
      paymentAmount: sessionData.paymentAmount,
      notes: sessionData.notes || "",
      availabilitySlotId: availabilityId,
      mentorName: sessionData.mentorName || mentorData.name || "Unknown Mentor",
      menteeName: sessionData.menteeName || menteeData.name || "Unknown Mentee",
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
        throw new Error(
          `Mentor profile not found for ID or userId: ${mentorId}`
        );
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
    const slots: AvailabilitySlot[] = availabilityDocs.map(
      (doc: Document<AvailabilityDocument>, index: number) => {
        const slot = doc.toJSON() as AvailabilityDocument;

        return {
          id: slot.id,
          mentorId: slot.mentorId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: slot.isBooked,
        };
      }
    );

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

    // Prevent booking slots in the past
    const slotStart = new Date(`${availabilitySlot.date}T${availabilitySlot.startTime}`);
    if (slotStart.getTime() < Date.now()) {
      return false;
    }

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
