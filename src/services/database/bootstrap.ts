import { resetAndInitializeDatabase, clearDatabase } from "./db";

/**
 * This bootstrap file automatically resets and initializes the database
 * when imported. It's designed to be imported early in the application
 * lifecycle to ensure the database is ready.
 */

// Set up a flag to track bootstrap status
export const databaseBootstrapStatus = {
  started: true,
  completed: false,
  error: null as Error | null,
};

console.log("Database bootstrap script starting...");

// Direct initialization without complex retry logic
const initializeDatabase = async () => {
  try {
    console.log("Starting direct database initialization");
    
    // In development, always fully clear the database first
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Performing complete database reset");
      await clearDatabase();
    }
    
    // Initialize with fresh data
    const success = await resetAndInitializeDatabase();
    
    if (success) {
      console.log("Database bootstrap completed successfully");
      databaseBootstrapStatus.completed = true;
    } else {
      throw new Error("Database initialization failed");
    }
  } catch (error) {
    console.error("Error during database bootstrap:", error);
    databaseBootstrapStatus.error = error instanceof Error ? error : new Error(String(error));
    
    // Set localStorage flag to indicate a hard refresh is needed
    if (typeof window !== "undefined") {
      localStorage.setItem("db_hard_reset_needed", "true");
    }
  }
};

// Start the initialization process
initializeDatabase();

// Export a function to check if bootstrap completed successfully
export const isBootstrapComplete = () => databaseBootstrapStatus.completed;

// Export a function to trigger a manual retry if needed
export const retryBootstrap = async () => {
  if (!databaseBootstrapStatus.completed) {
    console.log("Manually retrying database bootstrap with forced reset");
    
    // Always clear first on manual retry
    try {
      await clearDatabase();
      initializeDatabase();
    } catch (error) {
      console.error("Manual retry failed:", error);
    }
  }
};

// Nuclear option - completely reset browser storage for this domain
// Only used as a last resort
export const nuclearReset = async (): Promise<boolean> => {
  try {
    console.warn("🔥 EXECUTING NUCLEAR RESET - CLEARING ALL DOMAIN STORAGE 🔥");

    // Clear all localStorage
    localStorage.clear();

    // Clear all sessionStorage
    sessionStorage.clear();

    // Clear all cookies for this domain
    if (document.cookie) {
      const cookies = document.cookie.split(";");

      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }

      console.log("All cookies cleared");
    }

    // Clear all IndexedDB databases
    if (window.indexedDB) {
      try {
        const databases = await window.indexedDB.databases();

        // Delete each database
        for (const db of databases) {
          if (db.name) {
            await new Promise<void>((resolve) => {
              const deleteRequest = indexedDB.deleteDatabase(db.name!);

              deleteRequest.onsuccess = () => {
                console.log(`Successfully deleted database: ${db.name}`);
                resolve();
              };

              deleteRequest.onerror = () => {
                console.error(`Failed to delete database: ${db.name}`);
                resolve();
              };

              deleteRequest.onblocked = () => {
                console.warn(`Database deletion blocked: ${db.name}`);
                setTimeout(resolve, 1000);
              };
            });
          }
        }

        console.log("All IndexedDB databases cleared");
      } catch (error) {
        console.error("Error clearing IndexedDB databases:", error);
      }
    }

    // Clear Cache API if available
    if ("caches" in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
        console.log("Cache API storage cleared");
      } catch (error) {
        console.error("Error clearing Cache API storage:", error);
      }
    }

    console.log("Nuclear reset completed successfully");

    // Set flag to indicate we've performed a nuclear reset
    // This is stored in sessionStorage which we just cleared,
    // but will be available until the page reloads
    sessionStorage.setItem("nuclear_reset_performed", "true");

    return true;
  } catch (error) {
    console.error("Nuclear reset failed:", error);
    return false;
  }
};
