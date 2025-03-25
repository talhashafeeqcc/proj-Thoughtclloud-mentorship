import React, { useState, useEffect } from "react";
import {
  clearDatabase,
  initializeDatabaseWithSampleData,
} from "../../services/database/db";

/**
 * A utility component that appears when database schema migration issues are detected.
 * It provides options to reset the database or attempt migration.
 */
const DatabaseMigrationHelper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for migration flag
    const needsMigration = localStorage.getItem("db_needs_migration");
    if (needsMigration === "true") {
      setIsVisible(true);
    }
  }, []);

  const handleReset = async () => {
    const confirmReset = window.confirm(
      "WARNING: This will delete all data in the database. This action cannot be undone. Continue?"
    );

    if (!confirmReset) return;

    setIsResetting(true);
    setMessage(null);
    setError(null);

    try {
      await clearDatabase();
      setMessage("Database cleared successfully.");

      // Re-initialize with sample data
      await initializeDatabaseWithSampleData();
      setMessage("Database reset and re-initialized with sample data.");

      // Remove migration flag
      localStorage.removeItem("db_needs_migration");

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(`Failed to reset database: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-red-600">
          Database Migration Required
        </h2>

        <p className="mb-4">
          The database schema has been updated and requires migration. You have
          two options:
        </p>

        <div className="mb-6">
          <h3 className="font-medium mb-2">
            Option 1: Reset Database (Recommended)
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            This will clear all existing data and re-initialize the database
            with sample data. Choose this option if you don't have important
            data or are experiencing persistent issues.
          </p>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isResetting ? "Resetting..." : "Reset Database"}
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-medium mb-2">Option 2: Continue Without Reset</h3>
          <p className="text-sm text-gray-600 mb-2">
            Try to continue using the application with automatic migration. This
            may or may not work depending on the schema changes.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem("db_needs_migration");
              window.location.reload();
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Continue Without Reset
          </button>
        </div>

        {message && <p className="mt-4 text-green-600">{message}</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default DatabaseMigrationHelper;
