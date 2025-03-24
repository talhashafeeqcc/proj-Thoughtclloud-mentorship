import React, { useState } from "react";
import { resetAndInitializeDatabase } from "../../services/database/db";
import { retryBootstrap, nucleaReset } from "../../services/database/bootstrap";

/**
 * A fallback component that displays when database initialization fails.
 * Offers solutions to the user including hard reset options.
 */
const DatabaseErrorFallback: React.FC = () => {
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showNuclearOption, setShowNuclearOption] = useState(false);

  const handleRetry = () => {
    setMessage("Retrying database initialization...");
    // Trigger manual bootstrap retry
    retryBootstrap();

    // Force reload to ensure all resources are freshly loaded
    setTimeout(() => {
      // Use location.href to force a full page reload
      window.location.href =
        window.location.href.split("?")[0] + "?fresh=" + Date.now();
    }, 2000);
  };

  const handleHardReset = async () => {
    setIsResetting(true);
    setMessage("Performing hard reset of the database...");

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

      // Force reset database
      await resetAndInitializeDatabase();

      setMessage("Database reset successful! Reloading page...");

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
      "Please open your browser's developer tools (F12), go to Application > Storage > IndexedDB, " +
        "and delete all databases starting with 'thoughtcllouddb'. Then reload the page."
    );

    // After showing manual instructions, offer the nuclear option
    setShowNuclearOption(true);
  };

  // Nuclear option handler
  const handleNuclearReset = async () => {
    const confirmed = window.confirm(
      "WARNING: This will delete ALL data stored by this application in your browser, " +
        "including all databases, local storage, and cookies. This action cannot be undone. Continue?"
    );

    if (!confirmed) return;

    setIsResetting(true);
    setMessage("🔥 Executing nuclear reset - clearing all application data...");

    try {
      // Execute nuclear reset
      const success = await nucleaReset();

      if (success) {
        setMessage("Nuclear reset successful! Reloading application...");

        // Force reload with cache busting parameter
        setTimeout(() => {
          // Force hard refresh with no cache using location.replace
          window.location.replace(
            window.location.origin +
              window.location.pathname +
              "?forcereset=" +
              Date.now()
          );
        }, 1500);
      } else {
        throw new Error("Nuclear reset failed");
      }
    } catch (error) {
      console.error("Nuclear reset failed:", error);
      setMessage("Nuclear reset failed. Please try restarting your browser.");
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-red-500 mr-3"
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
          <h2 className="text-xl font-bold text-gray-800">Database Error</h2>
        </div>

        <p className="mb-4 text-gray-600">
          There was a problem initializing the database. This is likely due to a
          schema change or corrupted data.
        </p>

        {message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Option 1: Simple Retry</h3>
            <button
              onClick={handleRetry}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              Retry Database Initialization
            </button>
          </div>

          <div>
            <h3 className="font-medium mb-2">Option 2: Hard Reset</h3>
            <button
              onClick={handleHardReset}
              disabled={isResetting}
              className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-md disabled:opacity-50"
            >
              {isResetting ? "Resetting..." : "Reset Database (Clear All Data)"}
            </button>
          </div>

          <div>
            <h3 className="font-medium mb-2">Option 3: Manual Reset</h3>
            <button
              onClick={handleManualClearInstructions}
              className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
            >
              Show Manual Reset Instructions
            </button>
          </div>

          {showNuclearOption && (
            <div>
              <h3 className="font-medium mb-2 text-red-800">
                ⚠️ Option 4: Nuclear Reset (Last Resort)
              </h3>
              <button
                onClick={handleNuclearReset}
                disabled={isResetting}
                className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md disabled:opacity-50"
              >
                {isResetting
                  ? "Executing Nuclear Reset..."
                  : "Nuclear Reset - Clear EVERYTHING"}
              </button>
              <p className="text-xs text-red-600 mt-1">
                Only use this as a last resort. This will clear ALL data stored
                by this application in your browser.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseErrorFallback;
