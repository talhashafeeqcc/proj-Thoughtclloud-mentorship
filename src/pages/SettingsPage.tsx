import React from "react";
import ProfileSettings from "../components/dashboard/ProfileSettings";
import { clearDatabase } from "../services/database/db";
import { useNavigate } from "react-router-dom";

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleResetDatabase = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset the database? This will clear all data and you'll need to restart the application."
      )
    ) {
      await clearDatabase();
      alert("Database has been reset. Please refresh the application.");
      navigate("/");
      window.location.reload();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <ProfileSettings />

      {/* Development only - reset database button */}
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8 p-4 bg-red-50 border border-red-300 rounded-md">
          <h2 className="text-lg font-semibold text-red-700 mb-2">
            Developer Tools
          </h2>
          <p className="text-sm text-red-600 mb-4">
            These tools are only available in development mode.
          </p>
          <button
            onClick={handleResetDatabase}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Reset Database
          </button>
          <p className="text-xs text-gray-600 mt-2">
            This will completely clear the database and reset all data. Use with
            caution.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
