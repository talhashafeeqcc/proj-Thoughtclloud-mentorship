// Re-export all database functionality
import {
  getDatabase,
  clearDatabase,
  initializeDatabaseWithSampleData,
  resetAndInitializeDatabase,
  ThoughtclloudDatabase,
  UserCollection,
  MentorCollection,
  MenteeCollection,
  SessionCollection,
  AvailabilityCollection,
  RatingCollection,
  PaymentCollection,
} from "./db";

// Import bootstrap to ensure it has been executed
import {
  databaseBootstrapStatus,
  isBootstrapComplete,
  retryBootstrap,
  nucleaReset,
} from "./bootstrap";

// Export all database types and functions
export {
  getDatabase,
  clearDatabase,
  initializeDatabaseWithSampleData,
  resetAndInitializeDatabase,
  ThoughtclloudDatabase,
  UserCollection,
  MentorCollection,
  MenteeCollection,
  SessionCollection,
  AvailabilityCollection,
  RatingCollection,
  PaymentCollection,
  databaseBootstrapStatus,
  isBootstrapComplete,
  retryBootstrap,
  nucleaReset,
};

// Export a simple function to check if database bootstrap has completed
export const hasBootstrapped = () => isBootstrapComplete();

// The mere importing of this file will trigger the bootstrap process
console.log(
  "Database module loaded, bootstrap status:",
  databaseBootstrapStatus.completed
    ? "Completed"
    : databaseBootstrapStatus.started
    ? "Started"
    : "Not started"
);
