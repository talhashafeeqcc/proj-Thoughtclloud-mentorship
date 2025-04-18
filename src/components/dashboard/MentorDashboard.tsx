import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import AvailabilityManager from "./AvailabilityManager";
import { useAuth } from "../../context/AuthContext";
import { FaCalendarAlt, FaCalendarCheck, FaList, FaTools, FaWallet } from "react-icons/fa";
import SessionList from "./SessionList";
import { clearDatabase } from "../../services/database/db";
// import { seedDatabase } from "../../services/database/seedData";
import { retryBootstrap } from "../../services/database/bootstrap";
import ProfileCompletionBanner from "./ProfileCompletionBanner";
import { useSession } from "../../context/SessionContext";
import { getMentorByUserId, createMentorPayout } from "../../services/mentorService";
import { getMentorBalance } from "../../services/stripe";

// Interface for the balance data structure
interface MentorBalance {
  available: {
    amount: number;
    currency: string;
  }[];
  pending: {
    amount: number;
    currency: string;
  }[];
  instant_available: {
    amount: number;
    currency: string;
  }[];
}

const MentorDashboard: React.FC = () => {
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
  const { sessionState, fetchUserSessions, cancelUserSession } = sessionContextValue;

  const [mentorId, setMentorId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sessions"); // 'sessions', 'calendar', or 'manage'
  // Track availability changes to refresh calendar when needed
  const [availabilityVersion, setAvailabilityVersion] = useState(0);
  // State for storing mentor balance
  const [balance, setBalance] = useState<MentorBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

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

  // Handle session cancellation and refresh calendar
  const handleCancelSession = useCallback(async (sessionId: string) => {
    try {
      // Call the cancelUserSession from SessionContext
      await cancelUserSession(sessionId);

      // Increment availability version to force calendar refresh
      setAvailabilityVersion(prev => prev + 1);

      // Fetch updated session list
      fetchUserSessions(true);
    } catch (error) {
      console.error("Error cancelling session:", error);
    }
  }, [cancelUserSession, fetchUserSessions]);

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
          
          // Fetch mentor balance after getting mentor ID
          if (mentorData.id) {
            setBalanceLoading(true);
            try {
              const balanceData = await getMentorBalance(mentorData.id);
              if (mountedRef.current) {
                setBalance(balanceData);
              }
            } catch (balanceError) {
              console.error("Error fetching balance:", balanceError);
            } finally {
              if (mountedRef.current) {
                setBalanceLoading(false);
              }
            }
          }
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

  // Force refresh sessions when component mounts or mentorId changes
  useEffect(() => {
    if (authState.user?.id) {
      console.log("MentorDashboard: Refreshing sessions on mount or mentorId change");
      fetchUserSessions(true); // Force refresh
    }
  }, [authState.user?.id, mentorId, fetchUserSessions]);

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

  // Helper to format currency amount from cents to dollars
  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    });
    return formatter.format(amount / 100);
  };

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
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner />

      {/* Balance Summary Card */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <FaWallet className="text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold">Your Balance</h3>
        </div>
        
        {balanceLoading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-gray-600">Loading balance...</span>
          </div>
        ) : balance ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="text-sm text-gray-600">Available</h4>
              <p className="text-xl font-semibold">
                {balance.available.length > 0 
                  ? formatCurrency(balance.available[0].amount, balance.available[0].currency)
                  : '$0.00'}
              </p>
              {balance.available.length > 0 && balance.available[0].amount > 0 && (
                <button 
                  onClick={async () => {
                    try {
                      setBalanceLoading(true);
                      await createMentorPayout(mentorId, balance.available[0].amount, balance.available[0].currency);
                      // Refresh balance after withdrawal
                      const balanceData = await getMentorBalance(mentorId);
                      setBalance(balanceData);
                    } catch (error) {
                      console.error("Error creating payout:", error);
                      alert("Failed to process withdrawal. Please try again later.");
                    } finally {
                      setBalanceLoading(false);
                    }
                  }}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded"
                >
                  Withdraw
                </button>
              )}
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm text-gray-600">Pending</h4>
              <p className="text-xl font-semibold">
                {balance.pending.length > 0 
                  ? formatCurrency(balance.pending[0].amount, balance.pending[0].currency)
                  : '$0.00'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No balance information available. Make sure your account is connected to Stripe.</p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={handleSessionsTab}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "sessions"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <FaList className="inline-block mr-2" /> My Sessions
          </button>
          <button
            onClick={handleCalendarTab}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "calendar"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <FaCalendarAlt className="inline-block mr-2" /> View Availability
          </button>
          <button
            onClick={handleManageTab}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "manage"
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
              className={`py-2 px-1 border-b-2 font-medium text-sm ${showDebugTools
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <FaTools className="inline-block mr-2" /> Debug Tools
            </button>
          )}
        </nav>
      </div>

      {/* Debug Tools Section */}
      {showDebugTools && (
        <div className="p-4 mb-6 border border-red-300 bg-red-50 rounded-md">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Debug Tools</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={handleDatabaseReset}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Reset Database
            </button>
            {debugMessage && (
              <div className="mt-2 p-2 bg-white border border-red-200 rounded text-sm">
                {debugMessage}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-2">
        {activeTab === "sessions" && (
          <SessionList
            sessions={sessionState.sessions.filter(s => s.mentorId === mentorId)}
            onCancelSession={handleCancelSession}
            currentUserId={authState.user?.id || ""}
          />
        )}

        {activeTab === "calendar" && (
          <AvailabilityCalendar
            mentorId={mentorId}
            key={`calendar-${availabilityVersion}`}
            onSlotSelect={onSlotSelect}
            versionKey={availabilityVersion}
          />
        )}

        {activeTab === "manage" && (
          <AvailabilityManager
            mentorId={mentorId}
            onAvailabilityChange={handleAvailabilityChange}
          />
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
