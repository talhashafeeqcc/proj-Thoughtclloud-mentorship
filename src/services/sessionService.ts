import { Session, AvailabilitySlot } from "../types";
import { getDatabase } from "./database/db";
import { v4 as uuidv4 } from "uuid";
import type { RxDocument } from "rxdb";

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

// Get all sessions for a user (either as mentor or mentee)
export const getSessions = async (userId: string): Promise<Session[]> => {
  try {
    const db = await getDatabase();

    // Find sessions where the user is either mentor or mentee
    const sessionDocs = await db.sessions
      .find({
        selector: {
          $or: [{ mentorId: userId }, { menteeId: userId }],
        },
      })
      .exec();

    // Get user details for all mentors and mentees in the sessions
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
      // Don't include password in the returned object
      const { password, ...safeUser } = user;
      return safeUser;
    });

    // Map session data to full Session objects
    return sessionData.map((session: SessionDocument) => {
      const mentor = userData.find(
        (u: UserDocument) => u.id === session.mentorId
      ) as UserDocument;
      const mentee = userData.find(
        (u: UserDocument) => u.id === session.menteeId
      ) as UserDocument;

      return {
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
        mentorName: mentor?.name || "Unknown Mentor",
        menteeName: mentee?.name || "Unknown Mentee",
        title: session.notes || "Mentoring Session", // Use notes as title or default
      } as Session;
    });
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

    // Get mentor and mentee information
    const mentorDoc = await db.users.findOne(session.mentorId).exec();
    const menteeDoc = await db.users.findOne(session.menteeId).exec();

    if (!mentorDoc || !menteeDoc) {
      throw new Error("Session users not found");
    }

    const mentor = mentorDoc.toJSON();
    const mentee = menteeDoc.toJSON();

    // Get availability information
    const availabilityDoc = await db.availability
      .findOne(session.availabilityId)
      .exec();

    if (!availabilityDoc) {
      throw new Error("Session availability not found");
    }

    // Construct the full session object
    return {
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
      mentorName: mentor?.name || "Unknown Mentor",
      menteeName: mentee?.name || "Unknown Mentee",
      title: session.notes || "Mentoring Session",
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

    // Check if the mentor and mentee exist
    const mentorDoc = await db.users.findOne(sessionData.mentorId).exec();
    const menteeDoc = await db.users.findOne(sessionData.menteeId).exec();

    if (!mentorDoc) {
      throw new Error(`Mentor with ID ${sessionData.mentorId} not found`);
    }

    if (!menteeDoc) {
      throw new Error(`Mentee with ID ${sessionData.menteeId} not found`);
    }

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

    // Create the session document
    const newSession = {
      id: sessionId,
      mentorId: sessionData.mentorId,
      menteeId: sessionData.menteeId,
      date: sessionData.date,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      status: sessionData.status,
      paymentStatus: sessionData.paymentStatus,
      paymentAmount: sessionData.paymentAmount,
      notes: sessionData.notes || "",
      meetingLink: sessionData.meetingLink || "",
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
      title: sessionData.notes || "Mentoring Session", // Use notes as title or default
      mentorName: mentorDoc.toJSON().name,
      menteeName: menteeDoc.toJSON().name,
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
      mentor.availability.forEach((slot: AvailabilitySlot, index: number) => {
        console.log(`Slot ${index + 1}:`, {
          id: slot.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: slot.isBooked,
        });
      });
    }

    return mentor.availability || [];
  } catch (error) {
    console.error("Error fetching mentor availability:", error);
    throw error;
  }
};
