import React, { useMemo } from "react";
import { useSession } from "../../context/SessionContext";
import { useAuth } from "../../context/AuthContext";
import SessionList from "./SessionList";
import { Link } from "react-router-dom";
import { FaUserCheck } from "react-icons/fa";

const MenteeDashboard: React.FC = () => {
  const { sessionState, cancelUserSession } = useSession();
  const { authState } = useAuth();

  // Memoize loading UI to avoid recreating it on each render
  const loadingUI = useMemo(
    () => (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2">Loading your sessions...</p>
      </div>
    ),
    []
  );

  // Memoize error UI
  const errorUI = useMemo(
    () =>
      sessionState.error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p className="font-bold">Error</p>
          <p>{sessionState.error}</p>
        </div>
      ),
    [sessionState.error]
  );

  // Memoize the header
  const header = useMemo(
    () => (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <FaUserCheck className="mr-2" /> Your Mentoring Sessions
        </h2>
        <Link
          to="/mentors"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FaUserCheck className="mr-2" /> Find a Mentor
        </Link>
      </div>
    ),
    []
  );

  return (
    <div>
      {header}

      {sessionState.loading ? (
        loadingUI
      ) : sessionState.error ? (
        errorUI
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
