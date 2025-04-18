import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw, Terminal, HelpCircle } from "lucide-react";

interface DatabaseErrorFallbackProps {
  error?: string | null;
}

/**
 * A fallback component that displays when database initialization fails.
 * Offers solutions to the user including hard reset options.
 */
const DatabaseErrorFallback: React.FC<DatabaseErrorFallbackProps> = ({ error }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState(
    error || "There was an error connecting to the database. Let's try to fix it."
  );
  const [showTechDetails, setShowTechDetails] = useState(false);

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200 dark:border-gray-700 transition-all">
        <div className="flex items-center mb-6">
          <AlertCircle className="text-red-600 dark:text-red-400 w-8 h-8 mr-3 flex-shrink-0" />
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Database Connection Error
          </h2>
        </div>
        
        <p className="mb-6 whitespace-pre-line text-gray-700 dark:text-gray-300">{message}</p>

        {showTechDetails && error && (
          <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700 overflow-auto">
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              {error}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {!isResetting && (
            <>
              <button
                onClick={handleHardReset}
                className="w-full py-3 px-4 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center justify-center"
                disabled={isResetting}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Reset Application Data
              </button>

              <button
                onClick={handleManualClearInstructions}
                className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Show Manual Instructions
              </button>

              <button
                onClick={() => setShowTechDetails(!showTechDetails)}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors flex items-center justify-center"
              >
                <Terminal className="w-5 h-5 mr-2" />
                {showTechDetails ? "Hide Technical Details" : "Show Technical Details"}
              </button>

              <Link 
                to="/"
                className="block w-full text-center py-3 px-4 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors mt-4"
              >
                Return to Home Page
              </Link>
            </>
          )}

          {isResetting && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 dark:border-red-400 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseErrorFallback;
