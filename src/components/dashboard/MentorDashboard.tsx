import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import AvailabilityManager from "./AvailabilityManager";
import { useAuth } from "../../context/AuthContext";
import { FaCalendarAlt, FaCalendarCheck, FaList, FaTools, FaWallet, FaMoneyBillWave, FaHourglassHalf, FaLink } from "react-icons/fa";
import SessionList from "./SessionList";
import { clearDatabase } from "../../services/database/db";
// import { seedDatabase } from "../../services/database/seedData";
import { retryBootstrap } from "../../services/database/bootstrap";
import ProfileCompletionBanner from "./ProfileCompletionBanner";
import { useSession } from "../../context/SessionContext";
import { getMentorByUserId, createMentorPayout } from "../../services/mentorService";
import { connectMentorToStripe } from "../../services/stripe";
import { getMentorBalance } from "../../services/stripe";
import { motion } from "framer-motion";
import { MentorProfile, AvailabilitySlot } from "../../types";
import BookingModal from "../../components/BookingModal";

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
  instant_available?: {
    amount: number;
    currency: string;
  }[];
  connected?: boolean;
  message?: string;
  error?: string;
  stripeAccountId?: string;
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
  const [connectingStripe, setConnectingStripe] = useState(false);
  // Add state for mentorProfile
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);

  // State for booking modal
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

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

  // Determine user role for booking permissions
  const isMentee = authState.user?.role === "mentee";

  // Only allow mentees to select a slot for booking. Mentors will see the calendar in read-only mode.
  const onSlotSelect = useCallback((slot: AvailabilitySlot | null) => {
    if (!isMentee) return; // Prevent mentors (or unauthenticated users) from booking

    if (slot) {
      setSelectedSlot(slot);
      setIsBookingModalOpen(true);
    }
  }, [isMentee]);

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
    setAvailabilityVersion(prev => prev + 1); // Increment to force calendar refresh
  }, []);

  // Handle booking modal close
  const handleCloseBookingModal = useCallback(() => {
    setIsBookingModalOpen(false);
    setSelectedSlot(null);
    setBookingError(null);
  }, []);

  // Handle booking confirmation
  const handleConfirmBooking = useCallback(async () => {
    if (!selectedSlot || !mentorProfile) {
      console.error("Missing slot or mentor data for booking");
      setBookingError("Unable to complete booking: Missing mentor data");
      return Promise.reject("Missing mentor data");
    }

    try {
      // For a self-booking demo, we'll just simulate the booking process
      // In a real app, this would call a booking service
      
      // Increment availability version to force calendar refresh
      setAvailabilityVersion(prev => prev + 1);
      
      // Close the modal
      handleCloseBookingModal();
      
      // Return a session ID
      return "session-" + Date.now();
    } catch (error) {
      console.error("Error during booking confirmation:", error);
      setBookingError("Failed to complete booking. Please try again.");
      return Promise.reject(error);
    }
  }, [selectedSlot, mentorProfile, handleCloseBookingModal]);

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

  // Add test sessions for the current mentor
  const handleAddTestSessions = async () => {
    if (!mentorId || !authState.user) return;
    
    try {
      setDebugMessage("Adding test sessions...");
      
      // Import session service
      const { setDocument, COLLECTIONS } = await import("../../services/firebase");
      
      // Create test sessions using Firebase directly
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const testSessions = [
        {
          id: `test-session-1-${Date.now()}`,
          mentorId: authState.user.id, // Use current user ID as mentorId
          menteeId: "test-mentee-id", // Use a test mentee ID
          date: today.toISOString().split('T')[0],
          startTime: "14:00",
          endTime: "15:00",
          status: "scheduled",
          paymentStatus: "pending",
          paymentAmount: 5000, // $50.00 in cents
          notes: "Test mentoring session - scheduled",
          availabilityId: "test-slot-id-1",
          mentorName: mentorProfile?.name || "Test Mentor",
          menteeName: authState.user.name || "Test Mentee",
          meetingLink: "https://meet.google.com/test-1",
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: `test-session-2-${Date.now()}`,
          mentorId: authState.user.id, // Use current user ID as mentorId
          menteeId: "test-mentee-id-2",
          date: tomorrow.toISOString().split('T')[0],
          startTime: "10:00",
          endTime: "11:00",
          status: "completed",
          paymentStatus: "completed",
          paymentAmount: 7500, // $75.00 in cents
          notes: "Test mentoring session - completed",
          availabilityId: "test-slot-id-2",
          mentorName: mentorProfile?.name || "Test Mentor",
          menteeName: authState.user.name || "Test Mentee",
          meetingLink: "https://meet.google.com/test-2",
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      // Add sessions to Firebase
      for (const session of testSessions) {
        await setDocument(COLLECTIONS.SESSIONS, session.id, session);
      }
      
      // Refresh sessions
      await fetchUserSessions(true);
      
      setDebugMessage(`Added ${testSessions.length} test sessions successfully!`);
    } catch (error) {
      console.error("Error adding test sessions:", error);
      setDebugMessage(`Failed to add test sessions: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Handle connecting mentor to Stripe
  const handleConnectStripe = async () => {
    if (!mentorId || !authState.user?.email) return;
    try {
      setConnectingStripe(true);
      const result = await connectMentorToStripe(mentorId, authState.user.email, "US");
      if (result?.accountLink) {
        // Redirect mentor to Stripe onboarding
        window.location.href = result.accountLink;
      } else {
        alert("Failed to initiate Stripe onboarding. Please try again later.");
      }
    } catch (err) {
      console.error("Stripe connect error:", err);
      alert("Unable to connect Stripe account. Please try again later.");
    } finally {
      setConnectingStripe(false);
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
        const mentorData = await getMentorByUserId(authState.user.id);

        // Only update state if component is still mounted
        if (mountedRef.current && mentorData) {
          setMentorId(mentorData.id || "");
          // Convert MentorDocument to MentorProfile
          setMentorProfile({
            id: mentorData.id || "",
            role: "mentor", // Set default role
            email: authState.user?.email || "",
            name: mentorData.name || authState.user?.name || "",
            // Copy other properties that might be available
            bio: mentorData.bio || "",
            expertise: mentorData.expertise || [],
            sessionPrice: mentorData.sessionPrice || 0,
            // Optional properties
            portfolio: mentorData.portfolio || [],
            certifications: mentorData.certifications || [],
            education: mentorData.education || [],
            workExperience: mentorData.workExperience || [],
            availability: mentorData.availability || [],
            ratings: mentorData.ratings || [],
            averageRating: mentorData.averageRating || 0,
            profilePicture: mentorData.profileImageUrl || mentorData.profilePicture || "",
          });
          
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
      <div className="inline-block w-8 h-8 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      <div className="ml-3 text-xl dark:text-white">Loading mentor dashboard...</div>
    </div>
  ), []);

  // Force refresh sessions when component mounts or mentorId changes
  useEffect(() => {
    if (authState.user?.id) {
      fetchUserSessions(true); // Force refresh
    }
  }, [authState.user?.id, mentorId, fetchUserSessions]);

  // Memoize the error UI
  const errorUI = useMemo(() => error && (
    <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
      <p className="font-bold">Error</p>
      <p>{error}</p>
    </div>
  ), [error]);

  // Memoize the no profile UI
  const noProfileUI = useMemo(() => (
    <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-4">
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-full dark:bg-gray-900 dark:text-white"
    >
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner />

      {/* Balance Summary Card */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <FaWallet className="text-blue-500 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold dark:text-white">Your Balance</h3>
        </div>
        
        {balanceLoading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-gray-600 dark:text-gray-300">Loading balance...</span>
          </div>
        ) : balance ? (
          <>
            {/* Warning banner if Stripe isn't connected */}
            {balance.connected === false && (
              <div className="p-4 mb-4 bg-orange-50 dark:bg-orange-900/20 rounded-md">
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  {balance.message || "Connect your Stripe account to receive payments."}
                </p>
                {balance.error && (
                  <p className="text-xs text-orange-500 dark:text-orange-500 mt-1">
                    {balance.error}
                  </p>
                )}
                <button
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="mt-3 inline-flex items-center bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2 px-4 rounded"
                >
                  {connectingStripe ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white border-solid mr-2"></span>
                  ) : (
                    <FaLink className="h-4 w-4 mr-2" />
                  )}
                  {connectingStripe ? "Connecting..." : "Connect Stripe Account"}
                </button>
              </div>
            )}

            {/* Always show balance amounts */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
                <h4 className="text-sm text-gray-600 dark:text-gray-300">Available</h4>
                <p className="text-xl font-semibold dark:text-white">
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
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <h4 className="text-sm text-gray-600 dark:text-gray-300">Pending</h4>
                <p className="text-xl font-semibold dark:text-white">
                  {balance.pending.length > 0 
                    ? formatCurrency(balance.pending[0].amount, balance.pending[0].currency)
                    : '$0.00'}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-gray-600 dark:text-gray-300">
            <p>No balance information available.</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={handleSessionsTab}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "sessions"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
          >
            <FaList className="inline-block mr-2" /> My Sessions
          </button>
          <button
            onClick={handleCalendarTab}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "calendar"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
          >
            <FaCalendarAlt className="inline-block mr-2" /> View Availability
          </button>
          <button
            onClick={handleManageTab}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "manage"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
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
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              <FaTools className="inline-block mr-2" /> Debug Tools
            </button>
          )}
        </nav>
      </div>

      {/* Debug Tools Section */}
      {showDebugTools && (
        <div className="p-4 mb-6 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 rounded-md">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Debug Tools</h3>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={handleDatabaseReset}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Reset Database
            </button>
            <button
              onClick={handleAddTestSessions}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Add Test Sessions
            </button>
            <button
              onClick={() => fetchUserSessions(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Refresh Sessions
            </button>
            {debugMessage && (
              <div className="mt-2 p-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded text-sm dark:text-gray-300">
                {debugMessage}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-2">
        {activeTab === "sessions" && (
          <>
            {/* Debug information - only show in development */}
            {window.location.hostname === 'localhost' && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">Debug Info:</h4>
                                 <p className="text-xs text-blue-600 dark:text-blue-300">
                   Total sessions: {sessionState.sessions.length} | 
                   User ID: {authState.user?.id} | 
                   Mentor Profile ID: {mentorId} | 
                   Filtered for mentor: {sessionState.sessions.filter(s => s.mentorId === authState.user?.id).length}
                 </p>
                {sessionState.sessions.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-blue-600 dark:text-blue-300 cursor-pointer">View all sessions</summary>
                    <pre className="text-xs mt-1 bg-white dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(sessionState.sessions.map(s => ({ 
                        id: s.id, 
                        mentorId: s.mentorId, 
                        menteeId: s.menteeId, 
                        status: s.status 
                      })), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <SessionList
              sessions={sessionState.sessions.filter(s => s.mentorId === authState.user?.id)}
              onCancelSession={handleCancelSession}
              currentUserId={authState.user?.id || ""}
            />
          </>
        )}

        {activeTab === "calendar" && (
          <AvailabilityCalendar
            mentorId={mentorId}
            key={`calendar-${availabilityVersion}`}
            onSlotSelect={onSlotSelect}
            disabled={!isMentee}
            readOnly={!isMentee}
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

      {/* Render the booking modal only for mentees */}
      {isMentee && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={handleCloseBookingModal}
          onConfirm={handleConfirmBooking}
          slot={selectedSlot}
          mentor={mentorProfile}
        />
      )}
    </motion.div>
  );
};

export default MentorDashboard;
