import { v4 as uuidv4 } from "uuid";
import type { Rating } from "../types";
import { getDatabase } from "./database/db";
import type { RxDocument } from "rxdb";

// Define interface for RxDB document type
interface RatingDocument {
  id: string;
  sessionId: string;
  mentorId: string;
  menteeId: string;
  score: number;
  review: string;
  date: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Get all ratings for a mentor
 */
export const getMentorRatings = async (mentorId: string): Promise<Rating[]> => {
  try {
    const db = await getDatabase();
    const ratingDocs = await db.ratings
      .find({
        selector: {
          mentorId: mentorId,
        },
      })
      .exec();

    return ratingDocs.map((doc: RxDocument<RatingDocument>) => {
      const rating = doc.toJSON() as RatingDocument;
      return {
        id: rating.id,
        sessionId: rating.sessionId,
        menteeId: rating.menteeId,
        score: rating.score,
        review: rating.review,
        date: rating.date,
      };
    });
  } catch (error) {
    console.error(`Failed to get ratings for mentor ${mentorId}:`, error);
    throw new Error(`Failed to get ratings for mentor ${mentorId}`);
  }
};

/**
 * Get average rating score for a mentor
 */
export const getMentorAverageRating = async (
  mentorId: string
): Promise<number> => {
  try {
    const ratings = await getMentorRatings(mentorId);

    if (ratings.length === 0) {
      return 0;
    }

    const sum = ratings.reduce((total, rating) => total + rating.score, 0);
    return sum / ratings.length;
  } catch (error) {
    console.error(
      `Failed to get average rating for mentor ${mentorId}:`,
      error
    );
    throw new Error(`Failed to get average rating for mentor ${mentorId}`);
  }
};

/**
 * Get a specific rating by ID
 */
export const getRatingById = async (id: string): Promise<Rating | null> => {
  try {
    const db = await getDatabase();
    const ratingDoc = await db.ratings.findOne(id).exec();

    if (!ratingDoc) {
      return null;
    }

    const rating = ratingDoc.toJSON() as RatingDocument;
    return {
      id: rating.id,
      sessionId: rating.sessionId,
      menteeId: rating.menteeId,
      score: rating.score,
      review: rating.review,
      date: rating.date,
    };
  } catch (error) {
    console.error(`Failed to get rating with ID ${id}:`, error);
    throw new Error(`Failed to get rating with ID ${id}`);
  }
};

/**
 * Check if a session has already been rated
 */
export const hasSessionRating = async (sessionId: string): Promise<boolean> => {
  try {
    const db = await getDatabase();
    const ratings = await db.ratings
      .find({
        selector: {
          sessionId: sessionId,
        },
      })
      .exec();

    return ratings.length > 0;
  } catch (error) {
    console.error(`Failed to check rating for session ${sessionId}:`, error);
    throw new Error(`Failed to check rating for session ${sessionId}`);
  }
};

/**
 * Create a new rating
 */
export const createRating = async (
  ratingData: Omit<Rating, "id">
): Promise<Rating> => {
  try {
    const db = await getDatabase();

    // Check if a rating already exists for this session
    const existingRating = await hasSessionRating(ratingData.sessionId);
    if (existingRating) {
      throw new Error("This session has already been rated");
    }

    // Validate the session exists and belongs to the right mentor and mentee
    const sessionDoc = await db.sessions.findOne(ratingData.sessionId).exec();
    if (!sessionDoc) {
      throw new Error(`Session with ID ${ratingData.sessionId} not found`);
    }

    const session = sessionDoc.toJSON();
    if (session.status !== "completed") {
      throw new Error("Only completed sessions can be rated");
    }

    // Ensure the mentee is rating their own session
    if (session.menteeId !== ratingData.menteeId) {
      throw new Error("You can only rate sessions you participated in");
    }

    // Create the rating
    const now = Date.now();
    const ratingId = uuidv4();

    const newRating = {
      id: ratingId,
      sessionId: ratingData.sessionId,
      mentorId: session.mentorId, // Get the mentor ID from the session
      menteeId: ratingData.menteeId,
      score: ratingData.score,
      review: ratingData.review || "",
      date: ratingData.date || new Date().toISOString().split("T")[0],
      createdAt: now,
      updatedAt: now,
    };

    await db.ratings.insert(newRating);

    return {
      id: ratingId,
      sessionId: newRating.sessionId,
      menteeId: newRating.menteeId,
      score: newRating.score,
      review: newRating.review,
      date: newRating.date,
    };
  } catch (error) {
    console.error("Failed to create rating:", error);
    throw error;
  }
};

/**
 * Update an existing rating
 */
export const updateRating = async (
  id: string,
  updates: Partial<Pick<Rating, "score" | "review">>
): Promise<Rating | null> => {
  try {
    const db = await getDatabase();
    const ratingDoc = await db.ratings.findOne(id).exec();

    if (!ratingDoc) {
      return null;
    }

    const rating = ratingDoc.toJSON() as RatingDocument;
    const now = Date.now();

    // Only allow updating score and review
    const ratingUpdates: Partial<RatingDocument> = {
      score: updates.score,
      review: updates.review,
      updatedAt: now,
    };

    // Filter out undefined values
    Object.keys(ratingUpdates).forEach((key) => {
      if (ratingUpdates[key as keyof typeof ratingUpdates] === undefined) {
        delete ratingUpdates[key as keyof typeof ratingUpdates];
      }
    });

    await ratingDoc.update({
      $set: ratingUpdates,
    });

    const updatedRating = await getRatingById(id);
    return updatedRating;
  } catch (error) {
    console.error(`Failed to update rating with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a rating
 */
export const deleteRating = async (id: string): Promise<void> => {
  try {
    const db = await getDatabase();
    const ratingDoc = await db.ratings.findOne(id).exec();

    if (!ratingDoc) {
      throw new Error(`Rating with ID ${id} not found`);
    }

    await ratingDoc.remove();
  } catch (error) {
    console.error(`Failed to delete rating with ID ${id}:`, error);
    throw error;
  }
};
