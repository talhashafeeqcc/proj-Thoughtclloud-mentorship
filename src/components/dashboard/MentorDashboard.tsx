import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import AvailabilityManager from "./AvailabilityManager";
import { useAuth } from "../../context/AuthContext";
import { useSession } from "../../context/SessionContext";
import { getMentorByUserId } from "../../services/mentorService";
import { FaCalendarAlt, FaCalendarCheck, FaList, FaTools } from "react-icons/fa";
import SessionList from "./SessionList";
import { clearDatabase } from "../../services/database/db";
// import { seedDatabase } from "../../services/database/seedData";
import { retryBootstrap } from "../../services/database/bootstrap";

const MentorDashboard: React.FC = () => {
  const { authState } = useAuth();
  const { sessionState, cancelUserSession } = useSession();
  
  const [mentorId, setMentorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sessions"); // 'sessions', 'calendar', or 'manage'
  // Track availability changes to refresh calendar when needed
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  
  // Ref to track component mounted state and fetching state
  const mountedRef = useRef(true);
  const isFetchingMentorRef = useRef(false);

  // Tab change handlers with useCallback to avoid recreating on each render
  const handleTabChange = useCallback((tab: string) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [activeTab]);

  // Memoize the tab handlers to avoid creating new functions on each render
  const handleSessionsTab = useCallback(() => handleTabChange("sessions"), [handleTabChange]);
  const handleCalendarTab = useCallback(() => handleTabChange("calendar"), [handleTabChange]);
  const handleManageTab = useCallback(() => handleTabChange("manage"), [handleTabChange]);
  
  // Define this callback at the component level to ensure consistent hooks order
  const onSlotSelect = useCallback(() => {
    // Empty callback - just here to maintain hooks order
    console.log("Slot selected (placeholder)");
  }, []);

  // Handler for when availability changes (add/edit/delete)
  const handleAvailabilityChange = useCallback(() => {
    console.log("Availability changed, refreshing data");
    setAvailabilityVersion(prev => prev + 1); // Increment to force calendar refresh
  }, []);

  // Debug tools state
  const [showDebugTools, setShowDebugTools] = useState(false);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  
  // Handler for resetting database
  const handleDatabaseReset = async () => {
    if (window.confirm("This will reset the database and reseed it. Continue?")) {
      try {
        setDebugMessage("Resetting database...");
        
        // Clear the database first
        await clearDatabase();
        
        // Try to re-run the bootstrap process
        await retryBootstrap();
        
        // Reload the page to see changes
        setDebugMessage("Database reset successful. Reloading page...");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error("Error resetting database:", error);
        setDebugMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  };

  // Fetch mentor profile data
  useEffect(() => {
    // Set mounted status
    mountedRef.current = true;
    
    const fetchMentorData = async () => {
      // Skip if not logged in or already fetching
      if (!authState.user || isFetchingMentorRef.current) return;
      
      // Set fetching state
      isFetchingMentorRef.current = true;
      
      try {
        console.log("Fetching mentor data for:", authState.user.id);
        const mentorData = await getMentorByUserId(authState.user.id);
        
        // Only update state if component is still mounted
        if (mountedRef.current && mentorData) {
          setMentorId(mentorData.id || "");
        }
      } catch (err: any) {
        if (mountedRef.current) {
          console.error("Error fetching mentor data:", err);
          setError(err.message);
        }
      } finally {
        // Always reset the loading state and fetching ref if mounted
        if (mountedRef.current) {
          setLoading(false);
          isFetchingMentorRef.current = false;
        }
      }
    };

    fetchMentorData();
    
    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [authState.user]);

  // Memoize the loading UI to avoid recreating it on each render
  const loadingUI = useMemo(() => (
    <div className="flex justify-center items-center h-64">
      <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <div className="ml-3 text-xl">Loading mentor dashboard...</div>
    </div>
  ), []);

  // Memoize the error UI
  const errorUI = useMemo(() => error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <p className="font-bold">Error</p>
      <p>{error}</p>
    </div>
  ), [error]);

  // Memoize the no profile UI
  const noProfileUI = useMemo(() => (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
      <p className="font-bold">Mentor Profile Not Found</p>
      <p>Please complete your mentor profile setup.</p>
    </div>
  ), []);

  // Handle early returns based on loading state
  if (loading) {
    return loadingUI;
  }

  if (error) {
    return errorUI;
  }

  if (!mentorId) {
    return noProfileUI;
  }

  // Render the dashboard content
  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={handleSessionsTab}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "sessions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaList className="inline-block mr-2" /> My Sessions
          </button>
          <button
            onClick={handleCalendarTab}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "calendar"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaCalendarAlt className="inline-block mr-2" /> View Availability
          </button>
          <button
            onClick={handleManageTab}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "manage"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaCalendarCheck className="inline-block mr-2" /> Manage
            Availability
          </button>
          {/* Add debug tools toggle button only in development mode */}
          {window.location.hostname === 'localhost' && (
            <button
              onClick={() => setShowDebugTools(!showDebugTools)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                showDebugTools
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaTools className="inline-block mr-2" /> Debug Tools
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content - Only render the active tab */}
      {activeTab === "sessions" && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FaList className="mr-2" /> Your Mentoring Sessions
          </h3>

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
      )}
      
      {activeTab === "calendar" && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FaCalendarAlt className="mr-2" /> Your Availability Calendar
          </h3>
          <p className="mb-4 text-gray-600">
            View your current availability. Slots that are already booked will
            not be shown here.
          </p>
          <AvailabilityCalendar 
            mentorId={mentorId} 
            onSlotSelect={onSlotSelect}
            versionKey={availabilityVersion} // Pass version to trigger refresh 
          />
        </div>
      )}
      
      {activeTab === "manage" && (
        <AvailabilityManager 
          mentorId={mentorId} 
          onAvailabilityChange={handleAvailabilityChange} // Add change handler
        />
      )}
      
      {/* Debug Tools Section */}
      {showDebugTools && window.location.hostname === 'localhost' && (
        <div className="mt-4 p-4 border border-red-300 rounded-md bg-red-50">
          <h3 className="text-xl font-semibold mb-2 text-red-700">Debug Tools</h3>
          <p className="text-sm text-gray-600 mb-4">Use these tools to reset the database and fix data issues.</p>
          
          <div className="flex space-x-4">
            <button 
              onClick={handleDatabaseReset}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Reset Database & Reseed Data
            </button>
          </div>
          
          {debugMessage && (
            <div className="mt-4 p-2 bg-white border border-gray-300 rounded">
              <p className="text-sm">{debugMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorDashboard;
