import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase } from "rxdb";
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

// Import schemas
import { userSchema } from "./schemas/userSchema";
import { mentorSchema } from "./schemas/mentorSchema";
import { menteeSchema } from "./schemas/menteeSchema";
import { sessionSchema } from "./schemas/sessionSchema";
import { availabilitySchema } from "./schemas/availabilitySchema";
import { ratingSchema } from "./schemas/ratingSchema";

// Add plugins
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationPlugin);

// Define database type with proper collection types
export type UserCollection = RxCollection<any, any, any, any>;
export type MentorCollection = RxCollection<any, any, any, any>;
export type MenteeCollection = RxCollection<any, any, any, any>;
export type SessionCollection = RxCollection<any, any, any, any>;
export type AvailabilityCollection = RxCollection<any, any, any, any>;
export type RatingCollection = RxCollection<any, any, any, any>;

export type ThoughtclloudDatabase = RxDatabase<{
  users: UserCollection;
  mentors: MentorCollection;
  mentees: MenteeCollection;
  sessions: SessionCollection;
  availability: AvailabilityCollection;
  ratings: RatingCollection;
}>;

// Database instance
let dbPromise: Promise<ThoughtclloudDatabase> | null = null;

// Centralized error handling for database operations
const handleDatabaseError = (error: any) => {
  console.error("Database error:", error);

  // Check for schema version errors
  if (error.message && error.message.includes("DB6")) {
    console.log(
      "Schema version mismatch detected. Database needs to be reset."
    );
    if (typeof window !== "undefined") {
      console.log("Clearing localStorage...");
      localStorage.clear();

      // Clear IndexedDB
      indexedDB.deleteDatabase("thoughtcllouddb");

      console.log(
        "Database cleared due to schema changes. Please refresh the page."
      );
    }
  }

  return Promise.reject(error);
};

// Initialize database
export const getDatabase = async (): Promise<ThoughtclloudDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = createRxDatabase<any>({
    name: "thoughtcllouddb",
    storage: getRxStorageDexie(),
    ignoreDuplicate: true,
  })
    .then(async (db) => {
      console.log("Database created");

      // Create collections
      await db.addCollections({
        users: {
          schema: userSchema,
        },
        mentors: {
          schema: mentorSchema,
        },
        mentees: {
          schema: menteeSchema,
        },
        sessions: {
          schema: sessionSchema,
        },
        availability: {
          schema: availabilitySchema,
        },
        ratings: {
          schema: ratingSchema,
        },
      });

      return db;
    })
    .catch(handleDatabaseError);

  return dbPromise;
};

// Initialize the database with sample data if it's empty
export const initializeDatabaseWithSampleData = async () => {
  try {
    const db = await getDatabase();

    // Check if database is empty
    const userCount = await db.users
      .find()
      .exec()
      .then((docs: any[]) => docs.length);

    if (userCount === 0) {
      console.log("Database is empty, initializing with sample data");

      // Import the seed data function
      const { seedDatabase } = await import("./seedData");

      // Seed the database
      await seedDatabase(db);
    }
  } catch (error) {
    handleDatabaseError(error);
  }
};

// Function to clear all data (for testing)
export const clearDatabase = async () => {
  try {
    // If we have an active database, remove it
    if (dbPromise) {
      const db = await dbPromise;
      await db.remove();
    }

    // Reset the database promise
    dbPromise = null;

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.clear();
    }

    // Force clear IndexedDB
    if (typeof indexedDB !== "undefined") {
      indexedDB.deleteDatabase("thoughtcllouddb");
    }

    console.log("Database cleared successfully!");
    return true;
  } catch (error) {
    console.error("Error clearing database:", error);
    return false;
  }
};
