// Main database module
// Simply re-export everything from db.ts and bootstrap.ts

// Export database functions
export { 
  getDatabase, 
  clearDatabase,
  initializeDatabaseWithSampleData,
  resetAndInitializeDatabase 
} from './db';

// Export bootstrap functions and status
export { 
  databaseBootstrapStatus,
  isBootstrapComplete,
  retryBootstrap, 
  nuclearReset 
} from './bootstrap';

// Import bootstrap to ensure it's initialized
import { databaseBootstrapStatus, isBootstrapComplete } from './bootstrap';

// Export a simple function to check if database bootstrap has completed
export const hasBootstrapped = () => isBootstrapComplete();

// Log bootstrap status on module load
console.log(
  "Database module loaded, bootstrap status:",
  databaseBootstrapStatus.completed
    ? "Completed"
    : databaseBootstrapStatus.started
    ? "Started"
    : "Not started"
);
