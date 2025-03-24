import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase } from "rxdb";
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { RxDBMigrationPlugin } from "rxdb/plugins/migration";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";

// Import schemas
import { userSchema } from "./schemas/userSchema";
import { mentorSchema } from "./schemas/mentorSchema";
import { menteeSchema } from "./schemas/menteeSchema";
import { sessionSchema } from "./schemas/sessionSchema";
import { availabilitySchema } from "./schemas/availabilitySchema";
import { ratingSchema } from "./schemas/ratingSchema";
import { paymentSchema } from "./schemas/paymentSchema";

// Add plugins
addRxPlugin(RxDBLeaderElectionPlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBMigrationPlugin);
addRxPlugin(RxDBUpdatePlugin);
if (process.env.NODE_ENV !== "production") {
  addRxPlugin(RxDBDevModePlugin);
}

// Define proper collection types with more specific typing
export type UserDocument = {
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
  profilePicture?: string;
  createdAt: number;
  updatedAt: number;
};

export type MentorDocument = {
  id: string;
  userId: string;
  expertise: string[]; // Changed from specialization
  bio: string;
  sessionPrice: number; // Changed from hourlyRate
  yearsOfExperience: number; // Changed from experience
  portfolio: any[]; // Added field
  certifications: any[]; // Added field
  education: any[]; // Added field
  workExperience: any[]; // Added field
  availability?: any[]; // Added optional field
  createdAt: number;
  updatedAt: number;
};

export type MenteeDocument = {
  id: string;
  userId: string;
  interests: string[];
  bio: string;
  goals: string[] | string; // Updated to allow both string and array
  currentPosition?: string; // Added optional field
  createdAt: number;
  updatedAt: number;
};

export type SessionDocument = {
  id: string;
  mentorId: string;
  menteeId: string;
  date?: string; // Added optional field
  startTime: string | number; // Allow both string and number
  endTime: string | number; // Allow both string and number
  status: string;
  paymentStatus?: string; // Added optional field
  paymentAmount?: number; // Added optional field
  notes: string;
  meetingLink?: string; // Added optional field
  availabilityId?: string; // Added optional field
  createdAt: number;
  updatedAt: number;
};

export type AvailabilityDocument = {
  id: string;
  mentorId: string;
  date?: string; // Added optional field
  dayOfWeek?: number; // Made optional
  startTime: string;
  endTime: string;
  isBooked?: boolean; // Added optional field
  createdAt: number;
  updatedAt: number;
};

export type RatingDocument = {
  id: string;
  sessionId: string;
  mentorId?: string; // Added optional field
  menteeId?: string; // Added optional field
  rating?: number; // Made optional
  feedback?: string; // Made optional
  score?: number; // Added optional field for compatibility
  review?: string; // Added optional field for compatibility
  date?: string; // Added optional field
  createdAt: number;
  updatedAt: number;
};

export type PaymentDocument = {
  id: string;
  sessionId: string;
  mentorId?: string; // Added optional field
  menteeId?: string; // Added optional field
  amount: number;
  status: string;
  date?: string; // Added optional field
  transactionId?: string; // Added optional field
  createdAt: number;
  updatedAt: number;
};

// Define collection types with proper typing
export type UserCollection = RxCollection<UserDocument>;
export type MentorCollection = RxCollection<MentorDocument>;
export type MenteeCollection = RxCollection<MenteeDocument>;
export type SessionCollection = RxCollection<SessionDocument>;
export type AvailabilityCollection = RxCollection<AvailabilityDocument>;
export type RatingCollection = RxCollection<RatingDocument>;
export type PaymentCollection = RxCollection<PaymentDocument>;

// Define the database type with proper collection types
export type ThoughtclloudDatabase = RxDatabase<{
  users: UserCollection;
  mentors: MentorCollection;
  mentees: MenteeCollection;
  sessions: SessionCollection;
  availability: AvailabilityCollection;
  ratings: RatingCollection;
  payments: PaymentCollection;
}>;

// Database instance
let dbPromise: Promise<ThoughtclloudDatabase> | null = null;

// Forceful database deletion - this ensures all connections are closed and database is deleted
const forceDeleteDatabase = async (dbName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // First check if the database exists by trying to open it
      const openRequest = indexedDB.open(dbName);

      openRequest.onsuccess = (event) => {
        // Database exists and we got a connection
        const db = (event.target as IDBOpenDBRequest).result;

        // Close the connection properly
        db.close();

        // Now try to delete
        const deleteRequest = indexedDB.deleteDatabase(dbName);

        deleteRequest.onsuccess = () => {
          console.log(`Successfully deleted database: ${dbName}`);
          resolve(true);
        };

        deleteRequest.onerror = (event) => {
          console.error(`Error deleting database ${dbName}:`, event);
          resolve(false);
        };

        deleteRequest.onblocked = (event) => {
          console.warn(
            `Database deletion blocked for ${dbName}, forcing through:`,
            event
          );
          // Force through anyway after a timeout
          setTimeout(() => resolve(false), 1000);
        };
      };

      openRequest.onerror = () => {
        // Database doesn't exist or can't be opened - try direct deletion
        const deleteRequest = indexedDB.deleteDatabase(dbName);

        deleteRequest.onsuccess = () => {
          console.log(`Database ${dbName} didn't exist or was deleted.`);
          resolve(true);
        };

        deleteRequest.onerror = () => {
          console.error(`Failed to delete database ${dbName}`);
          resolve(false);
        };
      };

      // Handle edge case
      openRequest.onblocked = () => {
        console.warn(
          `Opening database ${dbName} was blocked - trying deletion anyway`
        );
        indexedDB.deleteDatabase(dbName);
        setTimeout(() => resolve(false), 1000);
      };
    } catch (error) {
      console.error(`Exception trying to delete database ${dbName}:`, error);
      resolve(false);
    }
  });
};

