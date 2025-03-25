import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase } from "rxdb";
import { RxDBLeaderElectionPlugin } from "rxdb/plugins/leader-election";
import { RxDBQueryBuilderPlugin } from "rxdb/plugins/query-builder";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
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
addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBUpdatePlugin);
// if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
addRxPlugin(RxDBDevModePlugin);
// }

// Define types for documents and collections
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
  expertise: string[];
  bio: string;
  sessionPrice: number;
  yearsOfExperience: number;
  portfolio: any[];
  certifications: any[];
  education: any[];
  workExperience: any[];
  availability?: any[];
  createdAt: number;
  updatedAt: number;
};

export type MenteeDocument = {
  id: string;
  userId: string;
  interests: string[];
  bio: string;
  goals: string[] | string;
  currentPosition?: string;
  createdAt: number;
  updatedAt: number;
};

export type SessionDocument = {
  id: string;
  mentorId: string;
  menteeId: string;
  date?: string;
  startTime: string | number;
  endTime: string | number;
  status: string;
  paymentStatus?: string;
  paymentAmount?: number;
  notes: string;
  meetingLink?: string;
  availabilityId?: string;
  createdAt: number;
  updatedAt: number;
};

export type AvailabilityDocument = {
  id: string;
  mentorId: string;
  date?: string;
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type RatingDocument = {
  id: string;
  sessionId: string;
  mentorId?: string;
  menteeId?: string;
  rating?: number;
  feedback?: string;
  score?: number;
  review?: string;
  date?: string;
  createdAt: number;
  updatedAt: number;
};

export type PaymentDocument = {
  id: string;
  sessionId: string;
  mentorId?: string;
  menteeId?: string;
  amount: number;
  status: string;
  date?: string;
  transactionId?: string;
  createdAt: number;
  updatedAt: number;
};

// Define collection types
export type UserCollection = RxCollection<UserDocument>;
export type MentorCollection = RxCollection<MentorDocument>;
export type MenteeCollection = RxCollection<MenteeDocument>;
export type SessionCollection = RxCollection<SessionDocument>;
export type AvailabilityCollection = RxCollection<AvailabilityDocument>;
export type RatingCollection = RxCollection<RatingDocument>;
export type PaymentCollection = RxCollection<PaymentDocument>;

// Define the database type
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

// Simple database deletion
const deleteDatabase = async (dbName: string): Promise<void> => {
  if (typeof indexedDB === "undefined") return;

  try {
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    await new Promise<void>((resolve, reject) => {
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject();
      // Don't block if operation takes too long
      setTimeout(resolve, 1000);
    });
  } catch (error) {
    console.warn(`Error deleting database ${dbName}:`, error);
  }
};

// Clear databases that might be leftover from previous sessions
export const clearDatabases = async (): Promise<void> => {
  if (typeof indexedDB === "undefined") return;

  // Get list of existing databases if available
  const databaseNames: string[] = [];

  try {
    if (indexedDB.databases) {
      const databases = await indexedDB.databases();
      databases.forEach((db) => {
        if (db.name && db.name.startsWith("thoughtcllouddb")) {
          databaseNames.push(db.name);
        }
      });
    }
  } catch (error) {
    console.warn("Error listing databases:", error);
  }

  // Always try to delete the main database
  if (!databaseNames.includes("thoughtcllouddb")) {
    databaseNames.push("thoughtcllouddb");
  }

  // Delete all matching databases
  for (const dbName of databaseNames) {
    await deleteDatabase(dbName);
  }
};

// For backward compatibility
export const clearDatabase = clearDatabases;

// Database initialization with simplified approach
export const getDatabase = async (): Promise<ThoughtclloudDatabase> => {
  // Return existing instance if available
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    try {
      // Clear old databases
      await clearDatabases();

      // Create a new database
      const db = await createRxDatabase<any>({
        name: "thoughtcllouddb",
        storage: wrappedValidateAjvStorage({
          storage: getRxStorageDexie(),
        }),
        ignoreDuplicate: true,
        options: {
          allowUserDatabaseAccess: true,
        },
      });

      console.log("Database created successfully");

      // Add collections
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
    } catch (error) {
      console.error("Error initializing database:", error);
      dbPromise = null;
      throw error;
    }
  })();

  return dbPromise;
};

// Initialize database with sample data
export const initializeDatabaseWithSampleData = async (): Promise<void> => {
  try {
    const db = await getDatabase();

    // Check if database is empty
    const userCount = await db.users
      .find()
      .exec()
      .then((docs) => docs.length);

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
    throw error;
  }
};

// Reset and initialize database
export const resetAndInitializeDatabase = async (): Promise<boolean> => {
  try {
    // Reset DB promise
    dbPromise = null;

    // Clear databases
    await clearDatabases();

    // Initialize with fresh data
    await initializeDatabaseWithSampleData();

    console.log("Database has been completely reset and re-initialized");
    return true;
  } catch (error) {
    console.error("Failed to reset and initialize database:", error);
    return false;
  }
};
