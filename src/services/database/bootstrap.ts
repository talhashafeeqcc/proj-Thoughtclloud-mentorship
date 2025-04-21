import { getDatabase } from './db';

/**
 * Function to initialize and retry database bootstrapping
 * This is called when trying to recover from database errors
 */
export const retryBootstrap = async (): Promise<boolean> => {
    try {
        // Reset the database connection by getting a fresh instance
        await getDatabase();

        return true;
    } catch (error) {
        console.error("Database bootstrap failed:", error);
        return false;
    }
}; 