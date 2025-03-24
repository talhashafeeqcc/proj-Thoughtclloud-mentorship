import React, { useState } from "react";
import { resetAndInitializeDatabase } from "../../services/database/db";

/**
 * A utility component that allows resetting the database.
 * This is useful during development or when schema changes occur.
 */
const ResetDatabase: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    const confirmReset = window.confirm(
      "WARNING: This will delete all data in the database. This action cannot be undone. Continue?"
    );

    if (!confirmReset) return;

    setIsResetting(true);
    setMessage("Resetting database...");
    setError(null);

    try {
      // Use the utility function to reset and re-initialize
      const success = await resetAndInitializeDatabase();

      if (success) {
        setMessage(
          "Database reset and re-initialized with sample data successfully."
        );

        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error("Reset failed");
      }
    } catch (err: any) {
      setError(`Failed to reset database: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-md bg-gray-50 my-4">
      <h3 className="text-lg font-medium mb-2">Database Utilities</h3>
      <p className="text-sm text-gray-600 mb-4">
        If you encounter database errors, you can reset the database and
        reinitialize it with sample data.
      </p>

      <button
        onClick={handleReset}
        disabled={isResetting}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
      >
        {isResetting ? "Resetting..." : "Reset Database"}
      </button>

      {message && <p className="mt-2 text-green-600">{message}</p>}
      {error && <p className="mt-2 text-red-600">{error}</p>}
    </div>
  );
};

export default ResetDatabase;
