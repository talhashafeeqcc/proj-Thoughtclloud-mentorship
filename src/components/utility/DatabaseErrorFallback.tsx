import React, { useState } from "react";

/**
 * A fallback component that displays when database initialization fails.
 * Offers solutions to the user including hard reset options.
 */
const DatabaseErrorFallback: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState(
    "There was an error connecting to the database. Let's try to fix it."
  );

  const handleHardReset = async () => {
    setIsResetting(true);
    setMessage("Clearing application data...");

    try {
      // Clear all application data
      localStorage.clear();
      sessionStorage.clear();

      // Try to clear any cached data
      if ("caches" in window) {
        try {
          // Try to clear application cache
          const cacheNames = await window.caches.keys();
          await Promise.all(
            cacheNames.map((name) => window.caches.delete(name))
          );
          console.log("Application cache cleared");
        } catch (e) {
          console.error("Error clearing cache:", e);
        }
      }

      setMessage("Data reset successful! Reloading page...");

      // Force a complete fresh page reload
      setTimeout(() => {
        window.location.href =
          window.location.origin +
          window.location.pathname +
          "?fresh=" +
          Date.now();
      }, 1000);
    } catch (error) {
      console.error("Hard reset failed:", error);
      setMessage("Reset failed. Please try the manual steps below.");
      setIsResetting(false);
    }
  };

  const handleManualClearInstructions = () => {
    setMessage(
      "Please try the following steps:\n" +
      "1. Clear your browser cache\n" +
      "2. Clear your cookies for this site\n" +
      "3. Reload the page\n\n" +
      "If problems persist, try using a different browser."
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 text-red-600">
          Firebase Connection Error
        </h2>
        <p className="mb-6 whitespace-pre-line">{message}</p>

        <div className="space-y-4">
          {!isResetting && (
            <>
              <button
                onClick={handleHardReset}
                className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                disabled={isResetting}
              >
                Reset Application Data
              </button>

              <button
                onClick={handleManualClearInstructions}
                className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Show Manual Instructions
              </button>
            </>
          )}

          {isResetting && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseErrorFallback;
