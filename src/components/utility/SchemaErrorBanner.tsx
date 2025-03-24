import React, { useState } from "react";
import {
  clearDatabase,
  initializeDatabaseWithSampleData,
} from "../../services/database/db";

/**
 * A banner component that displays when database schema errors are detected
 * and provides a direct way to reset the database.
 */
const SchemaErrorBanner: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setMessage("Resetting database...");

    try {
      // Clear the database
      await clearDatabase();

      // Re-initialize with sample data
      await initializeDatabaseWithSampleData();

      // Clear the schema error flag
      localStorage.removeItem("schema_error");

      setMessage("Database reset successful! Reloading page...");

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Failed to reset database:", error);
      setMessage(
        "Failed to reset database. Please try again or reload the page."
      );
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center mb-3 md:mb-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-bold">Database Schema Error</span>
        </div>

        <p className="mb-3 md:mb-0 md:mx-4 text-center">
          {message ||
            "The database schema has changed and requires a reset to function properly."}
        </p>

        <button
          onClick={handleReset}
          disabled={isResetting}
          className="bg-white text-red-600 font-bold py-2 px-4 rounded hover:bg-gray-100 disabled:opacity-75 whitespace-nowrap"
        >
          {isResetting ? "Resetting..." : "Reset Now"}
        </button>
      </div>
    </div>
  );
};

export default SchemaErrorBanner;