// Simplified database initialization that aggressively resets the database
export const getDatabase = async (): Promise<ThoughtclloudDatabase> => {
  // If we already have a database instance, return it
  if (dbPromise) return dbPromise;

  try {
    // Force clear IndexedDB to prevent schema conflicts
    if (typeof indexedDB !== "undefined") {
      console.log(
        "Aggressively clearing existing database to prevent schema conflicts..."
      );

      // Close and forcefully delete databases
      const dbNames = [
        "thoughtcllouddb",
        "thoughtcllouddb-mrview",
        "thoughtcllouddb-meteor",
        "_pouch_thoughtcllouddb",
      ];

      // Delete each database with the force method
      for (const dbName of dbNames) {
        await forceDeleteDatabase(dbName);
      }

      // Add a small delay to ensure deletion is complete before creating a new one
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Database deletion completed, now creating fresh database");
    }

    // Create a fresh database - with retries
    let retryCount = 0;
    const maxRetries = 3;

    const createDatabaseWithRetry =
      async (): Promise<ThoughtclloudDatabase> => {
        try {
          return await createRxDatabase<any>({
            name: "thoughtcllouddb",
            storage: getRxStorageDexie(),
            ignoreDuplicate: true,
            // Add a cache buster to the name in development to force a fresh database
            ...(process.env.NODE_ENV === "development"
              ? {
                  name: `thoughtcllouddb_${Date.now()}`, // Force new DB each time in development
                }
              : {}),
            options: {
              // Add explicit option to prevent schema conflicts
              allowUserDatabaseAccess: true,
            },
          }).then(async (db) => {
            console.log("Database created successfully");

            // Create collections with the current schema
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
              payments: {
                schema: paymentSchema,
              },
            });

            return db;
          });
        } catch (error) {
          retryCount++;
          console.error(
            `Error creating database (attempt ${retryCount}/${maxRetries}):`,
            error
          );

          if (retryCount >= maxRetries) {
            throw error;
          }

          // Retry with exponential backoff
          const delay = Math.pow(2, retryCount) * 500;
          console.log(`Retrying database creation in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Force delete databases again before retry
          for (const dbName of [
            "thoughtcllouddb",
            "thoughtcllouddb-mrview",
            "thoughtcllouddb-meteor",
          ]) {
            await forceDeleteDatabase(dbName);
          }

          // Try again
          return createDatabaseWithRetry();
        }
      };

    dbPromise = createDatabaseWithRetry();
    return dbPromise;
  } catch (error) {
    console.error("Error initializing database:", error);
    return Promise.reject(error);
  }
};

// Initialize the database with sample data if it's empty
export const initializeDatabaseWithSampleData = async (): Promise<void> => {
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
      console.log("Sample data initialized successfully");
    } else {
      console.log("Database already contains data, skipping initialization");
    }
  } catch (error) {
    console.error("Error initializing database with sample data:", error);
    throw error; // Re-throw to allow calling code to handle
  }
};

// Function to clear all data
export const clearDatabase = async (): Promise<boolean> => {
  try {
    console.log("Aggressively clearing database...");

    // If we have an active database, try to remove it properly
    if (dbPromise) {
      try {
        const db = await dbPromise;
        await db.remove();
        console.log("Successfully removed RxDB instance");
      } catch (e) {
        console.log("Could not properly remove database, will force clear:", e);
      }
    }

    // Reset the database promise
    dbPromise = null;

    // Clear localStorage
    if (typeof window !== "undefined") {
      console.log("Clearing localStorage");
      localStorage.clear();
    }

    // Force close and delete IndexedDB databases
    if (typeof indexedDB !== "undefined") {
      try {
        // Try to list all databases and delete any that match our pattern
        if (indexedDB.databases) {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && db.name.startsWith("thoughtclloud")) {
              await forceDeleteDatabase(db.name);
            }
          }
        }
      } catch (e) {
        console.error("Error listing databases:", e);
      }

      // Also try to delete known database names directly
      const dbNames = [
        "thoughtcllouddb",
        "thoughtcllouddb-mrview",
        "thoughtcllouddb-meteor",
        "_pouch_thoughtcllouddb",
      ];

      console.log("Forcefully deleting all related databases...");
      for (const dbName of dbNames) {
        await forceDeleteDatabase(dbName);
      }
    }

    // Add a delay to ensure deletion is complete
    await new Promise((resolve) => setTimeout(resolve, 750));
    console.log("Database cleared successfully");
    return true;
  } catch (error) {
    console.error("Error clearing database:", error);
    return false;
  }
};

// Utility function to completely reset and re-initialize the database
export const resetAndInitializeDatabase = async (): Promise<boolean> => {
  try {
    // Clear the database first
    await clearDatabase();

    // Reset the database promise to force a new instance
    dbPromise = null;

    // Initialize with fresh data
    await initializeDatabaseWithSampleData();

    console.log("Database has been completely reset and re-initialized");
    return true;
  } catch (error) {
    console.error("Failed to reset and initialize database:", error);
    return false;
  }
};
