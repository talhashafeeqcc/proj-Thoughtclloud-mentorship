import React, { useEffect, useMemo } from "react";
import { useSession } from "../../context/SessionContext";
import { useAuth } from "../../context/AuthContext";
import SessionList from "./SessionList";
import { Link } from "react-router-dom";
import { FaUserCheck } from "react-icons/fa";

const MenteeDashboard: React.FC = () => {
  // Add error handling for context issues
  let sessionContextValue;

  try {
    sessionContextValue = useSession();
  } catch (error) {
    console.error("Error accessing SessionContext:", error);
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
        <p className="font-bold">Session Context Error</p>
        <p>There was an error accessing the session data. Please try refreshing the page.</p>
        <p className="text-sm mt-2">Error details: {error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }

  const { authState } = useAuth();
  const { sessionState, cancelUserSession, fetchUserSessions } = sessionContextValue;

  // Force refresh sessions when component mounts
  useEffect(() => {
    if (authState.user?.id) {
      console.log("MenteeDashboard: Refreshing sessions on mount");
      fetchUserSessions(true); // Force refresh
    }
  }, [authState.user?.id, fetchUserSessions]);

  // Filter sessions to only show those where the current user is the mentee
  const menteeSessions = useMemo(() => {
    if (!authState.user?.id) return [];

    // Don't filter by mentee ID - show all sessions for this user
    // The sessionService already handles proper filtering by profile ID
    console.log("MenteeDashboard sessions:", sessionState.sessions);

    // Verify no filtering is happening accidentally
    if (sessionState.sessions.length > 0) {
      console.log("All session details:", sessionState.sessions.map(s => ({
        id: s.id,
        mentorId: s.mentorId,
        menteeId: s.menteeId,
        status: s.status,
        paymentStatus: s.paymentStatus
      })));
    }

    return sessionState.sessions;
  }, [sessionState.sessions]);

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

  // No sessions message
  const noSessionsMessage = useMemo(
    () => (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
        <p className="text-blue-800 mb-2">You don't have any sessions yet.</p>
        <p className="text-sm text-blue-600">
          Find a mentor and book your first session to get started!
        </p>
        <Link
          to="/mentors"
          className="mt-3 inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Browse Mentors
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
      ) : menteeSessions.length === 0 ? (
        noSessionsMessage
      ) : (
        <SessionList
          sessions={menteeSessions}
          onCancelSession={cancelUserSession}
          currentUserId={authState.user?.id || ""}
        />
      )}
    </div>
  );
};

export default MenteeDashboard;
