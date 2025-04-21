import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMentorById } from "../services/mentorService";
import { useSession } from "../context/SessionContext";
import { useAuth } from "../context/AuthContext";
import MentorProfile from "../components/mentor/MentorProfile";
import AvailabilityCalendar from "../components/dashboard/AvailabilityCalendar";
import BookingModal from "../components/BookingModal";
import { AvailabilitySlot, MentorProfile as MentorProfileType } from "../types";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Clock, Calendar } from "lucide-react";

const MentorProfilePage: React.FC = () => {
  const { mentorId } = useParams<{ mentorId: string }>();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { bookSession } = useSession();

  const [mentor, setMentor] = useState<MentorProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [calendarVersion, setCalendarVersion] = useState(0);

  // Check if the current user is a mentee
  const isMentee = authState?.user?.role === "mentee";
  const isMentor = authState?.user?.role === "mentor";
  const isAuthenticated = authState?.isAuthenticated;

  // Determine booking permission:
  // - Authenticated mentees can book
  // - Authenticated mentors cannot book
  // - Unauthenticated users see a login prompt
  const canBook = isMentee && isAuthenticated;
  const showLoginPrompt = !isAuthenticated;

  // Fetch the mentor profile data when the component mounts
  useEffect(() => {
    const fetchMentor = async () => {
      if (!mentorId) return;

      setLoading(true);
      setError(null);
      try {
        const mentorData = await getMentorById(mentorId);
        setMentor(mentorData);
      } catch (error) {
        console.error("Error fetching mentor:", error);
        setError("Failed to load mentor profile");
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [mentorId]);

  const handleSlotSelect = (slot: AvailabilitySlot | null) => {
    setSelectedSlot(slot);
    if (slot) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setBookingError(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !authState.user || !mentor) {
      setBookingError("Missing required information for booking");
      return Promise.reject("Missing required information for booking");
    }

    try {
      // Creating a loading state variable to indicate booking is in progress
      setLoading(true);
      setBookingError(null);

      const sessionData = {
        mentorId: mentor.id,
        menteeId: authState.user.id,
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        paymentAmount: mentor.sessionPrice || 0,
        availabilitySlotId: selectedSlot.id,
        notes: `Session with ${mentor.name}`,
        // Status and payment status are set by the bookSession function
      };

      const session = await bookSession(sessionData);

      // Refresh the calendar after successful booking
      setCalendarVersion(prev => prev + 1);

      // Return the session ID for the BookingModal
      return session.id;
    } catch (error) {
      console.error("Error during booking:", error);
      if (error instanceof Error) {
        setBookingError(error.message);
      } else {
        setBookingError("An unknown error occurred during booking");
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex justify-center items-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent dark:border-indigo-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-700 dark:text-gray-300">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-6 max-w-4xl"
      >
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-800 dark:text-red-300 p-6 rounded-xl shadow-md">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 mr-3 flex-shrink-0" />
            <div>
              <p className="font-bold text-lg mb-2">Error</p>
              <p className="mb-4">{error}</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(-1)}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg inline-flex items-center shadow-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!mentor) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-6 max-w-4xl"
      >
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-300 p-6 rounded-xl shadow-md">
          <p className="font-bold text-lg mb-2">Mentor Not Found</p>
          <p className="mb-4">The mentor you're looking for could not be found.</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/mentors")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow-sm transition-colors"
          >
            Browse Mentors
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Get the current user role for display purposes
  const userRoleDisplay = isAuthenticated
    ? isMentee
      ? "mentee"
      : isMentor
        ? "mentor"
        : "user"
    : "visitor";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-300"
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mentor Profile Section */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <MentorProfile mentor={mentor} />

            {/* Show login prompt for unauthenticated users */}
            {showLoginPrompt && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-xl shadow-md border border-indigo-100 dark:border-indigo-800"
              >
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Want to book a session?</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                  Please log in or create an account to book a session with this mentor.
                </p>
                <div className="flex space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/login")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-5 rounded-lg shadow-sm transition-colors flex-1 flex justify-center"
                  >
                    Log In
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/register")}
                    className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2.5 px-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-colors flex-1 flex justify-center"
                  >
                    Sign Up
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Show booking instruction for mentors */}
            {isMentor && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-8 bg-blue-50 dark:bg-blue-900/30 p-6 rounded-xl shadow-md border border-blue-100 dark:border-blue-800"
              >
                <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">You're logged in as a mentor</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  As a mentor, you can't book sessions with other mentors. Switch to a mentee account if you want to book sessions.
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Calendar and Booking Section */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white flex items-center">
                <Calendar className="mr-2 text-indigo-600 dark:text-indigo-400" size={20} />
                Available Time Slots
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Select an available time slot to book a session with {mentor.name}.
                {mentor.sessionPrice > 0 && (
                  <span className="ml-1">
                    Session fee: <span className="font-semibold text-indigo-600 dark:text-indigo-400">${mentor.sessionPrice}</span>
                  </span>
                )}
                {mentor.sessionDuration && (
                  <span className="ml-2 inline-flex items-center text-gray-500 dark:text-gray-400">
                    <Clock size={16} className="mr-1" />
                    {mentor.sessionDuration} min
                  </span>
                )}
              </p>
            </div>

            <AvailabilityCalendar
              mentorId={mentor.id}
              onSlotSelect={canBook ? handleSlotSelect : () => {}}
              disabled={!canBook}
              readOnly={!canBook}
              version={calendarVersion}
            />

            {bookingError && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700 dark:text-red-300">{bookingError}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmBooking}
        slot={selectedSlot}
        mentor={mentor}
      />
    </motion.div>
  );
};

export default MentorProfilePage;
