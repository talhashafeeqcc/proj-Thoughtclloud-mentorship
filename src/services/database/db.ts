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

// Define database type with proper collection types
export type UserCollection = RxCollection<any, any, any, any>;
export type MentorCollection = RxCollection<any, any, any, any>;
export type MenteeCollection = RxCollection<any, any, any, any>;
export type SessionCollection = RxCollection<any, any, any, any>;
export type AvailabilityCollection = RxCollection<any, any, any, any>;
export type RatingCollection = RxCollection<any, any, any, any>;
export type PaymentCollection = RxCollection<any, any, any, any>;

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

// Centralized error handling for database operations
const handleDatabaseError = (error: any) => {
  console.error("Database error:", error);

  // Check for schema version errors - RxDB error code DB6 indicates schema conflict
  if (error.message && error.message.includes("DB6")) {
    console.log("Schema version mismatch detected. Clearing database...");

    // Set flag to indicate schema error
    if (typeof window !== "undefined") {
      localStorage.setItem("schema_error", "true");

      try {
        // Clear localStorage except the schema_error flag
        const schemaError = localStorage.getItem("schema_error");
        localStorage.clear();
        localStorage.setItem("schema_error", schemaError || "true");

        // Force close and delete the IndexedDB database
        indexedDB.deleteDatabase("thoughtcllouddb");

        console.log(
          "Database cleared due to schema changes. Reloading page..."
        );

        // Reload the page to initialize fresh database
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } catch (clearError) {
        console.error("Error while clearing database:", clearError);
      }
    }
  }

  return Promise.reject(error);
};

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
    // Simple error handling - just log the error and reject the promise
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
