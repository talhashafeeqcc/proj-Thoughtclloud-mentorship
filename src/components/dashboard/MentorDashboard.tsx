import React, { useState, useEffect } from "react";
import AvailabilityCalendar from "./AvailabilityCalendar";
import AvailabilityManager from "./AvailabilityManager";
import { useAuth } from "../../context/AuthContext";
import { useSession } from "../../context/SessionContext";
import { getMentorByUserId } from "../../services/userService";
import { FaCalendarAlt, FaCalendarCheck, FaList } from "react-icons/fa";
import SessionList from "./SessionList";

const MentorDashboard: React.FC = () => {
  const { authState } = useAuth();
  const { sessionState, fetchUserSessions, cancelUserSession } = useSession();
  
  const [mentorId, setMentorId] = useState<string>("");
  const [mentorName, setMentorName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sessions"); // 'sessions', 'calendar', or 'manage'

  // Fetch mentor profile data
  useEffect(() => {
    const fetchMentorData = async () => {
      if (authState.user?.id) {
        try {
          const mentorProfile = await getMentorByUserId(authState.user.id);
          if (mentorProfile) {
            setMentorId(mentorProfile.id);
            setMentorName(authState.user.name);
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMentorData();
  }, [authState.user]);
  
  // Fetch sessions
  useEffect(() => {
    if (authState.user) {
      fetchUserSessions();
    }
  }, [authState.user, fetchUserSessions]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="ml-3 text-xl">Loading mentor dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!mentorId) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <p className="font-bold">Mentor Profile Not Found</p>
        <p>Please complete your mentor profile setup.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab("sessions")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "sessions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaList className="inline-block mr-2" /> My Sessions
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "calendar"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaCalendarAlt className="inline-block mr-2" /> View Availability
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "manage"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <FaCalendarCheck className="inline-block mr-2" /> Manage Availability
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "sessions" ? (
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
              currentUserId={authState.user?.id || ''}
            />
          )}
        </div>
      ) : activeTab === "calendar" ? (
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
            onSlotSelect={() => {}}
          />
        </div>
      ) : (
        <AvailabilityManager mentorId={mentorId} />
      )}
    </div>
  );
};

export default MentorDashboard;
