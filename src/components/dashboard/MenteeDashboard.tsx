import React, { useEffect } from "react";
import { useSession } from "../../context/SessionContext";
import { useAuth } from "../../context/AuthContext";
import SessionList from "./SessionList";
import { Link } from "react-router-dom";
import { FaCalendarAlt, FaUserCheck } from "react-icons/fa";

const MenteeDashboard: React.FC = () => {
  const { sessionState, fetchUserSessions, cancelUserSession } = useSession();
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.user) {
      fetchUserSessions();
    }
  }, [authState.user, fetchUserSessions]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FaUserCheck className="mr-2" /> Mentee Dashboard
        </h2>
        <Link
          to="/mentors"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <FaCalendarAlt className="mr-2" /> Find Mentors
        </Link>
      </div>

      {sessionState.loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2">Loading your sessions...</p>
        </div>
      ) : sessionState.error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p className="font-bold">Error</p>
          <p>{sessionState.error}</p>
        </div>
      ) : (
        <SessionList
          sessions={sessionState.sessions}
          onCancelSession={cancelUserSession}
          currentUserId={authState.user?.id || ""}
        />
      )}
    </div>
  );
};

export default MenteeDashboard;
