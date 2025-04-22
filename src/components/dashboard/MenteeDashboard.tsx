import React, { useEffect, useMemo } from "react";
import { useSession } from "../../context/SessionContext";
import { useAuth } from "../../context/AuthContext";
import SessionList from "./SessionList";
import { Link, useNavigate } from "react-router-dom";
import { Users, Calendar, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const MenteeDashboard: React.FC = () => {
  const navigate = useNavigate();
  // Add error handling for context issues
  let sessionContextValue;

  try {
    sessionContextValue = useSession();
  } catch (error) {
    console.error("Error accessing SessionContext:", error);
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-5 mb-6 rounded-md shadow-sm">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold">Session Context Error</p>
            <p>There was an error accessing the session data. Please try refreshing the page.</p>
            <p className="text-sm mt-2">Error details: {error instanceof Error ? error.message : String(error)}</p>
          </div>
        </div>
      </div>
    );
  }

  const { authState } = useAuth();
  const { sessionState, cancelUserSession, fetchUserSessions } = sessionContextValue;

  // Force refresh sessions when component mounts
  useEffect(() => {
    if (authState.user?.id) {
      fetchUserSessions(true); // Force refresh
    }
  }, [authState.user?.id, fetchUserSessions]);

  // Filter sessions to only show those where the current user is the mentee
  const menteeSessions = useMemo(() => {
    if (!authState.user?.id) return [];

    // Don't filter by mentee ID - show all sessions for this user
    // The sessionService already handles proper filtering by profile ID
    
    // Verify no filtering is happening accidentally
    if (sessionState.sessions.length > 0) {
      // Log for debugging if needed
    }

    return sessionState.sessions;
  }, [sessionState.sessions, authState.user?.id]);

  // Memoize loading UI to avoid recreating it on each render
  const loadingUI = useMemo(
    () => (
      <div className="text-center py-10">
        <div className="inline-block w-12 h-12 border-4 border-indigo-500 border-t-transparent dark:border-indigo-400 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-700 dark:text-gray-300 text-lg">Loading your sessions...</p>
      </div>
    ),
    []
  );

  // Memoize error UI
  const errorUI = useMemo(
    () =>
      sessionState.error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-5 mb-6 rounded-md shadow-sm">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">Error</p>
              <p>{sessionState.error}</p>
            </div>
          </div>
        </div>
      ),
    [sessionState.error]
  );

  // Memoize the header
  const header = useMemo(
    () => (
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-semibold flex items-center text-gray-900 dark:text-white">
          <Calendar className="mr-2 text-indigo-600 dark:text-indigo-400 h-6 w-6" /> 
          Your Mentoring Sessions
        </h2>
        {/* <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/mentors"
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg shadow-sm flex items-center justify-center transition-colors"
          >
            <Users className="h-5 w-5 mr-2" /> Find a Mentor
          </Link>
        </motion.div> */}
      </div>
    ),
    []
  );

  // No sessions message
  const noSessionsMessage = useMemo(
    () => (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-800/50 rounded-full mb-4">
          <Calendar className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No sessions yet</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto">
          You don't have any mentoring sessions scheduled yet. Find a mentor and book your first session to get started!
        </p>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/mentors"
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-5 rounded-lg shadow-sm transition-colors"
          >
            <Users className="mr-2 h-5 w-5" /> Browse Mentors
          </Link>
        </motion.div>
      </motion.div>
    ),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
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
    </motion.div>
  );
};

export default MenteeDashboard;
